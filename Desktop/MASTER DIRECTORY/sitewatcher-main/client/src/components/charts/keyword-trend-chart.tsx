import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart as LineChartIcon, Download, TrendingUp, TrendingDown, Search } from "lucide-react";

interface KeywordData {
  date: string;
  [keyword: string]: string | number;
}

interface KeywordInfo {
  keyword: string;
  currentRank: number;
  previousRank: number;
  change: number;
  searchVolume: number;
  difficulty: number;
}

interface KeywordTrendChartProps {
  data: KeywordData[];
  keywords: KeywordInfo[];
  title?: string;
  description?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  showExport?: boolean;
  onExport?: () => void;
  height?: number;
  selectedKeywords?: string[];
  onKeywordSelect?: (keywords: string[]) => void;
}

const generateChartConfig = (keywords: KeywordInfo[]): ChartConfig => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
  ];
  
  const config: ChartConfig = {};
  keywords.forEach((keyword, index) => {
    config[keyword.keyword] = {
      label: keyword.keyword,
      color: colors[index % colors.length],
    };
  });
  
  return config;
};

export function KeywordTrendChart({
  data,
  keywords,
  title = "Keyword Ranking Trends",
  description = "Track keyword position changes over time",
  timeRange = "30d",
  onTimeRangeChange,
  showExport = true,
  onExport,
  height = 400,
  selectedKeywords = [],
  onKeywordSelect
}: KeywordTrendChartProps) {
  
  const chartConfig = generateChartConfig(keywords);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return null;
  };

  const getRankChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-500";
  };

  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty >= 70) return "destructive";
    if (difficulty >= 40) return "secondary";
    return "default";
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
                    {entry.dataKey}
                  </span>
                </div>
                <span className="font-mono font-medium text-foreground">
                  #{entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const visibleKeywords = selectedKeywords.length > 0 ? selectedKeywords : keywords.map(k => k.keyword);

  return (
    <div className="space-y-6">
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
                domain={[1, 100]}
                reversed={true}
                tickFormatter={(value) => `#${value}`}
              />
              <ChartTooltip content={customTooltip} />
              <ChartLegend content={<ChartLegendContent />} />
              
              {visibleKeywords.map((keyword, index) => (
                <Line
                  key={keyword}
                  type="monotone"
                  dataKey={keyword}
                  stroke={`var(--color-${keyword})`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Keyword Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keyword Performance Summary
          </CardTitle>
          <CardDescription>
            Current rankings and performance metrics for tracked keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keywords.map((keyword, index) => (
              <div key={keyword.keyword} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chartConfig[keyword.keyword]?.color }}
                  />
                  <div>
                    <div className="font-medium">{keyword.keyword}</div>
                    <div className="text-sm text-muted-foreground">
                      Volume: {keyword.searchVolume.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Current Rank</div>
                    <div className="font-mono font-bold text-lg">
                      #{keyword.currentRank}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Change</div>
                    <div className={`flex items-center gap-1 justify-center ${getRankChangeColor(keyword.change)}`}>
                      {getRankChangeIcon(keyword.change)}
                      <span className="font-medium">
                        {keyword.change === 0 ? "No change" : Math.abs(keyword.change)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                    <Badge variant={getDifficultyBadge(keyword.difficulty)}>
                      {keyword.difficulty}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}