import { Link, useLocation } from "wouter";
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Key, 
  History, 
  Settings,
  Gauge,
  FileText,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "Add Site", href: "/add-site", icon: Plus },
  { name: "Sites", href: "/sites", icon: Globe },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Keywords", href: "/keywords", icon: Key },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Search className="text-white text-sm" size={16} />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              SEO Watcher
            </span>
          </div>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href} asChild>
                  <a
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon
                      className={cn(
                        "mr-3 text-sm",
                        isActive
                          ? "text-primary"
                          : "text-gray-400 group-hover:text-gray-500"
                      )}
                      size={16}
                    />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
