// client/src/pages/Home.tsx — Private Compute main page
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import PrivacyBanner from "@/components/PrivacyBanner";
import ArchitecturePanel from "@/components/ArchitecturePanel";
import PrivacyStatusWidget from "@/components/PrivacyStatusWidget";
import DatasetLoader from "@/components/DatasetLoader";
import SqlConsole from "@/components/SqlConsole";
import AnalysisPanel from "@/components/AnalysisPanel";
import ReasoningAgent from "@/components/ReasoningAgent";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <DatabaseProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container py-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Private Compute</h1>
              <p className="text-[11px] text-muted-foreground font-mono">Privacy by architecture, not policy.</p>
            </div>
          </div>
        </header>

        {/* Privacy boundary — requirement #3 */}
        <PrivacyBanner />

        {/* Intro description — requirement #9 */}
        <div className="container py-6">
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Private Compute demonstrates client-side analytics over sensitive datasets. Files are loaded into a browser-local PGlite database, persisted in IndexedDB, queried using PostgreSQL syntax, and summarized through aggregate-only reasoning tools. The server only delivers static application assets.
          </p>
        </div>

        {/* Main content */}
        <main className="container pb-12 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left column — Architecture + Privacy Status */}
            <div className="space-y-4">
              <ArchitecturePanel />
              <PrivacyStatusWidget />
            </div>

            {/* Center column — Dataset + SQL */}
            <div className="space-y-4">
              <DatasetLoader />
              <SqlConsole />
            </div>

            {/* Right column — Analysis + Reasoning */}
            <div className="space-y-4">
              <AnalysisPanel />
              <ReasoningAgent />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4">
          <div className="container">
            <p className="text-[10px] text-muted-foreground font-mono text-center">
              Private Compute &mdash; PGlite WASM proof of concept. No backend database. No API routes. No telemetry containing uploaded data.
            </p>
          </div>
        </footer>
      </div>
    </DatabaseProvider>
  );
}
