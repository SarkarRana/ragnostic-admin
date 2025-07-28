import apiClient from "./client";
import { Document, DocumentStatus } from "../types/document";

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await apiClient.get("/documents");
  return response.data.map((doc: any) => ({
    ...doc,
    createdAt: doc.created_at || doc.createdAt,
    updatedAt: doc.updated_at || doc.updatedAt,
  }));
};

export const processDocument = async (id: number) => {
  return apiClient.post(`/documents/${id}/process`);
};

export const embedDocument = async (id: number) => {
  return apiClient.post(`/documents/${id}/embed`);
};

export const queryDocument = async (
  documentId: number,
  query: string,
  onStreamChunk?: (chunk: string) => void,
  onSourcesReceived?: (sources: Array<{ text: string; page: number }>) => void
) => {
  console.log("RAG Query starting - Request params:", {
    documentId,
    query,
    stream: true,
  });

  try {
    // Set up a fetch request instead of using axios for streaming
    const response = await fetch(
      `${apiClient.defaults.baseURL}/documents/rag/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, documentId, stream: true }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Track whether we're in sources section and collect sources
    let inSourcesSection = false;
    const sources: Array<{ text: string; page: number }> = [];
    let currentSourceText = "";

    console.log("Stream response initialized, starting to read chunks");

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("Stream complete");
        // If we've collected sources, send them to the callback
        if (sources.length > 0 && onSourcesReceived) {
          onSourcesReceived(sources);
        }
        break;
      }

      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });

      // Process any complete SSE messages in the buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            // Extract the JSON data
            const jsonStr = line.substring(6); // Remove "data: " prefix
            const data = JSON.parse(jsonStr);

            // Check if this is the "done" message
            if (data.done === true) {
              console.log("Received done message");
              // If we've collected sources, send them to the callback
              if (sources.length > 0 && onSourcesReceived) {
                onSourcesReceived(sources);
              }
              continue;
            }

            // Check if this is a chunk with content
            if (data.chunk !== undefined) {
              const chunk = data.chunk;

              // Check if we're entering the sources section
              if (chunk.includes("--- Sources ---")) {
                inSourcesSection = true;
                continue;
              }

              // Process chunk based on section
              if (inSourcesSection) {
                // Source format: "Source X (Page Y):"
                if (chunk.match(/^Source \d+ \(Page \d+\):/)) {
                  // If we already had a source, save it before starting new one
                  if (currentSourceText) {
                    // Extract page number from previous source
                    const pageMatch = currentSourceText.match(/Page (\d+)/);
                    const page = pageMatch ? parseInt(pageMatch[1]) : 0;

                    // Extract text content
                    const textContent = currentSourceText
                      .replace(/^Source \d+ \(Page \d+\):/, "")
                      .trim();

                    sources.push({
                      text: textContent,
                      page: page,
                    });
                  }

                  // Start collecting new source
                  currentSourceText = chunk;
                } else {
                  // Continue collecting current source
                  currentSourceText += chunk;
                }
              } else {
                // Pass the chunk to the callback if we're in the answer section
                if (onStreamChunk) {
                  onStreamChunk(chunk);
                }
              }
            }
          } catch (e) {
            console.error("Error parsing SSE message:", e, line);
          }
        }
      }
    }

    console.log("RAG Query completed successfully");
    return { success: true };
  } catch (error) {
    console.error("RAG Query error:", error);
    throw error;
  }
};

export interface DocumentFileInfo {
  documentId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
}

export const getDocumentFileInfo = async (
  id: number
): Promise<DocumentFileInfo> => {
  const response = await apiClient.get(`/documents/${id}/file`);
  return response.data;
};

export const updateDocumentStatus = async (
  id: number,
  status: DocumentStatus
) => {
  return apiClient.put(`/documents/${id}/status`, { status });
};

export const deleteDocument = async (id: number) => {
  return apiClient.delete(`/documents/${id}`);
};
