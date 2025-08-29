import { TrendingUp, Gauge, Key, Users, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Metrics {
  seoScore?: number;
  seoChange?: number;
  pageSpeed?: number;
  speedChange?: number;
  keywords?: number;
  keywordChange?: number;
  traffic?: string;
  trafficChange?: number;
}

interface MetricsOverviewProps {
  metrics?: Metrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const metricsData = [
    {
      title: "SEO Score",
      value: metrics?.seoScore || 0,
      change: metrics?.seoChange || 0,
      changeText: metrics?.seoChange ? `${metrics.seoChange > 0 ? '+' : ''}${metrics.seoChange}%` : "+0%",
      icon: TrendingUp,
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Page Speed",
      value: metrics?.pageSpeed || 0,
      change: metrics?.speedChange || 0,
      changeText: metrics?.speedChange ? `${metrics.speedChange > 0 ? '+' : ''}${metrics.speedChange}%` : "+0%",
      icon: Gauge,
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Keywords",
      value: metrics?.keywords || 0,
      change: metrics?.keywordChange || 0,
      changeText: metrics?.keywordChange ? `${metrics.keywordChange > 0 ? '+' : ''}${metrics.keywordChange}` : "+0",
      changeTextSuffix: " new rankings",
      icon: Key,
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Traffic",
      value: metrics?.traffic || "0",
      change: metrics?.trafficChange || 0,
      changeText: metrics?.trafficChange ? `${metrics.trafficChange > 0 ? '+' : ''}${metrics.trafficChange}%` : "0%",
      icon: Users,
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;
        const ArrowIcon = isPositive ? ArrowUp : ArrowDown;
        
        return (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid={`metric-${metric.title.toLowerCase().replace(' ', '-')}`}>
                    {metric.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${metric.iconColor} text-lg`} size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <ArrowIcon 
                    className={`text-xs mr-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`} 
                    size={12} 
                  />
                  <span className={`text-sm font-medium mr-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metric.changeText}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {metric.changeTextSuffix || "vs last week"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
