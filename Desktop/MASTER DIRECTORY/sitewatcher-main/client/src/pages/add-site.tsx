import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WebCrawler } from "@/components/crawler/web-crawler";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Globe, Search, TrendingUp } from "lucide-react";

export default function AddSite() {
  const [url, setUrl] = useState("");
  const [showCrawler, setShowCrawler] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Site creation mutation
  const createSiteMutation = useMutation({
    mutationFn: async (url: string) => {
      const urlObj = new URL(url);
      const response = await apiRequest("POST", "/sites", {
        url,
        domain: urlObj.hostname
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Site Added Successfully", 
        description: `${data.domain} has been added to your monitoring list`,
      });
      // Invalidate site-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/dashboard/metrics"] });
      
      if (autoAnalyze) {
        // Start SEO analysis
        analyzeUrlMutation.mutate(url);
      }
      
      // Always clear the URL after successful site creation
      setUrl("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add site. Please try again.",
        variant: "destructive",
      });
    },
  });

  // SEO analysis mutation
  const analyzeUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/analyses", { url });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisId(data.id);
      setShowCrawler(true);
      // Invalidate analysis queries
      queryClient.invalidateQueries({ queryKey: ["/analyses"] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
      createSiteMutation.mutate(url);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      });
    }
  };

  const isLoading = createSiteMutation.isPending || analyzeUrlMutation.isPending;

  const features = [
    {
      icon: Search,
      title: "SEO Analysis",
      description: "Comprehensive SEO audit including meta tags, headers, and content optimization"
    },
    {
      icon: TrendingUp,
      title: "Performance Monitoring",
      description: "Track page speed, Core Web Vitals, and overall site performance"
    },
    {
      icon: Globe,
      title: "Global Monitoring",
      description: "Monitor your site's performance from multiple geographic locations"
    }
  ];

  return (
    <PageLayout 
      title="Add New Site" 
      description="Start monitoring a new website's SEO performance and get detailed insights"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Website for Monitoring
            </CardTitle>
            <CardDescription>
              Enter the URL of the website you want to monitor. We'll start analyzing its SEO performance immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-analyze" 
                  checked={autoAnalyze}
                  onCheckedChange={setAutoAnalyze}
                />
                <Label htmlFor="auto-analyze" className="text-sm">
                  Automatically analyze tech stack after adding site
                </Label>
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding Site..." : autoAnalyze ? "Add Site & Analyze" : "Add Site"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>What You'll Get</CardTitle>
              <CardDescription>
                Once you add a site, you'll have access to these powerful features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Web Crawler */}
        {showCrawler && url && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Website Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive analysis and tech stack detection for {new URL(url).hostname}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebCrawler 
                url={url} 
                analysisId={analysisId}
                onComplete={(result) => {
                  console.log("Analysis complete:", result);
                  toast({
                    title: "Analysis Complete",
                    description: "Website analysis has been completed and saved.",
                  });
                  setUrl("");
                  setShowCrawler(false);
                  setAnalysisId(null);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}