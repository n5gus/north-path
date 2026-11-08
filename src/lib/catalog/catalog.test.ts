import { describe, expect, it } from "vitest";
import { getCatalog, getProgram } from "./load";
import { buildPlan, type StudentConstraints } from "../planner/engine";

const constraints: StudentConstraints = {
  residency: "resident",
  modality: "in-person",
  weeklyHours: 12,
  budgetPerTerm: null,
  budgetTotal: null,
  completedCourseIds: [],
  termLengthWeeks: 16,
  hoursPerCreditPerWeek: 3,
};

describe("ingested catalog", () => {
  it("matches the inventory count and keeps AA pathways and continuing education separate", () => {
    const catalog = getCatalog();
    const inventory = catalog.programs.filter((program) => program.awardType !== "AA-PATHWAY" && program.awardType !== "CE");
    expect(inventory).toHaveLength(251);
    expect(catalog.programs.filter((program) => program.awardType === "AA-PATHWAY").length).toBe(79);
    expect(getProgram("CE-PUBLIC-SEARCH")?.coverage).toBe("source-page-without-course-rows");
    expect(getProgram("1****")?.coverage).toBe("inventory-index-only");
    expect(catalog.programs.filter((program) => program.coverage === "requirements-extracted").length).toBeGreaterThan(200);
    const pathways = catalog.programs.filter((program) => program.awardType === "AA-PATHWAY");
    expect(pathways.filter((program) => program.confidence === "low")).toHaveLength(0);
    expect(getProgram("AA-10100")?.name).toBe("Agriculture");
    expect(getProgram("AA-10200")?.name).toBe("Architecture");
    expect(getProgram("AA-10504")?.name).toBe("Accounting");
    expect(getProgram("AA-12200")?.name).toBe("Anthropology");
    expect(pathways.every((program) => program.editionLabel.includes("2024-2026"))).toBe(true);
    expect(pathways.every((program) => program.coverage === "narrative-only")).toBe(true);
    expect(catalog.programs.filter((program) => program.coverage === "requirements-extracted")).toHaveLength(238);
    expect(catalog.programs.filter((program) => program.coverage === "requirements-partial")).toHaveLength(9);
    expect(catalog.programs.filter((program) => program.coverage === "sheet-not-found")).toHaveLength(3);
    expect(catalog.programs.filter((program) => program.coverage === "sheet-unparsed")).toHaveLength(0);
    expect(catalog.programs).toHaveLength(331);
  });

  it("does not give cybersecurity and accounting the same course list", () => {
    const cyber = buildPlan(getProgram("25079")!, constraints, getCatalog().fees.rates);
    const accounting = buildPlan(getProgram("25022")!, constraints, getCatalog().fees.rates);
    const cyberIds = cyber.terms.flatMap((term) => term.courses.map((course) => course.courseId));
    const accountingIds = accounting.terms.flatMap((term) => term.courses.map((course) => course.courseId));
    expect(cyberIds.join()).not.toBe(accountingIds.join());
    expect(cyberIds).toContain("CTS 1120");
    expect(accountingIds).not.toContain("CTS 1120");
  });

  it("plans the sterile processing certificate in clock hours", () => {
    const program = getProgram("53014")!;
    expect(program.unit).toBe("clock");
    expect(program.clockHours).toBe(650);
    const plan = buildPlan(program, constraints, getCatalog().fees.rates);
    expect(plan.unit).toBe("clock");
    expect(plan.totals.estimatedCost).toBeNull();
    expect(plan.diagnostics.some((item) => item.code === "clock-course-exceeds-term")).toBe(true);
    expect(plan.sectionOfferings).toBe("unknown");
  });
});
