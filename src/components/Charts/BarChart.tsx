import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

export const BarChart = ({
  data,
}: {
  data: { date: string; count: number }[];
}) => {
  const { theme } = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBar
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: theme === "dark" ? "#d1d5db" : "#4b5563" }}
        />
        <YAxis tick={{ fill: theme === "dark" ? "#d1d5db" : "#4b5563" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
            borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
            color: theme === "dark" ? "#f3f4f6" : "#111827",
          }}
        />
        <Legend
          wrapperStyle={{
            color: theme === "dark" ? "#f3f4f6" : "#111827",
          }}
        />
        <Bar
          dataKey="count"
          fill={theme === "dark" ? "#60a5fa" : "#3b82f6"}
          name="Documents Uploaded"
        />
      </RechartsBar>
    </ResponsiveContainer>
  );
};
