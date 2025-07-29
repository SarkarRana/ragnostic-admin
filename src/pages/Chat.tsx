import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import {
  ChatSession,
  ChatMessage,
  createChatSession,
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  deleteChatSession,
} from "../api/chat-sessions";

// CSS for the typing indicator
const typingIndicatorStyles = `
  .typing-indicator {
    display: flex;
    align-items: center;
  }
  
  .typing-indicator span {
    height: 10px;
    width: 10px;
    margin-right: 5px;
    border-radius: 50%;
    background-color: #aaa;
    display: inline-block;
    animation: bounce 1.5s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.2s;
    margin-right: 0;
  }
  
  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-5px);
    }
  }
  
  .markdown-content {
    white-space: pre-wrap;
  }
  
  .markdown-content pre {
    background-color: rgba(0,0,0,0.05);
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }
  
  .dark .markdown-content pre {
    background-color: rgba(0,0,0,0.3);
  }
  
  .markdown-content code {
    font-family: monospace;
  }
  
  .markdown-content p {
    margin-bottom: 0.5rem;
  }
  
  .markdown-content p:last-child {
    margin-bottom: 0;
  }
`;

export const ChatPage = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const { user } = useAuth();
  
  // Reference to abort controller for canceling API requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch sessions when component mounts
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.tenantId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getChatSessions(user.tenantId, user.id);
        setSessions(data);

        // Auto-select the first session if any
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user?.tenantId, user?.id, selectedSessionId]);

  // Fetch messages when selected session changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedSessionId) return;

      setSessionLoading(true);
      try {
        const data = await getChatMessages(selectedSessionId);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setSessionLoading(false);
      }
    };

    fetchMessages();
  }, [selectedSessionId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.tenantId || !newSessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    setIsCreatingSession(true);
    try {
      const newSession = await createChatSession({
        name: newSessionName.trim(),
        tenantId: user.tenantId,
        userId: user.id,
      });

      setSessions([newSession, ...sessions]);
      setSelectedSessionId(newSession.id);
      setNewSessionName("");
      toast.success("Chat session created");
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create chat session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSessionId) return;

    try {
      await deleteChatSession(selectedSessionId);
      setSessions(
        sessions.filter((session) => session.id !== selectedSessionId)
      );
      setSelectedSessionId(
        sessions.length > 1
          ? sessions.find((s) => s.id !== selectedSessionId)?.id || null
          : null
      );
      setMessages([]);
      setIsDeleteModalOpen(false);
      toast.success("Chat session deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete chat session");
    }
  };

  // Helper function to render markdown with sanitization
  // Add typing indicator styles to the document
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = typingIndicatorStyles;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSessionId || !newMessage.trim()) return;

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      content: newMessage.trim(),
      role: "user",
      sessionId: selectedSessionId,
      createdAt: new Date().toISOString(),
    };

    // Add user message to the UI
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsSending(true);
    setIsAssistantTyping(true);

    try {
      // Initialize for streaming
      const assistantMessageId = Date.now() + 1;
      let messageStarted = false;

      // Start streaming the assistant's response
      await sendChatMessage(selectedSessionId, userMessage.content, (chunk) => {
        let data: { delta?: { role?: string; content?: string } };
        try {
          data = typeof chunk === "string" ? JSON.parse(chunk) : chunk;
        } catch {
          data = {};
        }
        // Check if this is the start of a new assistant message
        if (data.delta && data.delta.role === "assistant") {
          // Reset for new message
          messageStarted = true;
          
          // Create initial assistant message (empty content)
          const initialAssistantMessage: ChatMessage = {
            id: assistantMessageId,
            content: "",
            role: "assistant",
            sessionId: selectedSessionId,
            createdAt: new Date().toISOString(),
          };
          
          setMessages(prev => [...prev, initialAssistantMessage]);
        } 
        // Add content chunks to the message
        else if (data.delta && typeof data.delta.content === "string" && messageStarted) {
          const delta = data.delta as { content: string };
          setMessages(messages => {
            const updatedMessages = [...messages];
            const lastIndex = updatedMessages.length - 1;
            if (lastIndex >= 0 && updatedMessages[lastIndex].role === "assistant") {
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                content: updatedMessages[lastIndex].content + delta.content
              };
            }
            return updatedMessages;
          });
        }
      });
      
      // Streaming completed
      setIsAssistantTyping(false);
      // Fetch the latest messages from the backend to ensure the new assistant message is shown
      try {
        const updatedMessages = await getChatMessages(selectedSessionId);
        setMessages(updatedMessages);
      } catch (err) {
        // Optionally handle error
        console.error("Error fetching updated messages after streaming:", err);
      }
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "AbortError") {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        
        // Display error message in chat
        const errorMessage: ChatMessage = {
          id: Date.now() + 2,
          content: "Sorry, there was an error processing your request. Please try again.",
          role: "assistant",
          sessionId: selectedSessionId,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsSending(false);
      setIsAssistantTyping(false);
      abortControllerRef.current = null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Please Login
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You need to be logged in to access chat features.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] p-6">
      {/* Sessions Sidebar */}
      <div className="w-80 mr-6 flex flex-col border-r border-gray-200 dark:border-gray-700 pr-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Chat Sessions
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNewSessionName("New Chat")}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </motion.button>
        </div>

        {/* New Session Form */}
        <AnimatePresence>
          {newSessionName !== "" && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateSession}
              className="mb-4 overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Enter session name"
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isCreatingSession}
                  className={`px-3 py-2 rounded-md ${
                    isCreatingSession
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500"
                  } text-white transition-colors`}
                >
                  {isCreatingSession ? "..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setNewSessionName("")}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No chat sessions yet
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                      selectedSessionId === session.id
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="font-medium truncate">{session.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Chat Header */}
        {selectedSessionId ? (
          <>
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {sessions.find((s) => s.id === selectedSessionId)?.name || "Chat"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(() => {
                    const session = sessions.find((s) => s.id === selectedSessionId);
                    return session && session.createdAt && !isNaN(new Date(session.createdAt).getTime())
                      ? new Date(session.createdAt).toLocaleDateString()
                      : "";
                  })()}
                </span>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
              {sessionLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Avatar for assistant messages */}
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-md px-4 py-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {/* Use dangerouslySetInnerHTML to render markdown */}
                        <div className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        
                        <div
                          className={`text-xs mt-1 ${
                            msg.role === "user"
                              ? "text-blue-200"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                      
                      {/* Avatar for user messages */}
                      {msg.role === "user" && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ml-2">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isAssistantTyping && (
                    <div className="flex justify-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-3">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className={`px-4 py-2 rounded-md ${
                    isSending || !newMessage.trim()
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500"
                  } text-white transition-colors`}
                >
                  {isSending ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending
                    </span>
                  ) : (
                    "Send"
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No Chat Selected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select an existing chat session or create a new one to start a
              conversation.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNewSessionName("New Chat")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
            >
              Create New Chat
            </motion.button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Full-screen overlay to capture clicks */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left shadow-xl relative z-[10000] max-w-lg w-full mx-auto"
            >
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-red-600 dark:text-red-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Delete Chat Session
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete this chat session? All
                      messages will be permanently removed.
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleDeleteSession}
                      className="ml-3 inline-flex justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-500 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="mt-3 sm:mt-0 inline-flex justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
