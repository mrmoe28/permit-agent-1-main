import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { URLAnalysisForm } from "@/components/dashboard/url-analysis-form";
import { LoadingState } from "@/components/dashboard/loading-state";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { EnhancedSEORecommendations } from "@/components/dashboard/enhanced-seo-recommendations";
import { KeywordPerformance } from "@/components/dashboard/keyword-performance";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { useQuery } from "@tanstack/react-query";
import type { Analysis } from "@shared/schema";

export default function Dashboard() {
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);

  const { data: baseMetrics } = useQuery({
    queryKey: ["/dashboard/metrics"],
  });

  // Enhance metrics with current analysis data if available
  const metrics = currentAnalysisData && (currentAnalysisData as any).status === 'completed' ? {
    ...baseMetrics,
    seoScore: (currentAnalysisData as any).seo_score || baseMetrics?.seoScore || 0,
    pageSpeed: (currentAnalysisData as any).page_speed || baseMetrics?.pageSpeed || 0,
    // Keep other metrics from baseMetrics
    seoChange: baseMetrics?.seoChange || 0,
    speedChange: baseMetrics?.speedChange || 0,
    keywords: baseMetrics?.keywords || 0,
    keywordChange: baseMetrics?.keywordChange || 0,
    traffic: baseMetrics?.traffic || "N/A",
    trafficChange: baseMetrics?.trafficChange || 0,
  } : baseMetrics;

  const { data: currentAnalysisData } = useQuery({
    queryKey: ["/analyses", currentAnalysis],
    enabled: !!currentAnalysis,
    refetchInterval: (data: Analysis | undefined) => 
      data?.status === "pending" || data?.status === "running" ? 2000 : false,
  });

  const handleAnalysisStart = (analysisId: string) => {
    setCurrentAnalysis(analysisId);
  };

  const isLoading = (currentAnalysisData as any)?.status === "pending" || (currentAnalysisData as any)?.status === "running";

  return (
    <PageLayout 
      title="SEO Dashboard" 
      description="Monitor your website's SEO performance and get actionable insights"
    >
      <div className="space-y-6">
        <URLAnalysisForm onAnalysisStart={handleAnalysisStart} />
        
        {isLoading && (
          <LoadingState 
            progress={(currentAnalysisData as any)?.progress || 0}
            status={(currentAnalysisData as any)?.status_message || "Starting analysis..."}
          />
        )}
        
        <MetricsOverview metrics={metrics} />
        
        {/* Featured SEO Action Plan - Full Width for Maximum Visibility */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-2xl -z-10"></div>
          <div className="relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h2 className="text-3xl font-bold">SEO Action Plan</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                Get actionable, step-by-step recommendations with copy-paste code examples to improve your SEO rankings
              </p>
            </div>
            <EnhancedSEORecommendations analysisId={currentAnalysis} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeywordPerformance />
          <RecentAnalyses onAnalysisStart={handleAnalysisStart} />
        </div>
      </div>
    </PageLayout>
  );
}
