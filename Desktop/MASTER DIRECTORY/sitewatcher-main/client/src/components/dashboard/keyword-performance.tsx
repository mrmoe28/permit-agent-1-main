import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export function KeywordPerformance() {
  // First get all sites to find keywords
  const { data: sites = [] } = useQuery({
    queryKey: ["/sites"],
  });

  // Get keywords for all sites
  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ["/keywords"],
    enabled: sites.length > 0,
  });

  // Calculate change trends (mock for now since we don't have historical data yet)
  const enhancedKeywords = (keywords as any[]).map((keyword, index) => ({
    ...keyword,
    // Mock change data - in real app this would come from historical comparison
    change: Math.floor(Math.random() * 10) - 5, // Random change between -5 and +5
  })).slice(0, 5); // Show top 5 keywords

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle>Top Keywords</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Current rankings and trends
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : enhancedKeywords.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">📊</div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No keyword data yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Analyze a website to see keyword rankings
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enhancedKeywords.map((keyword: any) => {
              const isPositive = keyword.change >= 0;
              const ArrowIcon = isPositive ? ArrowUp : ArrowDown;
              
              return (
                <div key={keyword.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`keyword-${keyword.id}`}>
                      {keyword.term}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Search volume: {keyword.volume?.toLocaleString() || 0}/month
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        #{keyword.rank}
                      </div>
                      <div className="flex items-center text-xs">
                        <ArrowIcon 
                          className={`mr-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`} 
                          size={10} 
                        />
                        <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {isPositive ? '+' : ''}{keyword.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full"
            data-testid="view-keywords-button"
          >
            View All Keywords
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
