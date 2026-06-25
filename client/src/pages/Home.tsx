import { DatabaseProvider } from "@/contexts/DatabaseContext";
import PrivacyBanner from "@/components/PrivacyBanner";
import DatasetLoader from "@/components/DatasetLoader";
import SqlConsole from "@/components/SqlConsole";
import AnalysisPanel from "@/components/AnalysisPanel";
import ReasoningAgent from "@/components/ReasoningAgent";

export default function Home() {
  return (
    <DatabaseProvider>
      <div className="min-h-screen flex flex-col">
        <header className="container pt-16 pb-4">
          <h1 className="text-4xl tracking-tight">Private Compute</h1>
          <p className="text-muted-foreground mt-2">
            Privacy by architecture, not policy.
          </p>
        </header>

        <PrivacyBanner />

        <main className="container py-12 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-12">
              <DatasetLoader />
              <SqlConsole />
              <AnalysisPanel />
            </div>
            <div>
              <ReasoningAgent />
            </div>
          </div>
        </main>

        <footer className="container pb-12">
          <p className="text-sm text-muted-foreground">
            No backend database. No API routes. No telemetry.
          </p>
        </footer>
      </div>
    </DatabaseProvider>
  );
}
