import { sources, type SourceRef } from "./sources";

export type StartingPoint =
  | "not-admitted"
  | "admitted-no-degree"
  | "associate-complete";

export type Goal = "associate" | "bachelor" | "certificate";

export type ReportedCourse = "cts1134" | "cts1120" | "cts1111" | "scripting";

export interface Profile {
  startingPoint: StartingPoint;
  goal: Goal;
  reportedCourses: ReportedCourse[];
  workingInTech: boolean;
}

export type Evidence = "requirement" | "recommended" | "verify";

export type StepCategory = "education" | "skill" | "project" | "next";

export interface RoadmapStep {
  id: string;
  category: StepCategory;
  title: string;
  summary: string;
  detail: string;
  evidence: Evidence;
  sources: SourceRef[];
}

export interface RoadmapStage {
  id: string;
  title: string;
  summary: string;
  steps: RoadmapStep[];
}

export interface Roadmap {
  headline: string;
  lede: string;
  stages: RoadmapStage[];
  limits: string[];
}

export const EXAMPLE_STUDENT = {
  label:
    "Fictional example. Alex R. is not a real person, and this is not a student record.",
  profile: {
    startingPoint: "admitted-no-degree",
    goal: "bachelor",
    reportedCourses: ["cts1134"],
    workingInTech: false,
  } satisfies Profile,
};

const CATALOG_CAUTION =
  "The MDC catalog page checked on November 7, 2026 presents a 2026–2028 catalog. The program sheets and sequence guides cited here print effective terms of Spring 2025 (associate and bachelor) or Fall 2023 (certificate). If a newer catalog disagrees with a sheet, your degree audit and an advisor control. This prototype is not that audit.";

const SHEET_NOTE = ` ${CATALOG_CAUTION}`;

function has(profile: Profile, course: ReportedCourse) {
  return profile.reportedCourses.includes(course);
}

function step(partial: RoadmapStep): RoadmapStep {
  return partial;
}

interface ListedCourse {
  id: string;
  reported?: ReportedCourse;
  title: string;
  summary: string;
  detail: string;
  sources: SourceRef[];
}

function listedCourse(profile: Profile, course: ListedCourse): RoadmapStep {
  if (course.reported && has(profile, course.reported)) {
    return step({
      id: `${course.id}-confirm`,
      category: "education",
      evidence: "verify",
      title: `Ask an advisor to confirm ${course.title}`,
      summary:
        "You reported this course as already finished. That report is not a transcript evaluation, a grade check, or an award of credit.",
      detail: `${course.detail} Bring the syllabus or unofficial transcript to advising and ask whether the course, grade, and catalog year satisfy the plan.`,
      sources: course.sources,
    });
  }

  return step({
    id: course.id,
    category: "education",
    evidence: "requirement",
    title: course.title,
    summary: course.summary,
    detail: course.detail,
    sources: course.sources,
  });
}

function scriptingCourse(
  profile: Profile,
  id: string,
  where: "associate" | "certificate",
): RoadmapStep {
  const sourcesFor =
    where === "associate"
      ? [sources.asSheet, sources.asGuide, sources.bsSheet, sources.bsAdmit]
      : [sources.cccSheet, sources.cccGuide, sources.bsAdmit];
  const plan =
    where === "associate"
      ? "The AS program sheet lists CIS 1531 Introduction to Secure Scripting (4 credits) by name."
      : "The certificate program sheet lists CIS 1531 Introduction to Secure Scripting (4 credits) by name.";

  if (has(profile, "scripting")) {
    return step({
      id: `${id}-unmatched`,
      category: "education",
      evidence: "verify",
      title: "Confirm whether your scripting course is CIS 1531",
      summary:
        "You reported one of CIS 1531, COP 1047C, or COP 1334. This plan names CIS 1531. A different scripting course can satisfy the bachelor's prerequisite and still leave CIS 1531 on this plan.",
      detail: `${plan} The BS admission page and the BS program sheet accept CIS 1531, COP 1047C, or COP 1334 for the scripting prerequisite. An advisor has to see which course is actually on your record. This app cannot tell those three apart from a checkbox.`,
      sources: sourcesFor,
    });
  }

  return step({
    id,
    category: "education",
    evidence: "requirement",
    title: "CIS 1531 Introduction to Secure Scripting",
    summary: "4 credits. Listed by name on this credential.",
    detail: `${plan} The bachelor's scripting rule is wider: CIS 1531 or COP 1047C or COP 1334. Choosing a different scripting course for the BS does not, by itself, remove CIS 1531 from the AS or the certificate.`,
    sources: sourcesFor,
  });
}

const asCourses = {
  cgs1060c: {
    id: "as-cgs1060c",
    title: "CGS 1060C Introduction to Computer Technology and Applications",
    summary: "4 credits on the AS program sheet, and one way to meet computer competency.",
    detail:
      "Major course requirement, 4 credits. The program sheet also lists the Computer Competency Test, or this course, under computer competency. The full-time sequence guide places it in semester 1.",
    sources: [sources.asSheet, sources.asGuide],
  },
  cts1134: {
    id: "as-cts1134",
    reported: "cts1134" as const,
    title: "CTS 1134 Networking Technologies",
    summary: "4 credits. The certificate footnote says to take this before CTS 1120.",
    detail:
      "Major course requirement, 4 credits. The certificate sequence guide prints CompTIA Network+ in this course's certification column and says CTS 1134 should be taken before CTS 1120. The AS sequence guide instead lists CTS 1134 and CTS 1120 together in semester 1. Passing Network+ is not printed as a graduation requirement. Ask which section order to use.",
    sources: [sources.asSheet, sources.asGuide, sources.cccGuide],
  },
  cts1120: {
    id: "as-cts1120",
    reported: "cts1120" as const,
    title: "CTS 1120 Cybersecurity Fundamentals",
    summary:
      "4 credits. The program sheet recommends prior knowledge of networking technologies.",
    detail:
      "Major course requirement, 4 credits. Recommended preparation printed on the AS and BS program sheets: prior knowledge of networking technologies. The certificate guide's certification column lists CompTIA Security+. That column means preparation the college associates with the course, not a rule that you must pass Security+ to graduate.",
    sources: [sources.asSheet, sources.cccGuide, sources.bsSheet],
  },
  cgs1700: {
    id: "as-cgs1700",
    title: "CGS 1700 Introduction to Operating Systems",
    summary: "4 credits. The AS sequence guide prints CompTIA Linux+ on this row.",
    detail:
      "Major course requirement, 4 credits, semester 2 on the full-time AS sequence guide. That guide prints CompTIA Linux+ beside CGS 1700. The certificate sequence guide prints CompTIA Linux+ beside CTS 1111 instead. Do not treat either column as proof that the exam is required, or that both courses prepare you for the same sitting. Ask the instructor.",
    sources: [sources.asSheet, sources.asGuide, sources.cccGuide],
  },
  cts1111: {
    id: "as-cts1111",
    reported: "cts1111" as const,
    title: "CTS 1111 Linux+",
    summary: "4 credits on the AS program sheet and a BS common prerequisite.",
    detail:
      "Program course requirement, 4 credits. The certificate guide lists CompTIA Linux+ in this row; the AS sequence guide lists CompTIA Linux+ beside CGS 1700. See that conflict before you pay for an exam. The BS admission page requires CTS 1111 with a C or higher.",
    sources: [sources.asSheet, sources.asGuide, sources.cccGuide, sources.bsAdmit],
  },
  cet2880c: {
    id: "as-cet2880c",
    title: "CET 2880C Digital Forensics",
    summary: "4 credits in semester 4 of the full-time AS sequence.",
    detail:
      "Program course requirement, 4 credits. No prerequisite was printed on this row of the Spring 2025 program sheet. Confirm the section before you register. The AS page says graduates are trained to collect and analyze digital forensic evidence; that is a program outcome statement, not a job offer.",
    sources: [sources.asSheet, sources.asGuide, sources.asPage],
  },
  cis2350: {
    id: "as-cis2350",
    title: "CIS 2350 Cybersecurity Analysis",
    summary: "4 credits. Prerequisites printed as CTS 1120 and CTS 1134.",
    detail:
      "Program course requirement, 4 credits. Program sheet prerequisites: CTS 1120 and CTS 1134. The AS sequence guide's certification column lists CompTIA CySA+. Passing CySA+ is not printed as a graduation requirement.",
    sources: [sources.asSheet, sources.asGuide],
  },
  cts2314: {
    id: "as-cts2314",
    title: "CTS 2314 Network Defense and Countermeasures",
    summary: "4 credits. Read the prerequisite line with an advisor before you register.",
    detail:
      "Program course requirement, 4 credits. The AS program sheet prints the prerequisite as CTS 1120 and CTS 1134 or CTS 1650. The certificate guide prints prerequisites CTS 1120, CTS 1134. The AS sequence guide's certification column lists Certified Network Defender. Ask an advisor to interpret the prerequisite line. Passing that exam is not stated here as a graduation requirement.",
    sources: [sources.asSheet, sources.asGuide, sources.cccGuide],
  },
} satisfies Record<string, ListedCourse>;

function associateCourseSteps(profile: Profile): RoadmapStep[] {
  return [
    listedCourse(profile, asCourses.cgs1060c),
    listedCourse(profile, asCourses.cts1134),
    listedCourse(profile, asCourses.cts1120),
    step({
      id: "as-math",
      category: "education",
      evidence: "requirement",
      title: "Mathematics: MAC 1105 or STA 2023",
      summary:
        "3 credits. The program sheet says to seek advisement for the proper mathematics course.",
      detail:
        "General education mathematics, 3 credits. MAC 1105 College Algebra lists prerequisite MAT 1033. STA 2023 Statistical Methods lists prerequisite MAT 1033 or MGF 1131. A symbol printed after MAT 1033 did not extract cleanly, so do not treat this sentence as the whole footnote. The sheet says students must seek advisement for the proper mathematics course from the discipline chairperson. The full-time guide groups this choice in semester 1.",
      sources: [sources.asSheet, sources.asGuide],
    }),
    listedCourse(profile, asCourses.cgs1700),
    scriptingCourse(profile, "as-cis1531", "associate"),
    listedCourse(profile, asCourses.cts1111),
    step({
      id: "as-enc1101",
      category: "education",
      evidence: "requirement",
      title: "ENC 1101 English Composition",
      summary: "3 credits, with a placement or exemption prerequisite this app does not judge.",
      detail:
        "Communications requirement, 3 credits. The program sheet prerequisite says the student must meet the developmental education reading and writing requirements in State Rule 6A-10.0315 by course, placement score, or an eligible exemption. This prototype does not read scores or decide exemptions.",
      sources: [sources.asSheet, sources.placement],
    }),
    step({
      id: "as-social",
      category: "education",
      evidence: "requirement",
      title: "Social science: AMH 2010, AMH 2020, or POS 2041",
      summary: "3 credits. Both the program sheet and the sequence guide list these three.",
      detail:
        "Choose one: AMH 2010 History of the US to 1877, AMH 2020 History of the US since 1877, or POS 2041 American Federal Government. The BS program sheet later ties civic literacy to these same course numbers plus an assessment, under different rules. Do not assume the associate course alone finishes a bachelor's civic-literacy rule.",
      sources: [sources.asSheet, sources.asGuide, sources.bsSheet],
    }),
    step({
      id: "as-science",
      category: "education",
      evidence: "requirement",
      title: "Natural science, using the program sheet list",
      summary:
        "3 credits. The sequence guide's science line is not identical to the program sheet.",
      detail:
        "Program sheet options: AST 1002, BSC 1005, CHM 1020, ESC 1000, EVR 1001, GLY 1010, OCE 1001, and PHY 1020. The full-time sequence guide also prints PHY 2053 and does not list GLY 1010 or OCE 1001. The guide says to check requisite information with an advisor. Use the program sheet, then confirm the section that is actually offered.",
      sources: [sources.asSheet, sources.asGuide],
    }),
    listedCourse(profile, asCourses.cet2880c),
    listedCourse(profile, asCourses.cis2350),
    listedCourse(profile, asCourses.cts2314),
    step({
      id: "as-electives",
      category: "education",
      evidence: "requirement",
      title: "9 credits of published program electives",
      summary: "The sheet names prefixes and specific courses. An advisor has to open that list with you.",
      detail:
        "Program course elective, 9 credits. The Spring 2025 sheet says any course with the prefixes CAI, CGS, CIS, COP, or CTS can satisfy the starred prefix rule, and it also names CIS 2619, CIS 2900, CJE 1680, CJL 2062, COP 1334, COP 2800, COP 2805C, CTS 1145, CTS 2303, CTS 2670, and CTS 2671. Several of those named courses have prerequisites on the sheet. The sequence guide's elective line is not word-for-word the same. This prototype does not pick electives for you.",
      sources: [sources.asSheet, sources.asGuide],
    }),
    step({
      id: "as-humanities",
      category: "education",
      evidence: "requirement",
      title: "Humanities: one course from the published list",
      summary: "3 credits. LIT 2000 additionally requires ENC 1101.",
      detail:
        "Choose one: ARH 1000, HUM 1020, LIT 2000, MUL 1010, PHI 2010, or THE 2000. The program sheet prints ENC 1101 as a prerequisite to LIT 2000.",
      sources: [sources.asSheet, sources.asGuide],
    }),
  ];
}

function certificateCourseSteps(profile: Profile): RoadmapStep[] {
  return [
    listedCourse(profile, {
      id: "ccc-cts1134",
      reported: "cts1134",
      title: "CTS 1134 Networking Technologies",
      summary: "4 credits. The sequence-guide footnote says to take this before CTS 1120.",
      detail:
        "Certificate major requirement, 4 credits. Certification column on the sequence guide: CompTIA Network+. Footnote: students are recommended to enroll in CTS 1120 and CTS 1134 during mini terms when offered, and CTS 1134 should be taken before CTS 1120. The table itself lists CTS 1111, CTS 1120, and CTS 1134 together in semester 1. Ask an advisor which order your sections should follow. Passing Network+ is not printed as a requirement to earn the certificate.",
      sources: [sources.cccGuide, sources.cccSheet, sources.analystPage],
    }),
    listedCourse(profile, {
      id: "ccc-cts1120",
      reported: "cts1120",
      title: "CTS 1120 Cybersecurity Fundamentals",
      summary: "4 credits. The sequence guide's certification column lists CompTIA Security+.",
      detail:
        "Certificate major requirement, 4 credits. The AS program sheet, which shares this course number, recommends prior knowledge of networking technologies. Passing Security+ is not printed as a graduation requirement.",
      sources: [sources.cccGuide, sources.cccSheet, sources.asSheet],
    }),
    listedCourse(profile, {
      id: "ccc-cts1111",
      reported: "cts1111",
      title: "CTS 1111 Linux+",
      summary: "4 credits. The certificate guide prints CompTIA Linux+ on this row.",
      detail:
        "Certificate major requirement, 4 credits, listed in semester 1 of the certificate sequence table. The AS sequence guide prints CompTIA Linux+ beside CGS 1700 instead. Ask before you pay for an exam. Passing Linux+ is not printed as a requirement to earn the certificate.",
      sources: [sources.cccGuide, sources.cccSheet, sources.asGuide],
    }),
    scriptingCourse(profile, "ccc-cis1531", "certificate"),
    step({
      id: "ccc-cis2350",
      category: "education",
      evidence: "requirement",
      title: "CIS 2350 Cybersecurity Analysis",
      summary: "4 credits. Prerequisites printed as CTS 1120 and CTS 1134.",
      detail:
        "Semester 2 on the certificate sequence guide. Certification column: CompTIA CySA+. The program sheet uses the title Cybersecurity Analysis (CySA+). Passing the exam is not printed as a requirement to earn the certificate.",
      sources: [sources.cccGuide, sources.cccSheet],
    }),
    step({
      id: "ccc-cts2314",
      category: "education",
      evidence: "requirement",
      title: "CTS 2314 Network Defense and Countermeasures",
      summary: "4 credits. Certificate guide prerequisites: CTS 1120 and CTS 1134.",
      detail:
        "Semester 2, 4 credits. The certificate documents print prerequisites CTS 1120 and CTS 1134. The AS program sheet's line for the same course number also mentions CTS 1650. Ask an advisor which prerequisite line applies to the section you want. No industry exam is printed in this row of the certificate guide.",
      sources: [sources.cccGuide, sources.cccSheet, sources.asSheet],
    }),
  ];
}

function upperDivisionSteps(): RoadmapStep[] {
  const upper = [sources.bsSheet, sources.bsCourses, sources.exploreNorth];
  const courses: Array<[string, string, string]> = [
    [
      "bs-cis3215",
      "CIS 3215 Ethics in Cybersecurity",
      "4 credits on the Spring 2025 BS program sheet. No prerequisite was printed on that row.",
    ],
    [
      "bs-cis3360",
      "CIS 3360 Principles of Information Security",
      "4 credits. Program sheet prerequisite: CTS 1134 or CTS 1650. The BS courses page titles this 'Principles in Information Security.' The North Campus explore page says 'Principles of Information Security' and prints the same prerequisite. Use the program sheet title, and ask which wording is on the current syllabus.",
    ],
    [
      "bs-cis3361",
      "CIS 3361 Information Security Management",
      "4 credits. Program sheet prerequisite: CIS 3360. The North Campus page prints the same prerequisite.",
    ],
    [
      "bs-cis4204",
      "CIS 4204 Ethical Hacking I",
      "4 credits. Program sheet prerequisite: CIS 3360. The North Campus page prints the same prerequisite. This prototype does not describe hacking techniques. Enroll only through the college, and test only systems you are authorized to test.",
    ],
    [
      "bs-cis4378",
      "CIS 4378 Ethical Hacking II",
      "4 credits. Program sheet prerequisite: CIS 4204. The North Campus explore page instead lists CIS 4359 Ethical Hacking II with prerequisite CIS 4204. Those are different course numbers. Do not register from the North page alone. Ask which code is active.",
    ],
    [
      "bs-cis4364",
      "CIS 4364 Intrusion Detection and Incident Response",
      "4 credits. Program sheet prerequisite: CIS 3360. This course appears on the BS courses page in the fourth semester of that sequence. It was not in the shorter core-class list on the North Campus explore page.",
    ],
    [
      "bs-cis4366",
      "CIS 4366 Computer Forensics",
      "4 credits. Program sheet prerequisite: CIS 3360. The North Campus page lists Computer Forensics without printing a prerequisite on that line. Follow the program sheet, then confirm.",
    ],
    [
      "bs-cis4388",
      "CIS 4388 Advanced Computer Forensics",
      "4 credits. Program sheet prerequisite: CIS 4366. Listed on the BS courses page. Not in the shorter North Campus core-class list checked on November 7, 2026.",
    ],
    [
      "bs-cnt3409c",
      "CNT 3409C Network Security",
      "4 credits. Program sheet prerequisite: CIS 3360. This course is an upper-division requirement on the program sheet. It did not appear in the five-semester sequence extracted from the BS courses page on November 7, 2026. Ask which document controls your catalog year.",
    ],
    [
      "bs-cis4891",
      "CIS 4891 Capstone Project",
      "4 credits. The program sheet says departmental approval is required. The courses page lists it in a fifth semester with program electives. The fifth-semester credit total was not fully shown in the page text checked on November 7, 2026, so this prototype does not invent one.",
    ],
  ];

  return [
    ...courses.map(([id, title, detail]) =>
      step({
        id,
        category: "education",
        evidence: "requirement",
        title,
        summary:
          "Upper-division requirement on the BS program sheet. Not a course to register for until you are admitted to the bachelor's program.",
        detail: `${detail} The courses page mixes some general education into its semester sequence. This list follows the program sheet's upper-division block, not a promise that North Campus offers every section.`,
        sources: upper,
      }),
    ),
    step({
      id: "bs-electives",
      category: "education",
      evidence: "requirement",
      title: "12 credits of BS program electives",
      summary: "The sheet prints prefixes. One of them, CET, has no asterisk in the extract.",
      detail:
        "Program electives, 12 credits. The Spring 2025 sheet prints CAI*, CAP*, CEN*, CET, CGS*, CIS*, CNT*, COP*, CTS*. CET is printed without an asterisk. This prototype does not guess what that difference means. The courses page shows two program electives in the fifth semester, at 3–4 credits each, which does not by itself add up to the sheet's 12 credits. Ask an advisor.",
      sources: [sources.bsSheet, sources.bsCourses],
    }),
    step({
      id: "bs-gened",
      category: "education",
      evidence: "verify",
      title: "Finish the 36-credit general education block on a degree audit",
      summary:
        "The BS sheet requires 36 general education credits with a C or higher. An associate does not automatically finish that block.",
      detail:
        "The program sheet says students entering with an AS or AAS may need more general education to reach 36 credits, and students entering with an AA may need more electives for background. Group C of the lower division is 16 credits of transferable type-1 or type-2 courses; the sheet says to see an advisor and does not define those types here. The courses page places ENC 1102, a MAC or STA math course, humanities, natural science, and social science inside the bachelor's sequence. Your audit, not this list, decides what is still open. Civic literacy, foreign language, computer competency, Gordon Rule writing and math, and MDC residency are printed as further graduation rules on the sheet.",
      sources: [sources.bsSheet, sources.bsCourses],
    }),
  ];
}

function skillSteps(profile: Profile): RoadmapStep[] {
  const steps: RoadmapStep[] = [];
  const early = profile.goal !== "bachelor" || profile.startingPoint !== "associate-complete";

  if (early) {
    steps.push(
      step({
        id: "skill-comptia-map",
        category: "skill",
        evidence: "recommended",
        title: "Map the four CompTIA exams the college names, after an advisor confirms the course",
        summary:
          "Recommended study step. Not a graduation requirement in the documents checked.",
        detail:
          "The AS page and the Cybersecurity Analyst page say students are prepared for CompTIA Security+, Linux+, Network+, and CySA+. Sequence guides place exam names in certification columns beside courses, and those columns disagree about Linux+ (CGS 1700 on the AS guide, CTS 1111 on the certificate guide). Read the vendor's current objectives only after an advisor or instructor says that exam matches your section. The sequence guides say some certification costs may be eligible for reimbursement. That is not a promise of payment, and this prototype has no prices. Passing an exam is a separate event from earning the credential.",
        sources: [sources.asPage, sources.analystPage, sources.asGuide, sources.cccGuide],
      }),
    );
  }

  if (profile.goal === "bachelor") {
    steps.push(
      step({
        id: "skill-bs-cert-names",
        category: "skill",
        evidence: "recommended",
        title: "Treat bachelor's certification names as exam preparation, not as courses you have finished",
        summary:
          "The program sheet and the BS overview page do not list the same exam names.",
        detail:
          "The Spring 2025 BS program sheet says the courses prepare students for certifications such as Certified Ethical Hacker, Computer Hacking Forensics Investigator, and Certified Information Security Manager. The BS overview page also lists Certified Incident Handler. None of these pages say you must hold the certification to graduate, and this prototype does not schedule exams or quote fees. Ethical-hacking coursework is a college course with a printed prerequisite. It is not instructions to test a network you do not own.",
        sources: [sources.bsSheet, sources.bsPage],
      }),
    );
  }

  steps.push(
    step({
      id: profile.workingInTech ? "skill-work-language" : "skill-outcomes-language",
      category: "skill",
      evidence: "recommended",
      title: profile.workingInTech
        ? "Write the work you already do in the college's course language"
        : "Restate the published program outcomes in your own words",
      summary: "A study habit. It does not earn credit and it does not replace a course.",
      detail: profile.workingInTech
        ? "List tasks you already perform that resemble published titles such as networking, Linux, or information security. Leave out attack procedures. The certificate sequence guide says students may accelerate through credit for prior learning or credit for an industry certification. Ask an advisor whether any of that applies to you. Do not assume it does."
        : "The AS page says students are taught to defend computer systems; scan, footprint, and enumerate networks; do penetration testing of applications, wireless networks, and mobile platforms; collect and analyze digital forensic evidence; and conduct incident response. Those verbs are the college's outcome statement. Use them as vocabulary for advising questions. This prototype does not teach scanning or testing techniques.",
      sources: profile.workingInTech
        ? [sources.cccGuide, sources.asSheet]
        : [sources.asPage],
    }),
  );

  return steps;
}

function projectSteps(profile: Profile): RoadmapStep[] {
  const projects: RoadmapStep[] = [
    step({
      id: "project-advisor-sheet",
      category: "project",
      evidence: "recommended",
      title: "One-page question sheet for advising",
      summary:
        "Recommended project for this prototype. It is not an MDC assignment and it is not graded.",
      detail: advisorProjectDetail(profile),
      sources: [sources.asPage, sources.admissions, sources.bsAdmit],
    }),
  ];

  if (profile.goal === "certificate") {
    projects.push(
      step({
        id: "project-ccc-grid",
        category: "project",
        evidence: "recommended",
        title: "Six-course grid for the Cybersecurity Analyst certificate",
        summary: "Copy the six published course numbers into a grid and leave the grade column blank.",
        detail:
          "Rows: CTS 1134, CTS 1120, CTS 1111, CIS 1531, CIS 2350, CTS 2314. Add the prerequisite note from the sequence guide on CIS 2350 and CTS 2314. Add a column labeled 'self-reported, not evaluated' for anything you already checked in this app. Take the grid to entec@mdc.edu. Do not fill in a grade you have not earned.",
        sources: [sources.cccGuide, sources.cccSheet, sources.analystPage],
      }),
    );
  }

  if (!profile.workingInTech && profile.reportedCourses.length === 0) {
    projects.push(
      step({
        id: "project-account-hygiene",
        category: "project",
        evidence: "recommended",
        title: "Personal account and device checklist",
        summary:
          "A beginner project with no scanning, no exploit practice, and no college credit.",
        detail:
          "Write down whether each personal account you care about has a unique password, multi-factor authentication, and a backup you have actually restored once. Note which devices still need software updates. Bring questions, not a security engagement, to your first advising appointment. This is ordinary hygiene, not the penetration-testing outcome described on the AS page.",
        sources: [sources.asPage],
      }),
    );
  }

  if (profile.goal === "associate" || (profile.goal === "bachelor" && profile.startingPoint !== "associate-complete")) {
    projects.push(
      step({
        id: "project-career-titles",
        category: "project",
        evidence: "recommended",
        title: "Pick a job title from the AS page and write why you want to ask about it",
        summary:
          "The college lists titles. Listing a title is not a job offer and not a salary claim.",
        detail:
          "The AS page says career opportunities include, but are not limited to: Security Operations Center (SOC) Analyst, Cybersecurity Specialist, Incident Responder, Security System Administrator, Security Consultant, Cybersecurity Analyst, and Cybersecurity Manager / Administrator. Choose one. Write five questions an advisor or instructor could answer. This prototype does not repeat salary or shortage figures that appear on some MDC program pages.",
        sources: [sources.asPage],
      }),
    );
  }

  if (profile.goal === "bachelor" && (profile.startingPoint === "associate-complete" || has(profile, "scripting"))) {
    projects.push(
      step({
        id: "project-ethics-note",
        category: "project",
        evidence: "recommended",
        title: "Ethics note to take into Ethical Hacking I",
        summary:
          "A writing project tied to CIS 4204. It does not include testing steps.",
        detail:
          "Draft a short statement you can revise in CIS 3215 Ethics in Cybersecurity and CIS 4204 Ethical Hacking I: you will only examine systems you own or have written permission to test, you will stop if permission is unclear, and you will follow the syllabus. The program sheet requires CIS 3360 before CIS 4204. This note does not waive that prerequisite.",
        sources: [sources.bsSheet, sources.bsPage],
      }),
    );
  }

  if (
    profile.goal === "bachelor" &&
    profile.startingPoint === "associate-complete" &&
    missingPrerequisites(profile).length === 0
  ) {
    projects.push(
      step({
        id: "project-capstone-questions",
        category: "project",
        evidence: "recommended",
        title: "Questions for the capstone, not a capstone proposal",
        summary: "CIS 4891 requires departmental approval on the program sheet.",
        detail:
          "Write three questions about what departmental approval for CIS 4891 looks like, what a capstone is allowed to touch, and how the fifth semester on the courses page relates to the 12 elective credits on the program sheet. Do not draft an attack plan. You reported the common prerequisites; an advisor still has to confirm them before this project is timely.",
        sources: [sources.bsSheet, sources.bsCourses],
      }),
    );
  }

  if (profile.workingInTech) {
    projects.push(
      step({
        id: "project-prior-learning-notes",
        category: "project",
        evidence: "recommended",
        title: "Prior-learning notes for the advisor",
        summary:
          "The certificate guide says acceleration may be possible. It does not say your job counts.",
        detail:
          "On one page, list certificates you already hold and courses you think match CTS 1134, CTS 1120, CTS 1111, or a scripting option. Quote the certificate sequence guide's sentence that students may accelerate via credit for prior learning or credit for attained industry certifications, and ask entec@mdc.edu or bscybersecurity@mdc.edu what evidence they accept. Leave the decision column blank.",
        sources: [sources.cccGuide, sources.analystPage],
      }),
    );
  }

  return projects;
}

function advisorProjectDetail(profile: Profile): string {
  const missing = missingPrerequisites(profile);
  const lines = [
    "Include your starting point in your own words, the credential you selected in this prototype, and the sentence: this website did not evaluate a transcript.",
  ];
  if (profile.startingPoint === "not-admitted") {
    lines.push("Ask what still has to happen before you can register, including transcripts and any placement rule that applies to you.");
  }
  if (profile.goal === "certificate") {
    lines.push("Ask whether plan 66061 is offered on the campus you want this term. The North Campus explore page does not name that plan code.");
  }
  if (profile.goal === "bachelor") {
    lines.push(
      missing.length
        ? `Ask how the still-open common prerequisites fit a schedule: ${missing.join("; ")}.`
        : "Ask the bachelor's advisor to verify the four common prerequisites, the 2.5 GPA rule, and general education. You reported the course checkboxes; that is not verification.",
    );
  }
  if (profile.goal === "associate") {
    lines.push("Ask for the current plan 25079 sequence at North Campus and which of the self-reported boxes, if any, match the degree audit.");
  }
  return lines.join(" ");
}

function missingPrerequisites(profile: Profile): string[] {
  const missing: string[] = [];
  if (!has(profile, "cts1134")) missing.push("CTS 1134 Networking Technologies");
  if (!has(profile, "cts1120")) missing.push("CTS 1120 Cybersecurity Fundamentals");
  if (!has(profile, "cts1111")) missing.push("CTS 1111 Linux+");
  if (!has(profile, "scripting")) {
    missing.push("one of CIS 1531, COP 1047C, or COP 1334");
  }
  return missing;
}

function nextStep(profile: Profile): RoadmapStep {
  const north =
    "North Campus administration publishes the address 11380 NW 27th Avenue, Miami, FL 33167. The AS and certificate pages list entec@mdc.edu and 305-237-3676. The bachelor's pages list bscybersecurity@mdc.edu. The Cybersecurity Center of the Americas address on the degree-programs page is Wolfson Campus, 300 NE Second Avenue, Miami, FL 33132, (305) 237-3626.";

  if (profile.startingPoint === "not-admitted") {
    return step({
      id: "next-apply",
      category: "next",
      evidence: "requirement",
      title: "Submit the MDC application and write the technology advisors",
      summary:
        "Admission is the documented first college step. Email entec@mdc.edu before you assume a North Campus section is open.",
      detail: `${north} The admissions page says new students complete the application and pay a $30 non-refundable fee, and that returning students do not pay that fee. High school graduates who were dual-enrollment students need a new application. Procedure 4000 is the fee-and-waiver document for other applicant types; read it before you pay if you are an international student, a baccalaureate applicant, or someone who may qualify for a waiver. This prototype only repeats the $30 figure printed on the admissions page.`,
      sources: [sources.admissions, sources.procedure4000, sources.asPage, sources.exploreNorth, sources.northOffice],
    });
  }

  if (profile.startingPoint === "associate-complete" && profile.goal === "bachelor") {
    const missing = missingPrerequisites(profile);
    if (missing.length === 0) {
      return step({
        id: "next-bs-review",
        category: "next",
        evidence: "verify",
        title: "Ask bachelor's advising to review admission, not to skip it",
        summary:
          "You reported an associate degree and all four common-prerequisite groups. Email bscybersecurity@mdc.edu and say this website did not evaluate your transcript.",
        detail: `${north} Ask them to check the published minimums: completed AA or AS, or at least 60 college credits including general education, from a regionally or nationally accredited institution; a 2.5 cumulative GPA; and a C or higher in CTS 1120, CTS 1134, CTS 1111, and one of CIS 1531, COP 1047C, or COP 1334. Also ask whether an AS leaves you short of 36 general education credits. Self-reporting courses in this app does not meet any of those rules.`,
        sources: [sources.bsAdmit, sources.bsSheet, sources.bsPage],
      });
    }
    return step({
      id: "next-bs-prereqs",
      category: "next",
      evidence: "verify",
      title: "Ask which missing common prerequisites you still have to take",
      summary: `You reported an associate degree. These boxes are still empty: ${missing.join("; ")}.`,
      detail: `${north} The admission page requires those courses with a C or higher, along with the degree-or-60-credit rule and a 2.5 cumulative GPA. An empty box means you did not claim the course. It does not mean the college has decided you lack it. A checked box does not mean the college has accepted it.`,
      sources: [sources.bsAdmit, sources.bsSheet],
    });
  }

  if (profile.startingPoint === "associate-complete" && profile.goal === "associate") {
    return step({
      id: "next-second-associate",
      category: "next",
      evidence: "verify",
      title: "Ask whether a second associate is the right next credential",
      summary:
        "You reported an associate degree and also selected the AS. This app will not build a gap analysis.",
      detail: `${north} Ask whether the degree you finished is already plan 25079, a different AS, or an AA, and what remains if plan 25079 is still the goal. The BS may be the more direct published route if the associate already satisfies the bachelor's admission page. That is a question, not a recommendation this prototype can personalize from a checkbox.`,
      sources: [sources.asSheet, sources.bsAdmit, sources.asPage],
    });
  }

  if (profile.startingPoint === "associate-complete" && profile.goal === "certificate") {
    return step({
      id: "next-ccc-after-degree",
      category: "next",
      evidence: "verify",
      title: "Ask whether plan 66061 is still a useful credential after your associate",
      summary:
        "The certificate courses use numbers that also appear in the AS. Overlap is an advisor question.",
      detail: `${north} The certificate guide says the CCC is a pathway toward the AS, which is the opposite direction from someone who already finished an associate. Ask whether any of CTS 1111, CTS 1120, CTS 1134, CIS 1531, CIS 2350, and CTS 2314 are already on the degree you finished, and whether a Certificate of Professional Preparation is the document you actually want. Course lists for the CPP options were not verified in this prototype.`,
      sources: [sources.cccGuide, sources.degreePrograms, sources.analystPage],
    });
  }

  if (profile.goal === "certificate") {
    return step({
      id: "next-ccc-campus",
      category: "next",
      evidence: "verify",
      title: "Ask where plan 66061 is offered this term",
      summary:
        "You are admitted, in your own words, and you want the certificate first. Campus is not assumed.",
      detail: `${north} The School of Engineering and Technology program list includes the Cybersecurity Analyst CCC. The North Campus explore page says the Cybersecurity AS is new at North and, separately, names a certificate called Network Security. It does not print plan code 66061. Ask entec@mdc.edu which plan that North Campus line refers to before you enroll.`,
      sources: [sources.entec, sources.exploreNorth, sources.analystPage, sources.inventory],
    });
  }

  if (profile.goal === "bachelor") {
    const missing = missingPrerequisites(profile);
    return step({
      id: "next-bs-via-associate",
      category: "next",
      evidence: "verify",
      title: "Ask advising to choose the route that can qualify you for the bachelor's",
      summary:
        missing.length
          ? `The BS admission page will not take you from zero credits. Still open on your checklist: ${missing.join("; ")}.`
          : "You reported the four common-prerequisite groups and also said you have no associate yet. The admission page still requires an AA, an AS, or 60 credits including general education.",
      detail: `${north} A published route is the AS in Cybersecurity, plan 25079. The AS sequence guide says that associate is a pathway to the BS. The admission page also allows a different AA or AS, or 60 credits with general education, from a regionally or nationally accredited institution, plus a 2.5 GPA and the common prerequisites at a C or higher. Email bscybersecurity@mdc.edu and entec@mdc.edu with the route question. Do not register for upper-division courses because they appear later in this roadmap.`,
      sources: [sources.bsAdmit, sources.asGuide, sources.exploreNorth, sources.bsSheet],
    });
  }

  return step({
    id: "next-as-sequence",
    category: "next",
    evidence: "verify",
    title: "Book advising for the next plan 25079 course you have not already reported",
    summary:
      "You said you are admitted and you want the associate. The first education step below that is not a confirmation is the one to ask about.",
    detail: `${north} The North Campus explore page invites students into the Cybersecurity AS. It does not publish a section schedule. Ask which of the Spring 2025 sequence is offered on North Campus, and whether any course you checked in this app is already on the audit. The public AS page's tuition, credit, and time cells were empty when checked; use the 60-credit program sheet for the credit total and do not invent a personal calendar.`,
    sources: [sources.exploreNorth, sources.asSheet, sources.asPage, sources.admissions],
  });
}

function admissionStages(profile: Profile): RoadmapStage[] {
  if (profile.startingPoint === "not-admitted") {
    return [
      {
        id: "stage-admit",
        title: "Get admitted to the college",
        summary:
          "These are published admissions steps. They do not reserve a seat in a cybersecurity class.",
        steps: [
          step({
            id: "admit-apply",
            category: "education",
            evidence: "requirement",
            title: "Complete the MDC admission application",
            summary:
              "The admissions page says admission stays incomplete until required official transcripts arrive.",
            detail:
              "Start the application and select a major from MDC's academic programs when the application asks. The same page prints a $30 non-refundable application fee for that step and says returning students do not pay it. Dual-enrollment graduates of high school need a new application. Procedure 4000 covers other fees and waiver categories. This app does not collect an application and does not store your records.",
            sources: [sources.admissions, sources.procedure4000],
          }),
          step({
            id: "admit-transcripts",
            category: "education",
            evidence: "requirement",
            title: "Send official transcripts from every high school and college",
            detail:
              "The admissions page says applicants must request final official transcripts from all secondary and postsecondary schools, sent electronically by a third party or by mail from the institution. A document you upload into this prototype would not count, and this prototype does not accept uploads.",
            summary: "Transcripts go to the college, not to this website.",
            sources: [sources.admissions],
          }),
          step({
            id: "admit-placement",
            category: "education",
            evidence: "verify",
            title: "Ask which placement rule applies before you try to register",
            summary:
              "Many degree-seeking students need scores or an exemption on file. Many others are exempt. This app does not decide which you are.",
            detail:
              "The placement page says the State Board of Education requires public state colleges to use common placement tests or alternate methods prior to the completion of initial registration, except for EAP students, and that a registration hold prevents registration until scores or qualifying high school grades are in the student record. It also lists exemptions, including students who entered 9th grade in a Florida public school in 2003–2004 or later and earned a standard Florida public high school diploma. Home-education students and students with a GED or a private-school diploma are not in that particular exemption. Active-duty military and students who already earned an associate or higher from an institution MDC recognizes are also discussed, with documentation rules. Read the page with admissions. Do not assume a score this prototype never saw.",
            sources: [sources.placement, sources.admissions],
          }),
          step({
            id: "admit-residency",
            category: "education",
            evidence: "verify",
            title: "Submit Florida residency documents if you want them considered",
            summary:
              "The admissions page ties in-state tuition to at least 12 months in Florida and says immigration status is a factor.",
            detail:
              "This prototype does not determine residency and does not quote a tuition rate. The public AS and BS pages have tuition cells that were empty in the text checked on November 7, 2026.",
            sources: [sources.admissions, sources.asPage, sources.bsPage],
          }),
          step({
            id: "admit-orientation",
            category: "education",
            evidence: "requirement",
            title: "Watch for new-student orientation",
            summary:
              "The admissions page says new students get orientation details by MDC email and leave with a course schedule.",
            detail:
              "Orientation is where the page says you meet an assigned advisor and register. Returning students are told to meet an advisor instead. Financial aid, including a prompt to file the FAFSA even if you think you will not qualify, is a separate item on that same page. This roadmap does not estimate aid.",
            sources: [sources.admissions],
          }),
        ],
      },
    ];
  }

  if (profile.startingPoint === "admitted-no-degree") {
    return [
      {
        id: "stage-admitted",
        title: "Use the admission you say you already have",
        summary:
          "You told this prototype you are admitted. Nothing here checked MyMDC, a hold, or a transcript.",
        steps: [
          step({
            id: "admitted-advisor",
            category: "education",
            evidence: "verify",
            title: "Meet an academic advisor and bring prior transcripts",
            summary:
              "The admissions page says returning students meet an advisor to go over transcripts and register.",
            detail:
              "Ask the advisor to confirm you are actually admitted to the plan you want, that required transcripts are in, and whether a placement hold still applies. The placement page describes holds and exemptions. This screen cannot see them. If your admission is to a different major, ask what it takes to select Cybersecurity.",
            sources: [sources.admissions, sources.placement, sources.exploreNorth],
          }),
        ],
      },
    ];
  }

  return [
    {
      id: "stage-associate-claimed",
      title: "Treat the associate degree as a claim, not a fact in our database",
      summary:
        "You said an associate degree is finished. This prototype does not know the school, the major, the date, or the GPA.",
      steps: [
        step({
          id: "claimed-degree",
          category: "education",
          evidence: "verify",
          title: "Ask MDC to evaluate the associate degree you finished",
          summary:
            "Official transcripts still have to come from the school that awarded the degree, if they are not already on file.",
          detail:
            "The placement page lists an exemption path for students who earned an associate degree or higher from an institution MDC recognizes, and it says official documentation is required. The BS program sheet says an AS or AAS may leave you short of 36 general education credits, and an AA may leave you short of background electives. Neither sentence evaluates your degree.",
          sources: [sources.placement, sources.bsSheet, sources.admissions],
        }),
      ],
    },
  ];
}

function credentialStages(profile: Profile): RoadmapStage[] {
  if (profile.goal === "certificate") {
    return [
      {
        id: "stage-ccc",
        title: "Cybersecurity Analyst College Credit Certificate, plan 66061",
        summary:
          "24 credits on the program sheet and the sequence guide. Effective term printed: Fall 2023 (2237). CIP 0511100314.",
        steps: [
          step({
            id: "ccc-overview",
            category: "education",
            evidence: "requirement",
            title: "Use plan 66061 as the certificate, and check the campus",
            summary:
              "The college describes this as a head start that may lead to the AS and then the BS. 'May' is the college's word.",
            detail: `The sequence guide's academic-pathway note says the certificate is a pathway to the AS in Cybersecurity, plan 25079, and that the AS leads to the BS. It also says some exam costs may be eligible for reimbursement and that credit for prior learning or industry certifications may accelerate the program. Confirm both before you rely on them. The certificate web page says the program takes 1 year or less. The sequence guide is two full-time semesters of 12 credits. Part-time study will not match either sentence automatically. The inventory lists plan 66061. The North Campus explore page does not.${SHEET_NOTE}`,
            sources: [
              sources.cccGuide,
              sources.cccSheet,
              sources.analystPage,
              sources.inventory,
              sources.exploreNorth,
              sources.catalog,
            ],
          }),
          step({
            id: "ccc-order",
            category: "education",
            evidence: "verify",
            title: "Resolve the semester-1 order with an advisor",
            summary:
              "The table and the footnote do not tell the same story about CTS 1134 and CTS 1120.",
            detail:
              "Table order for semester 1: CTS 1111, CTS 1120, CTS 1134. Footnote: CTS 1134 should be taken before CTS 1120, and those two are recommended in mini terms when offered. Semester 2 is CIS 1531, CIS 2350, and CTS 2314, with prerequisites on the last two. This prototype lists CTS 1134 first because of the footnote, and it says so. It is not a registration override.",
            sources: [sources.cccGuide],
          }),
          ...certificateCourseSteps(profile),
        ],
      },
    ];
  }

  const asStage = (title: string, summary: string): RoadmapStage => ({
    id: "stage-as",
    title,
    summary,
    steps: [
      step({
        id: "as-overview",
        category: "education",
        evidence: "requirement",
        title: "Read plan 25079 before you treat this list as your schedule",
        summary:
          "60 credits. CIP 1511100308. Program sheet and full-time sequence guide: effective Spring 2025 (2253).",
        detail: `The AS page says the degree is for students looking for immediate entry into a career, that most courses relate to the career, and that the rest are general education. It says the program is NSA-validated for academic years 2022–2027 and that graduates receive that validation on the transcript, tied to MDC's CAE-CD designation. North Campus calls the AS new at North Campus. The sequence guide says the AS is a pathway to the BS. None of those sentences promise employment, a seat, or a personal timeline. The public web page's tuition, credit, and time cells were empty when checked; the 60-credit figure is from the program sheet and the sequence guide. General education on this AS sheet is 15 credits, which is not the 36-credit bachelor's general education block.${SHEET_NOTE}`,
        sources: [sources.asPage, sources.asSheet, sources.asGuide, sources.exploreNorth, sources.catalog],
      }),
      ...associateCourseSteps(profile),
    ],
  });

  if (profile.goal === "associate") {
    if (profile.startingPoint === "associate-complete") {
      return [
        {
          id: "stage-as-already",
          title: "Plan 25079 only if an advisor says you still need it",
          summary:
            "The course list is reference material for the conversation, not a new degree plan this app has calculated.",
          steps: [
            step({
              id: "as-already-stop",
              category: "education",
              evidence: "verify",
              title: "Do not re-enroll through this list until the audit says a course is unmet",
              summary:
                "You reported a finished associate degree and selected the AS again. Those two facts can conflict.",
              detail:
                "Ask whether you already completed plan 25079. If you completed a different associate, ask whether a second associate is appropriate or whether the BS admission path fits better. The courses below are the published AS requirements so you can point at them. Checking a box above only changes a course from 'enroll' to 'please confirm.'",
              sources: [sources.asSheet, sources.bsAdmit],
            }),
            ...associateCourseSteps(profile),
          ],
        },
      ];
    }
    return [asStage(
      "Associate in Science in Cybersecurity, plan 25079",
      "Published full-time order, adjusted only when you report a course as already done. Not your degree audit.",
    )];
  }

  const bachelorStages: RoadmapStage[] = [
    {
      id: "stage-bs-rule",
      title: "Bachelor's admission is a separate gate",
      summary:
        "Plan S9515, 120 credits, CIP 1101110031, program sheet effective Spring 2025. Admission is not the same thing as graduating.",
      steps: [
        step({
          id: "bs-admit-rule",
          category: "education",
          evidence: "requirement",
          title: "Meet the published BS admission minimums",
          summary:
            "AA, AS, or at least 60 credits including general education; 2.5 cumulative GPA; four common prerequisites at C or higher.",
          detail:
            "The admission page requires a completed MDC application; an associate of arts, an associate in science, or at least 60 college credits including general education, from a regionally or nationally accredited institution, before admission; a minimum 2.5 cumulative GPA; and a C or higher in CTS 1120, CTS 1134, CTS 1111, and one of CIS 1531, COP 1047C, or COP 1334. The program sheet's graduation GPA is different: a minimum 2.0 cumulative GPA, with a C or better on general education and upper-division requirements, and at least 120 unduplicated credits. This prototype cannot see your GPA.",
          sources: [sources.bsAdmit, sources.bsSheet, sources.bsPage],
        }),
        step({
          id: "bs-scripting-rule",
          category: "education",
          evidence: has(profile, "scripting") ? "verify" : "requirement",
          title: has(profile, "scripting")
            ? "Ask which scripting course satisfies the BS rule"
            : "Complete one BS scripting option",
          summary: has(profile, "scripting")
            ? "You reported CIS 1531, COP 1047C, or COP 1334. The admission page needs the actual course and a C or higher."
            : "The admission page accepts CIS 1531, COP 1047C, or COP 1334. The AS and the certificate specifically require CIS 1531.",
          detail:
            "Group B of the BS program sheet is the same three-course choice, 4 credits. Reporting 'a scripting course' in this app does not identify which one, and it does not clear CIS 1531 off the associate or the certificate if you are also following those plans.",
          sources: [sources.bsAdmit, sources.bsSheet, sources.asSheet, sources.cccSheet],
        }),
      ],
    },
  ];

  if (profile.startingPoint !== "associate-complete") {
    bachelorStages.push(
      asStage(
        "One published route to those 60 credits: the Cybersecurity AS",
        "The admission page does not require this specific associate. The sequence guide does call it a pathway to the BS. The courses below are plan 25079 if you and an advisor choose it.",
      ),
    );
  } else {
    const missing = missingPrerequisites(profile);
    bachelorStages.push({
      id: "stage-prereq-gaps",
      title: "Common prerequisites still to confirm",
      summary:
        missing.length
          ? "Checked boxes are skipped here. Empty boxes stay on the list as courses to ask about."
          : "Every common-prerequisite box is checked. Each one still needs an advisor and a grade of C or higher.",
      steps: [
        listedCourse(profile, {
          ...asCourses.cts1120,
          id: "bs-gap-cts1120",
        }),
        listedCourse(profile, {
          ...asCourses.cts1134,
          id: "bs-gap-cts1134",
        }),
        listedCourse(profile, {
          ...asCourses.cts1111,
          id: "bs-gap-cts1111",
        }),
        step({
          id: has(profile, "scripting") ? "bs-gap-scripting-confirm" : "bs-gap-scripting",
          category: "education",
          evidence: has(profile, "scripting") ? "verify" : "requirement",
          title: has(profile, "scripting")
            ? "Confirm the scripting course and the grade"
            : "Complete CIS 1531, COP 1047C, or COP 1334",
          summary: has(profile, "scripting")
            ? "You reported one of the three accepted scripting courses."
            : "Any one of the three meets the admission page. A C or higher is required.",
          detail:
            "This step exists because you said the associate degree is finished, so the full AS sequence is not listed as remaining work. The scripting course may already be inside that degree. Only the college can see that.",
          sources: [sources.bsAdmit, sources.bsSheet],
        }),
      ],
    });
  }

  bachelorStages.push({
    id: "stage-bs-upper",
    title: "After BS admission: upper-division requirements",
    summary:
      "40 upper-division credits on the Spring 2025 program sheet, plus 12 elective credits. Not your next registration if you are not admitted to the BS.",
    steps: [
      step({
        id: "bs-recognition",
        category: "education",
        evidence: "verify",
        title: "Read the NSA validation dates before you repeat them",
        summary:
          "The BS page says NSA validation of the bachelor's runs from 2024 through 2029.",
        detail:
          "The page says students graduating from the bachelor's receive NSA validation on the transcript, and that the program was built following the NICE framework and NSA guidelines. The AS page's validation window is printed as academic years 2022–2027. Those are college statements about designation, not a promise that a particular section is designated, and not a hiring commitment. The courses page mentions agreements that may let graduates continue to a master's; the sentence checked on November 7, 2026 did not name the schools in the text this prototype used, so no partner is listed here.",
        sources: [sources.bsPage, sources.bsCourses, sources.asPage],
      }),
      ...upperDivisionSteps(),
    ],
  });

  return bachelorStages;
}

function extraStages(profile: Profile): RoadmapStage[] {
  const stages: RoadmapStage[] = [];
  if (profile.workingInTech) {
    stages.push({
      id: "stage-cpp",
      title: "Shorter professional certificates: descriptions only",
      summary:
        "You said you already work in technology. These two certificates are published. Their course lists were not verified for this prototype.",
      steps: [
        step({
          id: "cpp-defense",
          category: "education",
          evidence: "verify",
          title: "Read about the Cyber Defense Certificate of Professional Preparation",
          summary:
            "Inventory plan PBC04. Curriculum, credits, price, and campus were not confirmed here.",
          detail:
            "The degree-programs page says the CPP in Cyber Defense is for current and pre-professionals interested in cybersecurity operations: analyzing events and mitigating attacks and breaches. The academic program inventory lists award type CPP, plan PBC04, Florida CIP 5554304030, program name Cyber Defense. No course sequence was fetched for this build. Ask an advisor for the current curriculum before you enroll. Do not treat this card as a class list.",
          sources: [sources.degreePrograms, sources.inventory],
        }),
        step({
          id: "cpp-vulnerability",
          category: "education",
          evidence: "verify",
          title: "Read about the Vulnerability Assessment CPP",
          summary: "Inventory plan PBC07. Curriculum was not confirmed here either.",
          detail:
            "The degree-programs page says this CPP prepares you to assess the security health of applications, systems, and networks and to recommend mitigation. The inventory lists plan PBC07, Florida CIP 5551110030, program name Vulnerability Assessment. Course identifiers are intentionally absent. If a flyer or another page disagrees with the inventory name, use the advisor and the current catalog.",
          sources: [sources.degreePrograms, sources.inventory],
        }),
      ],
    });
  }

  stages.push({
    id: "stage-skills",
    title: "Skills to practice around the courses",
    summary:
      "Recommended. None of these replace a course, an exam, or an advisor.",
    steps: skillSteps(profile),
  });

  stages.push({
    id: "stage-projects",
    title: "Projects you can finish without a lab login",
    summary:
      "Recommended by this student prototype. They are not MDC assignments, and they do not include attack instructions.",
    steps: projectSteps(profile),
  });

  return stages;
}

const GOAL_LABEL: Record<Goal, string> = {
  associate: "Associate in Science in Cybersecurity",
  bachelor: "Bachelor of Science in Cybersecurity",
  certificate: "Cybersecurity Analyst College Credit Certificate",
};

const START_LABEL: Record<StartingPoint, string> = {
  "not-admitted": "before you are admitted to MDC",
  "admitted-no-degree": "after admission, before an associate degree",
  "associate-complete": "after an associate degree you say is finished",
};

export function buildRoadmap(profile: Profile): Roadmap {
  const reported = profile.reportedCourses.length;
  const stages: RoadmapStage[] = [
    {
      id: "stage-next",
      title: "Do this next",
      summary: "The single best-supported action for the answers you gave. It is not an admissions decision.",
      steps: [nextStep(profile)],
    },
    ...admissionStages(profile),
    ...credentialStages(profile),
    ...extraStages(profile),
  ];

  return {
    headline: `${GOAL_LABEL[profile.goal]}, ${START_LABEL[profile.startingPoint]}`,
    lede: [
      reported === 0
        ? "No cybersecurity courses were marked complete."
        : `${reported} self-reported course ${reported === 1 ? "box is" : "boxes are"} checked, and each one still needs an advisor.`,
      profile.workingInTech
        ? "You said you already work in technology, so shorter professional certificates and prior-learning notes are included."
        : "Work experience was not selected, so those notes stay off this path.",
      "Changing the goal or the starting point changes which credentials and courses appear.",
    ].join(" "),
    stages,
    limits: [
      "Independent student prototype for the SharkByte 2026 MDC North Campus challenge. Not an official Miami Dade College service, not a degree audit, and not a transcript evaluation.",
      CATALOG_CAUTION,
      "North Campus section offerings were not confirmed course by course. The explore page says the Cybersecurity AS is new at North Campus.",
      "Salary figures, hiring guarantees, transfer guarantees, and personal timelines are omitted on purpose, including numbers that appear on some MDC marketing pages.",
      "Checked boxes and completed steps live only in this browser. Clearing site data or using another device removes them.",
    ],
  };
}

export function allSteps(roadmap: Roadmap): RoadmapStep[] {
  return roadmap.stages.flatMap((stage) => stage.steps);
}

export function stepsByCategory(roadmap: Roadmap, category: StepCategory): RoadmapStep[] {
  return allSteps(roadmap).filter((item) => item.category === category);
}

export function evidenceLabel(evidence: Evidence): string {
  if (evidence === "requirement") return "Documented college step";
  if (evidence === "recommended") return "Recommended, not a graduation requirement";
  return "Verify with an advisor";
}

export function roadmapToText(roadmap: Roadmap, profile: Profile, exampleLabel?: string): string {
  const lines: string[] = [
    "North Path",
    "Independent student prototype. Not an official Miami Dade College service.",
    "",
    roadmap.headline,
    roadmap.lede,
    "",
  ];
  if (exampleLabel) {
    lines.push(exampleLabel, "");
  }
  lines.push(
    `Starting point: ${profile.startingPoint}`,
    `Goal: ${profile.goal}`,
    `Self-reported courses: ${profile.reportedCourses.join(", ") || "none"}`,
    `Working in technology: ${profile.workingInTech ? "yes" : "no"}`,
    "",
  );
  roadmap.stages.forEach((stage, index) => {
    lines.push(`${index + 1}. ${stage.title}`, stage.summary, "");
    stage.steps.forEach((item) => {
      lines.push(`- ${item.title}`, `  ${evidenceLabel(item.evidence)}`, `  ${item.summary}`, `  ${item.detail}`);
      item.sources.forEach((itemSource) => {
        lines.push(`  Source: ${itemSource.label} (${itemSource.url}), checked ${itemSource.checked}`);
      });
      lines.push("");
    });
  });
  lines.push("Limits");
  roadmap.limits.forEach((limit) => lines.push(`- ${limit}`));
  return lines.join("\n");
}
