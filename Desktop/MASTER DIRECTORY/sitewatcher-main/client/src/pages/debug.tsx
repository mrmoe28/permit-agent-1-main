import { PageLayout } from "@/components/layout/page-layout";
import { ApiDebugPanel } from "@/components/debug/api-debug";

export default function Debug() {
  return (
    <PageLayout 
      title="API Debug Panel" 
      description="Debug API configuration and test endpoint connectivity"
    >
      <ApiDebugPanel />
    </PageLayout>
  );
}