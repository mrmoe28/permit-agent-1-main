import { Globe, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Analysis } from "@shared/schema";

interface RecentAnalysesProps {
  onAnalysisStart: (analysisId: string) => void;
}

export function RecentAnalyses({ onAnalysisStart }: RecentAnalysesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses = [] } = useQuery({
    queryKey: ["/analyses"],
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      await apiRequest("DELETE", `/analyses/${analysisId}`);
    },
    onSuccess: () => {
      toast({
        title: "Analysis Deleted",
        description: "The analysis has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/analyses"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete analysis",
        variant: "destructive",
      });
    },
  });

  const getSpeedBadge = (score: number) => {
    if (score >= 90) return { text: "Fast", color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300" };
    if (score >= 50) return { text: "Moderate", color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300" };
    return { text: "Slow", color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle>Recent Analyses</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your latest website scans and results
        </p>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SEO Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Speed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Analyzed
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No analyses yet. Start by analyzing your first website.
                </td>
              </tr>
            ) : (
              (analyses as any[]).map((analysis: any) => {
                const domain = analysis.domain || new URL(analysis.url || "").hostname;
                const speedBadge = getSpeedBadge(analysis.page_speed || 0);
                
                return (
                  <tr key={analysis.id} data-testid={`analysis-row-${analysis.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                          <Globe className="text-gray-500 dark:text-gray-400 text-sm" size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {domain}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {analysis.url}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {analysis.status === "completed" ? (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analysis.seo_score || 0}
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <Progress 
                              value={analysis.seo_score || 0} 
                              className="h-2 w-16"
                            />
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary">{analysis.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {analysis.status === "completed" ? (
                        <Badge className={speedBadge.color}>
                          {speedBadge.text}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {analysis.issues || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(analysis.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAnalysisStart(analysis.id)}
                        className="text-primary hover:text-primary/80 mr-2"
                        data-testid={`view-analysis-${analysis.id}`}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnalysisMutation.mutate(analysis.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        data-testid={`delete-analysis-${analysis.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
