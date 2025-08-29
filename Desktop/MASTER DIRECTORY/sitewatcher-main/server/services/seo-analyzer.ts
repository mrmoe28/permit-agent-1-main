import { storage } from "../storage";

interface PageSpeedInsightsResult {
  lighthouseResult: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
    audits: Record<string, any>;
  };
}

class SEOAnalyzer {
  private getApiKey(): string {
    return process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY || "";
  }

  async analyzeUrl(url: string, analysisId: string): Promise<void> {
    try {
      // Update status to running
      await storage.updateAnalysis(analysisId, {
        status: "running",
        progress: 10,
        statusMessage: "Starting PageSpeed analysis..."
      });

      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error("Google PageSpeed Insights API key not configured");
      }

      // Call Google PageSpeed Insights API
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo`;
      
      await storage.updateAnalysis(analysisId, {
        progress: 30,
        statusMessage: "Analyzing page speed performance..."
      });

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.status} ${response.statusText}`);
      }

      const data: PageSpeedInsightsResult = await response.json();

      await storage.updateAnalysis(analysisId, {
        progress: 60,
        statusMessage: "Processing SEO recommendations..."
      });

      // Extract metrics
      const categories = data.lighthouseResult.categories;
      const seoScore = Math.round((categories.seo?.score || 0) * 100);
      const pageSpeed = Math.round((categories.performance?.score || 0) * 100);

      // Generate recommendations
      const recommendations = this.generateRecommendations(data.lighthouseResult.audits);
      
      await storage.updateAnalysis(analysisId, {
        progress: 80,
        statusMessage: "Saving analysis results..."
      });

      // Update analysis with results
      await storage.updateAnalysis(analysisId, {
        seoScore,
        pageSpeed,
        issues: recommendations.length,
        status: "completed",
        progress: 100,
        statusMessage: "Analysis completed successfully",
        rawData: data
      });

      // Save recommendations
      for (const rec of recommendations) {
        await storage.createRecommendation({
          analysisId,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          type: rec.type,
          implementationGuide: rec.implementationGuide,
          codeExample: rec.codeExample,
          effortScore: rec.effortScore,
          impactScore: rec.impactScore,
          estimatedTime: rec.estimatedTime
        });
      }

    } catch (error) {
      console.error("SEO analysis failed:", error);
      await storage.updateAnalysis(analysisId, {
        status: "failed",
        statusMessage: error instanceof Error ? error.message : "Unknown error occurred"
      });
      throw error;
    }
  }

  private generateRecommendations(audits: Record<string, any>) {
    const recommendations = [];

    // Check meta description
    if (audits['meta-description'] && audits['meta-description'].score < 1) {
      recommendations.push({
        title: "Add Meta Description",
        description: "Meta descriptions help improve click-through rates from search results by providing a compelling preview of your page content.",
        priority: "high" as const,
        type: "meta",
        implementationGuide: "1. Identify pages missing meta descriptions\n2. Write unique, compelling descriptions (150-160 characters)\n3. Include target keywords naturally\n4. Add meta description tags to HTML head section\n5. Test descriptions in SERP preview tools",
        codeExample: `<meta name="description" content="Learn SEO optimization techniques to improve your website's search rankings and drive more organic traffic. Expert tips and actionable strategies.">`,
        effortScore: 3,
        impactScore: 8,
        estimatedTime: "15 minutes per page"
      });
    }

    // Check image optimization
    if (audits['unused-css'] && audits['unused-css'].score < 0.8) {
      recommendations.push({
        title: "Remove Unused CSS",
        description: "Eliminate unused CSS to reduce bundle size and improve page load times.",
        priority: "medium" as const,
        type: "speed",
        implementationGuide: "1. Use browser DevTools Coverage tab to identify unused CSS\n2. Use tools like PurgeCSS or UnCSS to remove unused styles\n3. Split critical CSS for above-the-fold content\n4. Load non-critical CSS asynchronously\n5. Minify remaining CSS files",
        codeExample: `<!-- Critical CSS inline -->\n<style>\n/* Only critical above-the-fold styles */\n.header { display: flex; }\n</style>\n\n<!-- Non-critical CSS async -->\n<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
        effortScore: 6,
        impactScore: 7,
        estimatedTime: "1-2 hours"
      });
    }

    // Check for largest contentful paint
    if (audits['largest-contentful-paint'] && audits['largest-contentful-paint'].score < 0.9) {
      const lcpValue = audits['largest-contentful-paint'].numericValue;
      recommendations.push({
        title: "Improve Largest Contentful Paint (LCP)",
        description: `Your LCP is ${(lcpValue / 1000).toFixed(1)}s. Optimize the loading of your largest content element to improve perceived performance.`,
        priority: "high" as const,
        type: "speed",
        implementationGuide: "1. Identify LCP element using PageSpeed Insights\n2. Optimize images: compress, use modern formats (WebP), add preload hints\n3. Eliminate render-blocking resources (CSS/JS)\n4. Improve server response time (TTFB)\n5. Use CDN for faster content delivery\n6. Implement resource preloading for critical elements",
        codeExample: `<!-- Preload critical LCP image -->\n<link rel="preload" as="image" href="hero-image.webp">\n\n<!-- Optimized image with modern formats -->\n<picture>\n  <source srcset="hero.webp" type="image/webp">\n  <source srcset="hero.avif" type="image/avif">\n  <img src="hero.jpg" alt="Hero image" loading="eager">\n</picture>`,
        effortScore: 7,
        impactScore: 9,
        estimatedTime: "2-4 hours"
      });
    }

    // Check for structured data
    if (!audits['structured-data'] || audits['structured-data'].score < 1) {
      recommendations.push({
        title: "Implement Schema Markup",
        description: "Add structured data to help search engines understand your content better and enable rich snippets in search results.",
        priority: "medium" as const,
        type: "schema",
        implementationGuide: "1. Identify content types (Article, Organization, Product, etc.)\n2. Choose appropriate Schema.org vocabulary\n3. Implement JSON-LD structured data\n4. Add schema markup to relevant pages\n5. Test with Google's Rich Results Test\n6. Monitor rich snippets in Search Console",
        codeExample: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "SEO Best Practices Guide",\n  "author": {\n    "@type": "Person",\n    "name": "John Smith"\n  },\n  "datePublished": "2024-01-15",\n  "image": "https://example.com/article-image.jpg"\n}\n</script>`,
        effortScore: 4,
        impactScore: 6,
        estimatedTime: "30 minutes per page type"
      });
    }

    // Check heading structure
    if (audits['heading-order'] && audits['heading-order'].score < 1) {
      recommendations.push({
        title: "Fix Heading Hierarchy",
        description: "Proper heading structure (H1→H2→H3) improves content organization and helps search engines understand your content hierarchy.",
        priority: "medium" as const,
        type: "content",
        implementationGuide: "1. Audit current heading structure\n2. Ensure only one H1 per page (main topic)\n3. Use H2 for main sections, H3 for subsections\n4. Don't skip heading levels (H1→H3)\n5. Include relevant keywords in headings naturally\n6. Keep headings descriptive and concise",
        codeExample: `<!-- Correct heading hierarchy -->\n<h1>Complete SEO Guide</h1>\n  <h2>On-Page SEO</h2>\n    <h3>Title Tags</h3>\n    <h3>Meta Descriptions</h3>\n  <h2>Technical SEO</h2>\n    <h3>Site Speed</h3>\n    <h3>Mobile Optimization</h3>`,
        effortScore: 2,
        impactScore: 5,
        estimatedTime: "10 minutes"
      });
    }

    // Check for HTTPS
    if (audits['is-on-https'] && audits['is-on-https'].score < 1) {
      recommendations.push({
        title: "Enable HTTPS",
        description: "HTTPS is a ranking factor and builds user trust. Secure your website to protect user data and improve SEO.",
        priority: "high" as const,
        type: "security",
        implementationGuide: "1. Purchase SSL certificate from provider\n2. Install certificate on web server\n3. Update all internal links to HTTPS\n4. Set up 301 redirects from HTTP to HTTPS\n5. Update canonical URLs\n6. Submit HTTPS version to Google Search Console\n7. Update sitemaps and robots.txt",
        codeExample: `<!-- HTTPS redirect in .htaccess -->\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n\n<!-- Canonical URL -->\n<link rel="canonical" href="https://example.com/page">`,
        effortScore: 8,
        impactScore: 8,
        estimatedTime: "2-4 hours"
      });
    }

    // Check for mobile optimization
    if (audits['viewport'] && audits['viewport'].score < 1) {
      recommendations.push({
        title: "Add Viewport Meta Tag",
        description: "Viewport meta tag ensures your site displays correctly on mobile devices.",
        priority: "high" as const,
        type: "mobile",
        implementationGuide: "1. Add viewport meta tag to HTML head section\n2. Test responsive design on various devices\n3. Ensure touch targets are appropriately sized\n4. Verify text remains readable without zooming",
        codeExample: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
        effortScore: 1,
        impactScore: 7,
        estimatedTime: "2 minutes"
      });
    }

    // Check for crawlable links
    if (audits['crawlable-anchors'] && audits['crawlable-anchors'].score < 1) {
      recommendations.push({
        title: "Make Links Crawlable",
        description: "Ensure all navigation links are discoverable by search engines using proper HTML anchor tags.",
        priority: "medium" as const,
        type: "technical",
        implementationGuide: "1. Replace JavaScript-only navigation with HTML links\n2. Ensure href attributes contain valid URLs\n3. Avoid using onclick events for primary navigation\n4. Add proper anchor text that describes the destination\n5. Test with 'Disable JavaScript' to verify crawlability",
        codeExample: `<!-- Good: Crawlable link -->\n<a href="/about-us">About Us</a>\n\n<!-- Bad: Not crawlable -->\n<span onclick="navigateTo('/about-us')">About Us</span>\n\n<!-- Better: Progressive enhancement -->\n<a href="/about-us" onclick="navigateTo('/about-us'); return false;">About Us</a>`,
        effortScore: 4,
        impactScore: 6,
        estimatedTime: "1 hour"
      });
    }

    return recommendations;
  }
}

export const seoAnalyzer = new SEOAnalyzer();
