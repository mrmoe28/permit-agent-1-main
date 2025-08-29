import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Key, 
  Plus, 
  TrendingUp,
  TrendingDown,
  Search,
  Target,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Trash2,
  AlertCircle
} from "lucide-react";

export default function Keywords() {
  const [selectedSite, setSelectedSite] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real sites from API
  const { data: sites = [] } = useQuery({
    queryKey: ["/sites"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch keywords for selected site
  const { data: keywords = [], isLoading: keywordsLoading } = useQuery({
    queryKey: [`/api/keywords?siteId=${selectedSite}`],
    enabled: !!selectedSite,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add keyword mutation
  const addKeywordMutation = useMutation({
    mutationFn: async ({ siteId, term, domain }: { siteId: string; term: string; domain: string }) => {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, term, domain }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add keyword');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/keywords?siteId=${selectedSite}`] });
      setNewKeyword("");
      toast({
        title: "Keyword Added",
        description: "Keyword tracking has been added successfully with real ranking data",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Keyword",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete keyword mutation
  const deleteKeywordMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      const response = await fetch(`/api/keywords?id=${keywordId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete keyword');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/keywords?siteId=${selectedSite}`] });
      toast({
        title: "Keyword Deleted",
        description: "Keyword has been removed from tracking",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Keyword",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Keyword Required",
        description: "Please enter a keyword to track",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSite) {
      toast({
        title: "Site Required",
        description: "Please select a site for keyword tracking",
        variant: "destructive",
      });
      return;
    }

    const selectedSiteData = sites.find(site => site.id === selectedSite);
    if (!selectedSiteData) {
      toast({
        title: "Site Not Found",
        description: "Selected site could not be found",
        variant: "destructive",
      });
      return;
    }

    addKeywordMutation.mutate({
      siteId: selectedSite,
      term: newKeyword.trim(),
      domain: selectedSiteData.domain,
    });
  };

  const handleDeleteKeyword = (keywordId: string) => {
    deleteKeywordMutation.mutate(keywordId);
  };

  // Calculate metrics from keywords
  const totalKeywords = keywords.length;
  const avgPosition = keywords.length > 0 
    ? Math.round(keywords.reduce((sum, k) => sum + (k.rank || 0), 0) / keywords.length)
    : 0;
  const totalVolume = keywords.reduce((sum, k) => sum + (k.volume || 0), 0);


  return (
    <PageLayout 
      title="Keyword Tracking" 
      description="Monitor your keyword rankings and search performance across all your sites"
    >
      <div className="space-y-6">
        {/* Add New Keyword */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Keyword
            </CardTitle>
            <CardDescription>
              Track a new keyword's ranking performance across your monitored sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter keyword to track (e.g., 'SEO analysis')"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
              </div>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-48">
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
              <Button 
                onClick={handleAddKeyword} 
                className="px-6"
                disabled={addKeywordMutation.isPending || !selectedSite}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addKeywordMutation.isPending ? 'Adding...' : 'Add Keyword'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Keywords
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalKeywords}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg Position
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {avgPosition > 0 ? avgPosition : '-'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Volume
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalVolume.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keywords Table */}
        {selectedSite && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Keywords Performance
              </CardTitle>
              <CardDescription>
                Real-time keyword rankings for {sites.find(s => s.id === selectedSite)?.domain}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keywordsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading keywords...</p>
                  </div>
                </div>
              ) : keywords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead className="text-center">Rank</TableHead>
                      <TableHead className="text-center">Volume</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((keyword) => (
                      <TableRow key={keyword.id}>
                        <TableCell className="font-medium">{keyword.term}</TableCell>
                        <TableCell className="text-center">
                          {keyword.rank > 0 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              #{keyword.rank}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              Not Found
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {keyword.volume ? keyword.volume.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {keyword.change > 0 ? (
                            <div className="flex items-center justify-center text-green-600">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              +{keyword.change}
                            </div>
                          ) : keyword.change < 0 ? (
                            <div className="flex items-center justify-center text-red-600">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              {keyword.change}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKeyword(keyword.id)}
                            disabled={deleteKeywordMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center space-y-3">
                    <Key className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        No keywords tracked yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add keywords above to start tracking rankings
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedSite && sites.length > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                <AlertCircle className="h-5 w-5" />
                Select a Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 dark:text-yellow-300">
                Please select a site from the dropdown above to view and manage keywords for that domain.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section - Only show if no sites or no selected site */}
        {(sites.length === 0 || !selectedSite) && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Lightbulb className="h-5 w-5" />
                {sites.length === 0 ? 'Get Started with Keyword Tracking' : 'Select a Site to Continue'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sites.length === 0 ? (
                <div>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    To start tracking keyword rankings, you need to add a website first.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/add-site'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add Your First Site
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-blue-700 dark:text-blue-300">
                  Select a site from the dropdown above to start adding keywords and tracking their Google search rankings with real-time data from SERPApi.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}