import { MAX_CLAIMS } from "./models";

export type ClaimKind = "course" | "prerequisite" | "admission" | "elective" | "title";

export interface CandidateClaim {
  kind: ClaimKind;
  text: string;
  quotation: string;
  courseId?: string;
}

export interface AcceptedClaim extends CandidateClaim {
  status: "evidence-checked";
  sourceId: string;
  programId: string;
}

export interface RejectedClaim {
  reason: string;
  quotation: string | null;
  courseId: string | null;
}

export interface ValidationResult {
  status: "evidence-checked" | "rejected" | "malformed";
  accepted: AcceptedClaim[];
  rejected: RejectedClaim[];
  editionFlagPreserved: boolean;
  ignoredPromotion: boolean;
}

const KINDS = new Set<ClaimKind>(["course", "prerequisite", "admission", "elective", "title"]);
const COURSE_ID = /^[A-Z]{3} \d{4}[A-Z]?$/;
const INJECTION = /\b(ignore (all|any|previous)|system prompt|you are now|do not follow the)\b/i;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sourceContainsCourse(source: string, courseId: string): boolean {
  const match = courseId.match(/^([A-Z]{3}) (\d{4}[A-Z]?)$/);
  if (!match) return false;
  return new RegExp(`${match[1]}\\s*${match[2]}`).test(source);
}

function contradictsEdition(editionLabel: string, claimText: string): boolean {
  const older = /2024-2026|previous edition/i.test(editionLabel);
  const assertsLater = /2026-2028|current catalog|fully verified|requirements-extracted/i.test(claimText);
  return older && assertsLater;
}

function asClaim(value: unknown): CandidateClaim | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.kind !== "string" || !KINDS.has(record.kind as ClaimKind)) return null;
  if (typeof record.text !== "string" || typeof record.quotation !== "string") return null;
  const claim: CandidateClaim = {
    kind: record.kind as ClaimKind,
    text: record.text,
    quotation: record.quotation,
  };
  if (record.courseId !== undefined) {
    if (typeof record.courseId !== "string") return null;
    claim.courseId = record.courseId;
  }
  return claim;
}

export function validateCandidate(input: {
  raw: unknown;
  sourceText: string;
  sourceId: string;
  programId: string;
  editionLabel: string;
}): ValidationResult {
  const rejected: RejectedClaim[] = [];
  const accepted: AcceptedClaim[] = [];
  if (!input.sourceText.trim() || !input.sourceId.trim() || !input.programId.trim()) {
    return {
      status: "malformed",
      accepted,
      rejected: [{ reason: "missing-source", quotation: null, courseId: null }],
      editionFlagPreserved: /previous edition|2024-2026/i.test(input.editionLabel),
      ignoredPromotion: false,
    };
  }
  if (!input.raw || typeof input.raw !== "object" || Array.isArray(input.raw)) {
    return {
      status: "malformed",
      accepted,
      rejected: [{ reason: "malformed-json", quotation: null, courseId: null }],
      editionFlagPreserved: /previous edition|2024-2026/i.test(input.editionLabel),
      ignoredPromotion: false,
    };
  }
  const record = input.raw as Record<string, unknown>;
  const ignoredPromotion = "coverage" in record || "verified" in record || record.status === "verified";
  if (record.programId !== input.programId || record.sourceId !== input.sourceId) {
    return {
      status: "rejected",
      accepted,
      rejected: [{ reason: "unsupported-program-or-source-id", quotation: null, courseId: null }],
      editionFlagPreserved: true,
      ignoredPromotion,
    };
  }
  if (!new RegExp(input.programId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(input.sourceText)) {
    return {
      status: "rejected",
      accepted,
      rejected: [{ reason: "program-id-not-in-source", quotation: null, courseId: null }],
      editionFlagPreserved: true,
      ignoredPromotion,
    };
  }
  if (!Array.isArray(record.claims)) {
    return {
      status: "malformed",
      accepted,
      rejected: [{ reason: "malformed-json", quotation: null, courseId: null }],
      editionFlagPreserved: true,
      ignoredPromotion,
    };
  }
  if (record.claims.length > MAX_CLAIMS) {
    return {
      status: "rejected",
      accepted,
      rejected: [{ reason: "too-many-claims", quotation: null, courseId: null }],
      editionFlagPreserved: true,
      ignoredPromotion,
    };
  }
  const sourceNorm = normalizeWhitespace(input.sourceText);
  let editionFlagPreserved = /previous edition|2024-2026/i.test(input.editionLabel);
  for (const item of record.claims) {
    const claim = asClaim(item);
    if (!claim) {
      rejected.push({ reason: "malformed-claim", quotation: null, courseId: null });
      continue;
    }
    const quotation = normalizeWhitespace(claim.quotation);
    if (quotation.length < 8 || !sourceNorm.includes(quotation)) {
      rejected.push({ reason: "quotation-not-in-source", quotation: claim.quotation, courseId: claim.courseId ?? null });
      continue;
    }
    if (INJECTION.test(claim.quotation) || INJECTION.test(claim.text)) {
      rejected.push({ reason: "prompt-injection-marker", quotation: claim.quotation, courseId: claim.courseId ?? null });
      continue;
    }
    if (contradictsEdition(input.editionLabel, claim.text)) {
      editionFlagPreserved = true;
      rejected.push({ reason: "edition-flag-preserved", quotation: claim.quotation, courseId: claim.courseId ?? null });
      continue;
    }
    if (claim.kind === "course" || claim.courseId) {
      const courseId = claim.courseId ?? "";
      if (!COURSE_ID.test(courseId) || !sourceContainsCourse(input.sourceText, courseId) || !sourceContainsCourse(claim.quotation, courseId)) {
        rejected.push({ reason: "unsupported-course-id", quotation: claim.quotation, courseId: courseId || null });
        continue;
      }
    }
    accepted.push({
      ...claim,
      quotation,
      status: "evidence-checked",
      sourceId: input.sourceId,
      programId: input.programId,
    });
  }
  return {
    status: accepted.length > 0 ? "evidence-checked" : "rejected",
    accepted,
    rejected,
    editionFlagPreserved,
    ignoredPromotion,
  };
}
