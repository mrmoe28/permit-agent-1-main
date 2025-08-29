import { useState, useCallback, useRef, useEffect } from "react";
import { ProgressStage } from "@/components/ui/multi-progress";

export type OperationType = 
  | "analytics-aggregation" 
  | "analytics-export" 
  | "keyword-rank-check" 
  | "keyword-bulk-add"
  | "site-comparison"
  | "chart-generation";

interface ProgressOperation {
  id: string;
  type: OperationType;
  title: string;
  stages: ProgressStage[];
  currentStage: string;
  overallProgress: number;
  status: "idle" | "running" | "completed" | "error" | "cancelled";
  canCancel: boolean;
  startTime?: number;
  endTime?: number;
}

export function useProgress() {
  const [operations, setOperations] = useState<Map<string, ProgressOperation>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const createOperation = useCallback((
    type: OperationType,
    title: string,
    stages: Omit<ProgressStage, "progress" | "status">[],
    canCancel = true
  ): string => {
    const id = Math.random().toString(36).substr(2, 9);
    
    const progressStages: ProgressStage[] = stages.map(stage => ({
      ...stage,
      progress: 0,
      status: "pending" as const
    }));

    const operation: ProgressOperation = {
      id,
      type,
      title,
      stages: progressStages,
      currentStage: progressStages[0]?.id || "",
      overallProgress: 0,
      status: "idle",
      canCancel,
      startTime: Date.now()
    };

    setOperations(prev => new Map(prev.set(id, operation)));
    return id;
  }, []);

  const startOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        // Mark first stage as running
        const updatedStages = operation.stages.map((stage, index) => ({
          ...stage,
          status: index === 0 ? "running" as const : "pending" as const
        }));

        newMap.set(operationId, {
          ...operation,
          status: "running",
          stages: updatedStages,
          startTime: Date.now()
        });
      }
      return newMap;
    });

    // Start simulated progress for the operation
    const interval = setInterval(() => {
      setOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(operationId);
        
        if (!operation || operation.status !== "running") {
          clearInterval(interval);
          intervalRefs.current.delete(operationId);
          return prev;
        }

        const currentStageIndex = operation.stages.findIndex(s => s.id === operation.currentStage);
        const currentStage = operation.stages[currentStageIndex];
        
        if (!currentStage) return prev;

        // Simulate progress with some randomness
        const progressIncrement = Math.random() * 5 + 2; // 2-7% increment
        const newStageProgress = Math.min(currentStage.progress + progressIncrement, 100);
        
        const updatedStages = operation.stages.map((stage, index) => {
          if (index === currentStageIndex) {
            return { ...stage, progress: newStageProgress };
          }
          return stage;
        });

        let newCurrentStage = operation.currentStage;
        let overallProgress = operation.overallProgress;

        // Check if current stage is complete
        if (newStageProgress >= 100) {
          updatedStages[currentStageIndex] = { 
            ...updatedStages[currentStageIndex], 
            status: "completed",
            progress: 100
          };

          // Move to next stage if available
          if (currentStageIndex < operation.stages.length - 1) {
            newCurrentStage = operation.stages[currentStageIndex + 1].id;
            updatedStages[currentStageIndex + 1] = {
              ...updatedStages[currentStageIndex + 1],
              status: "running"
            };
          } else {
            // All stages complete
            clearInterval(interval);
            intervalRefs.current.delete(operationId);
            newMap.set(operationId, {
              ...operation,
              status: "completed",
              stages: updatedStages,
              currentStage: newCurrentStage,
              overallProgress: 100,
              endTime: Date.now()
            });
            return newMap;
          }
        }

        // Calculate overall progress
        const totalStages = operation.stages.length;
        const completedStages = updatedStages.filter(s => s.status === "completed").length;
        const currentStageProgress = updatedStages[currentStageIndex]?.progress || 0;
        overallProgress = ((completedStages * 100) + currentStageProgress) / totalStages;

        newMap.set(operationId, {
          ...operation,
          stages: updatedStages,
          currentStage: newCurrentStage,
          overallProgress: Math.round(overallProgress)
        });

        return newMap;
      });
    }, 200 + Math.random() * 300); // 200-500ms intervals for realistic feel

    intervalRefs.current.set(operationId, interval);
  }, []);

  const cancelOperation = useCallback((operationId: string) => {
    const interval = intervalRefs.current.get(operationId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(operationId);
    }

    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        newMap.set(operationId, {
          ...operation,
          status: "cancelled",
          endTime: Date.now()
        });
      }
      return newMap;
    });
  }, []);

  const removeOperation = useCallback((operationId: string) => {
    const interval = intervalRefs.current.get(operationId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(operationId);
    }

    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
  }, []);

  const getOperation = useCallback((operationId: string) => {
    return operations.get(operationId);
  }, [operations]);

  const getActiveOperations = useCallback(() => {
    return Array.from(operations.values()).filter(op => 
      op.status === "running" || op.status === "idle"
    );
  }, [operations]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current.clear();
    };
  }, []);

  return {
    createOperation,
    startOperation,
    cancelOperation,
    removeOperation,
    getOperation,
    getActiveOperations,
    operations: Array.from(operations.values())
  };
}

// Predefined operation templates
export const OPERATION_TEMPLATES = {
  "analytics-aggregation": {
    title: "Aggregating Analytics Data",
    stages: [
      {
        id: "fetch-sites",
        name: "Fetching Site Data",
        description: "Retrieving data from all monitored sites",
        estimatedTime: 10
      },
      {
        id: "calculate-trends", 
        name: "Calculating Trends",
        description: "Processing historical data and trend analysis",
        estimatedTime: 15
      },
      {
        id: "generate-insights",
        name: "Generating Insights", 
        description: "Creating AI-powered recommendations",
        estimatedTime: 8
      }
    ]
  },
  "keyword-rank-check": {
    title: "Checking Keyword Rankings",
    stages: [
      {
        id: "fetch-keywords",
        name: "Fetching Keywords",
        description: "Loading keyword list and configuration",
        estimatedTime: 3
      },
      {
        id: "check-rankings",
        name: "Checking Rankings",
        description: "Querying search engines for current positions",
        estimatedTime: 25
      },
      {
        id: "update-database",
        name: "Updating Database",
        description: "Saving new ranking data and calculating changes",
        estimatedTime: 5
      }
    ]
  },
  "analytics-export": {
    title: "Exporting Analytics Report",
    stages: [
      {
        id: "collect-data",
        name: "Collecting Data",
        description: "Gathering all relevant analytics information",
        estimatedTime: 8
      },
      {
        id: "format-report",
        name: "Formatting Report",
        description: "Creating charts and formatting document",
        estimatedTime: 12
      },
      {
        id: "generate-file",
        name: "Generating File",
        description: "Creating PDF/CSV file for download",
        estimatedTime: 5
      }
    ]
  }
} as const;