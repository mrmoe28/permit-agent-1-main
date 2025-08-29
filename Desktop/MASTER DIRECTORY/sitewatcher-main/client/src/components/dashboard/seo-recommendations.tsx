import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Recommendation } from "@shared/schema";

interface SEORecommendationsProps {
  analysisId: string | null;
}

export function SEORecommendations({ analysisId }: SEORecommendationsProps) {
  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/analyses", analysisId, "recommendations"],
    enabled: !!analysisId,
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="text-red-600 dark:text-red-400 text-xs" size={12} />;
      case "medium":
        return <AlertTriangle className="text-yellow-600 dark:text-yellow-400 text-xs" size={12} />;
      case "low":
        return <Info className="text-blue-600 dark:text-blue-400 text-xs" size={12} />;
      default:
        return <Info className="text-blue-600 dark:text-blue-400 text-xs" size={12} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
      case "low":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/20";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/20";
      case "low":
        return "bg-blue-100 dark:bg-blue-900/20";
      default:
        return "bg-gray-100 dark:bg-gray-900/20";
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle>SEO Recommendations</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Based on Google best practices
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No recommendations available. Analyze a website to see SEO suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(recommendations as Recommendation[]).map((recommendation) => (
              <div key={recommendation.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-6 h-6 ${getPriorityBgColor(recommendation.priority)} rounded-full flex items-center justify-center`}>
                  {getPriorityIcon(recommendation.priority)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`recommendation-title-${recommendation.id}`}>
                    {recommendation.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {recommendation.description}
                  </p>
                  <div className="mt-2">
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div className="mt-6">
            <Button className="w-full" data-testid="generate-report-button">
              Generate Detailed Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
