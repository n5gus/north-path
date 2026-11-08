import type { CatalogProgram, CourseRequirement, FeeRate, LogicExpr } from "../catalog/types";

export const API_VERSION = "1";

export interface StudentConstraints {
  residency: "resident" | "nonresident" | "unknown";
  modality: "in-person" | "online" | "unknown";
  weeklyHours: number;
  budgetPerTerm: number | null;
  budgetTotal: number | null;
  completedCourseIds: string[];
  termLengthWeeks: number;
  hoursPerCreditPerWeek: number;
}

export interface PlanDiagnostic {
  code: string;
  severity: "info" | "warning" | "blocker";
  message: string;
}

export interface PlanCourse {
  courseId: string;
  title: string | null;
  credits: number | null;
  prerequisite: LogicExpr | null;
  corequisite: LogicExpr | null;
}

export interface PlanTerm {
  index: number;
  courses: PlanCourse[];
  weeklyLoadHours: number | null;
  clockHours: number | null;
  estimatedCost: number | null;
  costStatus: "estimated-from-published-table" | "unknown";
}

export interface PlanResult {
  apiVersion: typeof API_VERSION;
  programId: string;
  feasible: boolean;
  coverage: CatalogProgram["coverage"];
  confidence: CatalogProgram["confidence"];
  unit: CatalogProgram["unit"];
  assumptions: string[];
  diagnostics: PlanDiagnostic[];
  terms: PlanTerm[];
  totals: {
    creditsPlanned: number;
    clockHoursPlanned: number | null;
    terms: number;
    estimatedCost: number | null;
    costStatus: "estimated-from-published-table" | "partial" | "unknown";
  };
  unfilledChoices: { title: string; minCredits: number | null; options: string[] }[];
  selfReportedCourses: string[];
  sectionOfferings: "unknown";
}

const CREDIT_AWARDS = new Set(["AA", "AA-PATHWAY", "AS", "AAS", "CCC", "ATC", "BS", "BAS", "CPP"]);

export function normalizeConstraints(input: Partial<StudentConstraints> | null): { value: StudentConstraints | null; errors: string[] } {
  if (!input || typeof input !== "object") return { value: null, errors: ["Request body must be an object."] };
  const errors: string[] = [];
  const residency = input.residency ?? "unknown";
  const modality = input.modality ?? "unknown";
  if (!["resident", "nonresident", "unknown"].includes(residency)) errors.push("residency must be resident, nonresident, or unknown.");
  if (!["in-person", "online", "unknown"].includes(modality)) errors.push("modality must be in-person, online, or unknown.");
  const weeklyHours = Number(input.weeklyHours);
  if (!Number.isFinite(weeklyHours) || weeklyHours < 0 || weeklyHours > 80) errors.push("weeklyHours must be a number from 0 through 80.");
  const termLengthWeeks = input.termLengthWeeks == null ? 16 : Number(input.termLengthWeeks);
  if (!Number.isFinite(termLengthWeeks) || termLengthWeeks < 1 || termLengthWeeks > 52) errors.push("termLengthWeeks must be from 1 through 52.");
  const hoursPerCreditPerWeek = input.hoursPerCreditPerWeek == null ? 3 : Number(input.hoursPerCreditPerWeek);
  if (!Number.isFinite(hoursPerCreditPerWeek) || hoursPerCreditPerWeek < 0.5 || hoursPerCreditPerWeek > 20) {
    errors.push("hoursPerCreditPerWeek must be from 0.5 through 20.");
  }
  const budgetPerTerm = optionalMoney(input.budgetPerTerm, "budgetPerTerm", errors);
  const budgetTotal = optionalMoney(input.budgetTotal, "budgetTotal", errors);
  const completed = Array.isArray(input.completedCourseIds) ? input.completedCourseIds : [];
  if (completed.length > 80) errors.push("completedCourseIds is limited to 80 entries.");
  const completedCourseIds = completed.map((id) => String(id).replace(/\s+/g, " ").trim().toUpperCase());
  if (completedCourseIds.some((id) => !/^[A-Z]{3} \d{4}[A-Z]?$/.test(id) && !/^[A-Z]{3}\d{4}[A-Z]?$/.test(id))) {
    errors.push("Each completed course id must look like CTS 1134.");
  }
  const normalizedIds = completedCourseIds.map((id) => (id.includes(" ") ? id : `${id.slice(0, 3)} ${id.slice(3)}`));
  if (errors.length) return { value: null, errors };
  return {
    value: {
      residency: residency as StudentConstraints["residency"],
      modality: modality as StudentConstraints["modality"],
      weeklyHours,
      budgetPerTerm,
      budgetTotal,
      completedCourseIds: normalizedIds,
      termLengthWeeks,
      hoursPerCreditPerWeek,
    },
    errors: [],
  };
}

function optionalMoney(value: unknown, name: string, errors: string[]): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10_000_000) {
    errors.push(`${name} must be a nonnegative number up to 10000000, or null.`);
    return null;
  }
  return number;
}

function courseIdsIn(expr: LogicExpr | null): string[] {
  if (!expr) return [];
  if (expr.op === "course") return [expr.id];
  if (expr.op === "and" || expr.op === "or") return expr.args.flatMap(courseIdsIn);
  return [];
}

function exprSatisfied(expr: LogicExpr | null, done: Set<string>): { ok: boolean; unsupported: boolean; detail: string | null } {
  if (!expr) return { ok: true, unsupported: false, detail: null };
  if (expr.op === "course") return { ok: done.has(expr.id), unsupported: false, detail: null };
  if (expr.op === "and") {
    const parts = expr.args.map((item) => exprSatisfied(item, done));
    return { ok: parts.every((part) => part.ok), unsupported: parts.some((part) => part.unsupported), detail: null };
  }
  if (expr.op === "or") {
    const parts = expr.args.map((item) => exprSatisfied(item, done));
    return { ok: parts.some((part) => part.ok), unsupported: parts.some((part) => part.unsupported), detail: expr.note ?? null };
  }
  return { ok: false, unsupported: true, detail: expr.op === "unknown" ? expr.text : expr.op === "test" ? expr.detail : expr.detail };
}

function allCourses(program: CatalogProgram): CourseRequirement[] {
  return program.requirements.flatMap((group) => (group.kind === "note" ? [] : group.children ?? []));
}

function detectCycle(courses: CourseRequirement[]): string[] | null {
  const ids = new Set(courses.map((course) => course.courseId));
  const graph = new Map<string, string[]>();
  for (const course of courses) {
    graph.set(
      course.courseId,
      courseIdsIn(course.prerequisite).filter((id) => ids.has(id)),
    );
  }
  const color = new Map<string, number>();
  const stack: string[] = [];
  function visit(id: string): string[] | null {
    color.set(id, 1);
    stack.push(id);
    for (const next of graph.get(id) ?? []) {
      const state = color.get(next) ?? 0;
      if (state === 1) return stack.slice(stack.indexOf(next));
      if (state === 0) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(id, 2);
    return null;
  }
  for (const id of ids) {
    if ((color.get(id) ?? 0) === 0) {
      const found = visit(id);
      if (found) return found;
    }
  }
  return null;
}

function selectRate(program: CatalogProgram, constraints: StudentConstraints, rates: FeeRate[]): FeeRate | null {
  if (program.unit !== "credit" || program.completeness === "suspected-unit") return null;
  if (constraints.modality === "online" && constraints.residency === "nonresident") {
    const exclusive = rates.find((rate) => rate.id === "online-nonresident-distance-290");
    if (exclusive && exclusive.appliesToAwardTypes.includes(program.awardType)) return exclusive;
  }
  return (
    rates.find(
      (rate) =>
        rate.modality !== "online" &&
        rate.appliesToAwardTypes.includes(program.awardType) &&
        rate.unit === "credit",
    ) ?? null
  );
}

function perCredit(rate: FeeRate | null, residency: StudentConstraints["residency"]): number | null {
  if (!rate || residency === "unknown") return null;
  return residency === "resident" ? rate.residentPerCredit ?? null : rate.nonresidentPerCredit ?? null;
}

export function buildPlan(program: CatalogProgram, constraints: StudentConstraints, rates: FeeRate[]): PlanResult {
  const assumptions = [
    `Study load uses ${constraints.hoursPerCreditPerWeek} hours per credit each week. That is a North Path assumption, not an MDC rule.`,
    `A planning term is ${constraints.termLengthWeeks} weeks, taken from published term shapes such as 16-week terms. It is not a seat in a section.`,
    "Completed course ids are self-reported. They are treated as already finished only for ordering this plan. They are not transfer credit and an advisor must confirm them.",
    "No public class-section schedule was ingested. Meeting days, campuses, and registration dates are unknown.",
  ];
  const diagnostics: PlanDiagnostic[] = [];
  const done = new Set(constraints.completedCourseIds);
  const unfilledChoices: PlanResult["unfilledChoices"] = [];

  if (program.coverage === "inventory-only" || program.coverage === "inventory-index-only" || program.coverage === "sheet-not-found" || program.coverage === "source-page-without-course-rows" || program.coverage === "narrative-only") {
    diagnostics.push({
      code: "insufficient-evidence",
      severity: "blocker",
      message: `Coverage is ${program.coverage}. North Path will not invent a course sequence for this record.`,
    });
  }
  if (program.conflicts.length) {
    diagnostics.push({
      code: "source-conflict",
      severity: "warning",
      message: `Sources disagree on ${program.conflicts.map((item) => item.field).join(", ")}. Neither value was silently chosen as current.`,
    });
  }

  if (program.completeness === "suspected-unit") {
    diagnostics.push({
      code: "unit-unresolved",
      severity: "warning",
      message: "This certificate sheet lists vocational credits. A clock-hour total was not verified, and the per-credit fee table was not applied.",
    });
  }
  if (program.unit === "clock" || program.awardType === "APPR") {
    return clockPlan(program, constraints, diagnostics, assumptions);
  }

  const courses = allCourses(program);
  const cycle = detectCycle(courses);
  if (cycle) {
    diagnostics.push({
      code: "prerequisite-cycle",
      severity: "blocker",
      message: `Prerequisite cycle: ${cycle.join(" → ")}. No order was invented past the cycle.`,
    });
  }

  for (const group of program.requirements) {
    if (group.kind !== "choose") continue;
    const remaining = (group.children ?? []).filter((course) => !done.has(course.courseId));
    const selectedCredits = (group.children ?? [])
      .filter((course) => done.has(course.courseId))
      .reduce((sum, course) => sum + (course.credits ?? 0), 0);
    if (group.minCredits != null && selectedCredits + 0.01 < group.minCredits) {
      unfilledChoices.push({
        title: group.title ?? "Choice group",
        minCredits: group.minCredits,
        options: remaining.map((course) => course.courseId),
      });
      diagnostics.push({
        code: "choice-unfilled",
        severity: "warning",
        message: `${group.title ?? "A choice group"} still needs about ${group.minCredits - selectedCredits} credits. Options were not auto-picked.`,
      });
    }
  }

  const required = courses.filter((course) => {
    const group = program.requirements.find((item) => item.children?.some((child) => child.courseId === course.courseId));
    return group?.kind !== "choose";
  });
  const remaining = required.filter((course) => !done.has(course.courseId));
  const rate = CREDIT_AWARDS.has(program.awardType) ? selectRate(program, constraints, rates) : null;
  const price = perCredit(rate, constraints.residency);
  if (!price) {
    diagnostics.push({
      code: "cost-unknown",
      severity: "warning",
      message: "A complete current fee for this residency and award type is not in the ingested tables. Cost is unknown. That is not an affordability guarantee.",
    });
  } else if (rate) {
    assumptions.push(`Cost uses ${rate.yearLabel} from ${rate.source.url}. Books, aid, and some fees are unknown.`);
  }

  if (constraints.weeklyHours <= 0 && remaining.length) {
    diagnostics.push({ code: "no-weekly-time", severity: "blocker", message: "Weekly hours are 0, so no unfinished credit course can be placed." });
  }

  const terms: PlanTerm[] = [];
  const placed = new Set(done);
  const pool = [...remaining];
  let guard = 0;
  while (pool.length && guard < 40 && !cycle) {
    guard += 1;
    const termCourses: CourseRequirement[] = [];
    let load = 0;
    const deferred: CourseRequirement[] = [];
    for (const course of pool) {
      const prereq = exprSatisfied(course.prerequisite, placed);
      const coreqIds = courseIdsIn(course.corequisite);
      const coreqOk = coreqIds.every((id) => placed.has(id) || termCourses.some((item) => item.courseId === id) || pool.some((item) => item.courseId === id));
      if (!prereq.ok || prereq.unsupported) {
        deferred.push(course);
        if (prereq.unsupported) {
          diagnostics.push({
            code: "unsupported-prerequisite",
            severity: "warning",
            message: `${course.courseId} has a prerequisite North Path cannot evaluate (${prereq.detail ?? "see source"}). It was not scheduled.`,
          });
        }
        continue;
      }
      if (!coreqOk) {
        deferred.push(course);
        continue;
      }
      const courseLoad = (course.credits ?? 0) * constraints.hoursPerCreditPerWeek;
      if (course.credits == null) {
        diagnostics.push({ code: "credits-unknown", severity: "warning", message: `${course.courseId} has no parsed credit value, so it was not given a weekly load.` });
        deferred.push(course);
        continue;
      }
      if (courseLoad > constraints.weeklyHours) {
        diagnostics.push({
          code: "course-exceeds-week",
          severity: "blocker",
          message: `${course.courseId} needs about ${courseLoad} hours a week under the stated assumption, above ${constraints.weeklyHours}.`,
        });
        deferred.push(course);
        continue;
      }
      if (load + courseLoad > constraints.weeklyHours + 0.001) {
        deferred.push(course);
        continue;
      }
      termCourses.push(course);
      load += courseLoad;
    }
    if (termCourses.length === 0) break;
    const termCost = price == null ? null : round2(termCourses.reduce((sum, course) => sum + (course.credits ?? 0) * price, 0));
    if (termCost != null && constraints.budgetPerTerm != null && termCost > constraints.budgetPerTerm) {
      diagnostics.push({
        code: "budget-per-term",
        severity: "blocker",
        message: `Term ${terms.length + 1} estimates $${termCost.toFixed(2)}, above the per-term budget of $${constraints.budgetPerTerm.toFixed(2)}.`,
      });
    }
    terms.push({
      index: terms.length + 1,
      courses: termCourses.map(toPlanCourse),
      weeklyLoadHours: round2(load),
      clockHours: null,
      estimatedCost: termCost,
      costStatus: termCost == null ? "unknown" : "estimated-from-published-table",
    });
    for (const course of termCourses) placed.add(course.courseId);
    pool.length = 0;
    pool.push(...deferred.filter((course) => !placed.has(course.courseId) && !diagnostics.some((item) => item.code === "unsupported-prerequisite" && item.message.startsWith(course.courseId))));
  }

  const creditsPlanned = round2([...placed].reduce((sum, id) => {
    const course = courses.find((item) => item.courseId === id);
    return sum + (course?.credits ?? 0);
  }, 0));
  const costValues = terms.map((term) => term.estimatedCost).filter((value): value is number => value != null);
  const estimatedCost = costValues.length === terms.length && terms.length ? round2(costValues.reduce((sum, value) => sum + value, 0)) : null;
  if (estimatedCost != null && constraints.budgetTotal != null && estimatedCost > constraints.budgetTotal) {
    diagnostics.push({
      code: "budget-total",
      severity: "blocker",
      message: `Estimated tuition and fees of $${estimatedCost.toFixed(2)} exceed the total budget of $${constraints.budgetTotal.toFixed(2)}. Books and aid are still unknown.`,
    });
  }
  if (pool.length && !cycle) {
    diagnostics.push({
      code: "unscheduled-courses",
      severity: "warning",
      message: `${pool.length} parsed course${pool.length === 1 ? "" : "s"} could not be placed: ${pool.map((course) => course.courseId).slice(0, 8).join(", ")}.`,
    });
  }

  const feasible = !diagnostics.some((item) => item.severity === "blocker");
  return {
    apiVersion: API_VERSION,
    programId: program.id,
    feasible,
    coverage: program.coverage,
    confidence: program.confidence,
    unit: "credit",
    assumptions,
    diagnostics: dedupe(diagnostics),
    terms,
    totals: {
      creditsPlanned,
      clockHoursPlanned: null,
      terms: terms.length,
      estimatedCost,
      costStatus: estimatedCost == null ? "unknown" : "estimated-from-published-table",
    },
    unfilledChoices,
    selfReportedCourses: constraints.completedCourseIds,
    sectionOfferings: "unknown",
  };
}

function clockPlan(program: CatalogProgram, constraints: StudentConstraints, diagnostics: PlanDiagnostic[], assumptions: string[]): PlanResult {
  assumptions.push("Clock-hour and apprenticeship records are not converted into college credits.");
  const hours = program.clockHours;
  if (hours == null) {
    diagnostics.push({
      code: "clock-hours-unknown",
      severity: "blocker",
      message: "This record is clock-hour or apprenticeship, and a clock-hour total was not extracted. No credit conversion was applied.",
    });
  }
  if (constraints.weeklyHours <= 0) {
    diagnostics.push({ code: "no-weekly-time", severity: "blocker", message: "Weekly hours are 0, so the clock-hour block cannot be spread across terms." });
  }
  const terms: PlanTerm[] = [];
  const courses = allCourses(program).filter((course) => course.clockHours != null);
  if (courses.length && constraints.weeklyHours > 0 && hours != null) {
    let bucket: CourseRequirement[] = [];
    let bucketHours = 0;
    const capacity = constraints.weeklyHours * constraints.termLengthWeeks;
    const flush = () => {
      if (!bucket.length) return;
      terms.push({
        index: terms.length + 1,
        courses: bucket.map(toPlanCourse),
        weeklyLoadHours: round2(bucketHours / constraints.termLengthWeeks),
        clockHours: round2(bucketHours),
        estimatedCost: null,
        costStatus: "unknown",
      });
      bucket = [];
      bucketHours = 0;
    };
    for (const course of courses) {
      const size = course.clockHours ?? 0;
      if (size > capacity) {
        flush();
        diagnostics.push({
          code: "clock-course-exceeds-term",
          severity: "blocker",
          message: `${course.courseId} is ${size} clock hours. Under ${constraints.weeklyHours} hours a week and a ${constraints.termLengthWeeks}-week planning term, it does not fit. It was not split into a fake section.`,
        });
        continue;
      }
      if (bucketHours + size > capacity) flush();
      bucket.push(course);
      bucketHours += size;
    }
    flush();
    diagnostics.push({
      code: "clock-cost-unknown",
      severity: "warning",
      message: "The career-technical fee table is per credit hour. Clock hours were not converted into billable credits, so cost stays unknown.",
    });
  } else if (hours != null && constraints.weeklyHours > 0) {
    const hoursPerTerm = constraints.weeklyHours * constraints.termLengthWeeks;
    const termCount = Math.ceil(hours / hoursPerTerm);
    let left = hours;
    for (let index = 1; index <= termCount; index += 1) {
      const chunk = Math.min(hoursPerTerm, left);
      left -= chunk;
      terms.push({
        index,
        courses: [],
        weeklyLoadHours: constraints.weeklyHours,
        clockHours: round2(chunk),
        estimatedCost: null,
        costStatus: "unknown",
      });
    }
    diagnostics.push({
      code: "clock-cost-unknown",
      severity: "warning",
      message: "The career-technical fee table is per credit hour. Clock hours were not converted into billable credits, so cost stays unknown.",
    });
  }
  return {
    apiVersion: API_VERSION,
    programId: program.id,
    feasible: !diagnostics.some((item) => item.severity === "blocker"),
    coverage: program.coverage,
    confidence: program.confidence,
    unit: "clock",
    assumptions,
    diagnostics: dedupe(diagnostics),
    terms,
    totals: {
      creditsPlanned: 0,
      clockHoursPlanned: hours,
      terms: terms.length,
      estimatedCost: null,
      costStatus: "unknown",
    },
    unfilledChoices: [],
    selfReportedCourses: constraints.completedCourseIds,
    sectionOfferings: "unknown",
  };
}

export function explainDifference(left: PlanResult, right: PlanResult, leftInput: StudentConstraints, rightInput: StudentConstraints): string[] {
  const reasons: string[] = [];
  if (leftInput.weeklyHours !== rightInput.weeklyHours) {
    reasons.push(`Weekly hours changed from ${leftInput.weeklyHours} to ${rightInput.weeklyHours}, so the number of planning terms changed from ${left.totals.terms} to ${right.totals.terms}.`);
  }
  if (leftInput.budgetPerTerm !== rightInput.budgetPerTerm || leftInput.budgetTotal !== rightInput.budgetTotal) {
    reasons.push("The budget changed, so a plan can become infeasible when an estimated term or total exceeds that budget. Unknown costs do not become affordable.");
  }
  if (leftInput.residency !== rightInput.residency || leftInput.modality !== rightInput.modality) {
    reasons.push(`Residency or modality changed (${leftInput.residency}/${leftInput.modality} to ${rightInput.residency}/${rightInput.modality}), which selects a different published fee row when one exists.`);
  }
  if (leftInput.completedCourseIds.join() !== rightInput.completedCourseIds.join()) {
    reasons.push("Self-reported completed courses changed, so those ids were skipped in ordering. They are still not awarded credit.");
  }
  if (left.programId !== right.programId) {
    reasons.push(`The program changed from ${left.programId} to ${right.programId}, so the requirement list changed.`);
  }
  if (left.feasible !== right.feasible) {
    reasons.push(`Feasibility changed from ${left.feasible} to ${right.feasible} because of the diagnostics on the later plan.`);
  }
  if (!reasons.length) reasons.push("The constraints match, so the plans use the same rules and the same evidence.");
  return reasons;
}

function toPlanCourse(course: CourseRequirement): PlanCourse {
  return {
    courseId: course.courseId,
    title: course.title,
    credits: course.credits,
    prerequisite: course.prerequisite,
    corequisite: course.corequisite,
  };
}

function dedupe(items: PlanDiagnostic[]): PlanDiagnostic[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.code}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
