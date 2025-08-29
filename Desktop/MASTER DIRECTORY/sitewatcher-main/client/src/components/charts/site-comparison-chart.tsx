import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
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
import { BarChart3, Globe, Download, Eye } from "lucide-react";

interface SiteData {
  site: string;
  seoScore: number;
  pageSpeed: number;
  issues: number;
  accessibility?: number;
  bestPractices?: number;
  url?: string;
}

interface SiteComparisonChartProps {
  data: SiteData[];
  title?: string;
  description?: string;
  showExport?: boolean;
  onExport?: () => void;
  onSiteClick?: (site: SiteData) => void;
  height?: number;
  layout?: "vertical" | "horizontal";
  metric?: "seoScore" | "pageSpeed" | "issues" | "accessibility" | "bestPractices";
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

export function SiteComparisonChart({
  data,
  title = "Site Performance Comparison",
  description = "Compare performance metrics across all your monitored sites",
  showExport = true,
  onExport,
  onSiteClick,
  height = 400,
  layout = "vertical",
  metric = "seoScore"
}: SiteComparisonChartProps) {

  const getScoreColor = (score: number, metricType: string) => {
    if (metricType === "issues") {
      // For issues, lower is better
      if (score <= 3) return "hsl(142, 76%, 36%)"; // green
      if (score <= 7) return "hsl(48, 96%, 53%)"; // yellow
      return "hsl(0, 84%, 60%)"; // red
    } else {
      // For other metrics, higher is better
      if (score >= 90) return "hsl(142, 76%, 36%)"; // green
      if (score >= 70) return "hsl(48, 96%, 53%)"; // yellow
      return "hsl(0, 84%, 60%)"; // red
    }
  };

  const getScoreBadge = (score: number, metricType: string) => {
    if (metricType === "issues") {
      if (score <= 3) return "default";
      if (score <= 7) return "secondary";
      return "destructive";
    } else {
      if (score >= 90) return "default";
      if (score >= 70) return "secondary";
      return "destructive";
    }
  };

  const chartData = data.map(site => ({
    ...site,
    color: getScoreColor(site[metric], metric)
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[250px]">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-primary" />
            <p className="font-medium text-foreground">{data.site}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SEO Score:</span>
              <Badge variant={getScoreBadge(data.seoScore, "seoScore")}>
                {data.seoScore}/100
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page Speed:</span>
              <Badge variant={getScoreBadge(data.pageSpeed, "pageSpeed")}>
                {data.pageSpeed}/100
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Issues:</span>
              <Badge variant={getScoreBadge(data.issues, "issues")}>
                {data.issues}
              </Badge>
            </div>
            {data.accessibility && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accessibility:</span>
                <Badge variant={getScoreBadge(data.accessibility, "accessibility")}>
                  {data.accessibility}/100
                </Badge>
              </div>
            )}
            {data.bestPractices && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Best Practices:</span>
                <Badge variant={getScoreBadge(data.bestPractices, "bestPractices")}>
                  {data.bestPractices}/100
                </Badge>
              </div>
            )}
          </div>
          {onSiteClick && (
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Click to view details</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (entry: any) => {
    if (onSiteClick) {
      onSiteClick(entry);
    }
  };

  if (layout === "horizontal") {
    return (
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
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{
                top: 5,
                right: 30,
                left: 80,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                domain={metric === "issues" ? [0, "dataMax"] : [0, 100]}
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category"
                dataKey="site"
                className="text-xs"
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <ChartTooltip content={customTooltip} />
              
              <Bar
                dataKey={metric}
                radius={[0, 4, 4, 0]}
                onClick={handleBarClick}
                style={{ cursor: onSiteClick ? "pointer" : "default" }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  return (
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
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="site"
              className="text-xs"
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              className="text-xs"
              axisLine={false}
              tickLine={false}
              domain={metric === "issues" ? [0, "dataMax"] : [0, 100]}
            />
            <ChartTooltip content={customTooltip} />
            
            <Bar
              dataKey={metric}
              radius={[4, 4, 0, 0]}
              onClick={handleBarClick}
              style={{ cursor: onSiteClick ? "pointer" : "default" }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Site Details Grid */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Detailed Comparison
          </h4>
          <div className="space-y-2">
            {data.map((site, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getScoreColor(site[metric], metric) }} />
                  <span className="font-medium">{site.site}</span>
                  {onSiteClick && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => onSiteClick(site)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">SEO</div>
                    <Badge variant={getScoreBadge(site.seoScore, "seoScore")} className="text-xs">
                      {site.seoScore}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Speed</div>
                    <Badge variant={getScoreBadge(site.pageSpeed, "pageSpeed")} className="text-xs">
                      {site.pageSpeed}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Issues</div>
                    <Badge variant={getScoreBadge(site.issues, "issues")} className="text-xs">
                      {site.issues}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}