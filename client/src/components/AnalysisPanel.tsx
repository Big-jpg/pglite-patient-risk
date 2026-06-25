// client/src/components/AnalysisPanel.tsx — Local analysis with derived metrics
import { useState, useEffect } from "react";
import { CircleDot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/contexts/DatabaseContext";
import { getRiskBandDistribution, getMissingnessSummary, runPredefinedQuery } from "@/lib/database";

interface AnalysisData {
  riskDist: Record<string, number>;
  missingness: Record<string, number>;
  highRiskByRegion: { postcode_region: string; high_risk_count: number }[];
}

const RISK_COLORS: Record<string, string> = {
  critical: "text-[oklch(0.65_0.2_25)]",
  high: "text-[oklch(0.7_0.15_55)]",
  metabolic: "text-[oklch(0.7_0.12_290)]",
  lipid: "text-[oklch(0.7_0.1_200)]",
  normal: "text-[oklch(0.7_0.1_145)]",
};

const RISK_BG: Record<string, string> = {
  critical: "bg-[oklch(0.65_0.2_25/0.15)]",
  high: "bg-[oklch(0.7_0.15_55/0.15)]",
  metabolic: "bg-[oklch(0.7_0.12_290/0.15)]",
  lipid: "bg-[oklch(0.7_0.1_200/0.15)]",
  normal: "bg-[oklch(0.7_0.1_145/0.15)]",
};

export default function AnalysisPanel() {
  const { recordCount, patientCount } = useDatabase();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (recordCount === 0) return;
    setLoading(true);
    try {
      const [riskDist, missingness, highRiskResult] = await Promise.all([
        getRiskBandDistribution(),
        getMissingnessSummary(),
        runPredefinedQuery("high_risk_by_region"),
      ]);
      setData({
        riskDist,
        missingness,
        highRiskByRegion: highRiskResult.rows as { postcode_region: string; high_risk_count: number }[],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recordCount > 0) runAnalysis();
  }, [recordCount]);

  const totalRisk = data ? Object.values(data.riskDist).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <CircleDot className={`w-2.5 h-2.5 ${data ? "text-chart-1 led-pulse" : "text-muted-foreground"}`} />
        <span>Local Analysis</span>
        {recordCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={runAnalysis}
            disabled={loading}
            className="ml-auto h-5 w-5 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {recordCount === 0 ? (
          <p className="text-xs text-muted-foreground">Load data to view analysis.</p>
        ) : (
          <>
            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background border border-border rounded-sm p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Records</p>
                <p className="font-mono text-lg text-foreground">{recordCount}</p>
              </div>
              <div className="bg-background border border-border rounded-sm p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Distinct Patients</p>
                <p className="font-mono text-lg text-foreground">{patientCount}</p>
              </div>
            </div>

            {/* Risk band distribution */}
            {data && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Band Distribution</p>
                <div className="space-y-1.5">
                  {Object.entries(data.riskDist).map(([band, count]) => {
                    const pct = totalRisk > 0 ? (count / totalRisk) * 100 : 0;
                    return (
                      <div key={band} className="flex items-center gap-2">
                        <span className={`text-xs font-mono w-20 ${RISK_COLORS[band] || "text-foreground"}`}>
                          {band}
                        </span>
                        <div className="flex-1 h-4 bg-background rounded-sm overflow-hidden border border-border">
                          <div
                            className={`h-full transition-all duration-300 ${RISK_BG[band] || "bg-primary/20"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Missingness */}
            {data && Object.keys(data.missingness).length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing Value Rate</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(data.missingness).map(([field, pct]) => (
                    <div key={field} className="flex items-center justify-between px-2 py-1 bg-background rounded-sm border border-border">
                      <span className="text-[11px] font-mono text-muted-foreground">{field}</span>
                      <span className={`text-[11px] font-mono ${pct > 20 ? "text-destructive" : "text-foreground"}`}>
                        {pct}%
                      </span>
                    </div>
                  ))}
                </div>
                {Object.values(data.missingness).some((v) => v > 20) && (
                  <p className="text-[10px] text-destructive">Data quality warning: some fields exceed 20% missing rate.</p>
                )}
              </div>
            )}

            {/* High risk by region */}
            {data && data.highRiskByRegion.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">High-Risk Count by Region</p>
                <div className="grid grid-cols-3 gap-1">
                  {data.highRiskByRegion.slice(0, 9).map((r) => (
                    <div key={r.postcode_region} className="flex items-center justify-between px-2 py-1 bg-background rounded-sm border border-border">
                      <span className="text-[11px] font-mono text-muted-foreground">{r.postcode_region}</span>
                      <span className="text-[11px] font-mono text-[oklch(0.7_0.15_55)]">{r.high_risk_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
