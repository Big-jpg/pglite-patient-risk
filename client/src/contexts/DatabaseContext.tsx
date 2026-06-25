// client/src/contexts/DatabaseContext.tsx — Shared PGlite state
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getDb, insertRecords, clearAllData, getRecordCount, getDistinctPatientCount } from "@/lib/database";
import { validateRecords, type PatientObservation, type ValidationResult } from "@/lib/schema";
import { generateSyntheticData } from "@/lib/synthetic-data";

export type DataSource = "none" | "synthetic" | "csv" | "json";

interface DatabaseState {
  ready: boolean;
  loading: boolean;
  recordCount: number;
  patientCount: number;
  lastValidation: ValidationResult | null;
  dataSource: DataSource;
}

interface DatabaseContextValue extends DatabaseState {
  loadSampleData: () => Promise<void>;
  loadRecords: (raw: unknown[], source: DataSource) => Promise<ValidationResult>;
  clearData: () => Promise<void>;
  refreshCounts: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DatabaseState>({
    ready: false,
    loading: false,
    recordCount: 0,
    patientCount: 0,
    lastValidation: null,
    dataSource: "none",
  });

  // Initialize DB on mount
  useEffect(() => {
    getDb().then(async () => {
      const count = await getRecordCount();
      const patients = await getDistinctPatientCount();
      setState((s) => ({
        ...s,
        ready: true,
        recordCount: count,
        patientCount: patients,
        dataSource: count > 0 ? "synthetic" : "none",
      }));
    });
  }, []);

  const refreshCounts = useCallback(async () => {
    const count = await getRecordCount();
    const patients = await getDistinctPatientCount();
    setState((s) => ({ ...s, recordCount: count, patientCount: patients }));
  }, []);

  const loadSampleData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const data = generateSyntheticData(200);
    await insertRecords(data);
    await refreshCounts();
    setState((s) => ({
      ...s,
      loading: false,
      lastValidation: { valid: data, rejected: [] },
      dataSource: "synthetic",
    }));
  }, [refreshCounts]);

  const loadRecords = useCallback(
    async (raw: unknown[], source: DataSource): Promise<ValidationResult> => {
      setState((s) => ({ ...s, loading: true }));
      const result = validateRecords(raw);
      if (result.valid.length > 0) {
        await insertRecords(result.valid);
      }
      await refreshCounts();
      setState((s) => ({ ...s, loading: false, lastValidation: result, dataSource: source }));
      return result;
    },
    [refreshCounts]
  );

  const clearData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    await clearAllData();
    await refreshCounts();
    setState((s) => ({ ...s, loading: false, lastValidation: null, dataSource: "none" }));
  }, [refreshCounts]);

  return (
    <DatabaseContext.Provider
      value={{ ...state, loadSampleData, loadRecords, clearData, refreshCounts }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDatabase must be used within DatabaseProvider");
  return ctx;
}
