import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineData {
  value: number;
}

interface MiniSparklineProps {
  data: SparklineData[];
  color?: string;
  width?: number;
  height?: number;
  showDot?: boolean;
}

export function MiniSparkline({
  data,
  color = "hsl(var(--primary))",
  width = 80,
  height = 24,
  showDot = false
}: MiniSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="bg-muted/20 rounded" 
        style={{ width, height }}
      />
    );
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={showDot ? { r: 1.5, fill: color } : false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}