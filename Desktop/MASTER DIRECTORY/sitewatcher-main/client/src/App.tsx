import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { setupGlobalErrorHandlers } from "@/lib/error-handling";
import { PageLoader } from "@/components/ui/loading";
import { Suspense, useEffect } from "react";

// Lazy load pages for better performance
import { lazy } from "react";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const AddSite = lazy(() => import("@/pages/add-site"));
const Sites = lazy(() => import("@/pages/sites"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Keywords = lazy(() => import("@/pages/keywords"));
const Notes = lazy(() => import("@/pages/notes"));
const History = lazy(() => import("@/pages/history"));
const Settings = lazy(() => import("@/pages/settings"));
const Debug = lazy(() => import("@/pages/debug"));
const Profile = lazy(() => import("@/pages/profile"));
const Billing = lazy(() => import("@/pages/billing"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Privacy = lazy(() => import("@/pages/privacy"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/add-site" component={AddSite} />
        <Route path="/sites" component={Sites} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/keywords" component={Keywords} />
        <Route path="/notes" component={Notes} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route path="/debug" component={Debug} />
        <Route path="/profile" component={Profile} />
        <Route path="/billing" component={Billing} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Update document title based on current route
    const updateTitle = () => {
      const path = window.location.pathname;
      const titles: Record<string, string> = {
        "/": "Dashboard - Site Watcher",
        "/add-site": "Add Site - Site Watcher",
        "/sites": "Sites - Site Watcher",
        "/analytics": "Analytics - Site Watcher",
        "/keywords": "Keywords - Site Watcher",
        "/notes": "Notes - Site Watcher",
        "/history": "History - Site Watcher",
        "/settings": "Settings - Site Watcher",
        "/profile": "Profile - Site Watcher",
        "/billing": "Billing - Site Watcher",
        "/notifications": "Notifications - Site Watcher",
        "/privacy": "Privacy - Site Watcher",
      };
      
      document.title = titles[path] || "Site Watcher - SEO Analysis Tool";
    };

    updateTitle();
    
    // Listen for route changes
    window.addEventListener("popstate", updateTitle);
    
    return () => {
      window.removeEventListener("popstate", updateTitle);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
