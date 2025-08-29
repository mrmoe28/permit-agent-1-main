import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, Download, Target } from "lucide-react";

interface DonutDataItem {
  name: string;
  value: number;
  color: string;
  description?: string;
  target?: number;
}

interface AnalyticsDonutChartProps {
  data: DonutDataItem[];
  title?: string;
  description?: string;
  centerValue?: number;
  centerLabel?: string;
  showLegend?: boolean;
  showExport?: boolean;
  onExport?: () => void;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const COLORS = [
  "hsl(142, 76%, 36%)", // Green
  "hsl(221, 83%, 53%)", // Blue  
  "hsl(0, 84%, 60%)",   // Red
  "hsl(271, 81%, 56%)", // Purple
  "hsl(32, 95%, 44%)",  // Orange
  "hsl(191, 82%, 41%)", // Cyan
];

// Custom active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-lg font-semibold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-sm font-medium">
        {`${value}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// Custom center text component
const CenterText = ({ cx, cy, value, label }: { cx: number; cy: number; value?: number; label?: string }) => {
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" className="text-2xl font-bold fill-foreground">
        {value !== undefined ? value : ''}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-sm fill-muted-foreground">
        {label || ''}
      </text>
    </g>
  );
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium">{entry.value}</span>
          <Badge variant="outline" className="text-xs">
            {entry.payload.value}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export function AnalyticsDonutChart({
  data,
  title = "Metrics Breakdown",
  description = "Distribution of key performance metrics",
  centerValue,
  centerLabel,
  showLegend = true,
  showExport = true,
  onExport,
  height = 300,
  innerRadius = 60,
  outerRadius = 120
}: AnalyticsDonutChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Add colors to data if not provided
  const enhancedData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length]
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Calculate total for center display if not provided
  const totalValue = centerValue !== undefined ? centerValue : enhancedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Summary Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">Total</div>
                <div className="text-lg font-bold">{totalValue}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Items</div>
                <div className="text-lg font-bold">{enhancedData.length}</div>
              </div>
            </div>

            {showExport && onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={enhancedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
              >
                {enhancedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={entry.color}
                    strokeWidth={2}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      transition: 'filter 0.2s ease'
                    }}
                  />
                ))}
              </Pie>

              {/* Center text overlay */}
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={0}
                fill="transparent"
                dataKey="value"
                label={({ cx, cy }) => (
                  <CenterText 
                    cx={cx} 
                    cy={cy} 
                    value={totalValue} 
                    label={centerLabel || "Total"} 
                  />
                )}
              />

              {showLegend && <Legend content={<CustomLegend />} />}
            </PieChart>
          </ResponsiveContainer>

          {/* Data breakdown below chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {enhancedData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {((item.value / totalValue) * 100).toFixed(1)}%
                  </div>
                  {item.target && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      Target: {item.target}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}