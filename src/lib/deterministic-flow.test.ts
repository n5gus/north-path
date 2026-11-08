import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getCatalog, getProgram } from "./catalog/load";
import { getDirectory } from "./directory/build";
import { DIRECTORY_PAGE_SIZE, directoryPage } from "./directory/page";
import { matchGoal, rankDiscover } from "./match/goal";
import { buildPlan, type StudentConstraints } from "./planner/engine";

const constraints: StudentConstraints = {
  residency: "resident",
  modality: "unknown",
  weeklyHours: 12,
  budgetPerTerm: null,
  budgetTotal: null,
  completedCourseIds: [],
  termLengthWeeks: 16,
  hoursPerCreditPerWeek: 3,
};

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) found.push(full);
  }
  return found;
}

describe("deterministic search and planning", () => {
  it("matches a career phrase and plans the first catalog hit without a model", () => {
    const programs = getDirectory().programs;
    const matches = matchGoal("nursing", programs);
    expect(matches.matches.length).toBeGreaterThan(0);
    expect(matches.matches.every((item) => /nurs/i.test(item.program.name))).toBe(true);
    const program = getProgram(matches.matches[0].program.id);
    expect(program).toBeTruthy();
    const plan = buildPlan(program!, constraints, getCatalog().fees.rates);
    expect(plan.programId).toBe(program!.id);
    expect(plan.apiVersion).toBe("1");
    expect(plan.sectionOfferings).toBe("unknown");
  });

  it("ranks discover from a CIP group and pages the directory and continuing education", () => {
    const directory = getDirectory();
    const titles = new Map(directory.groups.map((group) => [group.id, group.officialTitle ?? group.label]));
    const ranked = rankDiscover({ groupIds: ["cip-51"], activity: "", award: "associate" }, directory.programs, titles);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((item) => item.program.cip2 === "51")).toBe(true);
    const page = directoryPage(directory.programs.filter((program) => program.awardType !== "CE"), 0);
    expect(DIRECTORY_PAGE_SIZE).toBe(12);
    expect(page.items).toHaveLength(12);
    const ce = directoryPage(Array.from({ length: 20 }, (_, index) => index), 0, 6);
    expect(ce.items).toHaveLength(6);
  });

  it("keeps Gemini calls and key settings out of the app source", () => {
    const files = [
      ...sourceFiles(path.join(process.cwd(), "src")),
      path.join(process.cwd(), "README.md"),
      path.join(process.cwd(), "docs", "API.md"),
      path.join(process.cwd(), "data", "DATA_DICTIONARY.md"),
    ];
    const banned = /GEMINI_|generativelanguage|Ask Gemini|gemini-3\./;
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(banned);
    }
  });
});
