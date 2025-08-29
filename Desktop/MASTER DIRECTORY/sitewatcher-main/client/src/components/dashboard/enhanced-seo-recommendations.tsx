import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Copy, Clock, Target, Zap, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnhancedRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
  implementation_guide: string;
  code_example: string;
  effort_score: number;
  impact_score: number;
  estimated_time: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  completed_at: string | null;
}

interface EnhancedSEORecommendationsProps {
  analysisId: string | null;
}

export function EnhancedSEORecommendations({ analysisId }: EnhancedSEORecommendationsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'priority' | 'impact' | 'effort'>('priority');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/analyses", analysisId, "recommendations"],
    enabled: !!analysisId,
  });

  // Update recommendation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/recommendations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Recommendation status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses", analysisId, "recommendations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="text-red-600 dark:text-red-400" size={16} />;
      case "medium":
        return <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={16} />;
      case "low":
        return <Info className="text-blue-600 dark:text-blue-400" size={16} />;
      default:
        return <Info className="text-blue-600 dark:text-blue-400" size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "low":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
      case "dismissed":
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300";
      default:
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300";
    }
  };

  // Calculate priority matrix score (impact / effort)
  const getPriorityScore = (recommendation: EnhancedRecommendation) => {
    return recommendation.impact_score / Math.max(recommendation.effort_score, 1);
  };

  // Sort recommendations
  const sortedRecommendations = [...(recommendations as EnhancedRecommendation[])].sort((a, b) => {
    switch (sortBy) {
      case 'impact':
        return b.impact_score - a.impact_score;
      case 'effort':
        return a.effort_score - b.effort_score;
      case 'priority':
      default:
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return getPriorityScore(b) - getPriorityScore(a);
    }
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code example copied to clipboard",
    });
  };

  const completedCount = recommendations.filter((r: EnhancedRecommendation) => r.status === 'completed').length;
  const totalCount = recommendations.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!analysisId) {
    return (
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Target className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to Optimize Your SEO?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              Analyze any website above to unlock powerful, step-by-step SEO recommendations with ready-to-use code examples
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Actionable Implementation Guides</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow">
                <Code2 className="h-4 w-4 text-blue-500" />
                <span>Copy-Paste Code Examples</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>Priority-Based Optimization</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-blue-100 dark:border-blue-800">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              SEO Action Plan
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Prioritized recommendations with implementation guides
            </p>
          </div>
          
          {totalCount > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium">
                {completedCount} of {totalCount} completed
              </div>
              <div className="w-24 mt-1">
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className="flex gap-2 mt-4">
            <Button
              variant={sortBy === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('priority')}
            >
              Priority
            </Button>
            <Button
              variant={sortBy === 'impact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('impact')}
            >
              Impact
            </Button>
            <Button
              variant={sortBy === 'effort' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('effort')}
            >
              Effort
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {sortedRecommendations.length === 0 ? (
          <div className="text-center py-8 px-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Great job! No issues found.
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your website follows SEO best practices.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRecommendations.map((recommendation) => (
              <Collapsible
                key={recommendation.id}
                open={expandedItems.has(recommendation.id)}
                onOpenChange={() => toggleExpanded(recommendation.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(recommendation.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {recommendation.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {recommendation.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className={getStatusColor(recommendation.status)}>
                            {recommendation.status.replace('_', ' ')}
                          </Badge>
                          {recommendation.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: recommendation.id, status: 'in_progress' })}
                            >
                              Start
                            </Button>
                          )}
                          {recommendation.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: recommendation.id, status: 'completed' })}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority} priority
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Zap className="h-4 w-4" />
                          Impact: {recommendation.impact_score}/10
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Target className="h-4 w-4" />
                          Effort: {recommendation.effort_score}/10
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {recommendation.estimated_time}
                        </div>
                        
                        <div className="text-sm font-medium text-primary">
                          Priority Score: {getPriorityScore(recommendation).toFixed(1)}
                        </div>
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-primary">
                          <span>View Implementation Guide</span>
                          {expandedItems.has(recommendation.id) ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="mt-6 ml-8 space-y-6">
                      {/* Implementation Guide */}
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Step-by-Step Implementation
                        </h5>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                            {recommendation.implementation_guide}
                          </div>
                        </div>
                      </div>

                      {/* Code Example */}
                      {recommendation.code_example && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Code2 className="h-4 w-4" />
                              Code Example
                            </h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(recommendation.code_example)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-green-400 whitespace-pre-wrap">
                              <code>{recommendation.code_example}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}