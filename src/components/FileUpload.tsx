import { useRef, useState } from "react";
import { uploadDocument } from "../api/tenant-documents";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/useAuth";

export const FileUpload = ({ onUpload }: { onUpload: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user?.tenantId) return;

    setIsUploading(true);
    try {
      await uploadDocument(e.target.files[0], user.tenantId);
      toast.success("File uploaded successfully!");
      onUpload();
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
