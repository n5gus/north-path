import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const research = process.env.GAP_RESEARCH ?? "/tmp/gap-research";
const catalogPath = path.join(root, "data/catalog/catalog.json");
const reportPath = path.join(root, "data/catalog/coverage-report.json");
const importDir = path.join(root, "data/catalog/imports");
mkdirSync(importDir, { recursive: true });

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const guides = JSON.parse(readFileSync(path.join(research, "aa-course-sequence-guides.json"), "utf8"));
const fiu = JSON.parse(readFileSync(path.join(research, "fiu-mdc-transfer-guides.json"), "utf8"));
const links = JSON.parse(readFileSync(path.join(research, "aa-to-fiu-candidate-links.json"), "utf8"));
const evidence = JSON.parse(readFileSync(path.join(research, "evidence.json"), "utf8"));

function program(id) {
  const found = catalog.programs.find((item) => item.id === id || item.planCode === id);
  if (!found) throw new Error(`missing program ${id}`);
  return found;
}

function note(item, text) {
  item.notes = item.notes ?? [];
  if (!item.notes.includes(text)) item.notes.push(text);
}

function sheetQuote(file, snippet) {
  const text = readFileSync(path.join(root, "data/snapshots/sheets", file), "utf8");
  if (!text.includes(snippet)) throw new Error(`${file} missing quote: ${snippet}`);
  return text;
}

sheetQuote("56016.txt", "150 Clock Hours");
sheetQuote("56016.txt", "138 Hours/4.6 Credits");
sheetQuote("56016.txt", "12 Hours/0.4 Credits");
const classB = program("56016");
classB.unit = "clock";
classB.clockHours = 150;
classB.credits = 5;
classB.completeness = "complete-small";
note(classB, "Sheet header prints 150 clock hours and a 5-credit equivalent. Planning uses 150 clock hours and does not bill college-credit tuition.");
for (const group of classB.requirements) {
  for (const course of group.children ?? []) {
    if (course.courseId === "TRA 0084") course.clockHours = 138;
    if (course.courseId === "TRA 0084L") course.clockHours = 12;
  }
}

sheetQuote("57004.txt", "492 contact hours/16.4 credits");
const fire = program("57004");
fire.unit = "clock";
fire.clockHours = 492;
fire.credits = 16.4;
fire.completeness = "complete-small";
note(fire, "Sheet prints 492 contact hours and a 16.4-credit equivalent. Planning uses 492 contact hours and does not bill college-credit tuition.");

const law = program("57022");
if (!readFileSync(path.join(root, "data/snapshots/sheets/57022.txt"), "utf8").includes("25.66 credits")) {
  throw new Error("57022 header changed");
}
law.completeness = "suspected-unit";
law.unit = "credit";
note(law, "Sheet lists 25.66 vocational credits, not a clock-hour total. The clock-hour suspicion was not verified, so no clock total was stored and the per-credit fee table is not applied.");

const completeSmall = ["51000", "56015", "56016", "58000", "57023", "57006", "57004"];
for (const id of completeSmall) {
  const item = program(id);
  item.completeness = "complete-small";
  note(item, "The program sheet's course rows are the whole printed program. A short list is not treated as missing courses.");
}
program("65100").completeness = "open-choice";
note(program("65100"), "Group C is any transferable course and several groups are prefix wildcards. Those were not expanded into invented courses.");
const garbled = program("65057");
garbled.completeness = "unresolved";
note(garbled, "Candidate parse is garbled (a course prefix is missing and the effective term is blank). It was not promoted to a verified course list.");

sheetQuote("51000.txt", "800 Hours/26.6 Credits");
sheetQuote("51000.txt", "800 Hours/26.5 Credits");
note(program("51000"), "The same sheet prints 26.6 credits in the header and 26.5 in the requirements line. Both figures are kept; neither was chosen as a tuition total. Effective term prints Spring 2203.");
program("51000").conflicts = program("51000").conflicts ?? [];
if (!program("51000").conflicts.some((item) => item.field === "printedCreditEquivalent")) {
  program("51000").conflicts.push({
    field: "printedCreditEquivalent",
    values: [
      { source: "https://www.mdc.edu/academics/programs/ps/51000.pdf", value: "header 26.6 credits" },
      { source: "https://www.mdc.edu/academics/programs/ps/51000.pdf", value: "requirements line 26.5 credits" },
    ],
  });
}

const facts = {
  CPP01: [
    { label: "Department program size", value: "21 institutional credits, 7 courses, 110 clinical hours", status: "verified-source", sourceUrl: "https://www.mdc.edu/education/excel/educator-preparation-institute-epi/" },
    { label: "Admission printed on the department page", value: "Bachelor's degree with a minimum 2.5 GPA, plus the printed EPI steps", status: "verified-source", sourceUrl: "https://www.mdc.edu/education/excel/educator-preparation-institute-epi/" },
    { label: "Credit type", value: "Institutional credit. Not stored as transferable associate or bachelor credit.", status: "verified-source", sourceUrl: "https://www.mdc.edu/educatorpreparation/" },
    { label: "Older sheet 69000", value: "Conflicting: code 69000, Fall 2017, a 9-credit header lists 12 credits. Not used as the current course list.", status: "conflicting", sourceUrl: "https://www.mdc.edu/academics/programs/ps/69000.pdf" },
  ],
  PBC02: [
    { label: "Courses named on the department page", value: "RED 4033, RED 4342, RED 4541, RED 4654, RED 4854", status: "verified-source", sourceUrl: "https://www.mdc.edu/education/excel/endorsements-programs/reading-endorsement/" },
    { label: "Prerequisite", value: "RED 4342 lists prerequisite RED 4033, 3 credit hours, and 60 in-service clinical hours", status: "verified-source", sourceUrl: "https://www.mdc.edu/asa/documents/competencies/pdf/RED4342%20Application%20of%20Research-Based%20Instructional%20Practices.pdf" },
    { label: "Remaining credits", value: "Credit totals for the courses other than RED 4342 were not on the fetched page.", status: "unresolved", sourceUrl: "https://www.mdc.edu/education/excel/endorsements-programs/reading-endorsement/" },
  ],
  PBC03: [
    { label: "Published size", value: "5 courses x 3 credits. Course titles were not on the fetched page.", status: "candidate", sourceUrl: "https://www.mdc.edu/education/excel/" },
  ],
};
for (const [id, rows] of Object.entries(facts)) {
  const item = program(id);
  item.verifiedFacts = rows;
  note(item, "Department pages supply the facts below. They were not turned into a complete generated pathway.");
}

const fiuById = new Map(fiu.map((guide) => [guide.guideId, guide]));
const alignments = links.filter((link) => link.status === "candidate" && link.match === "exact-normalized-name" && link.aaPathwayId);
if (alignments.length !== 11) throw new Error(`expected 11 name alignments, found ${alignments.length}`);

for (const guide of guides) {
  const item = program(guide.programId);
  item.sequenceGuide = {
    url: guide.url,
    effectiveTerm: guide.effectiveTerm,
    programTotal: guide.programTotal ?? null,
    rowStatus: "candidate",
    candidateCourseCount: (guide.courseRowsCandidate ?? []).length,
  };
  note(item, `Course sequence guide ${guide.effectiveTerm} is a suggested full-time sequence. Parsed rows stay candidates and were not written as required courses. The 2024-2026 catalog label is unchanged.`);
}
for (const id of ["AA-11211", "AA-10803"]) {
  const item = program(id);
  item.sequenceGuide = {
    url: "",
    effectiveTerm: "",
    programTotal: null,
    rowStatus: "missing",
    candidateCourseCount: 0,
  };
  note(item, "No MDC course sequence guide was found for this pathway. Requirements stay unknown.");
}
for (const link of alignments) {
  const guide = fiuById.get(link.guideId);
  const item = program(link.aaPathwayId);
  item.fiuAlignment = {
    guideId: link.guideId,
    degree: guide?.degree ?? link.fiuGuideTitle,
    status: "candidate-name-alignment",
    note: "Exact normalized name match only. Not transfer credit, stackability, or admission.",
  };
}

const aaOut = {
  asOf: "2026-11-08",
  core: {
    credits: 60,
    generalEducation: 36,
    pathwayElectives: 24,
    edition: "Effective Fall 2026",
    status: "verified-source",
    sourceUrl: "https://www.mdc.edu/academics/programs/ps/associate-in-arts-pathway-guide-effective-2026.pdf",
    quote: "PATHWAY ELECTIVES 24 Credits",
    limitation: "This core split is the Fall 2026 pathway guide. It is not the 2024-2026 catalog narrative and not a 2026-2028 CurriQunet extract.",
  },
  guides: guides.map((guide) => ({
    programId: guide.programId,
    name: guide.name,
    url: guide.url,
    effectiveTerm: guide.effectiveTerm,
    semesterTotals: guide.semesterTotals,
    programTotal: guide.programTotal,
    rowStatus: "candidate",
    courses: (guide.courseRowsCandidate ?? []).map((row) => ({
      courseId: row.course,
      title: row.title,
      credits: row.credits,
      role: "candidate-listed-row",
    })),
  })),
  missingProgramIds: ["AA-11211", "AA-10803"],
};
writeFileSync(path.join(importDir, "aa-sequence-guides.json"), JSON.stringify(aaOut));

writeFileSync(
  path.join(importDir, "fiu-mdc-guides.json"),
  JSON.stringify({
    asOf: "2026-11-08",
    edition: "2026-2027",
    destination: "Florida International University",
    status: "captured-guide",
    limitation: "These are FIU transfer-guide pages for students coming from MDC. They are not an MDC degree audit, not a stackability map, and not an admission or equivalency guarantee.",
    guides: fiu,
  }),
);
writeFileSync(path.join(importDir, "aa-fiu-links.json"), JSON.stringify({ asOf: "2026-11-08", alignments }, null, 2));
copyFileSync(path.join(research, "ce-courses.json"), path.join(importDir, "ce-snapshot.json"));
writeFileSync(
  path.join(importDir, "ce-snapshot-meta.json"),
  JSON.stringify({
    asOf: "2026-11-08",
    courses: 1097,
    coursesWithSections: 653,
    sections: 1778,
    noncredit: true,
    limitation: "Public CE pages on the fetch date. Fees are noncredit section prices, not college-credit tuition. Dates can include sections that have ended. No seat or availability guarantee.",
  }, null, 2),
);
writeFileSync(path.join(importDir, "gap-evidence.json"), JSON.stringify(evidence));

const report = JSON.parse(readFileSync(reportPath, "utf8"));
report.gapImport = {
  asOf: "2026-11-08",
  clockCorrected: ["56016", "57004"],
  unitUnresolved: ["57022"],
  completeSmall: completeSmall,
  openChoice: ["65100"],
  unresolvedPartial: ["65057"],
  aaGuides: guides.length,
  aaGuidesMissing: ["AA-11211", "AA-10803"],
  aaCore: "36 general education + 24 pathway electives, Fall 2026 guide",
  fiuGuides: fiu.length,
  fiuNameAlignments: alignments.length,
  ceCourses: 1097,
  ceSections: 1778,
  evidenceRecords: evidence.length,
  evidenceNotPromotedToVerifiedRequirements: evidence.filter((item) => item.status !== "verified-source").length,
  requirementsExtractedNotReaudited: report.coverageCounts["requirements-extracted"],
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(catalogPath, JSON.stringify(catalog));
console.log("gap import wrote catalog and supplements");
