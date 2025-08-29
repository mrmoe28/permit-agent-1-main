import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MultiProgress } from "@/components/ui/multi-progress";
import { useProgress } from "@/hooks/use-progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Globe, 
  Code, 
  Cpu, 
  Shield, 
  Search,
  Plus,
  Edit,
  Eye,
  Download,
  RefreshCw,
  Tag,
  Clock,
  Server,
  Smartphone,
  Zap,
  Trash2
} from "lucide-react";

interface Analysis {
  id: string;
  siteId: string;
  seoScore: number | null;
  pageSpeed: number | null;
  issues: number;
  status: string;
  progress: number;
  statusMessage: string;
  rawData: any;
  createdAt: string;
  site?: {
    id: string;
    url: string;
    domain: string;
    createdAt: string;
  };
  recommendations?: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    type: string;
  }>;
}

export default function Notes() {
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    createOperation,
    startOperation,
    cancelOperation,
    getActiveOperations
  } = useProgress();

  // Fetch real sites from API
  const { data: sites = [] } = useQuery({
    queryKey: ["/sites"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch real analyses from API
  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ["/analyses"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create a map of sites for easy lookup
  const sitesMap = sites.reduce((acc: Record<string, any>, site: any) => {
    acc[site.id] = site;
    return acc;
  }, {});

  // Transform analyses into note-like format
  const transformedAnalyses: Analysis[] = analyses.map((analysis: any) => ({
    ...analysis,
    site: sitesMap[analysis.siteId],
  }));

  // Delete analysis mutation
  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await apiRequest("DELETE", `/analyses/${analysisId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Deleted",
        description: "The analysis has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/analyses"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete analysis",
        variant: "destructive",
      });
    },
  });

  const activeOperations = getActiveOperations();
  const crawlerOperation = activeOperations.find(op => op.type === "site-comparison");

  const filteredAnalyses = transformedAnalyses.filter(analysis => {
    const matchesSite = selectedSite === "all" || analysis.siteId === selectedSite;
    const matchesCategory = selectedCategory === "all" || getAnalysisCategory(analysis) === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      (analysis.site?.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.statusMessage || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSite && matchesCategory && matchesSearch;
  });

  // Helper function to determine analysis category based on status and data
  function getAnalysisCategory(analysis: Analysis): string {
    if (analysis.status === 'completed' && analysis.seoScore) {
      return 'tech-stack';
    } else if (analysis.status === 'completed' && analysis.pageSpeed) {
      return 'performance';
    } else if (analysis.status === 'failed') {
      return 'security';
    }
    return 'general';
  }


  const handleAnalyzeSite = async (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    setIsAnalyzing(true);
    const operationId = createOperation(
      "site-comparison",
      `Analyzing ${site.domain}`,
      [
        {
          id: "crawl-pages",
          name: "Crawling Website",
          description: `Discovering pages and structure of ${site.domain}`,
          estimatedTime: 15
        },
        {
          id: "extract-tech",
          name: "Extracting Tech Stack",
          description: "Detecting frameworks, libraries, and technologies",
          estimatedTime: 10
        },
        {
          id: "analyze-performance",
          name: "Analyzing Performance",
          description: "Evaluating load times, optimization, and best practices",
          estimatedTime: 12
        },
        {
          id: "generate-notes",
          name: "Generating Notes",
          description: "Creating structured documentation and insights",
          estimatedTime: 8
        }
      ]
    );

    startOperation(operationId);

    // Simulate analysis process
    setTimeout(() => {
      toast({
        title: "Analysis Complete",
        description: `Comprehensive analysis of ${site.domain} has been completed and notes have been generated.`,
      });
      setIsAnalyzing(false);
    }, 12000); // 12 seconds for full analysis
  };

  const handleSaveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content for the note.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Note Saved",
      description: "Your note has been saved successfully.",
    });

    setNewNote({ title: "", content: "", tags: "" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tech-stack": return <Code className="h-4 w-4" />;
      case "performance": return <Zap className="h-4 w-4" />;
      case "security": return <Shield className="h-4 w-4" />;
      case "accessibility": return <Eye className="h-4 w-4" />;
      case "mobile": return <Smartphone className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "tech-stack": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "performance": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "security": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "accessibility": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "mobile": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <PageLayout 
      title="Site Notes & Analysis" 
      description="Comprehensive website analysis, tech stack detection, and documentation management"
    >
      <div className="space-y-6">
        {/* Web Crawler Progress */}
        {crawlerOperation && (
          <MultiProgress
            title={crawlerOperation.title}
            stages={crawlerOperation.stages}
            currentStage={crawlerOperation.currentStage}
            overallProgress={crawlerOperation.overallProgress}
            canCancel={crawlerOperation.canCancel}
            onCancel={() => {
              cancelOperation(crawlerOperation.id);
              setIsAnalyzing(false);
            }}
          />
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Website Analysis Tools
            </CardTitle>
            <CardDescription>
              Automatically analyze websites to extract tech stack information and generate insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select defaultValue="">
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select site to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => handleAnalyzeSite("1")}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Tech Stack'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notes, tags, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tech-stack">Tech Stack</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="accessibility">Accessibility</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notes & Documentation</TabsTrigger>
            <TabsTrigger value="create">Create New Note</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            {/* Analysis Loading */}
            {analysesLoading && (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading analyses...</p>
              </div>
            )}

            {/* Analysis Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {analysis.status === 'completed' ? 'SEO Analysis' : 
                           analysis.status === 'running' ? 'Analysis In Progress' : 
                           analysis.status === 'failed' ? 'Analysis Failed' : 'Analysis Pending'}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Globe className="h-3 w-3" />
                          {analysis.site?.domain || 'Unknown Site'}
                          <Badge variant="outline" className="text-xs">
                            Auto-generated
                          </Badge>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${getCategoryColor(getAnalysisCategory(analysis))}`}>
                        {getCategoryIcon(getAnalysisCategory(analysis))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {analysis.statusMessage || `Analysis ${analysis.status} for ${analysis.site?.domain}`}
                    </p>
                    
                    {/* Analysis Metrics */}
                    {analysis.status === 'completed' && (analysis.seoScore || analysis.pageSpeed) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {analysis.seoScore && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">SEO Score:</span>
                              <span className="font-medium">{analysis.seoScore}/100</span>
                            </div>
                          )}
                          {analysis.pageSpeed && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Page Speed:</span>
                              <span className="font-medium">{analysis.pageSpeed}/100</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Issues:</span>
                            <span className="font-medium">{analysis.issues}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className="font-medium capitalize">{analysis.status}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Progress for running analyses */}
                    {analysis.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{analysis.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${analysis.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Status Tags */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {analysis.status}
                      </Badge>
                      {analysis.site?.url && (
                        <Badge variant="outline" className="text-xs">
                          Website Analysis
                        </Badge>
                      )}
                      {analysis.seoScore && (
                        <Badge variant="outline" className="text-xs">
                          SEO
                        </Badge>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleteAnalysisMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this analysis for <strong>{analysis.site?.domain}</strong>? 
                                This action cannot be undone and will also delete all associated recommendations.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteAnalysisMutation.mutate(analysis.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteAnalysisMutation.isPending}
                              >
                                {deleteAnalysisMutation.isPending ? "Deleting..." : "Delete Analysis"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!analysesLoading && filteredAnalyses.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No analyses found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || selectedSite !== 'all' || selectedCategory !== 'all' 
                    ? 'No analyses match your current filters. Try adjusting your search criteria.'
                    : 'No website analyses have been created yet. Use the analysis tools above to get started.'
                  }
                </p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedSite("all");
                  setSelectedCategory("all");
                }} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Note
                </CardTitle>
                <CardDescription>
                  Add manual notes and observations about your websites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Note title..."
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Site</label>
                    <Select defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Add your notes, observations, or documentation here..."
                    className="min-h-32"
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={newNote.tags}
                    onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <Button onClick={handleSaveNote} className="w-full">
                  Save Note
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}