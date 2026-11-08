import { describe, expect, it } from "vitest";
import {
  allSteps,
  buildRoadmap,
  EXAMPLE_STUDENT,
  roadmapToText,
  type Profile,
} from "./roadmap";

function ids(profile: Profile) {
  return allSteps(buildRoadmap(profile)).map((item) => item.id);
}

const base: Profile = {
  startingPoint: "not-admitted",
  goal: "associate",
  reportedCourses: [],
  workingInTech: false,
};

describe("buildRoadmap", () => {
  it("keeps the certificate path on plan 66061 and off the bachelor's sequence", () => {
    const idList = ids({ ...base, goal: "certificate" });
    expect(idList).toContain("admit-apply");
    expect(idList).toContain("ccc-cts1134");
    expect(idList).toContain("ccc-cis2350");
    expect(idList).not.toContain("as-cet2880c");
    expect(idList).not.toContain("bs-cis3215");
  });

  it("uses the associate sequence when that goal is selected", () => {
    const idList = ids({ ...base, goal: "associate" });
    expect(idList).toContain("as-cet2880c");
    expect(idList).toContain("as-math");
    expect(idList).toContain("as-enc1101");
    expect(idList).not.toContain("ccc-overview");
    expect(idList).not.toContain("bs-cis4204");
  });

  it("adds bachelor's admission and upper division without dropping the associate route", () => {
    const idList = ids({ ...base, goal: "bachelor" });
    expect(idList).toContain("bs-admit-rule");
    expect(idList).toContain("as-cgs1060c");
    expect(idList).toContain("bs-cis3215");
    expect(idList).toContain("bs-cnt3409c");
    expect(idList).not.toContain("ccc-overview");
  });

  it("does not rebuild the associate sequence after a claimed associate degree", () => {
    const profile: Profile = {
      startingPoint: "associate-complete",
      goal: "bachelor",
      reportedCourses: ["cts1134", "cts1120", "cts1111", "scripting"],
      workingInTech: false,
    };
    const idList = ids(profile);
    expect(idList).not.toContain("as-cgs1060c");
    expect(idList).not.toContain("as-math");
    expect(idList).toContain("next-bs-review");
    expect(idList).toContain("bs-gap-cts1120-confirm");
    expect(idList).not.toContain("bs-gap-cts1120");
    expect(idList).toContain("project-capstone-questions");
    expect(idList).toContain("project-ethics-note");
  });

  it("turns a reported networking course into an advisor confirmation", () => {
    const plain = ids({ ...base, startingPoint: "admitted-no-degree" });
    const reported = ids({
      ...base,
      startingPoint: "admitted-no-degree",
      reportedCourses: ["cts1134"],
    });
    expect(plain).toContain("as-cts1134");
    expect(plain).not.toContain("as-cts1134-confirm");
    expect(reported).toContain("as-cts1134-confirm");
    expect(reported).not.toContain("as-cts1134");
  });

  it("does not treat an unnamed scripting course as CIS 1531", () => {
    const idList = ids({
      ...base,
      goal: "certificate",
      reportedCourses: ["scripting"],
    });
    expect(idList).toContain("ccc-cis1531-unmatched");
    expect(idList).not.toContain("ccc-cis1531");
    const bachelor = buildRoadmap({
      startingPoint: "associate-complete",
      goal: "bachelor",
      reportedCourses: ["scripting"],
      workingInTech: false,
    });
    const scripting = allSteps(bachelor).find((item) => item.id === "bs-scripting-rule");
    expect(scripting?.title).toMatch(/Ask which scripting course/i);
  });

  it("adds professional-certificate reading only when work experience is selected", () => {
    expect(ids(base)).not.toContain("cpp-defense");
    expect(ids({ ...base, workingInTech: true })).toContain("cpp-defense");
    expect(ids({ ...base, workingInTech: true })).toContain("cpp-vulnerability");
    expect(ids({ ...base, workingInTech: true })).toContain("project-prior-learning-notes");
  });

  it("changes the step list when the goal changes", () => {
    const associate = ids({ ...base, startingPoint: "admitted-no-degree", goal: "associate" }).join("|");
    const certificate = ids({ ...base, startingPoint: "admitted-no-degree", goal: "certificate" }).join("|");
    const bachelor = ids({ ...base, startingPoint: "admitted-no-degree", goal: "bachelor" }).join("|");
    expect(associate).not.toBe(certificate);
    expect(associate).not.toBe(bachelor);
    expect(certificate).not.toBe(bachelor);
  });

  it("exports source links and does not describe the fictional example as a real record", () => {
    const roadmap = buildRoadmap(EXAMPLE_STUDENT.profile);
    const text = roadmapToText(roadmap, EXAMPLE_STUDENT.profile, EXAMPLE_STUDENT.label);
    expect(text).toContain("https://www.mdc.edu/cybersecuritybs/admission-requirements.aspx");
    expect(text).toContain("November 7, 2026");
    expect(text).toContain("Fictional example");
    expect(text).not.toContain("student record number");
    expect(JSON.stringify(roadmap)).not.toContain("Alex");
  });
});
