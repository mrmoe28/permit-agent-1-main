import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Brush, ReferenceLine } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, Maximize2, Calendar } from "lucide-react";

interface DataPoint {
  date: string;
  seoScore: number;
  pageSpeed: number;
  issues: number;
  accessibility?: number;
  bestPractices?: number;
}

interface AnalyticsAreaChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  showExport?: boolean;
  onExport?: () => void;
  height?: number;
  enableBrush?: boolean;
  showReferenceLine?: boolean;
}

const chartConfig: ChartConfig = {
  seoScore: {
    label: "SEO Score",
    color: "hsl(142, 76%, 36%)", // Green
  },
  pageSpeed: {
    label: "Page Speed", 
    color: "hsl(221, 83%, 53%)", // Blue
  },
  issues: {
    label: "Issues",
    color: "hsl(0, 84%, 60%)", // Red
  },
  accessibility: {
    label: "Accessibility",
    color: "hsl(271, 81%, 56%)", // Purple
  },
  bestPractices: {
    label: "Best Practices",
    color: "hsl(32, 95%, 44%)", // Orange
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 space-y-2">
        <p className="font-medium text-sm">{new Date(label).toLocaleDateString()}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.name}: </span>
            <span className="font-semibold text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsAreaChart({
  data,
  title = "Performance Over Time",
  description = "Track your SEO performance, page speed, and issues over time",
  timeRange = "30d",
  onTimeRangeChange,
  showExport = true,
  onExport,
  height = 400,
  enableBrush = true,
  showReferenceLine = false
}: AnalyticsAreaChartProps) {
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([
    "seoScore", "pageSpeed"
  ]);

  // Calculate trend indicators
  const calculateTrend = (metric: keyof DataPoint) => {
    if (data.length < 2) return null;
    const latest = data[data.length - 1][metric] as number;
    const previous = data[data.length - 2][metric] as number;
    const change = ((latest - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change >= 0 ? 'up' : 'down',
      isPositive: metric === 'issues' ? change < 0 : change >= 0
    };
  };

  const seoTrend = calculateTrend('seoScore');
  const speedTrend = calculateTrend('pageSpeed');
  const issuesTrend = calculateTrend('issues');

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const avgSeoScore = data.length > 0 ? data.reduce((sum, d) => sum + d.seoScore, 0) / data.length : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Trend Indicators */}
            <div className="flex items-center gap-4">
              {seoTrend && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    SEO {seoTrend.direction === 'up' ? '↗' : '↘'} {seoTrend.value.toFixed(1)}%
                  </Badge>
                </div>
              )}
              {speedTrend && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Speed {speedTrend.direction === 'up' ? '↗' : '↘'} {speedTrend.value.toFixed(1)}%
                  </Badge>
                </div>
              )}
            </div>

            {onTimeRangeChange && (
              <Select value={timeRange} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
            )}

            {showExport && onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Metric Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(chartConfig).map(([key, config]) => {
            if (!data.some(d => d[key as keyof DataPoint] !== undefined)) return null;
            
            const isSelected = selectedMetrics.includes(key);
            return (
              <Button
                key={key}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMetric(key)}
                className="h-8"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: isSelected ? 'white' : config.color }}
                />
                {config.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                {selectedMetrics.map(metric => (
                  <linearGradient key={metric} id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartConfig[metric].color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartConfig[metric].color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted/30"
                vertical={false}
              />
              
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                domain={[0, 100]}
              />

              {showReferenceLine && (
                <ReferenceLine 
                  y={avgSeoScore} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="2 2"
                  label={{ value: `Avg: ${avgSeoScore.toFixed(0)}`, position: "topRight" }}
                />
              )}

              <ChartTooltip content={<CustomTooltip />} />
              
              {selectedMetrics.map(metric => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={chartConfig[metric].color}
                  strokeWidth={2}
                  fill={`url(#gradient-${metric})`}
                  fillOpacity={0.6}
                  connectNulls={false}
                />
              ))}

              {enableBrush && data.length > 10 && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="hsl(var(--border))"
                  fill="hsl(var(--muted))"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}