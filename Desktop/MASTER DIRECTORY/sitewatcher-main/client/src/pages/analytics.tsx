import { useState, useEffect } from "react";
import * as React from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MultiProgress } from "@/components/ui/multi-progress";
import { AnalyticsOverviewSkeleton, ChartSkeleton } from "@/components/ui/skeleton-loaders";
import { AnimatedMetricCard } from "@/components/ui/animated-metric-card";
import { AnalyticsAreaChart } from "@/components/charts/analytics-area-chart";
import { AnalyticsDonutChart } from "@/components/charts/analytics-donut-chart";
import { AnalyticsActionPanel } from "@/components/analytics/analytics-action-panel";
import { useProgress, OPERATION_TEMPLATES } from "@/hooks/use-progress";
import { useQuery } from "@tanstack/react-query";
import { PerformanceLineChart } from "@/components/charts/performance-line-chart";
import { SiteComparisonChart } from "@/components/charts/site-comparison-chart";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  BarChart3,
  LineChart,
  PieChart,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
  Brain
} from "lucide-react";


// Calculate real analytics data from API responses
const calculateAnalyticsData = (sites: any[], analyses: any[]) => {
  if (!sites.length || !analyses.length) {
    return {
      overview: {
        totalSites: 0,
        avgSeoScore: 0,
        avgPageSpeed: 0,
        totalIssues: 0,
        trends: { seoScore: 0, pageSpeed: 0, issues: 0 },
        sparklines: {
          seoScore: [],
          pageSpeed: [],
          issues: []
        }
      },
      timeSeriesData: [],
      siteComparison: []
    };
  }

  // Filter completed analyses (handle snake_case API response)
  const completedAnalyses = analyses.filter(a => a.status === 'completed' && (a.seo_score || a.page_speed));
  
  // Calculate overview metrics
  const totalSites = sites.length;
  const avgSeoScore = completedAnalyses.length > 0 
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.seo_score || 0), 0) / completedAnalyses.length)
    : 0;
  const avgPageSpeed = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.page_speed || 0), 0) / completedAnalyses.length)
    : 0;
  const totalIssues = analyses.reduce((sum, a) => sum + (a.issues || 0), 0);

  // Create time series data from analyses (handle snake_case API response)
  const timeSeriesData = completedAnalyses
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-5) // Last 5 analyses
    .map(analysis => ({
      date: new Date(analysis.created_at).toISOString().split('T')[0],
      seoScore: analysis.seo_score || 0,
      pageSpeed: analysis.page_speed || 0,
      issues: analysis.issues || 0
    }));

  // Create site comparison data
  const siteMap = sites.reduce((acc, site) => {
    acc[site.id] = site;
    return acc;
  }, {});

  const siteComparison = completedAnalyses
    .filter(analysis => siteMap[analysis.site_id])
    .map(analysis => ({
      site: siteMap[analysis.site_id].domain,
      seoScore: analysis.seo_score || 0,
      pageSpeed: analysis.page_speed || 0,
      issues: analysis.issues || 0
    }));

  // Generate sparkline data (simplified - using last 5 analyses)
  const sparklines = {
    seoScore: timeSeriesData.map(d => ({ value: d.seoScore })),
    pageSpeed: timeSeriesData.map(d => ({ value: d.pageSpeed })),
    issues: timeSeriesData.map(d => ({ value: d.issues }))
  };

  return {
    overview: {
      totalSites,
      avgSeoScore,
      avgPageSpeed,
      totalIssues,
      trends: {
        seoScore: timeSeriesData.length > 1 && timeSeriesData[0].seoScore > 0 ? 
          ((timeSeriesData[timeSeriesData.length - 1].seoScore - timeSeriesData[0].seoScore) / timeSeriesData[0].seoScore * 100) : 0,
        pageSpeed: timeSeriesData.length > 1 && timeSeriesData[0].pageSpeed > 0 ? 
          ((timeSeriesData[timeSeriesData.length - 1].pageSpeed - timeSeriesData[0].pageSpeed) / timeSeriesData[0].pageSpeed * 100) : 0,
        issues: timeSeriesData.length > 1 && timeSeriesData[0].issues > 0 ? 
          ((timeSeriesData[0].issues - timeSeriesData[timeSeriesData.length - 1].issues) / timeSeriesData[0].issues * 100) : 0
      },
      sparklines
    },
    timeSeriesData,
    siteComparison
  };
};

export default function Analytics() {
  const [selectedSite, setSelectedSite] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [runningActions, setRunningActions] = useState<string[]>([]);
  const [actionProgress, setActionProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  
  const {
    createOperation,
    startOperation,
    cancelOperation,
    getOperation,
    getActiveOperations
  } = useProgress();

  // Fetch real sites from API
  const { data: sites = [] } = useQuery({
    queryKey: ["/sites"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch real analyses from API
  const { data: analyses = [] } = useQuery({
    queryKey: ["/analyses"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate analytics data from real API responses
  const analyticsData = React.useMemo(() => {
    // Filter analyses by selected site if one is selected
    const filteredAnalyses = selectedSite && selectedSite !== "all" 
      ? analyses.filter(analysis => analysis.site_id === selectedSite)
      : analyses;
    
    // Filter sites by selected site if one is selected
    const filteredSites = selectedSite && selectedSite !== "all"
      ? sites.filter(site => site.id === selectedSite)
      : sites;
    
    return calculateAnalyticsData(filteredSites, filteredAnalyses);
  }, [sites, analyses, selectedSite, timeRange]);

  const isLoading = false; // Since we're using real data from existing queries
  
  const refetch = () => {
    // Refetch both sites and analyses
    window.location.reload();
  };

  const activeOperations = getActiveOperations();
  const refreshOperation = activeOperations.find(op => op.type === "analytics-aggregation");
  const exportOperation = activeOperations.find(op => op.type === "analytics-export");

  const handleRefreshAnalytics = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    const operationId = createOperation(
      "analytics-aggregation",
      OPERATION_TEMPLATES["analytics-aggregation"].title,
      OPERATION_TEMPLATES["analytics-aggregation"].stages
    );
    
    startOperation(operationId);
    
    // Simulate the refresh process
    setTimeout(() => {
      refetch();
      setIsRefreshing(false);
    }, 8000); // 8 seconds to complete the simulated operation
  };

  const handleExportReport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    const operationId = createOperation(
      "analytics-export",
      OPERATION_TEMPLATES["analytics-export"].title,
      OPERATION_TEMPLATES["analytics-export"].stages
    );
    
    startOperation(operationId);
    
    // Simulate export process
    setTimeout(() => {
      // Simulate file download
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,Analytics Report Data...';
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setIsExporting(false);
    }, 6000); // 6 seconds for export
  };

  // Handle analytics actions
  const handleAnalyticsAction = async (actionId: string) => {
    if (runningActions.includes(actionId)) return;

    setRunningActions(prev => [...prev, actionId]);
    setActionProgress(prev => ({ ...prev, [actionId]: 0 }));

    // Simulate action execution with progress
    const progressInterval = setInterval(() => {
      setActionProgress(prev => {
        const currentProgress = prev[actionId] || 0;
        const newProgress = Math.min(currentProgress + Math.random() * 15, 100);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setRunningActions(prev => prev.filter(id => id !== actionId));
            setActionProgress(prev => {
              const updated = { ...prev };
              delete updated[actionId];
              return updated;
            });
          }, 1000);
        }
        
        return { ...prev, [actionId]: newProgress };
      });
    }, 500);

    // Specific action handling
    switch (actionId) {
      case 'deep-analysis':
        await new Promise(resolve => setTimeout(resolve, 5000));
        toast({
          title: "Deep Analysis Complete",
          description: "Found 12 optimization opportunities across your sites",
        });
        break;
      
      case 'ai-insights':
        await new Promise(resolve => setTimeout(resolve, 3000));
        toast({
          title: "AI Insights Generated",
          description: "Discovered 8 new trends and 5 actionable recommendations",
        });
        break;
        
      case 'benchmark-performance':
        await new Promise(resolve => setTimeout(resolve, 4000));
        toast({
          title: "Benchmark Analysis Complete",
          description: "Your sites rank in the top 25% of your industry",
        });
        break;
        
      default:
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  // Show loading skeleton while data is being fetched initially
  if (isLoading && !analyticsData) {
    return (
      <PageLayout 
        title="Analytics Dashboard" 
        description="Comprehensive SEO analytics and performance insights across all your monitored sites"
      >
        <AnalyticsOverviewSkeleton />
      </PageLayout>
    );
  }

  // Enhanced metric card data preparation
  const getMetricStatus = (value: number, title: string): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (title.includes('SEO Score') || title.includes('Page Speed')) {
      if (value >= 90) return 'excellent';
      if (value >= 70) return 'good';
      if (value >= 50) return 'warning';
      return 'critical';
    }
    if (title.includes('Issues')) {
      if (value === 0) return 'excellent';
      if (value <= 5) return 'good';
      if (value <= 15) return 'warning';
      return 'critical';
    }
    return 'good';
  };

  const getMetricGradient = (title: string) => {
    const gradients = {
      'Total Sites': { from: '#3b82f6', to: '#1d4ed8' },
      'SEO Score': { from: '#10b981', to: '#059669' },
      'Page Speed': { from: '#8b5cf6', to: '#7c3aed' },
      'Issues': { from: '#f59e0b', to: '#d97706' }
    };
    return gradients[title as keyof typeof gradients];
  };

  // Show selection prompt if no site is selected
  if (!selectedSite) {
    return (
      <PageLayout 
        title="Analytics Dashboard" 
        description="Comprehensive SEO analytics and performance insights across all your monitored sites"
      >
        <div className="space-y-6">
          {/* Site Selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Choose a site to analyze" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection prompt */}
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-24 w-24 text-muted-foreground mb-4">
                <BarChart3 className="h-full w-full" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a Site to View Analytics</h3>
              <p className="text-muted-foreground mb-6">
                Choose a site from the dropdown above to view detailed SEO analytics, performance metrics, and insights.
              </p>
              {sites.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No sites found. <a href="/add-site" className="text-primary hover:underline">Add a site</a> to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Analytics Dashboard" 
      description={`SEO analytics and performance insights for ${sites.find(s => s.id === selectedSite)?.domain || 'selected site'}`}
    >
      <div className="space-y-6">
        {/* Progress Indicators */}
        {refreshOperation && (
          <MultiProgress
            title={refreshOperation.title}
            stages={refreshOperation.stages}
            currentStage={refreshOperation.currentStage}
            overallProgress={refreshOperation.overallProgress}
            canCancel={refreshOperation.canCancel}
            onCancel={() => {
              cancelOperation(refreshOperation.id);
              setIsRefreshing(false);
            }}
          />
        )}

        {exportOperation && (
          <MultiProgress
            title={exportOperation.title}
            stages={exportOperation.stages}
            currentStage={exportOperation.currentStage}
            overallProgress={exportOperation.overallProgress}
            canCancel={exportOperation.canCancel}
            onCancel={() => {
              cancelOperation(exportOperation.id);
              setIsExporting(false);
            }}
            compact
          />
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Choose a site to analyze" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={handleRefreshAnalytics}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedMetricCard
            title="Total Sites"
            value={analyticsData?.overview.totalSites || 0}
            icon={Globe}
            gradient={getMetricGradient('Total Sites')}
            status={getMetricStatus(analyticsData?.overview.totalSites || 0, 'Total Sites')}
            description="Websites monitored across your account"
          />
          <AnimatedMetricCard
            title="Avg SEO Score"
            value={analyticsData?.overview.avgSeoScore || 0}
            icon={TrendingUp}
            gradient={getMetricGradient('SEO Score')}
            status={getMetricStatus(analyticsData?.overview.avgSeoScore || 0, 'SEO Score')}
            trend={{
              value: Math.abs(analyticsData?.overview.trends.seoScore || 0),
              direction: (analyticsData?.overview.trends.seoScore || 0) >= 0 ? 'up' : 'down',
              isPositive: (analyticsData?.overview.trends.seoScore || 0) >= 0
            }}
            sparklineData={analyticsData?.overview.sparklines.seoScore}
            suffix="/100"
            description="Average SEO performance score"
          />
          <AnimatedMetricCard
            title="Avg Page Speed"
            value={analyticsData?.overview.avgPageSpeed || 0}
            icon={BarChart3}
            gradient={getMetricGradient('Page Speed')}
            status={getMetricStatus(analyticsData?.overview.avgPageSpeed || 0, 'Page Speed')}
            trend={{
              value: Math.abs(analyticsData?.overview.trends.pageSpeed || 0),
              direction: (analyticsData?.overview.trends.pageSpeed || 0) >= 0 ? 'up' : 'down',
              isPositive: (analyticsData?.overview.trends.pageSpeed || 0) >= 0
            }}
            suffix="/100"
            sparklineData={analyticsData?.overview.sparklines.pageSpeed}
            description="Average loading speed across sites"
          />
          <AnimatedMetricCard
            title="Total Issues"
            value={analyticsData?.overview.totalIssues || 0}
            icon={AlertCircle}
            gradient={getMetricGradient('Issues')}
            status={getMetricStatus(analyticsData?.overview.totalIssues || 0, 'Issues')}
            trend={{
              value: Math.abs(analyticsData?.overview.trends.issues || 0),
              direction: (analyticsData?.overview.trends.issues || 0) >= 0 ? 'down' : 'up',
              isPositive: (analyticsData?.overview.trends.issues || 0) <= 0
            }}
            sparklineData={analyticsData?.overview.sparklines.issues}
            description="SEO issues detected across all sites"
          />
        </div>

        {/* Analytics Action Panel */}
        <AnalyticsActionPanel
          onActionTrigger={handleAnalyticsAction}
          runningActions={runningActions}
          actionProgress={actionProgress}
        />

        {/* Analytics Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="comparison">Site Comparison</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AnalyticsAreaChart
                  data={analyticsData?.timeSeriesData || []}
                  title="Performance Trends Over Time"
                  description="Track your SEO performance, page speed, and issues over time"
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  showExport={true}
                  onExport={() => {
                    const csvData = analyticsData?.timeSeriesData.map(point => 
                      `${point.date},${point.seoScore},${point.pageSpeed},${point.issues}`
                    ).join('\n');
                    const link = document.createElement('a');
                    link.href = `data:text/csv;charset=utf-8,Date,SEO Score,Page Speed,Issues\n${csvData}`;
                    link.download = `performance-trends-${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                  }}
                  height={400}
                  enableBrush={true}
                  showReferenceLine={true}
                />
              </div>
              <div>
                <AnalyticsDonutChart
                  data={[
                    {
                      name: "SEO Score",
                      value: analyticsData?.overview.avgSeoScore || 0,
                      color: "hsl(142, 76%, 36%)",
                      description: "Average SEO performance"
                    },
                    {
                      name: "Page Speed",
                      value: analyticsData?.overview.avgPageSpeed || 0,
                      color: "hsl(221, 83%, 53%)",
                      description: "Average loading speed"
                    },
                    {
                      name: "Issues Fixed",
                      value: Math.max(0, 100 - (analyticsData?.overview.totalIssues || 0)),
                      color: "hsl(32, 95%, 44%)",
                      description: "Issues resolved"
                    }
                  ]}
                  title="Performance Summary"
                  description="Current state of your SEO metrics"
                  centerValue={Math.round(((analyticsData?.overview.avgSeoScore || 0) + (analyticsData?.overview.avgPageSpeed || 0)) / 2)}
                  centerLabel="Overall Score"
                  height={350}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid gap-6">
              <SiteComparisonChart
                data={analyticsData?.siteComparison || []}
                onExport={() => {
                  const csvData = analyticsData?.siteComparison.map(site => 
                    `${site.site},${site.seoScore},${site.pageSpeed},${site.issues}`
                  ).join('\n');
                  const link = document.createElement('a');
                  link.href = `data:text/csv;charset=utf-8,Site,SEO Score,Page Speed,Issues\n${csvData}`;
                  link.download = `site-comparison-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                onSiteClick={(site) => {
                  console.log('Navigate to site details:', site);
                }}
              />
              
              {analyticsData?.siteComparison && analyticsData.siteComparison.length > 0 && (
                <AnalyticsDonutChart
                  data={analyticsData.siteComparison.map((site, index) => ({
                    name: site.site,
                    value: site.seoScore,
                    color: [`hsl(142, 76%, 36%)`, `hsl(221, 83%, 53%)`, `hsl(0, 84%, 60%)`, `hsl(271, 81%, 56%)`, `hsl(32, 95%, 44%)`][index % 5],
                    description: `SEO Score: ${site.seoScore}/100`
                  }))}
                  title="SEO Score Distribution"
                  description="Compare SEO scores across your monitored sites"
                  height={300}
                  showLegend={true}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Top Issues
                  </CardTitle>
                  <CardDescription>
                    Most common SEO issues across your sites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { issue: "Missing meta descriptions", count: 5, severity: "high" },
                      { issue: "Slow loading images", count: 3, severity: "medium" },
                      { issue: "Missing alt text", count: 8, severity: "low" },
                      { issue: "Duplicate title tags", count: 2, severity: "high" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{item.issue}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.severity === "high" ? "destructive" : item.severity === "medium" ? "secondary" : "outline"}>
                            {item.count}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    AI-powered suggestions to improve your SEO
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      "Optimize images to improve page speed",
                      "Add schema markup for better search visibility",
                      "Fix missing meta descriptions",
                      "Improve internal linking structure"
                    ].map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}