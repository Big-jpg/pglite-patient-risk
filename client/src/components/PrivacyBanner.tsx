// client/src/components/PrivacyBanner.tsx — Privacy boundary banner with improved language
import { Shield, Lock } from "lucide-react";

export default function PrivacyBanner() {
  return (
    <div className="border-b border-dashed border-[oklch(0.7_0.15_55/0.5)] bg-[oklch(0.7_0.15_55/0.04)]">
      <div className="container py-3 flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-[oklch(0.7_0.15_55)]" />
          <Lock className="w-3.5 h-3.5 text-[oklch(0.7_0.15_55)]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Client-side execution boundary &mdash; raw records do not cross this line.
          </p>
          <p className="text-xs text-muted-foreground">
            Browser-local boundary: patient-level data remains below this line. Open DevTools &rarr; Network tab to verify that no patient records are posted to backend endpoints. Only static application assets (HTML, JS, CSS, WASM) are fetched from the server.
          </p>
        </div>
      </div>
    </div>
  );
}
