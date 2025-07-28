import { useEffect, useState } from "react";
import { BarChart } from "../components/Charts/BarChart";
import { FiFile, FiDatabase, FiActivity, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";
import { PieChart } from "../components/Charts/PieChart";
import { useAuth } from "../context/AuthContext";
import { getTenantDocuments, TenantDocument } from "../api/tenant-documents";
import { getChatSessions, ChatSession } from "../api/chat-sessions";

export const DashboardPage = () => {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.tenantId) {
        setLoading(false);
        return;
      }

      try {
        const [docs, sessions] = await Promise.all([
          getTenantDocuments(user.tenantId),
          getChatSessions(user.tenantId, user.id),
        ]);
        setDocuments(docs);
        setChatSessions(sessions);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.tenantId, user?.id]);

  // Calculate metrics
  // Calculate metrics
  const totalDocuments = documents.length;
  const processedDocuments = documents.filter(
    (doc) => doc.status === "processed"
  ).length;
  const uploadedDocuments = documents.filter(
    (doc) => doc.status === "uploaded"
  ).length;
  const errorDocuments = documents.filter(
    (doc) => doc.status === "error"
  ).length;

  // Prepare data for charts
  const statusDistribution = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uploadTrend = documents
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .reduce((acc, doc) => {
      const date = new Date(doc.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const statusData = Object.entries(statusDistribution).map(
    ([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
      color: getStatusColor(status),
    })
  );

  const trendData = Object.entries(uploadTrend).map(([date, count]) => ({
    date,
    count,
  }));

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      uploaded: "#3b82f6", // blue-500
      processed: "#8b5cf6", // violet-500
      error: "#ef4444", // red-500
    };
    return colors[status] || "#6b7280"; // gray-500 as fallback
  }

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 dark:text-gray-100"
      >
        Dashboard Overview
      </motion.h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Documents"
          value={totalDocuments}
          icon={<FiFile className="w-5 h-5" />}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
          loading={loading}
        />
        <MetricCard
          title="Processed"
          value={processedDocuments}
          icon={<FiDatabase className="w-5 h-5" />}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200"
          loading={loading}
        />
        <MetricCard
          title="Uploaded"
          value={uploadedDocuments}
          icon={<FiActivity className="w-5 h-5" />}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200"
          loading={loading}
        />
        <MetricCard
          title="Error"
          value={errorDocuments}
          icon={<FiClock className="w-5 h-5" />}
          color="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Document Status Distribution
          </h2>
          <div className="h-64">
            <PieChart data={statusData} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Upload Trend (Last 7 Days)
          </h2>
          <div className="h-64">
            <BarChart data={trendData} />
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Recent Documents
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Uploaded
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {documents.slice(0, 5).map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {doc.filename || "Untitled Document"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        doc.status === "processed"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : doc.status === "uploaded"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`p-4 rounded-lg shadow ${color.split(" ")[0]} ${
      loading ? "animate-pulse" : ""
    }`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-opacity-80 dark:text-opacity-90">
          {title}
        </p>
        <p className="text-2xl font-bold mt-1">{loading ? "--" : value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.split(" ")[1]} bg-opacity-20`}>
        {icon}
      </div>
    </div>
  </motion.div>
);
