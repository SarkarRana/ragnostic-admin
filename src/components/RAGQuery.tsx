import { useState, useRef, useEffect } from "react";
import {
  queryDocument,
  getDocumentFileInfo,
  DocumentFileInfo,
} from "../api/documents";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PDFViewer } from "./PDFViewer";
import apiClient from "../api/client";

interface Source {
  text: string;
  page: number;
}

interface RAGQueryProps {
  documentId: number;
  documentName?: string;
}

export const RAGQuery = ({ documentId, documentName }: RAGQueryProps) => {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [hasSources, setHasSources] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<DocumentFileInfo | null>(null);
  const [pdfFilePath, setPdfFilePath] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the answer container as new content arrives
  useEffect(() => {
    if (answerRef.current && isStreaming) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer, isStreaming]);

  // Format the answer to properly display numbered lists and paragraphs
  const formattedAnswer = answer
    .replace(/(\d+\.)/g, "\n$1") // Add newline before numbered items
    .trim();

  // Handle opening the PDF viewer
  const handleOpenPdf = async () => {
    if (pdfFilePath) {
      // If we already have PDF file path, just open the viewer
      setIsPdfOpen(true);
      return;
    }

    setLoadingPdf(true);
    try {
      // Fetch the PDF file information from the API
      const fileInfo = await getDocumentFileInfo(documentId);
      console.log("PDF file info fetched:", fileInfo);
      setPdfInfo(fileInfo);

      // Use the fileUrl (web-accessible path) instead of filePath
      if (fileInfo.fileUrl) {
        // Construct the full URL without /api/ prefix since uploads are served directly
        const baseUrl =
          apiClient.defaults.baseURL?.replace("/api", "") ||
          "http://localhost:3001";
        const fullPdfUrl = `${baseUrl}${fileInfo.fileUrl}`;
        console.log("Using PDF web URL:", fullPdfUrl);
        setPdfFilePath(fullPdfUrl);
        setIsPdfOpen(true);
      } else {
        throw new Error("No file URL returned from API");
      }
    } catch (error) {
      console.error("Error fetching PDF info:", error);
      toast.error("Failed to load PDF file information");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    console.log("Submitting RAG query:", query);
    setLoading(true);
    setIsStreaming(true);
    setAnswer(""); // Reset the answer before starting a new query
    setSources([]); // Reset sources
    setHasSources(false);
    setPdfInfo(null); // Reset PDF info
    setPdfFilePath(null); // Reset PDF file path
    setHasResult(true);

    try {
      await queryDocument(
        documentId,
        query,
        // Callback for streaming chunks
        (chunk) => {
          setAnswer((prev) => prev + chunk);
        },
        // Callback for receiving sources
        (sourcesData) => {
          setSources(sourcesData);
          setHasSources(sourcesData.length > 0);
          console.log("Sources received:", sourcesData);
        }
      );

      console.log("Stream complete, final answer length:", answer.length);
      setIsStreaming(false);
    } catch (error) {
      console.error("Error during RAG query:", error);
      toast.error("Failed to get answer");
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: 0.2,
      },
    },
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800/50">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Querying document:{" "}
          <span className="font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded">
            {documentName || `Document ${documentId}`}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about this document..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          disabled={loading}
        />
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`px-4 py-2 rounded-md ${
            loading
              ? "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
          } shadow-sm transition-colors`}
        >
          {loading ? "Asking..." : "Ask"}
        </motion.button>
      </form>

      <AnimatePresence mode="wait">
        {hasResult && (
          <motion.div
            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h3
              className="font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center justify-between"
              variants={headingVariants}
            >
              <div className="flex items-center">
                <span>Answer:</span>
                {isStreaming && (
                  <motion.span
                    className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [0.98, 1.02, 0.98],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Streaming...
                  </motion.span>
                )}
              </div>

              {/* View Sources button */}
              {hasSources && !isStreaming && (
                <motion.button
                  onClick={handleOpenPdf}
                  disabled={loadingPdf}
                  variants={buttonVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
                >
                  {loadingPdf ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 mr-1"
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
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      View Sources
                    </>
                  )}
                </motion.button>
              )}
            </motion.h3>

            <motion.div
              ref={answerRef}
              className="text-gray-800 dark:text-gray-200 whitespace-pre-line max-h-80 overflow-y-auto prose prose-sm max-w-none rounded-md bg-white dark:bg-gray-800/80 p-3 border border-gray-100 dark:border-gray-700"
              variants={textContainerVariants}
            >
              {formattedAnswer ||
                (isStreaming ? "Loading..." : "No response yet.")}
              {isStreaming && (
                <motion.span
                  className="inline-block ml-1 font-mono"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  ▌
                </motion.span>
              )}
            </motion.div>

            <div className="mt-2 flex justify-between items-center">
              <AnimatePresence>
                {hasSources && !isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="text-xs text-gray-500 dark:text-gray-400 flex items-center"
                  >
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full mr-1.5">
                      {sources.length}
                    </span>
                    sources found in document
                  </motion.div>
                )}
              </AnimatePresence>

              {!isStreaming && answer && (
                <motion.div
                  className="text-right text-xs text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <span>Response complete</span>
                  <span className="inline-block ml-1">✓</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal */}
      {isPdfOpen && pdfFilePath && (
        <PDFViewer
          fileUrl={pdfFilePath}
          sources={sources}
          isOpen={isPdfOpen}
          onClose={() => setIsPdfOpen(false)}
        />
      )}
    </div>
  );
};
