import { describe, expect, it } from "vitest";
import { buildPlan, explainDifference, normalizeConstraints, type StudentConstraints } from "./engine";
import type { CatalogProgram, FeeRate } from "../catalog/types";

const rates: FeeRate[] = [
  {
    id: "campus-college-credit-2022-23-page",
    appliesToAwardTypes: ["AS", "CCC"],
    modality: "unspecified",
    unit: "credit",
    residentPerCredit: 100,
    nonresidentPerCredit: 400,
    yearLabel: "fixture",
    confidence: "low",
    source: { url: "https://example.edu/fees", title: "fixture", asOf: "2026-11-07", edition: null, effectiveTerm: null, page: null, note: null },
  },
];

function creditProgram(id: string, groups: CatalogProgram["requirements"]): CatalogProgram {
  return {
    id,
    planCode: id,
    awardType: "AS",
    name: id,
    cip6: null,
    cip10: null,
    soc: null,
    unit: "credit",
    credits: 8,
    clockHours: null,
    effectiveTerm: "Fall 2025",
    editionLabel: "program sheet effective Fall 2025",
    coverage: "requirements-extracted",
    confidence: "medium",
    requirements: groups,
    wildcardElectives: [],
    sources: [],
    conflicts: [],
  };
}

const base: StudentConstraints = {
  residency: "resident",
  modality: "in-person",
  weeklyHours: 12,
  budgetPerTerm: null,
  budgetTotal: null,
  completedCourseIds: [],
  termLengthWeeks: 16,
  hoursPerCreditPerWeek: 3,
};

describe("planner", () => {
  it("places a prerequisite after its course and changes term count when hours drop", () => {
    const program = creditProgram("DEMO", [
      {
        kind: "all",
        title: "Major",
        minCredits: 8,
        children: [
          { kind: "course", courseId: "CTS 1134", title: "Networking", credits: 4, prerequisite: null, corequisite: null },
          { kind: "course", courseId: "CTS 1120", title: "Fundamentals", credits: 4, prerequisite: { op: "course", id: "CTS 1134" }, corequisite: null },
        ],
      },
    ]);
    const wide = buildPlan(program, { ...base, weeklyHours: 24 }, rates);
    expect(wide.terms[0].courses.map((item) => item.courseId)).toEqual(["CTS 1134"]);
    expect(wide.terms[1].courses.map((item) => item.courseId)).toEqual(["CTS 1120"]);
    const open = creditProgram("OPEN", [
      {
        kind: "all",
        title: "Major",
        minCredits: 8,
        children: [
          { kind: "course", courseId: "CTS 1134", title: "Networking", credits: 4, prerequisite: null, corequisite: null },
          { kind: "course", courseId: "CGS 1060C", title: "Computers", credits: 4, prerequisite: null, corequisite: null },
        ],
      },
    ]);
    const together = buildPlan(open, { ...base, weeklyHours: 24 }, rates);
    const split = buildPlan(open, { ...base, weeklyHours: 12 }, rates);
    expect(together.totals.terms).toBe(1);
    expect(split.totals.terms).toBe(2);
    expect(explainDifference(together, split, { ...base, weeklyHours: 24 }, { ...base, weeklyHours: 12 }).join(" ")).toMatch(/Weekly hours/);
    expect(wide.sectionOfferings).toBe("unknown");
    expect(wide.assumptions.join(" ")).toMatch(/not transfer credit/);
  });

  it("flags an OR group instead of picking an elective", () => {
    const program = creditProgram("OR", [
      {
        kind: "choose",
        title: "Scripting",
        minCredits: 4,
        children: [
          { kind: "course", courseId: "COP 1047C", title: "Python", credits: 4, prerequisite: null, corequisite: null },
          { kind: "course", courseId: "COP 1334", title: "C++", credits: 4, prerequisite: null, corequisite: null },
        ],
      },
    ]);
    const plan = buildPlan(program, base, rates);
    expect(plan.unfilledChoices).toHaveLength(1);
    expect(plan.terms).toHaveLength(0);
    expect(plan.diagnostics.some((item) => item.code === "choice-unfilled")).toBe(true);
  });

  it("reports a prerequisite cycle instead of a fake order", () => {
    const program = creditProgram("CYCLE", [
      {
        kind: "all",
        title: "Cycle",
        minCredits: 6,
        children: [
          { kind: "course", courseId: "AAA 1111", title: "A", credits: 3, prerequisite: { op: "course", id: "BBB 2222" }, corequisite: null },
          { kind: "course", courseId: "BBB 2222", title: "B", credits: 3, prerequisite: { op: "course", id: "AAA 1111" }, corequisite: null },
        ],
      },
    ]);
    const plan = buildPlan(program, base, rates);
    expect(plan.feasible).toBe(false);
    expect(plan.diagnostics.some((item) => item.code === "prerequisite-cycle")).toBe(true);
  });

  it("keeps clock-hour programs out of the credit fee math", () => {
    const program: CatalogProgram = {
      ...creditProgram("53014", []),
      awardType: "CTC",
      unit: "clock",
      credits: null,
      clockHours: 650,
      coverage: "requirements-extracted",
    };
    const plan = buildPlan(program, base, rates);
    expect(plan.unit).toBe("clock");
    expect(plan.totals.creditsPlanned).toBe(0);
    expect(plan.totals.clockHoursPlanned).toBe(650);
    expect(plan.totals.costStatus).toBe("unknown");
    expect(plan.terms.length).toBeGreaterThan(1);
  });

  it("is infeasible when time or budget cannot cover a known estimate", () => {
    const program = creditProgram("COST", [
      {
        kind: "all",
        title: "One",
        minCredits: 4,
        children: [{ kind: "course", courseId: "ENC 1101", title: "English", credits: 4, prerequisite: null, corequisite: null }],
      },
    ]);
    const noTime = buildPlan(program, { ...base, weeklyHours: 0 }, rates);
    expect(noTime.feasible).toBe(false);
    const broke = buildPlan(program, { ...base, budgetPerTerm: 10 }, rates);
    expect(broke.diagnostics.some((item) => item.code === "budget-per-term")).toBe(true);
    expect(broke.feasible).toBe(false);
  });

  it("does not invent a sequence when coverage is only the inventory", () => {
    const program = { ...creditProgram("INDEX", []), coverage: "inventory-only" as const };
    const plan = buildPlan(program, base, rates);
    expect(plan.feasible).toBe(false);
    expect(plan.diagnostics.some((item) => item.code === "insufficient-evidence")).toBe(true);
  });

  it("rejects malicious and invalid constraint payloads", () => {
    expect(normalizeConstraints(null).errors.length).toBeGreaterThan(0);
    expect(normalizeConstraints({ weeklyHours: -1, residency: "resident", modality: "in-person" }).errors.join(" ")).toMatch(/weeklyHours/);
    expect(normalizeConstraints({ weeklyHours: 10, residency: "root" as "resident", modality: "in-person" }).errors.join(" ")).toMatch(/residency/);
    expect(normalizeConstraints({ weeklyHours: 10, completedCourseIds: ["<script>"] }).errors.join(" ")).toMatch(/course id/);
    const huge = Array.from({ length: 90 }, (_, index) => `CTS ${1000 + index}`);
    expect(normalizeConstraints({ weeklyHours: 10, completedCourseIds: huge }).errors.join(" ")).toMatch(/80/);
  });
});
