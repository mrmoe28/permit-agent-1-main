import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LoadingStateProps {
  progress: number;
  status: string;
}

export function LoadingState({ progress, status }: LoadingStateProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Analyzing Website
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Running SEO analysis using Google PageSpeed Insights...
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progress} className="h-2" data-testid="analysis-progress" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2" data-testid="analysis-status">
            {status}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
