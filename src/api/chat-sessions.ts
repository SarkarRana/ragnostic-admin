import apiClient from "./client";

export interface ChatSession {
  id: number;
  name: string;
  tenantId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  role: "user" | "assistant";
  sessionId: number;
  createdAt: string;
}

export interface CreateSessionRequest {
  name: string;
  tenantId: number;
  userId: number;
}

export interface SendMessageRequest {
  message: string;
  stream?: boolean;
}

// Helper to convert snake_case to camelCase for session/message objects
function mapSession(session: any): ChatSession {
  return {
    ...session,
    name: session.title || session.name, // Map 'title' to 'name'
    createdAt: session.created_at || session.createdAt,
    updatedAt: session.updated_at || session.updatedAt,
  };
}

function mapMessage(msg: any): ChatMessage {
  return {
    ...msg,
    createdAt: msg.created_at || msg.createdAt,
  };
}

export const createChatSession = async (
  sessionData: CreateSessionRequest
): Promise<ChatSession> => {
  const response = await apiClient.post<ChatSession>(
    "/chat-sessions",
    sessionData
  );
  return mapSession(response.data);
};

export const getChatSessions = async (
  tenantId: number,
  userId?: number
): Promise<ChatSession[]> => {
  const params: Record<string, any> = { tenantId };
  if (userId) params.userId = userId;

  const response = await apiClient.get<ChatSession[]>("/chat-sessions", {
    params,
  });
  return response.data.map(mapSession);
};

export const getChatSession = async (id: number): Promise<ChatSession> => {
  const response = await apiClient.get<ChatSession>(`/chat-sessions/${id}`);
  return mapSession(response.data);
};

export const getChatMessages = async (
  sessionId: number
): Promise<ChatMessage[]> => {
  const response = await apiClient.get<ChatMessage[]>(
    `/chat-sessions/${sessionId}/messages`
  );
  return response.data.map(mapMessage);
};

export const sendChatMessage = async (
  sessionId: number,
  content: string,
  onMessageChunk?: (chunk: string) => void
): Promise<ChatMessage | null> => {
  const useStreaming = !!onMessageChunk;

  if (useStreaming) {
    // Use fetch for streaming
    const response = await fetch(
      `${apiClient.defaults.baseURL}/chat-sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ message: content, stream: true }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseMessage = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        responseMessage += chunk;
        onMessageChunk?.(chunk);
      }

      // Return null because we've been streaming the response
      return null;
    } catch (error) {
      console.error("Error reading stream:", error);
      throw error;
    }
  } else {
    // Use axios for non-streaming
    const response = await apiClient.post<ChatMessage>(
      `/chat-sessions/${sessionId}/messages`,
      {
        message: content,
      }
    );

    return response.data;
  }
};

export const deleteChatSession = async (id: number): Promise<void> => {
  await apiClient.delete(`/chat-sessions/${id}`);
};
