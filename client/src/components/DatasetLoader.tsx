// client/src/components/DatasetLoader.tsx — Simplified dataset loader
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDatabase } from "@/contexts/DatabaseContext";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
}

export default function DatasetLoader() {
  const { recordCount, patientCount, dataSource, loadSampleData, loadRecords, clearData, loading } = useDatabase();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSample = async () => {
    setError(null);
    try {
      await loadSampleData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      await loadRecords(rows, "csv");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJson = async () => {
    const text = prompt("Paste JSON array:");
    if (!text) return;
    setError(null);
    try {
      const rows = JSON.parse(text);
      await loadRecords(rows, "json");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    if (confirm("This will delete the local PGlite database and uploaded records from this browser. No server-side records exist to delete.")) {
      await clearData();
    }
  };

  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <span>Dataset</span>
        {recordCount > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground/60 normal-case tracking-normal">
            {recordCount} records / {patientCount} patients
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handleSample} disabled={loading} className="text-[11px]">
            Sample data
          </Button>
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading} className="text-[11px]">
            Upload CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={handleJson} disabled={loading} className="text-[11px]">
            Paste JSON
          </Button>
          {recordCount > 0 && (
            <Button size="sm" variant="ghost" onClick={handleClear} disabled={loading} className="text-[11px] text-muted-foreground">
              Clear
            </Button>
          )}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCsv} className="hidden" />
        </div>

        {dataSource && dataSource !== "none" && (
          <Badge variant="outline" className="text-[10px] font-normal border-border/40">
            {dataSource === "synthetic" ? "Synthetic sample" : dataSource === "csv" ? "Uploaded CSV, stored locally" : "Pasted JSON, stored locally"}
          </Badge>
        )}

        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}
