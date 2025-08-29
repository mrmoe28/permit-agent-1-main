import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Target, 
  FileText, 
  Play, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Users,
  Globe,
  Lightbulb
} from "lucide-react";

interface AnalyticsAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  category: 'analysis' | 'insights' | 'reporting' | 'optimization';
  isRunning?: boolean;
  progress?: number;
  lastRun?: Date;
  enabled: boolean;
}

interface AnalyticsActionPanelProps {
  onActionTrigger: (actionId: string) => Promise<void>;
  runningActions?: string[];
  actionProgress?: Record<string, number>;
}

const defaultActions: AnalyticsAction[] = [
  {
    id: 'deep-analysis',
    title: 'Run Deep Analysis',
    description: 'Comprehensive SEO audit across all sites with detailed insights and recommendations',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    estimatedTime: '3-5 min',
    difficulty: 'medium',
    category: 'analysis',
    enabled: true
  },
  {
    id: 'ai-insights',
    title: 'Generate AI Insights',
    description: 'AI-powered analysis to identify trends, anomalies, and optimization opportunities',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-600',
    estimatedTime: '2-3 min',
    difficulty: 'easy',
    category: 'insights',
    enabled: true
  },
  {
    id: 'schedule-reports',
    title: 'Schedule Reports',
    description: 'Set up automated analytics reports with customizable frequency and recipients',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-600',
    estimatedTime: '1-2 min',
    difficulty: 'easy',
    category: 'reporting',
    enabled: true
  },
  {
    id: 'trend-analysis',
    title: 'Analyze Trends',
    description: 'Advanced trend analysis with forecasting and predictive insights',
    icon: TrendingUp,
    color: 'from-emerald-500 to-green-600',
    estimatedTime: '4-6 min',
    difficulty: 'advanced',
    category: 'analysis',
    enabled: true
  },
  {
    id: 'benchmark-performance',
    title: 'Benchmark Performance',
    description: 'Compare your metrics against industry standards and competitor analysis',
    icon: Target,
    color: 'from-rose-500 to-pink-600',
    estimatedTime: '5-7 min',
    difficulty: 'advanced',
    category: 'analysis',
    enabled: true
  },
  {
    id: 'export-dashboard',
    title: 'Export Dashboard',
    description: 'Generate comprehensive PDF reports with charts, insights, and recommendations',
    icon: FileText,
    color: 'from-gray-500 to-slate-600',
    estimatedTime: '1-2 min',
    difficulty: 'easy',
    category: 'reporting',
    enabled: true
  }
];

const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  advanced: { color: 'bg-red-100 text-red-800', icon: Zap }
};

const categoryConfig = {
  analysis: { color: 'bg-purple-100 text-purple-800', label: 'Analysis' },
  insights: { color: 'bg-amber-100 text-amber-800', label: 'Insights' },
  reporting: { color: 'bg-blue-100 text-blue-800', label: 'Reporting' },
  optimization: { color: 'bg-emerald-100 text-emerald-800', label: 'Optimization' }
};

export function AnalyticsActionPanel({ 
  onActionTrigger, 
  runningActions = [], 
  actionProgress = {} 
}: AnalyticsActionPanelProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredActions = selectedCategory === 'all' 
    ? defaultActions 
    : defaultActions.filter(action => action.category === selectedCategory);

  const handleActionClick = async (action: AnalyticsAction) => {
    if (runningActions.includes(action.id) || !action.enabled) {
      return;
    }

    try {
      toast({
        title: `Starting ${action.title}`,
        description: `Estimated time: ${action.estimatedTime}`,
      });

      await onActionTrigger(action.id);
      
      toast({
        title: `${action.title} Completed`,
        description: "Results are now available in your dashboard",
      });
    } catch (error) {
      toast({
        title: `${action.title} Failed`,
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const ActionCard = ({ action }: { action: AnalyticsAction }) => {
    const isRunning = runningActions.includes(action.id);
    const progress = actionProgress[action.id] || 0;
    const difficultyInfo = difficultyConfig[action.difficulty];
    const categoryInfo = categoryConfig[action.category];

    return (
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Gradient background */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
          <div className={`w-full h-full bg-gradient-to-br ${action.color}`} />
        </div>

        <CardContent className="relative z-10 p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-lg bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>

                {action.lastRun && (
                  <Badge variant="outline" className="text-xs">
                    Last run: {action.lastRun.toLocaleDateString()}
                  </Badge>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                <Badge className={categoryInfo.color}>
                  {categoryInfo.label}
                </Badge>
                <Badge className={difficultyInfo.color}>
                  <difficultyInfo.icon className="h-3 w-3 mr-1" />
                  {action.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ~{action.estimatedTime}
                </span>
              </div>

              {/* Progress bar for running actions */}
              {isRunning && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">Running...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Action button */}
              <Button 
                onClick={() => handleActionClick(action)}
                disabled={!action.enabled || isRunning}
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                variant={isRunning ? "secondary" : "outline"}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start {action.title}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Analytics Actions
            </CardTitle>
            <CardDescription>
              Trigger advanced analytics and generate insights with one click
            </CardDescription>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="text-xs"
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredActions.map(action => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {filteredActions.length}
            </div>
            <div className="text-sm text-muted-foreground">Available Actions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {runningActions.length}
            </div>
            <div className="text-sm text-muted-foreground">Currently Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {defaultActions.filter(a => a.lastRun).length}
            </div>
            <div className="text-sm text-muted-foreground">Recently Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {defaultActions.filter(a => a.difficulty === 'advanced').length}
            </div>
            <div className="text-sm text-muted-foreground">Advanced Features</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}