// client/src/components/SqlConsole.tsx — Local SQL console (simplified)
import { useState } from "react";
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
        <span>SQL Console</span>
        {execTime !== null && (
          <span className="ml-auto text-xs text-muted-foreground/60 normal-case tracking-normal">
            {execTime}ms
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <select
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {QUERY_OPTIONS.map((q) => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={executing || recordCount === 0}
            className="text-sm px-4 py-2"
          >
            Run
          </Button>
        </div>

        <pre className="bg-secondary/50 rounded p-4 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
          {PREDEFINED_QUERIES[selectedQuery]}
        </pre>

        {result && result.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full data-readout">
              <thead>
                <tr className="border-b border-border/40">
                  {result.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-0">
                    {result.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-sm text-foreground/80">
                        {String(row[col] ?? "\u2014")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No results.</p>
        )}

        {recordCount === 0 && (
          <p className="text-sm text-muted-foreground/60">Load data to run queries.</p>
        )}
      </div>
    </div>
  );
}
