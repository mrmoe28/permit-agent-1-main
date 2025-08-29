import { useState } from "react";
import { Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface URLAnalysisFormProps {
  onAnalysisStart: (analysisId: string) => void;
}

export function URLAnalysisForm({ onAnalysisStart }: URLAnalysisFormProps) {
  const [url, setUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/analyses", { url });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Started",
        description: "Your website analysis has been queued and will begin shortly.",
      });
      onAnalysisStart(data.id);
      queryClient.invalidateQueries({ queryKey: ["/analyses"] });
      setUrl("");
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      new URL(url);
      analyzeUrlMutation.mutate(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Analyze Website</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="url-input" className="sr-only">
              Website URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="text-gray-400 text-sm" size={16} />
              </div>
              <Input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                placeholder="Enter website URL (e.g., https://example.com)"
                data-testid="url-input"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={analyzeUrlMutation.isPending || !url}
            className="px-6"
            data-testid="analyze-button"
          >
            <Search className="mr-2" size={16} />
            {analyzeUrlMutation.isPending ? "Analyzing..." : "Analyze"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
