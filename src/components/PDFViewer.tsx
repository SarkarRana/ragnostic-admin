import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface Source {
  text: string;
  page: number;
}

interface PDFViewerProps {
  fileUrl: string;
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  sources,
  isOpen,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>("");
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0); // Force iframe reload

  // Normalize sources to ensure page numbers start from 1
  const normalizedSources = useMemo(() => {
    return sources.map((source) => ({
      ...source,
      page: source.page === 0 ? 1 : source.page, // Convert 0-based to 1-based
    }));
  }, [sources]);

  // Set initial page based on sources when they change
  useEffect(() => {
    if (normalizedSources && normalizedSources.length > 0) {
      setCurrentPage(normalizedSources[0].page);
    } else {
      setCurrentPage(1);
    }
  }, [normalizedSources]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadError(false);
      console.log("🔄 PDFViewer opening...");
      console.log("📄 Loading PDF from URL:", fileUrl);
    }
  }, [isOpen, fileUrl]);

  const handlePageChange = useCallback((pageNumber: number) => {
    console.log(`Navigating to page ${pageNumber}`);
    setCurrentPage(pageNumber);
    setIframeKey((prev) => prev + 1); // Force iframe reload

    // Clear active source when changing pages manually
    setActiveSource(null);
  }, []);

  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      console.log("Closing PDF viewer");
      onClose();
    },
    [onClose]
  );

  // Group sources by page number for easier navigation
  const sourcesByPage = useMemo(() => {
    return normalizedSources.reduce<Record<number, Source[]>>((acc, source) => {
      const page = source.page;
      if (!acc[page]) acc[page] = [];
      acc[page].push(source);
      return acc;
    }, {});
  }, [normalizedSources]);

  // Get all unique pages that have sources
  const pagesWithSources = useMemo(() => {
    return Object.keys(sourcesByPage)
      .map(Number)
      .sort((a, b) => a - b);
  }, [sourcesByPage]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Source Document
              </h2>
              <button
                onClick={(e) => handleClose(e)}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* PDF Document using iframe - most reliable approach */}
              <div className="flex-1 overflow-hidden relative">
                <iframe
                  key={`iframe-${iframeKey}-${currentPage}`} // Force reload when page changes
                  src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&zoom=FitH&view=FitV`}
                  width="100%"
                  height="100%"
                  style={{ border: "none", minHeight: "600px" }}
                  title="PDF Viewer"
                  onLoad={() => {
                    console.log(
                      `✅ PDF loaded successfully on page ${currentPage}`
                    );
                  }}
                  onError={() => {
                    console.error("❌ Failed to load PDF via iframe");
                    setLoadError(true);
                    toast.error("Could not load the PDF file");
                  }}
                />

                {/* Page indicator overlay */}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  Page {currentPage}
                </div>

                {/* Source indicator overlay */}
                {activeSource !== null && (
                  <div className="absolute top-4 right-4 bg-blue-600/90 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    📍 Source {activeSource + 1} highlighted
                  </div>
                )}

                {loadError && (
                  <div className="absolute inset-0 bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                    <div className="text-red-500 text-center">
                      <p className="text-lg font-semibold">Error loading PDF</p>
                      <p className="text-sm mt-4 max-w-md">
                        There was a problem accessing the file at:
                      </p>
                      <p className="text-xs mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded max-w-md break-all">
                        {fileUrl}
                      </p>
                      <button
                        onClick={() => {
                          setLoadError(false);
                          setIframeKey((prev) => prev + 1);
                        }}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                      >
                        Retry Loading
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Source List */}
              <div className="w-80 flex-shrink-0 overflow-auto border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="p-4 h-full">
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Source References
                  </h3>

                  {/* Current page indicator */}
                  <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      📍 Currently viewing: Page {currentPage}
                    </p>
                    {activeSource !== null && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        🎯 Active source: #{activeSource + 1}
                      </p>
                    )}
                  </div>

                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search in sources..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                  />

                  <div
                    className="space-y-4 overflow-y-auto"
                    style={{ maxHeight: "calc(100vh - 300px)" }}
                  >
                    {pagesWithSources.map((pageNum) => (
                      <div key={`page-${pageNum}`}>
                        <h4
                          className={`text-sm font-medium mb-2 cursor-pointer transition-colors flex items-center justify-between ${
                            currentPage === pageNum
                              ? "text-blue-600 dark:text-blue-400 font-semibold"
                              : "text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                          }`}
                          onClick={() => {
                            console.log(`📄 Navigating to page ${pageNum}`);
                            handlePageChange(pageNum);
                          }}
                        >
                          <span>📄 Page {pageNum}</span>
                          <span className="text-xs">
                            {currentPage === pageNum ? "👁️" : "👆"}
                          </span>
                        </h4>
                        <ul className="space-y-2 ml-4">
                          {sourcesByPage[pageNum]
                            .filter(
                              (source) =>
                                !searchText ||
                                source.text
                                  .toLowerCase()
                                  .includes(searchText.toLowerCase())
                            )
                            .map((source, index) => (
                              <motion.li
                                key={`source-${pageNum}-${index}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`text-xs p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                                  activeSource === index &&
                                  currentPage === pageNum
                                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 shadow-md ring-2 ring-blue-300 dark:ring-blue-600"
                                    : currentPage === pageNum
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-700"
                                    : "bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
                                }`}
                                onClick={() => {
                                  console.log(
                                    `🎯 Clicked source ${
                                      index + 1
                                    } on page ${pageNum}`
                                  );

                                  // Navigate to page first
                                  if (currentPage !== pageNum) {
                                    handlePageChange(pageNum);
                                  }

                                  // Set active source
                                  setActiveSource(index);

                                  // Force iframe update with source highlighting
                                  setTimeout(() => {
                                    setIframeKey((prev) => prev + 1);
                                    console.log(
                                      `✨ Highlighted source ${
                                        index + 1
                                      } on page ${pageNum}`
                                    );
                                    toast.success(
                                      `Navigated to source ${
                                        index + 1
                                      } on page ${pageNum}`
                                    );
                                  }, 100);
                                }}
                              >
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-500 dark:text-blue-400 text-xs font-bold">
                                    #{index + 1}
                                  </span>
                                  <div className="flex-1">
                                    {source.text.length > 120
                                      ? `${source.text.substring(0, 120)}...`
                                      : source.text}
                                  </div>
                                  {activeSource === index &&
                                    currentPage === pageNum && (
                                      <span className="text-blue-500 dark:text-blue-400 text-xs">
                                        🎯
                                      </span>
                                    )}
                                </div>
                                {searchText &&
                                  source.text
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase()) && (
                                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                      🔍 Contains: "{searchText}"
                                    </div>
                                  )}
                              </motion.li>
                            ))}
                        </ul>
                      </div>
                    ))}

                    {pagesWithSources.length === 0 && (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                        <p className="text-sm">
                          📄 No source information available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
