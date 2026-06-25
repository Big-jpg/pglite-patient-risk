// client/src/components/DatasetLoader.tsx — Dataset loading panel with clear confirmation
import { useState, useRef } from "react";
import { Upload, FileJson, Database, Trash2, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDatabase } from "@/contexts/DatabaseContext";
import Papa from "papaparse";
import { toast } from "sonner";

const SOURCE_LABELS: Record<string, string> = {
  none: "No data loaded",
  synthetic: "Synthetic sample data",
  csv: "User-uploaded CSV, stored locally",
  json: "Pasted JSON, stored locally",
};

export default function DatasetLoader() {
  const { loading, recordCount, patientCount, lastValidation, dataSource, loadSampleData, loadRecords, clearData } = useDatabase();
  const [jsonInput, setJsonInput] = useState("");
  const [showJson, setShowJson] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const result = await loadRecords(results.data, "csv");
        toast.success(`Loaded ${result.valid.length} records. ${result.rejected.length} rejected.`);
      },
      error: (err) => {
        toast.error(`CSV parse error: ${err.message}`);
      },
    });

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleJsonPaste = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const result = await loadRecords(arr, "json");
      toast.success(`Loaded ${result.valid.length} records. ${result.rejected.length} rejected.`);
      setJsonInput("");
      setShowJson(false);
    } catch {
      toast.error("Invalid JSON format");
    }
  };

  const handleSample = async () => {
    await loadSampleData();
    toast.success("Loaded 200 synthetic patient observations");
  };

  const handleClear = async () => {
    await clearData();
    toast.success("All local data cleared");
  };

  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <CircleDot className={`w-2.5 h-2.5 ${recordCount > 0 ? "text-chart-1 led-pulse" : "text-muted-foreground"}`} />
        <span>Dataset Loader</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground normal-case tracking-normal">
          {recordCount} records / {patientCount} patients
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Dataset source badge — requirement #6 */}
        {dataSource !== "none" && (
          <Badge variant={dataSource === "synthetic" ? "secondary" : "outline"} className="text-[10px] font-mono">
            {SOURCE_LABELS[dataSource]}
          </Badge>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSample}
            disabled={loading}
            className="gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            Load sample data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJson(!showJson)}
            disabled={loading}
            className="gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            Paste JSON
          </Button>

          {/* Clear All with confirmation dialog — requirement #7 */}
          {recordCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear local data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the local PGlite database and uploaded records from this browser. No server-side records exist to delete. The IndexedDB store at <code className="text-xs font-mono">idb://patient-demo</code> will be emptied.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>
                    Delete local data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* JSON input area */}
        {showJson && (
          <div className="space-y-2">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"patient_id":"PAT-00001","age_years":45,"sex":"female",...}]'
              className="w-full h-32 bg-background border border-border rounded-sm p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" onClick={handleJsonPaste} disabled={!jsonInput.trim() || loading}>
              Validate & Insert
            </Button>
          </div>
        )}

        {/* Validation results */}
        {lastValidation && lastValidation.rejected.length > 0 && (
          <div className="border border-destructive/30 rounded-sm p-3 space-y-1">
            <p className="text-xs font-medium text-destructive">
              {lastValidation.rejected.length} rows rejected
            </p>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {lastValidation.rejected.slice(0, 10).map((r) => (
                <p key={r.row} className="text-[11px] font-mono text-muted-foreground">
                  Row {r.row}: {r.errors.join("; ")}
                </p>
              ))}
              {lastValidation.rejected.length > 10 && (
                <p className="text-[11px] text-muted-foreground">
                  ...and {lastValidation.rejected.length - 10} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
