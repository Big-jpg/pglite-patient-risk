// client/src/lib/synthetic-data.ts — Generates ~200 synthetic patient observations
import type { PatientObservation } from "./schema";

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe<T>(value: T, probability = 0.85): T | null {
  return Math.random() < probability ? value : null;
}

const POSTCODES = ["2000", "2010", "2020", "2030", "2040", "2050", "2060", "2100", "2200", "2300", "3000", "3100", "3200", "4000", "4100", "5000", "6000"];
const SEXES: ("female" | "male" | "other" | "unknown")[] = ["female", "male", "other", "unknown"];
const SEX_WEIGHTS = [0.48, 0.48, 0.02, 0.02];
const DIAGNOSIS_CODES = ["E11.9", "I10", "E78.5", "I25.1", "J44.1", "E11.65", "I48.0", "N18.3", null];

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function generateDate(): string {
  const start = new Date(2023, 0, 1);
  const end = new Date(2024, 11, 31);
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
}

function generatePatientId(index: number): string {
  return `PAT-${String(index).padStart(5, "0")}`;
}

export function generateSyntheticData(count = 200): PatientObservation[] {
  const records: PatientObservation[] = [];
  // ~60 distinct patients with multiple observations
  const patientCount = Math.min(60, Math.floor(count * 0.3));

  for (let i = 0; i < count; i++) {
    const patientIndex = i < patientCount ? i : randInt(0, patientCount - 1);
    const age = randInt(25, 95);
    const sex = weightedPick(SEXES, SEX_WEIGHTS);
    const isSmoker = Math.random() < 0.22;

    // Generate correlated vitals
    let systolic = maybe(randInt(100, 200), 0.9);
    let diastolic = systolic ? maybe(Math.round(systolic * rand(0.55, 0.7)), 0.9) : maybe(randInt(60, 130), 0.9);

    // Higher BP for older patients
    if (age > 65 && systolic && Math.random() < 0.4) {
      systolic = randInt(140, 195);
      diastolic = Math.round(systolic * rand(0.55, 0.65));
    }

    const heartRate = maybe(randInt(55, 110), 0.88);
    let hba1c = maybe(parseFloat(rand(4.5, 8.5).toFixed(1)), 0.75);
    let ldl = maybe(parseFloat(rand(1.5, 6.0).toFixed(1)), 0.7);

    // Correlate metabolic markers with age
    if (age > 55 && Math.random() < 0.35) {
      hba1c = parseFloat(rand(6.5, 9.0).toFixed(1));
    }
    if (isSmoker && Math.random() < 0.4) {
      ldl = parseFloat(rand(4.0, 6.5).toFixed(1));
    }

    records.push({
      patient_id: generatePatientId(patientIndex),
      age_years: age,
      sex,
      postcode_region: pick(POSTCODES),
      observation_date: generateDate(),
      systolic_bp: systolic,
      diastolic_bp: diastolic,
      heart_rate: heartRate,
      hba1c: hba1c,
      ldl_cholesterol: ldl,
      smoker: maybe(isSmoker, 0.85),
      diagnosis_code: pick(DIAGNOSIS_CODES),
      medication_count: maybe(randInt(0, 8), 0.8),
    });
  }

  return records;
}
