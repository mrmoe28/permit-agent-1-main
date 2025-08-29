import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, MoreHorizontal, Target, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedMetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  target?: number;
  suffix?: string;
  prefix?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    isPositive: boolean;
  };
  sparklineData?: Array<{ value: number }>;
  gradient?: {
    from: string;
    to: string;
  };
  status?: 'excellent' | 'good' | 'warning' | 'critical';
  description?: string;
  onClick?: () => void;
  showProgress?: boolean;
  maxValue?: number;
  animationDuration?: number;
  size?: 'sm' | 'md' | 'lg';
}

// Custom hook for number animation
const useAnimatedNumber = (
  targetValue: number, 
  duration: number = 1000,
  startValue: number = 0
) => {
  const [currentValue, setCurrentValue] = useState(startValue);

  useEffect(() => {
    const startTime = Date.now();
    const difference = targetValue - startValue;

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = (t: number) => 1 - (--t) * t * t * t;
      const easedProgress = easeOutQuart(progress);
      
      const newValue = startValue + (difference * easedProgress);
      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setCurrentValue(targetValue);
      }
    };

    const timeoutId = setTimeout(updateValue, 100); // Small delay before animation starts
    return () => clearTimeout(timeoutId);
  }, [targetValue, duration, startValue]);

  return Math.round(currentValue);
};

// Status color mappings
const statusColors = {
  excellent: {
    bg: 'from-emerald-500 to-green-600',
    text: 'text-emerald-600',
    icon: CheckCircle,
    badge: 'bg-emerald-100 text-emerald-800'
  },
  good: {
    bg: 'from-blue-500 to-cyan-600',
    text: 'text-blue-600',
    icon: CheckCircle,
    badge: 'bg-blue-100 text-blue-800'
  },
  warning: {
    bg: 'from-amber-500 to-orange-600',
    text: 'text-amber-600',
    icon: AlertCircle,
    badge: 'bg-amber-100 text-amber-800'
  },
  critical: {
    bg: 'from-red-500 to-rose-600',
    text: 'text-red-600',
    icon: AlertCircle,
    badge: 'bg-red-100 text-red-800'
  }
};

const sizeClasses = {
  sm: {
    card: 'p-4',
    value: 'text-xl',
    icon: 'h-5 w-5',
    iconContainer: 'w-10 h-10'
  },
  md: {
    card: 'p-6',
    value: 'text-2xl',
    icon: 'h-6 w-6',
    iconContainer: 'w-12 h-12'
  },
  lg: {
    card: 'p-8',
    value: 'text-3xl',
    icon: 'h-8 w-8',
    iconContainer: 'w-16 h-16'
  }
};

export function AnimatedMetricCard({
  title,
  value,
  previousValue,
  target,
  suffix = "",
  prefix = "",
  icon: Icon,
  trend,
  sparklineData,
  gradient,
  status,
  description,
  onClick,
  showProgress = false,
  maxValue = 100,
  animationDuration = 1500,
  size = 'md'
}: AnimatedMetricCardProps) {
  const animatedValue = useAnimatedNumber(value, animationDuration, previousValue || 0);
  const [isHovered, setIsHovered] = useState(false);
  
  const statusConfig = status ? statusColors[status] : null;
  const sizeConfig = sizeClasses[size];

  // Calculate progress percentage for progress bar
  const progressPercentage = showProgress ? Math.min((value / maxValue) * 100, 100) : 0;

  // Determine if the card should be interactive
  const isInteractive = Boolean(onClick);

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isInteractive && "cursor-pointer hover:shadow-xl hover:-translate-y-1",
        onClick && "hover:ring-2 hover:ring-primary/20"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background overlay */}
      {(gradient || statusConfig) && (
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
          <div 
            className={cn(
              "w-full h-full bg-gradient-to-br",
              gradient ? `bg-gradient-to-br` : statusConfig?.bg
            )}
            style={gradient ? {
              background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
            } : undefined}
          />
        </div>
      )}

      <CardContent className={cn("relative z-10", sizeConfig.card)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {status && (
                <Badge variant="outline" className={cn("text-xs", statusConfig?.badge)}>
                  {status}
                </Badge>
              )}
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className={cn("font-bold text-foreground", sizeConfig.value)}>
                {prefix}{animatedValue.toLocaleString()}{suffix}
              </span>
              
              {trend && (
                <div className="flex items-center gap-1 ml-2">
                  {trend.direction === 'up' ? (
                    <TrendingUp className={cn(
                      "h-4 w-4",
                      trend.isPositive ? "text-emerald-500" : "text-red-500"
                    )} />
                  ) : (
                    <TrendingDown className={cn(
                      "h-4 w-4", 
                      trend.isPositive ? "text-emerald-500" : "text-red-500"
                    )} />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-emerald-500" : "text-red-500"
                  )}>
                    {Math.abs(trend.value).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <div className={cn(
            "rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            sizeConfig.iconContainer,
            statusConfig 
              ? `bg-gradient-to-br ${statusConfig.bg}` 
              : "bg-primary/10 group-hover:bg-primary/20"
          )}>
            <Icon className={cn(
              sizeConfig.icon,
              statusConfig ? "text-white" : "text-primary"
            )} />
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Target indicator */}
        {target && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>Target: {target}{suffix}</span>
            </div>
            <div className={cn(
              "font-medium",
              value >= target ? "text-emerald-600" : "text-amber-600"
            )}>
              {value >= target ? "✓ Achieved" : `${Math.abs(target - value)} to go`}
            </div>
          </div>
        )}

        {/* Mini sparkline placeholder */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Trend</span>
            <div className="flex items-center gap-1">
              {sparklineData.slice(-5).map((point, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1 rounded-full transition-all duration-500",
                    trend?.isPositive ? "bg-emerald-400" : "bg-red-400"
                  )}
                  style={{ 
                    height: `${Math.max((point.value / Math.max(...sparklineData.map(d => d.value))) * 20, 2)}px`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action button on hover */}
        {isInteractive && isHovered && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}