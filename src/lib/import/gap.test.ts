import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getCatalog, getProgram } from "../catalog/load";
import { buildPlan } from "../planner/engine";
import { readRequirementTree, searchContinuingEducation, type CeCourse } from "./requirements";

const constraints = {
  residency: "resident" as const,
  modality: "in-person" as const,
  weeklyHours: 12,
  budgetPerTerm: null,
  budgetTotal: null,
  completedCourseIds: [],
  termLengthWeeks: 16,
  hoursPerCreditPerWeek: 3,
};

describe("gap evidence import", () => {
  it("plans 56016 and 57004 in clock or contact hours and leaves 57022 unresolved", () => {
    const rates = getCatalog().fees.rates;
    const classB = buildPlan(getProgram("56016")!, constraints, rates);
    expect(classB.unit).toBe("clock");
    expect(classB.totals.clockHoursPlanned).toBe(150);
    expect(classB.totals.estimatedCost).toBeNull();
    expect(classB.totals.creditsPlanned).toBe(0);
    const fire = buildPlan(getProgram("57004")!, constraints, rates);
    expect(fire.unit).toBe("clock");
    expect(fire.totals.clockHoursPlanned).toBe(492);
    expect(fire.totals.estimatedCost).toBeNull();
    const law = getProgram("57022")!;
    expect(law.unit).toBe("credit");
    expect(law.clockHours).toBeNull();
    expect(law.completeness).toBe("suspected-unit");
    const lawPlan = buildPlan(law, constraints, rates);
    expect(lawPlan.unit).toBe("credit");
    expect(lawPlan.totals.estimatedCost).toBeNull();
    expect(lawPlan.diagnostics.some((item) => item.code === "unit-unresolved")).toBe(true);
  });

  it("keeps AA sequence rows out of required courses and records the two missing guides", () => {
    const agriculture = getProgram("AA-10100")!;
    const required = agriculture.requirements.flatMap((group) => group.children ?? []);
    expect(required).toHaveLength(0);
    expect(agriculture.coverage).toBe("narrative-only");
    expect(agriculture.editionLabel).toContain("2024-2026");
    expect(agriculture.sequenceGuide?.rowStatus).toBe("candidate");
    expect(agriculture.sequenceGuide?.effectiveTerm).toBe("Fall 2025 (2257)");
    expect(getProgram("AA-11211")?.sequenceGuide?.rowStatus).toBe("missing");
    expect(getProgram("AA-10803")?.sequenceGuide?.rowStatus).toBe("missing");
    const guides = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/imports/aa-sequence-guides.json"), "utf8"));
    expect(guides.guides).toHaveLength(77);
    expect(guides.core.generalEducation).toBe(36);
    expect(guides.core.pathwayElectives).toBe(24);
    expect(guides.guides.every((guide: { courses: { role: string }[] }) => guide.courses.every((row) => row.role === "candidate-listed-row"))).toBe(true);
  });

  it("keeps FIU OR groups and limits name alignment to eleven candidates", () => {
    const fiu = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/imports/fiu-mdc-guides.json"), "utf8"));
    expect(fiu.guides).toHaveLength(106);
    const accounting = fiu.guides.find((guide: { guideId: string }) => guide.guideId === "FIU-MDC-Accounting");
    const reading = readRequirementTree(accounting.requirementTree);
    expect(reading.hasOr).toBe(true);
    expect(reading.courseLabels.some((label: string) => label.includes("MAC 2233"))).toBe(true);
    expect(reading.courseLabels.some((label: string) => label.includes("MAC 2311"))).toBe(true);
    expect(reading.mandatoryCourseLabels.some((label: string) => label.includes("MAC 2233"))).toBe(false);
    const links = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/imports/aa-fiu-links.json"), "utf8"));
    expect(links.alignments).toHaveLength(11);
    expect(getProgram("AA-10504")?.fiuAlignment?.status).toBe("candidate-name-alignment");
    expect(getProgram("AA-10100")?.fiuAlignment).toBeUndefined();
  });

  it("searches the noncredit CE snapshot without treating section fees as credit tuition", () => {
    const courses = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/imports/ce-snapshot.json"), "utf8")) as CeCourse[];
    const all = searchContinuingEducation(courses, { limit: 25, offset: 0 });
    expect(all.total).toBe(1097);
    expect(all.courses).toHaveLength(25);
    const nextPage = searchContinuingEducation(courses, { limit: 25, offset: 25 });
    expect(nextPage.courses[0]?.courseId).not.toBe(all.courses[0]?.courseId);
    const vowels = searchContinuingEducation(courses, { q: "Accent Reduction", limit: 5 });
    expect(vowels.total).toBeGreaterThan(0);
    expect(vowels.courses[0]?.sections[0]?.dates).toMatch(/\d{4}/);
    expect(vowels.courses[0]?.sections[0]?.fee).toMatch(/^\$/);
    expect(vowels.courses[0]?.feeMeaning).toBe("published-noncredit-section-fee");
    expect(vowels.courses.every((course) => course.noncredit)).toBe(true);
  });

  it("does not promote non-verified evidence into extracted requirements", () => {
    const evidence = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/imports/gap-evidence.json"), "utf8")) as { status: string }[];
    expect(evidence).toHaveLength(211);
    expect(evidence.filter((item) => item.status !== "verified-source").length).toBeGreaterThan(0);
    expect(getCatalog().programs.filter((item) => item.coverage === "requirements-extracted")).toHaveLength(238);
    expect(getProgram("65057")?.completeness).toBe("unresolved");
    expect(getProgram("CPP01")?.coverage).toBe("sheet-not-found");
    expect(getProgram("CPP01")?.verifiedFacts?.some((fact) => fact.value.includes("21 institutional credits"))).toBe(true);
    expect(getProgram("PBC03")?.verifiedFacts?.[0]?.status).toBe("candidate");
  });
});
