import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { 
  History as HistoryIcon, 
  Search, 
  Calendar,
  Eye,
  Download,
  Filter,
  TrendingUp,
  BarChart3,
  Activity
} from "lucide-react";

interface AnalysisHistory {
  id: string;
  url: string;
  domain: string;
  seo_score: number;
  page_speed: number;
  issues: number;
  status: string;
  created_at: string;
}

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");

  // Fetch analyses data
  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["/analyses"],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const filteredHistory = (analyses as AnalysisHistory[]).filter(analysis => {
    const matchesSearch = analysis.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || analysis.status === statusFilter;
    const matchesSite = siteFilter === "all" || analysis.domain === siteFilter;
    
    return matchesSearch && matchesStatus && matchesSite;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "running": return "secondary";
      case "failed": return "destructive";
      case "pending": return "outline";
      default: return "outline";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const uniqueSites = [...new Set((analyses as AnalysisHistory[]).map(a => a.domain).filter(Boolean))];

  // Prepare chart data - group by date and calculate averages
  const chartData = filteredHistory
    .filter(a => a.status === 'completed' && a.seo_score && a.page_speed)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(analysis => ({
      date: new Date(analysis.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: analysis.created_at,
      seoScore: analysis.seo_score || 0,
      pageSpeed: analysis.page_speed || 0,
      issues: analysis.issues || 0,
      domain: analysis.domain
    }));

  // Calculate summary stats
  const completedAnalyses = filteredHistory.filter(a => a.status === 'completed');
  const avgSeoScore = completedAnalyses.length > 0 
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.seo_score || 0), 0) / completedAnalyses.length)
    : 0;
  const avgPageSpeed = completedAnalyses.length > 0 
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.page_speed || 0), 0) / completedAnalyses.length)
    : 0;

  if (isLoading) {
    return (
      <PageLayout 
        title="Analysis History" 
        description="View and manage all your past SEO analyses and performance reports"
      >
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Analysis History" 
      description="View and manage all your past SEO analyses and performance reports"
    >
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total Analyses
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {filteredHistory.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <HistoryIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Avg SEO Score
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {avgSeoScore}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Avg Page Speed
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {avgPageSpeed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Sites Analyzed
                  </p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {uniqueSites.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                SEO score and page speed performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="seoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="seoScore"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#seoGradient)"
                      name="SEO Score"
                    />
                    <Area
                      type="monotone"
                      dataKey="pageSpeed"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#speedGradient)"
                      name="Page Speed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
            <CardDescription>
              Find specific analyses using filters and search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by URL or domain..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {uniqueSites.map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Analysis History Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Analysis History
              </CardTitle>
              <CardDescription>
                Complete record of all SEO analyses performed
              </CardDescription>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No analysis history found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || statusFilter !== "all" || siteFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "Start analyzing websites to see your analysis history here"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>SEO Score</TableHead>
                      <TableHead>Page Speed</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate">
                            {analysis.url}
                          </div>
                          <div className="text-sm text-gray-500">
                            {analysis.domain}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(analysis.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getScoreColor(analysis.seo_score || 0)}`}>
                            {analysis.seo_score || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getScoreColor(analysis.page_speed || 0)}`}>
                            {analysis.page_speed || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {analysis.issues || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(analysis.status) as any}>
                            {analysis.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}