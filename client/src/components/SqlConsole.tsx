// client/src/components/SqlConsole.tsx — Local SQL console with predefined queries
import { useState } from "react";
import { Play, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runPredefinedQuery, PREDEFINED_QUERIES, type QueryResult } from "@/lib/database";
import { useDatabase } from "@/contexts/DatabaseContext";

const QUERY_OPTIONS = [
  { id: "risk_distribution", label: "Risk band distribution" },
  { id: "regional_risk", label: "Regional risk breakdown" },
  { id: "age_band_risk", label: "Age decade risk analysis" },
  { id: "missingness", label: "Missing value summary" },
  { id: "high_risk_by_region", label: "High-risk count by region" },
];

export default function SqlConsole() {
  const { recordCount } = useDatabase();
  const [selectedQuery, setSelectedQuery] = useState("risk_distribution");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);

  const handleRun = async () => {
    if (recordCount === 0) return;
    setExecuting(true);
    const start = performance.now();
    try {
      const res = await runPredefinedQuery(selectedQuery);
      setExecTime(Math.round(performance.now() - start));
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <CircleDot className={`w-2.5 h-2.5 ${executing ? "text-primary led-pulse" : "text-muted-foreground"}`} />
        <span>Local SQL Console</span>
        {execTime !== null && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground normal-case tracking-normal">
            {execTime}ms local
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Query selector */}
        <div className="flex gap-2 items-center">
          <select
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
            className="flex-1 bg-background border border-border rounded-sm px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {QUERY_OPTIONS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={executing || recordCount === 0}
            className="gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            Run
          </Button>
        </div>

        {/* SQL preview */}
        <pre className="bg-background border border-border rounded-sm p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
          {PREDEFINED_QUERIES[selectedQuery]}
        </pre>

        {/* Results table */}
        {result && result.rows.length > 0 && (
          <div className="overflow-x-auto border border-border rounded-sm">
            <table className="w-full data-readout">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {result.columns.map((col) => (
                    <th key={col} className="px-3 py-1.5 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {result.columns.map((col) => (
                      <td key={col} className="px-3 py-1.5 text-xs">
                        {String(row[col] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.rows.length === 0 && (
          <p className="text-xs text-muted-foreground">No results returned.</p>
        )}

        {recordCount === 0 && (
          <p className="text-xs text-muted-foreground">Load data to run queries.</p>
        )}
      </div>
    </div>
  );
}
