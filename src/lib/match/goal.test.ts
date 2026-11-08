import { describe, expect, it } from "vitest";
import { getDirectory } from "../directory/build";
import { matchGoal, rankDiscover } from "./goal";

const programs = getDirectory().programs;

describe("goal matching", () => {
  it("matches nursing to program names and does not treat that as eligibility", () => {
    const result = matchGoal("nursing", programs);
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.every((item) => /nurs/i.test(item.program.name))).toBe(true);
    expect(result.note).toMatch(/not eligibility/i);
  });

  it("says so when no program name or CIP title contains the words", () => {
    const result = matchGoal("underwater basket weaving", programs);
    expect(result.matches).toHaveLength(0);
    expect(result.note).toMatch(/Nothing was invented/i);
  });

  it("ranks discover from selected CIP groups without a hardcoded career", () => {
    const titles = new Map(getDirectory().groups.map((group) => [group.id, group.officialTitle ?? group.label]));
    const ranked = rankDiscover({ groupIds: ["cip-51"], activity: "", award: "associate" }, programs, titles);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((item) => item.program.cip2 === "51")).toBe(true);
    expect(ranked.every((item) => ["AS", "AA", "AAS", "AA-PATHWAY"].includes(item.program.awardType))).toBe(true);
    expect(ranked.some((item) => /cyber/i.test(item.program.name))).toBe(false);
    const empty = rankDiscover({ groupIds: [], activity: "", award: "any" }, programs, titles);
    expect(empty).toHaveLength(0);
  });
});
