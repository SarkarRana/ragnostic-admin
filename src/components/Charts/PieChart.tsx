import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

export const PieChart = ({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) => {
  const { theme } = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPie>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
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
      </RechartsPie>
    </ResponsiveContainer>
  );
};
