import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

// Define the new status type based on TenantDocument.status
type DocumentStatus = "uploaded" | "processed" | "error";

const statusColors: Record<DocumentStatus, { light: string; dark: string }> = {
  uploaded: {
    light: "bg-blue-100 text-blue-800",
    dark: "bg-blue-900/40 text-blue-300",
  },
  processed: {
    light: "bg-green-100 text-green-800",
    dark: "bg-green-900/40 text-green-300",
  },
  error: {
    light: "bg-red-100 text-red-800",
    dark: "bg-red-900/40 text-red-300",
  },
};

export const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  const { theme } = useTheme();
  const displayText =
    status === "processed"
      ? "Ready"
      : status.charAt(0).toUpperCase() + status.slice(1);
  const colors = statusColors[status] || statusColors.uploaded;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
        theme === "dark" ? colors.dark : colors.light
      } transition-colors duration-200`}
    >
      {displayText}
    </motion.span>
  );
};
