import { TenantDocument } from "../api/tenant-documents";
import { StatusBadge } from "./StatusBadge";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { deleteTenantDocument } from "../api/tenant-documents";

interface DocumentListProps {
  documents: TenantDocument[];
  loading: boolean;
  selectedDocumentId: number | null;
  onDocumentSelect: (id: number) => void;
  onRefresh: () => void;
}

export const DocumentList = ({
  documents,
  loading,
  selectedDocumentId,
  onDocumentSelect,
  onRefresh,
}: DocumentListProps) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    documentId: number | null;
  }>({
    isOpen: false,
    documentId: null,
  });

  // Only allow selecting documents that are processed (ready)
  const isSelectable = (doc: TenantDocument): boolean => {
    return doc.status === "processed";
  };

  const handleDocumentSelect = (doc: TenantDocument) => {
    if (isSelectable(doc)) {
      onDocumentSelect(doc.id);
    } else {
      toast.error("Document must be fully processed before querying");
    }
  };

  // With the Pinecone Assistant API, processing happens automatically server-side
  // So we don't need manual processing steps anymore, just showing status

  const handleDelete = async (id: number) => {
    try {
      await deleteTenantDocument(id);
      toast.success("Document deleted");
      onRefresh();
      // Close the confirmation dialog
      setDeleteConfirmation({ isOpen: false, documentId: null });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const confirmDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, documentId: id });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, documentId: null });
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <AnimatePresence>
            {documents.map((doc) => (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                  selectedDocumentId === doc.id
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : ""
                } ${!isSelectable(doc) ? "opacity-80" : ""}}`}
              >
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 
                    ${
                      isSelectable(doc)
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    }`}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedDocumentId === doc.id}
                      disabled={!isSelectable(doc)}
                      onChange={() => {}}
                      className={`h-4 w-4 mr-3 ${
                        isSelectable(doc)
                          ? "text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                          : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      }`}
                    />
                    {doc.filename || "Untitled Document"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {doc.createdAt && !isNaN(Date.parse(doc.createdAt))
                    ? new Date(doc.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-3 items-center">
                    {doc.status === "uploaded" && (
                      <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                        Uploading...
                      </span>
                    )}
                    {doc.status === "processed" && (
                      <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                        Ready ✓
                      </span>
                    )}
                    {doc.status === "error" && (
                      <span className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                        Error
                      </span>
                    )}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(doc.id, e);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors duration-150"
                    >
                      Delete
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {deleteConfirmation.isOpen && (
        <>
          {/* Using a portal to render at the root level to avoid z-index issues */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            {/* Full-screen overlay to capture clicks */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={cancelDelete}
            ></div>
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-[10000] max-w-md w-full mx-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Delete
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this document? This action cannot
                be undone.
              </p>
              <div className="flex justify-end gap-4">
                <motion.button
                  onClick={cancelDelete}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(deleteConfirmation.documentId!)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};
