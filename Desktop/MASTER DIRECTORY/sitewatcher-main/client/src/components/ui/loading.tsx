import { Loader2, TrendingUp, Search, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'progress' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({ 
  type = 'spinner', 
  size = 'md', 
  message,
  progress,
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (type === 'progress' && progress !== undefined) {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
        <div className="w-full max-w-md space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{message || 'Loading...'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="flex space-x-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

// Specialized loading components for SEO features
export function SEOAnalysisLoader({ progress = 0 }: { progress?: number }) {
  const steps = [
    { icon: Search, label: 'Scanning website...', threshold: 20 },
    { icon: BarChart3, label: 'Analyzing SEO metrics...', threshold: 50 },
    { icon: TrendingUp, label: 'Generating insights...', threshold: 80 },
  ];

  const currentStep = steps.findIndex(step => progress < step.threshold) || steps.length - 1;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Analyzing Your Website</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This may take a few moments...
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = progress >= step.threshold;

              return (
                <div 
                  key={step.label}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                    isActive && 'bg-primary/10',
                    isCompleted && 'text-primary'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-full',
                    isActive && 'bg-primary text-primary-foreground animate-pulse',
                    isCompleted && 'bg-primary text-primary-foreground',
                    !isActive && !isCompleted && 'bg-muted'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    'text-sm',
                    isActive && 'font-medium',
                    isCompleted && 'font-medium'
                  )}>
                    {step.label}
                  </span>
                  {isActive && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Page level loading component
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading Site Watcher...</p>
      </div>
    </div>
  );
}
