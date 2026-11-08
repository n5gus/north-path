import { describe, expect, it } from "vitest";
import { getCatalog } from "../catalog/load";
import { buildDirectory } from "./build";

describe("directory index", () => {
  const index = buildDirectory(getCatalog().programs);

  it("groups every indexed program once", () => {
    expect(index.programCount).toBe(331);
    const ids = index.groups.flatMap((group) => group.programIds);
    expect(ids).toHaveLength(331);
    expect(new Set(ids).size).toBe(331);
  });

  it("keeps continuing education visible and unclassified codes unnamed", () => {
    const ce = index.groups.find((group) => group.id === "ce");
    expect(ce?.programIds).toEqual(["CE-PUBLIC-SEARCH"]);
    expect(ce?.meaning).toMatch(/no course rows/i);
    const unclassified = index.groups.find((group) => group.id === "unclassified");
    expect(unclassified?.programIds).toContain("C6037");
    expect(unclassified?.officialTitle).toBeNull();
    expect(unclassified?.meaning).toMatch(/invented/i);
  });

  it("labels shared-course links and does not create transfer edges", () => {
    const linked = index.programs.filter((program) => program.relations.length > 0);
    expect(linked.length).toBeGreaterThan(0);
    for (const program of index.programs) {
      for (const relation of program.relations) {
        expect(relation.meaning).toBe("shared-required-course");
        expect(relation.courseId).toMatch(/^[A-Z]{3} \d{4}/);
        expect(relation.programId).not.toBe(program.id);
      }
    }
  });
});
