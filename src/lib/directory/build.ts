import { getCatalog } from "../catalog/load";
import type { CatalogProgram, CourseRequirement } from "../catalog/types";
import { cipSeries } from "./cip";

export interface DirectoryRelation {
  programId: string;
  programName: string;
  courseId: string;
  meaning: "shared-required-course";
}

export interface DirectoryProgram {
  id: string;
  planCode: string | null;
  name: string;
  awardType: string;
  cip6: string | null;
  cip2: string | null;
  cipTitle: string | null;
  groupId: string;
  coverage: string;
  confidence: string;
  editionLabel: string;
  credits: number | null;
  clockHours: number | null;
  unit: string;
  effectiveTerm: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  relations: DirectoryRelation[];
  completeness?: CatalogProgram["completeness"];
  notes?: string[];
  sequenceGuide?: CatalogProgram["sequenceGuide"];
  fiuAlignment?: CatalogProgram["fiuAlignment"];
  verifiedFacts?: CatalogProgram["verifiedFacts"];
}

export interface DirectoryGroup {
  id: string;
  label: string;
  officialTitle: string | null;
  cip2: string | null;
  meaning: string;
  programIds: string[];
}

export interface DirectoryIndex {
  programCount: number;
  groups: DirectoryGroup[];
  programs: DirectoryProgram[];
}

const COMMON_COURSE_LIMIT = 12;

function courseIds(program: CatalogProgram): string[] {
  const ids: string[] = [];
  for (const group of program.requirements) {
    for (const child of group.children ?? []) {
      if ((child as CourseRequirement).kind === "course" && child.courseId) ids.push(child.courseId);
    }
  }
  return ids;
}

function toRecord(program: CatalogProgram, groupId: string): DirectoryProgram {
  const series = cipSeries(program.cip6);
  const source = program.sources[0];
  return {
    id: program.id,
    planCode: program.planCode,
    name: program.name,
    awardType: program.awardType,
    cip6: program.cip6,
    cip2: series?.code ?? (program.cip6 ? program.cip6.slice(0, 2) : null),
    cipTitle: series?.title ?? null,
    groupId,
    coverage: program.coverage,
    confidence: program.confidence,
    editionLabel: program.editionLabel,
    credits: program.credits,
    clockHours: program.clockHours,
    unit: program.unit,
    effectiveTerm: program.effectiveTerm,
    sourceUrl: source?.url ?? null,
    sourceTitle: source?.title ?? null,
    relations: [],
    completeness: program.completeness,
    notes: program.notes,
    sequenceGuide: program.sequenceGuide,
    fiuAlignment: program.fiuAlignment,
    verifiedFacts: program.verifiedFacts,
  };
}

export function buildDirectory(programs: CatalogProgram[]): DirectoryIndex {
  const groups = new Map<string, DirectoryGroup>();
  const records: DirectoryProgram[] = [];
  for (const program of programs) {
    let groupId: string;
    let label: string;
    let officialTitle: string | null;
    let cip2: string | null;
    let meaning: string;
    if (program.awardType === "CE" || program.id === "CE-PUBLIC-SEARCH") {
      groupId = "ce";
      label = "Continuing education";
      officialTitle = null;
      cip2 = null;
      meaning =
        "The public continuing-education search page was checked and returned no course rows. A separate dated noncredit snapshot is listed below this map. It is not a list of degree requirements or open seats.";
    } else {
      const series = cipSeries(program.cip6);
      if (!series) {
        groupId = "unclassified";
        label = "Unclassified";
        officialTitle = null;
        cip2 = program.cip6 ? program.cip6.slice(0, 2) : null;
        meaning =
          "These records have no CIP code, or the two-digit series is not in the CIP 2020 title list copied into this app. No field name was invented for them.";
      } else {
        groupId = `cip-${series.code}`;
        label = `CIP ${series.code}`;
        officialTitle = series.title;
        cip2 = series.code;
        meaning = `Inventory CIP codes in series ${series.code}. The series title is the NCES CIP 2020 title. Sharing a series is a classification, not transfer, stackability, or admission.`;
      }
    }
    if (!groups.has(groupId)) {
      groups.set(groupId, { id: groupId, label, officialTitle, cip2, meaning, programIds: [] });
    }
    const record = toRecord(program, groupId);
    groups.get(groupId)!.programIds.push(record.id);
    records.push(record);
  }

  const byId = new Map(records.map((record) => [record.id, record]));
  const owners = new Map<string, string[]>();
  for (const program of programs) {
    if (program.awardType === "CE") continue;
    for (const courseId of new Set(courseIds(program))) {
      const list = owners.get(courseId) ?? [];
      list.push(program.id);
      owners.set(courseId, list);
    }
  }
  for (const [courseId, ids] of owners) {
    const unique = [...new Set(ids)];
    if (unique.length < 2 || unique.length > COMMON_COURSE_LIMIT) continue;
    for (const id of unique) {
      const record = byId.get(id);
      if (!record) continue;
      for (const otherId of unique) {
        if (otherId === id || record.relations.length >= 6) continue;
        const other = byId.get(otherId);
        if (!other) continue;
        if (record.relations.some((item) => item.programId === otherId && item.courseId === courseId)) continue;
        record.relations.push({
          programId: otherId,
          programName: other.name,
          courseId,
          meaning: "shared-required-course",
        });
      }
    }
  }

  const orderedGroups = [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const group of orderedGroups) {
    group.programIds.sort((a, b) => {
      const left = byId.get(a)!;
      const right = byId.get(b)!;
      return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
    });
  }
  records.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  return { programCount: records.length, groups: orderedGroups, programs: records };
}

let cached: DirectoryIndex | null = null;

export function getDirectory(): DirectoryIndex {
  if (!cached) cached = buildDirectory(getCatalog().programs);
  return cached;
}
