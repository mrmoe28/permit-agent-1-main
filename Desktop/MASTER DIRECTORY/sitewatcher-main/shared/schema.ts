import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  domain: text("domain").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  site_id: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  seo_score: integer("seo_score"),
  page_speed: integer("page_speed"),
  issues: integer("issues").default(0),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").default(0),
  status_message: text("status_message"),
  raw_data: jsonb("raw_data"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysis_id: varchar("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  type: text("type").notNull(), // meta, images, speed, schema, etc.
  
  // Enhanced fields for actionable recommendations
  implementation_guide: text("implementation_guide"), // Step-by-step implementation instructions
  code_example: text("code_example"), // HTML/CSS/JS code examples
  effort_score: integer("effort_score").default(5), // 1-10 scale (1=easy, 10=hard)
  impact_score: integer("impact_score").default(5), // 1-10 scale (1=low impact, 10=high impact)
  estimated_time: text("estimated_time"), // "5 minutes", "1 hour", etc.
  
  // Progress tracking
  status: text("status").default("pending"), // pending, in_progress, completed, dismissed
  completed_at: timestamp("completed_at"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  site_id: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  rank: integer("rank"),
  volume: integer("volume"),
  change: integer("change").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  analyses: many(analyses),
  keywords: many(keywords),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  site: one(sites, {
    fields: [analyses.site_id],
    references: [sites.id],
  }),
  recommendations: many(recommendations),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  analysis: one(analyses, {
    fields: [recommendations.analysis_id],
    references: [analyses.id],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one }) => ({
  site: one(sites, {
    fields: [keywords.site_id],
    references: [sites.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
