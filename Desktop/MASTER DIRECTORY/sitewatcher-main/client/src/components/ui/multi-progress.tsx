import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, CheckCircle, AlertCircle } from "lucide-react";

export interface ProgressStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: "pending" | "running" | "completed" | "error";
  estimatedTime?: number;
}

interface MultiProgressProps {
  title: string;
  stages: ProgressStage[];
  currentStage: string;
  overallProgress: number;
  canCancel?: boolean;
  onCancel?: () => void;
  showTimeEstimate?: boolean;
  compact?: boolean;
}

export function MultiProgress({
  title,
  stages,
  currentStage,
  overallProgress,
  canCancel = false,
  onCancel,
  showTimeEstimate = true,
  compact = false
}: MultiProgressProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate estimated time remaining based on current progress
    if (overallProgress > 0 && overallProgress < 100) {
      const timePerPercent = timeElapsed / overallProgress;
      const remaining = (100 - overallProgress) * timePerPercent;
      setEstimatedTimeRemaining(Math.ceil(remaining));
    }
  }, [overallProgress, timeElapsed]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageIcon = (status: ProgressStage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const currentStageData = stages.find(stage => stage.id === currentStage);

  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {currentStageData?.name || title}
            </span>
            {canCancel && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Progress value={overallProgress} className="h-1.5" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {currentStageData?.description}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentStageData?.description || "Processing your request..."}
            </p>
          </div>
          {canCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Time Information */}
        {showTimeEstimate && (
          <div className="flex items-center gap-6 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Elapsed: {formatTime(timeElapsed)}</span>
            </div>
            {estimatedTimeRemaining && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Remaining: ~{formatTime(estimatedTimeRemaining)}</span>
              </div>
            )}
          </div>
        )}

        {/* Stage Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Progress Stages
          </h4>
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center space-x-3">
              {getStageIcon(stage.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    stage.id === currentStage 
                      ? "text-primary" 
                      : stage.status === "completed" 
                        ? "text-green-600 dark:text-green-400"
                        : stage.status === "error"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {stage.name}
                  </span>
                  <Badge variant={
                    stage.status === "completed" ? "default" :
                    stage.status === "running" ? "secondary" :
                    stage.status === "error" ? "destructive" : "outline"
                  }>
                    {stage.status}
                  </Badge>
                </div>
                {stage.id === currentStage && stage.status === "running" && (
                  <Progress value={stage.progress} className="h-1.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}