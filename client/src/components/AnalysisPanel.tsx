// client/src/components/AnalysisPanel.tsx — Simplified analysis panel
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/contexts/DatabaseContext";
import { getRiskBandDistribution, getMissingnessSummary, runPredefinedQuery } from "@/lib/database";

interface AnalysisData {
  riskDist: Record<string, number>;
  missingness: Record<string, number>;
}

export default function AnalysisPanel() {
  const { recordCount } = useDatabase();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (recordCount === 0) return;
    setLoading(true);
    try {
      const [riskDist, missingness] = await Promise.all([
        getRiskBandDistribution(),
        getMissingnessSummary(),
      ]);
      setData({ riskDist, missingness });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recordCount > 0 && !data) runAnalysis();
  }, [recordCount]);

  if (recordCount === 0) {
    return (
      <div className="instrument-panel">
        <div className="panel-header"><span>Analysis</span></div>
        <p className="text-sm text-muted-foreground/60">Load data to view analysis.</p>
      </div>
    );
  }

  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <span>Analysis</span>
        <Button size="sm" variant="ghost" onClick={runAnalysis} disabled={loading} className="ml-auto text-xs h-6 px-3">
          Refresh
        </Button>
      </div>

      {data && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Risk Distribution</p>
            <div className="space-y-1.5">
              {Object.entries(data.riskDist).map(([band, count]) => (
                <div key={band} className="flex justify-between text-sm">
                  <span className="text-foreground/70">{band}</span>
                  <span className="text-foreground/90">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Missingness</p>
            <div className="space-y-1.5">
              {Object.entries(data.missingness).map(([field, pct]) => (
                <div key={field} className="flex justify-between text-sm">
                  <span className="text-foreground/70">{field}</span>
                  <span className="text-foreground/90">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
