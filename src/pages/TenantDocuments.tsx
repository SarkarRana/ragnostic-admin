import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import {
  TenantDocument,
  uploadDocument,
  getTenantDocuments,
  downloadDocument,
  deleteTenantDocument,
} from "../api/tenant-documents";
import { PDFViewer } from "../components/PDFViewer";

interface FileUploadProps {
  tenantId: number;
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  tenantId,
  onUploadSuccess,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setIsUploading(true);
    try {
      await uploadDocument(e.target.files[0], tenantId);
      toast.success("File uploaded successfully!");
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        id="file-upload"
        accept=".pdf,.txt,.doc,.docx"
      />
      <label
        htmlFor="file-upload"
        className={`px-4 py-2 rounded-md cursor-pointer ${
          isUploading
            ? "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        } transition-colors duration-200`}
      >
        {isUploading ? "Uploading..." : "Upload Document"}
      </label>
    </div>
  );
};

interface DocumentStatusBadgeProps {
  status: string;
}

const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300";
      case "processed":
        return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300";
      case "error":
        return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300";
    }
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(
        status
      )} transition-colors duration-200`}
    >
      {status}
    </motion.span>
  );
};

export const TenantDocumentsPage = () => {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] =
    useState<TenantDocument | null>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!user?.tenantId) {
      toast.error("No tenant selected");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const docs = await getTenantDocuments(user.tenantId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    fetchDocuments();
  }, [user?.tenantId, fetchDocuments]);

  const handleViewDocument = async (document: TenantDocument) => {
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedDocument(document);
      setIsPdfViewerOpen(true);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document for viewing");
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      await deleteTenantDocument(selectedDocument.id);
      toast.success("Document deleted successfully");
      setIsDeleteModalOpen(false);
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Please Login
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You need to be logged in to view documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Documents
        </h1>
        <FileUpload tenantId={user.tenantId} onUploadSuccess={fetchDocuments} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No documents found. Upload your first document!
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Filename
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Uploaded
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {doc.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {doc.fileType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="mr-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDocument(doc);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {isPdfViewerOpen && pdfUrl && selectedDocument && (
        <PDFViewer
          fileUrl={pdfUrl}
          sources={[]}
          isOpen={isPdfViewerOpen}
          onClose={() => {
            setIsPdfViewerOpen(false);
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDocument && (
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
                    Delete Document
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete{" "}
                      <span className="font-bold">
                        {selectedDocument.filename}
                      </span>
                      ? This action cannot be undone.
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleDelete}
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

export default TenantDocumentsPage;
