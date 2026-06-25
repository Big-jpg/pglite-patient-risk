// client/src/lib/schema.ts — Data contract for patient observations
import { z } from "zod";

export const PatientObservationSchema = z.object({
  patient_id: z.string().min(1),
  age_years: z.coerce.number().int().min(0).max(120),
  sex: z.enum(["female", "male", "other", "unknown"]),
  postcode_region: z.string().min(1),
  observation_date: z.string().min(1),
  systolic_bp: z.coerce.number().nullable().optional().default(null),
  diastolic_bp: z.coerce.number().nullable().optional().default(null),
  heart_rate: z.coerce.number().nullable().optional().default(null),
  hba1c: z.coerce.number().nullable().optional().default(null),
  ldl_cholesterol: z.coerce.number().nullable().optional().default(null),
  smoker: z.preprocess(
    (v) => {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "boolean") return v;
      if (typeof v === "string") {
        const lower = v.toLowerCase();
        if (lower === "true" || lower === "1" || lower === "yes") return true;
        if (lower === "false" || lower === "0" || lower === "no") return false;
      }
      return null;
    },
    z.boolean().nullable()
  ),
  diagnosis_code: z.string().nullable().optional().default(null),
  medication_count: z.coerce.number().int().nullable().optional().default(null),
});

export type PatientObservation = z.infer<typeof PatientObservationSchema>;

export interface ValidationResult {
  valid: PatientObservation[];
  rejected: { row: number; errors: string[] }[];
}

export function validateRecords(raw: unknown[]): ValidationResult {
  const valid: PatientObservation[] = [];
  const rejected: { row: number; errors: string[] }[] = [];

  raw.forEach((record, idx) => {
    const result = PatientObservationSchema.safeParse(record);
    if (result.success) {
      valid.push(result.data);
    } else {
      rejected.push({
        row: idx + 1,
        errors: result.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`
        ),
      });
    }
  });

  return { valid, rejected };
}
