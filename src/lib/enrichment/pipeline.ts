import { requestGeminiExtraction, readInteractionText, type GeminiTransport } from "./gemini";
import { validateCandidate, type AcceptedClaim, type RejectedClaim } from "./validate";

export interface EnrichmentRun {
  status:
    | "evidence-checked"
    | "rejected"
    | "malformed"
    | "blocked-no-key"
    | "unsupported-model"
    | "missing-source"
    | "chunk-exceeds-bound"
    | "rejected-student-data"
    | "transport-error";
  liveCall: boolean;
  model: string | null;
  programId: string;
  sourceId: string;
  editionLabel: string;
  editionFlagPreserved: boolean;
  promotedToVerified: false;
  coverageUnchanged: true;
  accepted: AcceptedClaim[];
  rejected: RejectedClaim[];
  note: string;
}

const STUDENT_KEYS = ["student", "constraints", "completedCourseIds", "email", "studentId"];

export function hasStudentPayload(value: object): boolean {
  return STUDENT_KEYS.some((key) => key in value && (value as Record<string, unknown>)[key] != null);
}

export async function runEnrichment(
  input: {
    programId: string;
    sourceId: string;
    sourceText: string;
    editionLabel: string;
    page?: string | null;
    student?: unknown;
    constraints?: unknown;
    completedCourseIds?: unknown;
    email?: unknown;
    studentId?: unknown;
  },
  options: {
    env?: Record<string, string | undefined>;
    transport?: GeminiTransport;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<EnrichmentRun> {
  const base = {
    liveCall: false,
    model: null,
    programId: input.programId,
    sourceId: input.sourceId,
    editionLabel: input.editionLabel,
    editionFlagPreserved: /previous edition|2024-2026/i.test(input.editionLabel),
    promotedToVerified: false as const,
    coverageUnchanged: true as const,
    accepted: [],
    rejected: [],
  };
  if (hasStudentPayload(input)) {
    return { ...base, status: "rejected-student-data", note: "Student fields are not sent to Gemini." };
  }
  if (!input.sourceText?.trim() || !input.sourceId?.trim()) {
    return { ...base, status: "missing-source", note: "No source text or source id was supplied." };
  }
  const env = options.env ?? process.env;
  const response = await requestGeminiExtraction({
    programId: input.programId,
    sourceId: input.sourceId,
    sourceText: input.sourceText,
    editionLabel: input.editionLabel,
    page: input.page ?? null,
    env,
    transport: options.transport,
    fetchImpl: options.fetchImpl,
  });
  if (response.blocked) {
    return { ...base, status: response.blocked, liveCall: response.liveCall, model: response.model, note: response.note ?? response.blocked };
  }
  const text = readInteractionText(response.raw);
  let parsed: unknown = response.raw;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ...base,
        status: "malformed",
        liveCall: response.liveCall,
        model: response.model,
        rejected: [{ reason: "malformed-json", quotation: null, courseId: null }],
        note: "Model text was not JSON. Nothing was promoted.",
      };
    }
  }
  const validated = validateCandidate({
    raw: parsed,
    sourceText: input.sourceText,
    sourceId: input.sourceId,
    programId: input.programId,
    editionLabel: input.editionLabel,
  });
  return {
    ...base,
    status: validated.status,
    liveCall: response.liveCall,
    model: response.model,
    editionFlagPreserved: validated.editionFlagPreserved,
    accepted: validated.accepted,
    rejected: validated.rejected,
    note: validated.ignoredPromotion
      ? "Model coverage or verified flags were ignored. Accepted claims stay evidence-checked candidates."
      : "Accepted claims are evidence-checked candidates. They are not catalog coverage.",
  };
}
