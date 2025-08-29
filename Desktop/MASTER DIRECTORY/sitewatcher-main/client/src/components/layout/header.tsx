import { Menu, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "./profile-dropdown";

export function Header() {
  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="mobile-menu-button"
          >
            <Menu className="text-lg" />
          </Button>
          <h1 className="ml-2 md:ml-0 text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            data-testid="theme-toggle"
          >
            <Moon className="text-lg" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            data-testid="notifications-button"
          >
            <Bell className="text-lg" />
          </Button>
          
          <ProfileDropdown 
            userInitials="JD"
            userName="John Doe" 
            userEmail="john@sitewatcher.com"
          />
        </div>
      </div>
    </header>
  );
}
