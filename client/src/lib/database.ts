// client/src/lib/database.ts — PGlite WASM database layer (runs entirely in browser)
import { PGlite } from "@electric-sql/pglite";
import type { PatientObservation } from "./schema";

let db: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

export async function getDb(): Promise<PGlite> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const instance = new PGlite("idb://patient-demo");

    // Create table
    await instance.exec(`
      CREATE TABLE IF NOT EXISTS patient_observations (
        patient_id text NOT NULL,
        age_years int NOT NULL,
        sex text NOT NULL,
        postcode_region text NOT NULL,
        observation_date date NOT NULL,
        systolic_bp numeric,
        diastolic_bp numeric,
        heart_rate numeric,
        hba1c numeric,
        ldl_cholesterol numeric,
        smoker boolean,
        diagnosis_code text,
        medication_count int
      );
    `);

    // Create derived view
    await instance.exec(`
      CREATE OR REPLACE VIEW patient_risk_summary AS
      SELECT
        patient_id, age_years, sex, postcode_region, observation_date,
        CASE
          WHEN systolic_bp >= 180 OR diastolic_bp >= 120 THEN 'critical'
          WHEN systolic_bp >= 140 OR diastolic_bp >= 90 THEN 'high'
          WHEN hba1c >= 6.5 THEN 'metabolic'
          WHEN ldl_cholesterol >= 4.0 THEN 'lipid'
          ELSE 'normal'
        END AS risk_band
      FROM patient_observations;
    `);

    db = instance;
    return instance;
  })();

  return initPromise;
}

export async function insertRecords(records: PatientObservation[]): Promise<number> {
  const instance = await getDb();
  let inserted = 0;

  for (const r of records) {
    await instance.query(
      `INSERT INTO patient_observations (
        patient_id, age_years, sex, postcode_region, observation_date,
        systolic_bp, diastolic_bp, heart_rate, hba1c, ldl_cholesterol,
        smoker, diagnosis_code, medication_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        r.patient_id,
        r.age_years,
        r.sex,
        r.postcode_region,
        r.observation_date,
        r.systolic_bp,
        r.diastolic_bp,
        r.heart_rate,
        r.hba1c,
        r.ldl_cholesterol,
        r.smoker,
        r.diagnosis_code,
        r.medication_count,
      ]
    );
    inserted++;
  }

  return inserted;
}

export async function clearAllData(): Promise<void> {
  const instance = await getDb();
  await instance.exec("DELETE FROM patient_observations");
}

export async function getRecordCount(): Promise<number> {
  const instance = await getDb();
  const result = await instance.exec("SELECT COUNT(*)::int as count FROM patient_observations");
  return result[0]?.rows?.[0]?.count ?? 0;
}

export async function getDistinctPatientCount(): Promise<number> {
  const instance = await getDb();
  const result = await instance.exec("SELECT COUNT(DISTINCT patient_id)::int as count FROM patient_observations");
  return result[0]?.rows?.[0]?.count ?? 0;
}

// Predefined queries
export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export async function runPredefinedQuery(queryId: string): Promise<QueryResult> {
  const instance = await getDb();
  const sql = PREDEFINED_QUERIES[queryId];
  if (!sql) throw new Error(`Unknown query: ${queryId}`);

  const result = await instance.exec(sql);
  const fields = result[0]?.fields ?? [];
  const rows = (result[0]?.rows ?? []) as Record<string, unknown>[];
  return {
    columns: fields.map((f: { name: string }) => f.name),
    rows,
  };
}

export const PREDEFINED_QUERIES: Record<string, string> = {
  risk_distribution: `SELECT risk_band, COUNT(*)::int as count FROM patient_risk_summary GROUP BY risk_band ORDER BY count DESC;`,
  regional_risk: `SELECT postcode_region, risk_band, COUNT(*)::int as count FROM patient_risk_summary GROUP BY postcode_region, risk_band ORDER BY postcode_region, risk_band;`,
  age_band_risk: `SELECT (age_years / 10 * 10)::int AS age_decade, risk_band, COUNT(*)::int as count FROM patient_risk_summary GROUP BY age_decade, risk_band ORDER BY age_decade;`,
  missingness: `SELECT
    COUNT(*)::int as total,
    COUNT(*) FILTER (WHERE systolic_bp IS NULL)::int as missing_systolic,
    COUNT(*) FILTER (WHERE diastolic_bp IS NULL)::int as missing_diastolic,
    COUNT(*) FILTER (WHERE heart_rate IS NULL)::int as missing_heart_rate,
    COUNT(*) FILTER (WHERE hba1c IS NULL)::int as missing_hba1c,
    COUNT(*) FILTER (WHERE ldl_cholesterol IS NULL)::int as missing_ldl,
    COUNT(*) FILTER (WHERE smoker IS NULL)::int as missing_smoker,
    COUNT(*) FILTER (WHERE diagnosis_code IS NULL)::int as missing_diagnosis,
    COUNT(*) FILTER (WHERE medication_count IS NULL)::int as missing_medication
  FROM patient_observations;`,
  high_risk_by_region: `SELECT postcode_region, COUNT(*)::int as high_risk_count FROM patient_risk_summary WHERE risk_band IN ('critical', 'high') GROUP BY postcode_region ORDER BY high_risk_count DESC;`,
};

// Aggregate tool functions for the bounded reasoning agent
export async function getRiskBandDistribution(): Promise<Record<string, number>> {
  const result = await runPredefinedQuery("risk_distribution");
  const dist: Record<string, number> = {};
  for (const row of result.rows) {
    dist[row.risk_band as string] = row.count as number;
  }
  return dist;
}

export async function getMissingnessSummary(): Promise<Record<string, number>> {
  const result = await runPredefinedQuery("missingness");
  if (result.rows.length === 0) return {};
  const row = result.rows[0];
  const total = row.total as number;
  if (total === 0) return {};
  const summary: Record<string, number> = {};
  for (const [key, val] of Object.entries(row)) {
    if (key === "total") continue;
    summary[key.replace("missing_", "")] = Math.round(((val as number) / total) * 100);
  }
  return summary;
}

export async function getRegionalRiskSummary(): Promise<QueryResult> {
  return runPredefinedQuery("regional_risk");
}

export async function getAgeBandRiskSummary(): Promise<QueryResult> {
  return runPredefinedQuery("age_band_risk");
}
