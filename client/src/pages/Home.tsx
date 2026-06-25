// client/src/pages/Home.tsx — Private Compute main page (decluttered)
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import PrivacyBanner from "@/components/PrivacyBanner";
import ArchitecturePanel from "@/components/ArchitecturePanel";
import PrivacyStatusWidget from "@/components/PrivacyStatusWidget";
import DatasetLoader from "@/components/DatasetLoader";
import SqlConsole from "@/components/SqlConsole";
import AnalysisPanel from "@/components/AnalysisPanel";
import ReasoningAgent from "@/components/ReasoningAgent";

export default function Home() {
  return (
    <DatabaseProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Header — minimal */}
        <header className="container pt-10 pb-6">
          <h1 className="text-3xl tracking-tight text-foreground">Private Compute</h1>
          <p className="text-muted-foreground mt-1 text-[12px]">
            Privacy by architecture, not policy.
          </p>
        </header>

        {/* Privacy boundary */}
        <PrivacyBanner />

        {/* Intro */}
        <div className="container py-8">
          <p className="text-muted-foreground max-w-2xl text-[13px] leading-[1.7]">
            Client-side analytics over sensitive datasets. Files load into a browser-local
            PGlite database, persist in IndexedDB, and are queried using PostgreSQL syntax.
            The server delivers only static assets.
          </p>
        </div>

        {/* Main content — two-column on large screens */}
        <main className="container pb-16 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left column */}
            <div className="space-y-10">
              <DatasetLoader />
              <SqlConsole />
              <AnalysisPanel />
            </div>

            {/* Right column */}
            <div className="space-y-10">
              <ReasoningAgent />
              <ArchitecturePanel />
              <PrivacyStatusWidget />
            </div>
          </div>
        </main>

        {/* Footer — single line */}
        <footer className="container pb-8">
          <p className="text-[11px] text-muted-foreground/60">
            No backend database. No API routes. No telemetry.
          </p>
        </footer>
      </div>
    </DatabaseProvider>
  );
}
