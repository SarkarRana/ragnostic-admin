import { useState, useEffect } from "react";
import { DocumentList } from "../components/DocumentList";
import { FileUpload } from "../components/FileUpload";
import { RAGQuery } from "../components/RAGQuery";
import { TenantDocument } from "../api/tenant-documents";
import { useAuth } from "../context/useAuth";
import { getTenantDocuments } from "../api/tenant-documents";

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
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
        if (!user?.tenantId) {
          setDocuments([]);
          setSelectedDocumentId(null);
          setLoading(false);
          return;
        }
        const docs = await getTenantDocuments(user.tenantId);
        setDocuments(docs);
        setSelectedDocumentId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [refreshKey, user?.tenantId]);

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
