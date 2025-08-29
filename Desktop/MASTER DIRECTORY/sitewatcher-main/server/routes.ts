import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seoAnalyzer } from "./services/seo-analyzer";
import { insertSiteSchema, insertAnalysisSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sites endpoints
  app.get("/api/sites", async (req, res) => {
    try {
      const sites = await storage.getAllSites();
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const siteData = insertSiteSchema.parse(req.body);
      const site = await storage.createSite(siteData);
      res.json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid site data", errors: error.errors });
      } else {
        console.error("Error creating site:", error);
        res.status(500).json({ message: "Failed to create site" });
      }
    }
  });

  app.get("/api/sites/:id", async (req, res) => {
    try {
      const site = await storage.getSiteById(req.params.id);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.put("/api/sites/:id", async (req, res) => {
    try {
      const siteData = insertSiteSchema.partial().parse(req.body);
      const site = await storage.updateSite(req.params.id, siteData);
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid site data", errors: error.errors });
      } else {
        console.error("Error updating site:", error);
        res.status(500).json({ message: "Failed to update site" });
      }
    }
  });

  app.delete("/api/sites/:id", async (req, res) => {
    try {
      await storage.deleteSite(req.params.id);
      res.json({ message: "Site deleted successfully" });
    } catch (error) {
      console.error("Error deleting site:", error);
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Analysis endpoints
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post("/api/analyses", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Extract domain from URL
      const domain = new URL(url).hostname;
      
      // Create or get site
      let site = await storage.getSiteByUrl(url);
      if (!site) {
        site = await storage.createSite({ url, domain });
      }

      // Create analysis
      const analysis = await storage.createAnalysis({
        siteId: site.id,
        status: "pending",
        progress: 0,
        statusMessage: "Analysis queued"
      });

      // Start SEO analysis asynchronously
      seoAnalyzer.analyzeUrl(url, analysis.id).catch(error => {
        console.error("SEO analysis failed:", error);
        storage.updateAnalysis(analysis.id, {
          status: "failed",
          statusMessage: "Analysis failed: " + error.message
        });
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysisById(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysisById(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      await storage.deleteAnalysis(req.params.id);
      res.json({ message: "Analysis deleted successfully" });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Recommendations endpoints
  app.get("/api/analyses/:analysisId/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getRecommendationsByAnalysisId(req.params.analysisId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Keywords endpoints
  app.get("/api/sites/:siteId/keywords", async (req, res) => {
    try {
      const keywords = await storage.getKeywordsBySiteId(req.params.siteId);
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  // Keywords endpoints compatible with serverless API
  app.get("/api/keywords", async (req, res) => {
    try {
      const { siteId } = req.query;
      if (!siteId || typeof siteId !== 'string') {
        return res.status(400).json({ message: "Site ID is required" });
      }
      const keywords = await storage.getKeywordsBySiteId(siteId);
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    try {
      const { siteId, term, domain } = req.body;
      
      if (!siteId || !term || !domain) {
        return res.status(400).json({ message: "Site ID, term, and domain are required" });
      }

      // For development, create mock keyword data (in production this would use SERPApi)
      const keyword = await storage.createKeyword({
        siteId,
        term: term.trim(),
        rank: Math.floor(Math.random() * 100) + 1, // Mock rank for development
        volume: Math.floor(Math.random() * 10000) + 100, // Mock volume
        change: Math.floor(Math.random() * 21) - 10, // Mock change -10 to +10
      });

      res.status(201).json({
        ...keyword,
        domain
      });
    } catch (error) {
      console.error("Error creating keyword:", error);
      res.status(500).json({ message: "Failed to create keyword" });
    }
  });

  app.delete("/api/keywords", async (req, res) => {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: "Keyword ID is required" });
      }

      await storage.deleteKeyword(id);
      res.json({ message: "Keyword deleted successfully" });
    } catch (error) {
      console.error("Error deleting keyword:", error);
      res.status(500).json({ message: "Failed to delete keyword" });
    }
  });

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      const { site, timeRange = "30d" } = req.query;
      const analytics = await storage.getAnalyticsData(site as string, timeRange as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/trends", async (req, res) => {
    try {
      const { site, timeRange = "30d" } = req.query;
      const trends = await storage.getAnalyticsTrends(site as string, timeRange as string);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching analytics trends:", error);
      res.status(500).json({ message: "Failed to fetch analytics trends" });
    }
  });

  app.get("/api/analytics/comparison", async (req, res) => {
    try {
      const comparison = await storage.getSiteComparison();
      res.json(comparison);
    } catch (error) {
      console.error("Error fetching site comparison:", error);
      res.status(500).json({ message: "Failed to fetch site comparison" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
