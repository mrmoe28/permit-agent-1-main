import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {(title || description) && (
                <div className="mb-6">
                  {title && (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}