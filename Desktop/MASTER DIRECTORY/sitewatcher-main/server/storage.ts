import { 
  users, 
  sites, 
  analyses, 
  recommendations, 
  keywords,
  type User, 
  type InsertUser,
  type Site,
  type InsertSite,
  type Analysis,
  type InsertAnalysis,
  type Recommendation,
  type InsertRecommendation,
  type Keyword,
  type InsertKeyword
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, avg, gte, and, sql } from "drizzle-orm";

interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Site methods
  getAllSites(): Promise<Site[]>;
  getSiteById(id: string): Promise<Site | undefined>;
  getSiteByUrl(url: string): Promise<Site | undefined>;
  createSite(insertSite: InsertSite): Promise<Site>;
  updateSite(id: string, updates: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: string): Promise<void>;
  
  // Analysis methods
  getAllAnalyses(): Promise<Analysis[]>;
  getAnalysisById(id: string): Promise<Analysis | undefined>;
  createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: string, updates: Partial<Analysis>): Promise<void>;
  deleteAnalysis(id: string): Promise<void>;
  
  // Recommendation methods
  getRecommendationsByAnalysisId(analysisId: string): Promise<Recommendation[]>;
  createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation>;
  
  // Keyword methods
  getKeywordsBySiteId(siteId: string): Promise<Keyword[]>;
  createKeyword(insertKeyword: InsertKeyword): Promise<Keyword>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
  
  // Analytics methods
  getAnalyticsData(siteId?: string, timeRange?: string): Promise<any>;
  getAnalyticsTrends(siteId?: string, timeRange?: string): Promise<any>;
  getSiteComparison(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Site methods
  async getAllSites(): Promise<Site[]> {
    return await db.select().from(sites).orderBy(desc(sites.created_at));
  }

  async getSiteByUrl(url: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.url, url));
    return site || undefined;
  }

  async getSiteById(id: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site || undefined;
  }

  async createSite(insertSite: InsertSite): Promise<Site> {
    const [site] = await db
      .insert(sites)
      .values(insertSite)
      .returning();
    return site;
  }

  async updateSite(id: string, updates: Partial<InsertSite>): Promise<Site | undefined> {
    const [site] = await db
      .update(sites)
      .set(updates)
      .where(eq(sites.id, id))
      .returning();
    return site || undefined;
  }

  async deleteSite(id: string): Promise<void> {
    // Delete related data first
    await db.delete(analyses).where(eq(analyses.site_id, id));
    await db.delete(keywords).where(eq(keywords.site_id, id));
    // Delete the site
    await db.delete(sites).where(eq(sites.id, id));
  }

  // Analysis methods
  async getAllAnalyses(): Promise<Analysis[]> {
    return await db.query.analyses.findMany({
      with: {
        site: true,
      },
      orderBy: desc(analyses.created_at),
    });
  }

  async getAnalysisById(id: string): Promise<Analysis | undefined> {
    const analysis = await db.query.analyses.findFirst({
      where: eq(analyses.id, id),
      with: {
        site: true,
        recommendations: true,
      },
    });
    return analysis || undefined;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async updateAnalysis(id: string, updates: Partial<Analysis>): Promise<void> {
    await db
      .update(analyses)
      .set(updates)
      .where(eq(analyses.id, id));
  }

  async deleteAnalysis(id: string): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }

  // Recommendation methods
  async getRecommendationsByAnalysisId(analysisId: string): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.analysis_id, analysisId))
      .orderBy(desc(recommendations.created_at));
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db
      .insert(recommendations)
      .values(insertRecommendation)
      .returning();
    return recommendation;
  }

  // Keyword methods
  async getKeywordsBySiteId(siteId: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.site_id, siteId))
      .orderBy(desc(keywords.created_at));
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const [keyword] = await db
      .insert(keywords)
      .values(insertKeyword)
      .returning();
    return keyword;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    const [siteCount] = await db.select({ count: count() }).from(sites);
    const [analysisCount] = await db.select({ count: count() }).from(analyses);
    const [avgSeoScore] = await db.select({ avg: avg(analyses.seo_score) }).from(analyses).where(eq(analyses.status, "completed"));
    const [avgPageSpeed] = await db.select({ avg: avg(analyses.page_speed) }).from(analyses).where(eq(analyses.status, "completed"));

    return {
      seoScore: Math.round(Number(avgSeoScore?.avg) || 0),
      pageSpeed: Math.round(Number(avgPageSpeed?.avg) || 0),
      sites: siteCount?.count || 0,
      analyses: analysisCount?.count || 0,
    };
  }

  // Analytics methods
  async getAnalyticsData(siteId?: string, timeRange?: string): Promise<any> {
    // Calculate date range
    const now = new Date();
    const daysBack = this.getTimeRangeDays(timeRange || "30d");
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Base query filters
    let whereConditions = [
      eq(analyses.status, "completed"),
      gte(analyses.created_at, startDate)
    ];

    if (siteId && siteId !== "all") {
      whereConditions.push(eq(analyses.site_id, siteId));
    }

    // Get sites count
    const [totalSites] = await db.select({ count: count() }).from(sites);
    
    // Get completed analyses with averages
    const [metrics] = await db.select({
      avgSeoScore: avg(analyses.seo_score),
      avgPageSpeed: avg(analyses.page_speed),
      totalIssues: sql<number>`sum(${analyses.issues})`,
      count: count()
    }).from(analyses).where(and(...whereConditions));

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const previousConditions = [
      eq(analyses.status, "completed"),
      gte(analyses.created_at, previousPeriodStart),
      gte(analyses.created_at, startDate)
    ];

    if (siteId && siteId !== "all") {
      previousConditions.push(eq(analyses.site_id, siteId));
    }

    const [previousMetrics] = await db.select({
      avgSeoScore: avg(analyses.seo_score),
      avgPageSpeed: avg(analyses.page_speed),
      totalIssues: sql<number>`sum(${analyses.issues})`
    }).from(analyses).where(and(...previousConditions));

    // Calculate trend percentages
    const currentSeo = Number(metrics?.avgSeoScore) || 0;
    const previousSeo = Number(previousMetrics?.avgSeoScore) || currentSeo;
    const seoTrend = previousSeo > 0 ? ((currentSeo - previousSeo) / previousSeo) * 100 : 0;

    const currentSpeed = Number(metrics?.avgPageSpeed) || 0;
    const previousSpeed = Number(previousMetrics?.avgPageSpeed) || currentSpeed;
    const speedTrend = previousSpeed > 0 ? ((currentSpeed - previousSpeed) / previousSpeed) * 100 : 0;

    const currentIssues = Number(metrics?.totalIssues) || 0;
    const previousIssues = Number(previousMetrics?.totalIssues) || currentIssues;
    const issuesTrend = previousIssues > 0 ? ((currentIssues - previousIssues) / previousIssues) * 100 : 0;

    return {
      overview: {
        totalSites: totalSites?.count || 0,
        avgSeoScore: Math.round(currentSeo),
        avgPageSpeed: Math.round(currentSpeed),
        totalIssues: currentIssues,
        trends: {
          seoScore: Math.round(seoTrend * 10) / 10,
          pageSpeed: Math.round(speedTrend * 10) / 10,
          issues: Math.round(issuesTrend * 10) / 10
        }
      }
    };
  }

  async getAnalyticsTrends(siteId?: string, timeRange?: string): Promise<any> {
    const daysBack = this.getTimeRangeDays(timeRange || "30d");
    const now = new Date();
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    let whereConditions = [
      eq(analyses.status, "completed"),
      gte(analyses.created_at, startDate)
    ];

    if (siteId && siteId !== "all") {
      whereConditions.push(eq(analyses.site_id, siteId));
    }

    // Get analyses grouped by date
    const results = await db.select({
      date: sql<string>`DATE(${analyses.created_at})`,
      avgSeoScore: avg(analyses.seo_score),
      avgPageSpeed: avg(analyses.page_speed),
      totalIssues: sql<number>`sum(${analyses.issues})`
    })
    .from(analyses)
    .where(and(...whereConditions))
    .groupBy(sql`DATE(${analyses.created_at})`)
    .orderBy(sql`DATE(${analyses.created_at})`);

    return results.map((row: any) => ({
      date: row.date,
      seoScore: Math.round(Number(row.avgSeoScore) || 0),
      pageSpeed: Math.round(Number(row.avgPageSpeed) || 0),
      issues: Number(row.totalIssues) || 0
    }));
  }

  async getSiteComparison(): Promise<any> {
    // Get latest analysis for each site
    const latestAnalyses = await db.query.analyses.findMany({
      with: {
        site: true
      },
      where: eq(analyses.status, "completed"),
      orderBy: desc(analyses.created_at)
    });

    // Group by site and get the most recent analysis for each
    const siteMap = new Map();
    latestAnalyses.forEach((analysis: any) => {
      if (!siteMap.has(analysis.siteId) || 
          new Date(analysis.createdAt) > new Date(siteMap.get(analysis.siteId).createdAt)) {
        siteMap.set(analysis.siteId, analysis);
      }
    });

    return Array.from(siteMap.values()).map(analysis => ({
      site: analysis.site.domain,
      seoScore: analysis.seoScore || 0,
      pageSpeed: analysis.pageSpeed || 0,
      issues: analysis.issues || 0,
      url: analysis.site.url
    }));
  }

  private getTimeRangeDays(timeRange: string): number {
    switch (timeRange) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      case "1y": return 365;
      default: return 30;
    }
  }
}

export const storage = new DatabaseStorage();