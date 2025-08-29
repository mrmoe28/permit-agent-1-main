import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart as LineChartIcon, Download, TrendingUp, TrendingDown } from "lucide-react";

interface DataPoint {
  date: string;
  seoScore: number;
  pageSpeed: number;
  issues: number;
  accessibility?: number;
  bestPractices?: number;
}

interface PerformanceLineChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  showExport?: boolean;
  onExport?: () => void;
  height?: number;
  enableZoom?: boolean;
}

const chartConfig = {
  seoScore: {
    label: "SEO Score",
    color: "hsl(var(--chart-1))",
  },
  pageSpeed: {
    label: "Page Speed", 
    color: "hsl(var(--chart-2))",
  },
  issues: {
    label: "Issues",
    color: "hsl(var(--chart-3))",
  },
  accessibility: {
    label: "Accessibility",
    color: "hsl(var(--chart-4))",
  },
  bestPractices: {
    label: "Best Practices",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function PerformanceLineChart({
  data,
  title = "Performance Over Time",
  description = "Track your SEO performance, page speed, and issues over time",
  timeRange = "30d",
  onTimeRangeChange,
  showExport = true,
  onExport,
  height = 400,
  enableZoom = true
}: PerformanceLineChartProps) {
  
  // Calculate trends for the summary
  const calculateTrend = (metric: keyof DataPoint) => {
    if (data.length < 2) return { trend: 0, direction: "same" as const };
    
    const recent = data.slice(-2);
    const change = (recent[1][metric] as number) - (recent[0][metric] as number);
    const percentage = Math.abs(change / (recent[0][metric] as number) * 100);
    
    return {
      trend: Math.round(percentage * 10) / 10,
      direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "same" as const
    };
  };

  const seoTrend = calculateTrend("seoScore");
  const speedTrend = calculateTrend("pageSpeed");
  const issuesTrend = calculateTrend("issues");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
          <p className="font-medium text-foreground mb-2">
            {formatDate(label)}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
                  </span>
                </div>
                <span className="font-mono font-medium text-foreground">
                  {entry.value}
                  {entry.dataKey === "issues" ? "" : "/100"}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onTimeRangeChange && (
              <Select value={timeRange} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            )}
            {showExport && onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Trend Summary */}
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">SEO:</span>
            <div className="flex items-center gap-1">
              {seoTrend.direction === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : seoTrend.direction === "down" ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span className={`text-sm font-medium ${
                seoTrend.direction === "up" ? "text-green-600" : 
                seoTrend.direction === "down" ? "text-red-600" : "text-gray-500"
              }`}>
                {seoTrend.direction === "same" ? "No change" : `${seoTrend.trend}%`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <div className="flex items-center gap-1">
              {speedTrend.direction === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : speedTrend.direction === "down" ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span className={`text-sm font-medium ${
                speedTrend.direction === "up" ? "text-green-600" : 
                speedTrend.direction === "down" ? "text-red-600" : "text-gray-500"
              }`}>
                {speedTrend.direction === "same" ? "No change" : `${speedTrend.trend}%`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Issues:</span>
            <div className="flex items-center gap-1">
              {issuesTrend.direction === "down" ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : issuesTrend.direction === "up" ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : null}
              <span className={`text-sm font-medium ${
                issuesTrend.direction === "down" ? "text-green-600" : 
                issuesTrend.direction === "up" ? "text-red-600" : "text-gray-500"
              }`}>
                {issuesTrend.direction === "same" ? "No change" : `${issuesTrend.trend}%`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              className="text-xs"
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              axisLine={false}
              tickLine={false}
              domain={[0, 'dataMax']}
            />
            <ChartTooltip content={customTooltip} />
            <ChartLegend content={<ChartLegendContent />} />
            
            <Line
              type="monotone"
              dataKey="seoScore"
              stroke="var(--color-seoScore)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="pageSpeed"
              stroke="var(--color-pageSpeed)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="issues"
              stroke="var(--color-issues)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              yAxisId="right"
            />
            
            {/* Optional additional metrics */}
            {data.some(d => d.accessibility !== undefined) && (
              <Line
                type="monotone"
                dataKey="accessibility"
                stroke="var(--color-accessibility)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            )}
            
            {data.some(d => d.bestPractices !== undefined) && (
              <Line
                type="monotone"
                dataKey="bestPractices"
                stroke="var(--color-bestPractices)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}