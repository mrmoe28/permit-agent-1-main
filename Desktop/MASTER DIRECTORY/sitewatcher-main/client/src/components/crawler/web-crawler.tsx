import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiProgress } from "@/components/ui/multi-progress";
import { useProgress } from "@/hooks/use-progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Code, 
  Cpu, 
  Shield, 
  Zap,
  Server,
  Smartphone,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

interface CrawlerResult {
  url: string;
  domain: string;
  status: "crawling" | "completed" | "error";
  techStack: {
    framework?: string;
    library?: string;
    cms?: string;
    language?: string;
    hosting?: string;
    cdn?: string;
    analytics?: string;
    buildTool?: string;
    cssFramework?: string;
  };
  performance: {
    loadTime: number;
    pageSize: number;
    requests: number;
    lighthouse: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
  };
  security: {
    https: boolean;
    hsts: boolean;
    csp: boolean;
    ssl: {
      valid: boolean;
      issuer: string;
      expires: string;
    };
  };
  structure: {
    pageCount: number;
    internalLinks: number;
    externalLinks: number;
    images: number;
    forms: number;
  };
  meta: {
    title: string;
    description: string;
    keywords: string[];
    og: {
      title?: string;
      description?: string;
      image?: string;
    };
  };
}

interface WebCrawlerProps {
  url: string;
  onComplete?: (result: CrawlerResult) => void;
  compact?: boolean;
}

export function WebCrawler({ url, onComplete, compact = false }: WebCrawlerProps) {
  const [crawlerResult, setCrawlerResult] = useState<CrawlerResult | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const { toast } = useToast();

  const {
    createOperation,
    startOperation,
    cancelOperation,
    getActiveOperations
  } = useProgress();

  const activeOperations = getActiveOperations();
  const crawlerOperation = activeOperations.find(op => op.type === "site-comparison");

  const startCrawling = async () => {
    if (isCrawling) return;

    setIsCrawling(true);
    setCrawlerResult(null);

    const operationId = createOperation(
      "site-comparison",
      `Analyzing ${new URL(url).hostname}`,
      [
        {
          id: "initial-crawl",
          name: "Initial Page Crawl",
          description: "Fetching and parsing the main page",
          estimatedTime: 5
        },
        {
          id: "tech-detection",
          name: "Tech Stack Detection",
          description: "Analyzing technologies and frameworks",
          estimatedTime: 8
        },
        {
          id: "performance-test",
          name: "Performance Testing",
          description: "Running speed tests and Lighthouse audit",
          estimatedTime: 12
        },
        {
          id: "security-scan",
          name: "Security Analysis",
          description: "Checking SSL, headers, and security features",
          estimatedTime: 6
        },
        {
          id: "structure-analysis",
          name: "Structure Analysis",
          description: "Mapping site structure and content",
          estimatedTime: 10
        }
      ]
    );

    startOperation(operationId);

    // Simulate crawler process
    setTimeout(() => {
      const mockResult: CrawlerResult = {
        url,
        domain: new URL(url).hostname,
        status: "completed",
        techStack: {
          framework: "Next.js 14",
          library: "React 18",
          language: "TypeScript",
          cssFramework: "Tailwind CSS",
          hosting: "Vercel",
          cdn: "Vercel CDN",
          analytics: "Google Analytics 4",
          buildTool: "Webpack"
        },
        performance: {
          loadTime: 1.8,
          pageSize: 2.3,
          requests: 15,
          lighthouse: {
            performance: 92,
            accessibility: 87,
            bestPractices: 95,
            seo: 89
          }
        },
        security: {
          https: true,
          hsts: true,
          csp: true,
          ssl: {
            valid: true,
            issuer: "Let's Encrypt",
            expires: "2024-12-31"
          }
        },
        structure: {
          pageCount: 47,
          internalLinks: 156,
          externalLinks: 23,
          images: 34,
          forms: 3
        },
        meta: {
          title: "Example Website - SEO Optimized",
          description: "A comprehensive example website showcasing modern web development practices and SEO optimization.",
          keywords: ["SEO", "optimization", "web development", "performance"],
          og: {
            title: "Example Website - SEO Optimized",
            description: "Modern web development with SEO best practices",
            image: "https://example.com/og-image.jpg"
          }
        }
      };

      setCrawlerResult(mockResult);
      setIsCrawling(false);
      onComplete?.(mockResult);

      toast({
        title: "Crawling Complete",
        description: `Successfully analyzed ${new URL(url).hostname}`,
      });
    }, 15000); // 15 seconds for full crawl
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {crawlerOperation && (
          <MultiProgress
            title={crawlerOperation.title}
            stages={crawlerOperation.stages}
            currentStage={crawlerOperation.currentStage}
            overallProgress={crawlerOperation.overallProgress}
            canCancel={crawlerOperation.canCancel}
            onCancel={() => {
              cancelOperation(crawlerOperation.id);
              setIsCrawling(false);
            }}
            compact
          />
        )}

        {!isCrawling && !crawlerResult && (
          <Button onClick={startCrawling} className="w-full flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Analyze Website
          </Button>
        )}

        {crawlerResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analysis Complete</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Performance: <span className={getScoreColor(crawlerResult.performance.lighthouse.performance)}>{crawlerResult.performance.lighthouse.performance}</span></div>
              <div>SEO: <span className={getScoreColor(crawlerResult.performance.lighthouse.seo)}>{crawlerResult.performance.lighthouse.seo}</span></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crawler Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Crawler
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of {new URL(url).hostname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={startCrawling} 
              disabled={isCrawling}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isCrawling ? 'animate-spin' : ''}`} />
              {isCrawling ? 'Crawling...' : 'Start Analysis'}
            </Button>
            
            {crawlerResult && (
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {crawlerOperation && (
        <MultiProgress
          title={crawlerOperation.title}
          stages={crawlerOperation.stages}
          currentStage={crawlerOperation.currentStage}
          overallProgress={crawlerOperation.overallProgress}
          canCancel={crawlerOperation.canCancel}
          onCancel={() => {
            cancelOperation(crawlerOperation.id);
            setIsCrawling(false);
          }}
        />
      )}

      {/* Results */}
      {crawlerResult && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tech-stack">Tech Stack</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Performance
                      </p>
                      <p className={`text-2xl font-bold ${getScoreColor(crawlerResult.performance.lighthouse.performance)}`}>
                        {crawlerResult.performance.lighthouse.performance}
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        SEO Score
                      </p>
                      <p className={`text-2xl font-bold ${getScoreColor(crawlerResult.performance.lighthouse.seo)}`}>
                        {crawlerResult.performance.lighthouse.seo}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Load Time
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {crawlerResult.performance.loadTime}s
                      </p>
                    </div>
                    <Server className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Security
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {crawlerResult.security.https && crawlerResult.security.ssl.valid ? 'Secure' : 'Issues'}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tech-stack" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(crawlerResult.techStack).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <Badge variant="secondary">{value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lighthouse Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(crawlerResult.performance.lighthouse).map(([metric, score]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="capitalize font-medium">{metric.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge variant={getScoreBadge(score)}>{score}</Badge>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Load Time</span>
                    <span className="font-mono">{crawlerResult.performance.loadTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Page Size</span>
                    <span className="font-mono">{crawlerResult.performance.pageSize}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests</span>
                    <span className="font-mono">{crawlerResult.performance.requests}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>HTTPS Enabled</span>
                      {crawlerResult.security.https ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>HSTS</span>
                      {crawlerResult.security.hsts ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Content Security Policy</span>
                      {crawlerResult.security.csp ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">SSL Certificate</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge variant={crawlerResult.security.ssl.valid ? "default" : "destructive"}>
                          {crawlerResult.security.ssl.valid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Issuer</span>
                        <span className="font-mono">{crawlerResult.security.ssl.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires</span>
                        <span className="font-mono">{crawlerResult.security.ssl.expires}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(crawlerResult.structure).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meta Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {crawlerResult.meta.title}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {crawlerResult.meta.description}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Keywords</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {crawlerResult.meta.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}