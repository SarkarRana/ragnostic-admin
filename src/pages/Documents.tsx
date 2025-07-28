import { useState, useEffect } from "react";
import { DocumentList } from "../components/DocumentList";
import { FileUpload } from "../components/FileUpload";
import { RAGQuery } from "../components/RAGQuery";
import { Document } from "../types/document";
import { toast } from "react-hot-toast";
import { getDocuments } from "../api/documents";

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch documents without auto-selecting
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const docs = await getDocuments();
        setDocuments(docs);

        // No auto-selection - always start with no document selected
        setSelectedDocumentId(null);
      } catch (error) {
        toast.error("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [refreshKey]);

  const handleDocumentSelect = (docId: number) => {
    setSelectedDocumentId(docId);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Documents
        </h1>
        <FileUpload onUpload={handleRefresh} />
      </div>

      <DocumentList
        documents={documents}
        loading={loading}
        selectedDocumentId={selectedDocumentId}
        onDocumentSelect={handleDocumentSelect}
        onRefresh={handleRefresh}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Document Query
        </h2>
        {selectedDocumentId ? (
          <RAGQuery
            documentId={selectedDocumentId}
            documentName={
              documents.find((doc) => doc.id === selectedDocumentId)?.name ||
              documents.find((doc) => doc.id === selectedDocumentId)?.filename
            }
          />
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md border border-yellow-100 dark:border-yellow-800/50">
            {documents.length === 0
              ? "No documents available. Please upload a document first."
              : "Please select a document to query."}
          </div>
        )}
      </div>
    </div>
  );
};
