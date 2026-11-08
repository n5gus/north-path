export interface TreeNode {
  type?: string;
  value?: string;
  mdc?: string;
  fiu?: string;
  items?: TreeNode[];
}

export interface TreeReading {
  hasOr: boolean;
  hasAnd: boolean;
  courseLabels: string[];
  mandatoryCourseLabels: string[];
}

/** Read a guide tree without turning an OR into two required courses. */
export function readRequirementTree(node: TreeNode | TreeNode[] | null | undefined): TreeReading {
  const reading: TreeReading = { hasOr: false, hasAnd: false, courseLabels: [], mandatoryCourseLabels: [] };
  walk(node, false, reading);
  return reading;
}

function walk(node: TreeNode | TreeNode[] | null | undefined, insideOr: boolean, reading: TreeReading) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, insideOr, reading);
    return;
  }
  if (node.type === "op" && node.value === "OR") reading.hasOr = true;
  if (node.type === "op" && node.value === "AND") reading.hasAnd = true;
  if (node.type === "course") {
    const label = node.mdc ?? node.fiu ?? "";
    if (label) reading.courseLabels.push(label);
    if (label && !insideOr) reading.mandatoryCourseLabels.push(label);
    return;
  }
  const childOr = insideOr || (node.items ?? []).some((item) => item.type === "op" && item.value === "OR");
  for (const item of node.items ?? []) {
    if (item.type === "op") {
      if (item.value === "OR") reading.hasOr = true;
      if (item.value === "AND") reading.hasAnd = true;
      continue;
    }
    walk(item, childOr, reading);
  }
}

export interface CeCourse {
  courseId: string;
  number: string;
  title: string;
  url: string;
  description: string | null;
  prerequisiteText: string | null;
  sections: { days: string; time: string; dates: string; contactHours: string; location: string; delivery: string; fee: string; type: string }[];
}

export interface CeQuery {
  q?: string;
  offset?: number;
  limit?: number;
}

export function searchContinuingEducation(courses: CeCourse[], query: CeQuery) {
  const needle = (query.q ?? "").trim().toLowerCase();
  const limit = Math.min(100, Math.max(1, query.limit ?? 25));
  const offset = Math.max(0, query.offset ?? 0);
  const seen = new Set<string>();
  const rows = [];
  for (const course of courses) {
    if (!course.courseId || seen.has(course.courseId)) continue;
    seen.add(course.courseId);
    if (needle && !`${course.title} ${course.number} ${course.courseId}`.toLowerCase().includes(needle)) continue;
    rows.push(course);
  }
  return {
    total: rows.length,
    offset,
    limit,
    courses: rows.slice(offset, offset + limit).map((course) => ({
      courseId: course.courseId,
      number: course.number,
      title: course.title,
      url: course.url,
      prerequisiteText: course.prerequisiteText,
      sectionCount: course.sections?.length ?? 0,
      sections: (course.sections ?? []).slice(0, 8),
      noncredit: true,
      feeMeaning: "published-noncredit-section-fee",
    })),
  };
}
