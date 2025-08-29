import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  type ChartConfig 
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface AnalysisEvent {
  id: string;
  url: string;
  domain: string;
  date: string;
  time: string;
  seoScore: number;
  pageSpeed: number;
  issues: number;
  status: "completed" | "failed" | "running" | "pending";
}

interface TimelinePoint {
  date: string;
  analyses: number;
  avgSeoScore: number;
  avgPageSpeed: number;
  totalIssues: number;
  completedAnalyses: number;
  failedAnalyses: number;
}

interface HistoryTimelineChartProps {
  data: AnalysisEvent[];
  title?: string;
  description?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  showExport?: boolean;
  onExport?: () => void;
  height?: number;
  onAnalysisClick?: (analysis: AnalysisEvent) => void;
}

const chartConfig = {
  analyses: {
    label: "Total Analyses",
    color: "hsl(var(--chart-1))",
  },
  avgSeoScore: {
    label: "Avg SEO Score",
    color: "hsl(var(--chart-2))",
  },
  avgPageSpeed: {
    label: "Avg Page Speed",
    color: "hsl(var(--chart-3))",
  },
  completedAnalyses: {
    label: "Completed",
    color: "hsl(142, 76%, 36%)",
  },
  failedAnalyses: {
    label: "Failed",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

export function HistoryTimelineChart({
  data,
  title = "Analysis Timeline",
  description = "Historical overview of SEO analyses and performance trends",
  timeRange = "30d",
  onTimeRangeChange,
  showExport = true,
  onExport,
  height = 400,
  onAnalysisClick
}: HistoryTimelineChartProps) {
  
  // Process data into timeline points
  const processTimelineData = (): TimelinePoint[] => {
    const groupedData = data.reduce((acc, analysis) => {
      const dateKey = analysis.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(analysis);
      return acc;
    }, {} as Record<string, AnalysisEvent[]>);

    return Object.entries(groupedData).map(([date, analyses]) => {
      const completed = analyses.filter(a => a.status === "completed");
      const failed = analyses.filter(a => a.status === "failed");
      
      return {
        date,
        analyses: analyses.length,
        avgSeoScore: completed.length > 0 
          ? Math.round(completed.reduce((sum, a) => sum + a.seoScore, 0) / completed.length)
          : 0,
        avgPageSpeed: completed.length > 0
          ? Math.round(completed.reduce((sum, a) => sum + a.pageSpeed, 0) / completed.length)
          : 0,
        totalIssues: completed.reduce((sum, a) => sum + a.issues, 0),
        completedAnalyses: completed.length,
        failedAnalyses: failed.length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Create scatter plot data for individual events
  const processScatterData = () => {
    return data
      .filter(analysis => analysis.status === "completed")
      .map((analysis, index) => ({
        ...analysis,
        dateNum: new Date(analysis.date).getTime(),
        x: index + 1,
        y: analysis.seoScore,
        fill: analysis.seoScore >= 80 ? "hsl(142, 76%, 36%)" : 
              analysis.seoScore >= 60 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)"
      }));
  };

  const timelineData = processTimelineData();
  const scatterData = processScatterData();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "failed": return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "running": return <Clock className="h-3 w-3 text-blue-500" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[250px]">
          <p className="font-medium text-foreground mb-3">
            {formatDate(label)}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Analyses:</span>
              <span className="font-medium">{data.analyses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed:</span>
              <span className="font-medium text-green-600">{data.completedAnalyses}</span>
            </div>
            {data.failedAnalyses > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed:</span>
                <span className="font-medium text-red-600">{data.failedAnalyses}</span>
              </div>
            )}
            {data.avgSeoScore > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg SEO Score:</span>
                <span className="font-medium">{data.avgSeoScore}/100</span>
              </div>
            )}
            {data.avgPageSpeed > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Page Speed:</span>
                <span className="font-medium">{data.avgPageSpeed}/100</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const scatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const analysis = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(analysis.status)}
            <span className="font-medium text-sm">{analysis.domain}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="truncate max-w-[180px]" title={analysis.url}>
              {analysis.url}
            </div>
            <div className="text-muted-foreground">
              {formatDate(analysis.date)} at {analysis.time}
            </div>
            <div className="pt-1 space-y-1">
              <div className="flex justify-between">
                <span>SEO Score:</span>
                <span className="font-medium">{analysis.seoScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Page Speed:</span>
                <span className="font-medium">{analysis.pageSpeed}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Issues:</span>
                <span className="font-medium">{analysis.issues}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Timeline Area Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
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
        </CardHeader>
        
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart
              data={timelineData}
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
              />
              <ChartTooltip content={customTooltip} />
              
              <Area
                type="monotone"
                dataKey="analyses"
                stroke="var(--color-analyses)"
                fill="var(--color-analyses)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Individual Analysis Events Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Individual Analysis Events
          </CardTitle>
          <CardDescription>
            Each point represents a completed SEO analysis. Click on any point for details.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ScatterChart
              data={scatterData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                dataKey="x"
                domain={['dataMin', 'dataMax']}
                className="text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={() => ''} // Hide x-axis labels for cleaner look
              />
              <YAxis 
                type="number"
                dataKey="y"
                domain={[0, 100]}
                className="text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip content={scatterTooltip} />
              
              <Scatter
                dataKey="y"
                fill="hsl(var(--primary))"
                onClick={onAnalysisClick}
                style={{ cursor: onAnalysisClick ? "pointer" : "default" }}
              />
            </ScatterChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Analysis Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity Summary
          </CardTitle>
          <CardDescription>
            Quick overview of recent analysis activity and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timelineData.slice(-3).map((point, index) => (
              <div key={point.date} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{formatDate(point.date)}</span>
                  <Badge variant="outline">{point.analyses} analyses</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="text-green-600">{point.completedAnalyses}</span>
                  </div>
                  {point.failedAnalyses > 0 && (
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="text-red-600">{point.failedAnalyses}</span>
                    </div>
                  )}
                  {point.avgSeoScore > 0 && (
                    <div className="flex justify-between">
                      <span>Avg SEO:</span>
                      <span>{point.avgSeoScore}/100</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}