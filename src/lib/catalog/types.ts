export type AwardType =
  | "AA"
  | "AA-PATHWAY"
  | "AAS"
  | "APPR"
  | "AS"
  | "ATC"
  | "ATD"
  | "BAS"
  | "BS"
  | "CCC"
  | "CPP"
  | "CTC"
  | "CE"
  | string;

export type CoverageStatus =
  | "inventory-only"
  | "inventory-index-only"
  | "sheet-not-found"
  | "sheet-unparsed"
  | "requirements-partial"
  | "requirements-extracted"
  | "narrative-only"
  | "source-page-without-course-rows";

export interface SourceRef {
  url: string;
  title: string;
  asOf: string;
  edition: string | null;
  effectiveTerm: string | null;
  page: string | null;
  note: string | null;
}

export type LogicExpr =
  | { op: "course"; id: string }
  | { op: "and"; args: LogicExpr[] }
  | { op: "or"; args: LogicExpr[]; note?: string }
  | { op: "test"; name: string; detail: string }
  | { op: "permission"; detail: string }
  | { op: "unknown"; text: string };

export interface CourseRequirement {
  kind: "course";
  courseId: string;
  title: string | null;
  credits: number | null;
  clockHours?: number | null;
  prerequisite: LogicExpr | null;
  corequisite: LogicExpr | null;
}

export interface GroupRequirement {
  kind: "all" | "choose" | "note";
  title?: string;
  text?: string;
  minCredits?: number | null;
  children?: CourseRequirement[];
}

export interface CatalogProgram {
  id: string;
  planCode: string | null;
  awardType: AwardType;
  name: string;
  cip6: string | null;
  cip10: string | null;
  soc: string | null;
  unit: "credit" | "clock" | "unknown";
  credits: number | null;
  clockHours: number | null;
  effectiveTerm: string | null;
  editionLabel: string;
  coverage: CoverageStatus;
  confidence: "high" | "medium" | "low";
  requirements: GroupRequirement[];
  wildcardElectives: string[];
  sources: SourceRef[];
  conflicts: { field: string; values: { source: string; value: string }[] }[];
  notes?: string[];
  pathwayCode?: string;
  completeness?: "complete-small" | "open-choice" | "unresolved" | "suspected-unit";
  sequenceGuide?: {
    url: string;
    effectiveTerm: string;
    programTotal: number | null;
    rowStatus: "candidate" | "missing";
    candidateCourseCount: number;
  };
  fiuAlignment?: {
    guideId: string;
    degree: string;
    status: "candidate-name-alignment";
    note: string;
  };
  verifiedFacts?: { label: string; value: string; status: string; sourceUrl: string }[];
}

export interface FeeRate {
  id: string;
  appliesToAwardTypes: string[];
  modality: string;
  residency?: string;
  unit: "credit" | "clock";
  residentPerCredit?: number;
  nonresidentPerCredit?: number;
  yearLabel: string;
  confidence: "high" | "medium" | "low";
  source: SourceRef;
}

export interface CatalogFile {
  catalogVersion: number;
  generatedAt: string;
  asOf: string;
  blockers: { source: string; issue: string }[];
  fees: {
    checked: string;
    conflicts: { field: string; values: { source: string; value: number; label: string }[] }[];
    schedules: {
      note: string;
      url: string;
      checked: string;
      formats: string[];
      termsMentioned: string[];
      sectionOfferings: "unknown";
    };
    rates: FeeRate[];
  };
  programs: CatalogProgram[];
}
