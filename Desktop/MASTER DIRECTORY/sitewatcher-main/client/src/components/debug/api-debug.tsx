import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApiDebugInfo, getApiUrl } from "@/lib/api-config";
import { useQuery } from "@tanstack/react-query";
import { Code, Database, Globe, Settings, Zap } from "lucide-react";

export function ApiDebugPanel() {
  const [debugInfo, setDebugInfo] = useState(getApiDebugInfo());
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Test API endpoints
  const { data: sitesData, error: sitesError } = useQuery({
    queryKey: ["/sites"],
    staleTime: 1000,
    retry: false
  });

  const { data: healthData, error: healthError } = useQuery({
    queryKey: ["/health"],
    staleTime: 1000,
    retry: false
  });

  useEffect(() => {
    setDebugInfo(getApiDebugInfo());
  }, []);

  const testEndpoint = async (endpoint: string) => {
    try {
      const url = getApiUrl(endpoint);
      console.log(`Testing endpoint: ${endpoint} -> ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          url,
          status: response.status,
          ok: response.ok,
          data: data
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          url: getApiUrl(endpoint),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const getStatusBadge = (result: any) => {
    if (result?.ok) {
      return <Badge className="bg-green-600">Success</Badge>;
    } else if (result?.error) {
      return <Badge variant="destructive">Error</Badge>;
    } else if (result?.status) {
      return <Badge variant="secondary">{result.status}</Badge>;
    }
    return <Badge variant="outline">Not Tested</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration Debug
          </CardTitle>
          <CardDescription>
            Current API configuration and environment detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Environment:</strong>
              <Badge variant="outline" className="ml-2">
                {debugInfo.environment}
              </Badge>
            </div>
            <div>
              <strong>Hostname:</strong> {debugInfo.hostname}
            </div>
            <div>
              <strong>Base URL:</strong> {debugInfo.baseUrl || '(relative)'}
            </div>
            <div>
              <strong>Is Production:</strong> {debugInfo.isProduction ? '✅' : '❌'}
            </div>
            <div>
              <strong>Is Development:</strong> {debugInfo.isDevelopment ? '✅' : '❌'}
            </div>
            <div>
              <strong>Is Ngrok:</strong> {debugInfo.isNgrok ? '✅' : '❌'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Endpoint Testing
          </CardTitle>
          <CardDescription>
            Test various API endpoints to verify connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { endpoint: 'health', label: 'Health Check', icon: Zap },
              { endpoint: 'sites', label: 'Sites API', icon: Globe },
              { endpoint: 'analyses', label: 'Analyses API', icon: Database },
              { endpoint: 'test-db', label: 'Database Test', icon: Database }
            ].map(({ endpoint, label, icon: Icon }) => {
              const result = testResults[endpoint];
              const resolvedUrl = getApiUrl(endpoint);
              
              return (
                <div key={endpoint} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{label}</span>
                    </div>
                    {getStatusBadge(result)}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {resolvedUrl}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => testEndpoint(endpoint)}
                    className="w-full"
                  >
                    Test
                  </Button>
                  {result && (
                    <div className="text-xs space-y-1">
                      {result.status && (
                        <div>Status: {result.status}</div>
                      )}
                      {result.error && (
                        <div className="text-red-600">Error: {result.error}</div>
                      )}
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600">
                            Show Response
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            React Query Status
          </CardTitle>
          <CardDescription>
            Current status of React Query API calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Sites Query</div>
              <div className="text-sm space-y-1">
                <div>Status: {sitesData ? '✅ Success' : sitesError ? '❌ Error' : '⏳ Loading'}</div>
                {sitesData && <div>Count: {Array.isArray(sitesData) ? sitesData.length : 'N/A'}</div>}
                {sitesError && <div className="text-red-600">Error: {sitesError.message}</div>}
              </div>
            </div>
            
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Health Query</div>
              <div className="text-sm space-y-1">
                <div>Status: {healthData ? '✅ Success' : healthError ? '❌ Error' : '⏳ Loading'}</div>
                {healthData && <div>Response: {JSON.stringify(healthData).substring(0, 50)}...</div>}
                {healthError && <div className="text-red-600">Error: {healthError.message}</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}