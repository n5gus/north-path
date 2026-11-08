/**
 * Reproducible public-source ingestion for North Path.
 * Reads committed snapshots, optionally refetches program-sheet PDFs,
 * and writes data/catalog/catalog.json plus coverage-report.json.
 *
 * Usage: node scripts/ingest/build-catalog.mjs [--fetch]
 * Without --fetch, uses data/snapshots/sheets/*.txt already saved.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const snap = path.join(root, "data/snapshots");
const sheetDir = path.join(snap, "sheets");
const outDir = path.join(root, "data/catalog");
const AS_OF = "2026-11-07";
const fetchSheets = process.argv.includes("--fetch");
const USER_AGENT = "NorthPathResearch/1.0 (educational catalog ingestion; polite)";

const INVENTORY_URL = "https://www.mdc.edu/academics/documents/academic-programs-cip.pdf";
const TUITION_URL = "https://www.mdc.edu/student-financial-services/tuition-fees/";
const ONLINE_TUITION_URL = "https://online.mdc.edu/tuition/tuition-and-costs/";
const CALENDAR_URL = "https://www.mdc.edu/academics/calendar/";
const CE_URL = "https://ce.mdc.edu/search/publicCourseAdvancedSearch.do?method=load";
const CURRICUNET_URL = "https://mdc.curricunet.com/catalog";
const CATALOG_2024_URL = "https://www.mdc.edu/academics/documents/2024-2026MDCCollegeCatalog.pdf";

function source(partial) {
  return {
    url: partial.url,
    title: partial.title,
    asOf: AS_OF,
    edition: partial.edition ?? null,
    effectiveTerm: partial.effectiveTerm ?? null,
    page: partial.page ?? null,
    note: partial.note ?? null,
  };
}

function parseInventory(text) {
  const rows = [];
  const award = "AA|AAS|APPR|AS|ATC|ATD|BAS|BS|CCC|CPP|CTC";
  const re = new RegExp(
    `^\\s*(${award})\\s+(\\d{2}\\.\\d{4})\\s+(\\d{10})\\s+(\\S+)\\s+(.+?)\\s*$`,
  );
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/\s+/g, " ").trim();
    const match = line.match(re);
    if (!match) continue;
    let name = match[5].trim();
    let soc = null;
    const socMatch = name.match(/^(.*)\s(\d{6}|999999)$/);
    if (socMatch) {
      name = socMatch[1].trim();
      soc = socMatch[2];
    }
    rows.push({
      awardType: match[1],
      cip6: match[2],
      cip10: match[3],
      planCode: match[4],
      name,
      soc,
    });
  }
  return rows;
}

function rightColumnTitle(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const indent = raw.length - raw.trimStart().length;
  const split = trimmed.match(/^(.*?)\s{4,}(\S.*)$/);
  const candidate = split ? split[2].trim() : indent >= 20 ? trimmed : null;
  if (!candidate || candidate.length < 3 || candidate.length > 60) return null;
  if (/[.]$/.test(candidate)) return null;
  if (/Associate in Arts \| Code:|MDC Catalog|DEGREE \(AA\)|STUDENTS SHOULD/i.test(candidate)) return null;
  if (/\b(offers|students|pathway|prepares|curriculum|college)\b/i.test(candidate)) return null;
  if (candidate.length > 48 && !candidate.includes("(")) return null;
  if (candidate.includes("  ")) return null;
  return candidate;
}

function parseAaPathways(text) {
  const titled = new Map();
  let pendingRight = null;
  let pendingLeft = null;
  for (const raw of text.split(/\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const indent = raw.length - raw.trimStart().length;
    const codes = [...trimmed.matchAll(/Associate in Arts \| Code: (\d{5}) \| (\d+) credits/g)];
    if (codes.length > 0) {
      const usable = (title) =>
        Boolean(title) &&
        !/[,:]$/.test(title) &&
        (title.match(/\(/g) || []).length === (title.match(/\)/g) || []).length;
      const assign = (match, title) => {
        if (!match || !usable(title) || titled.has(match[1])) return;
        titled.set(match[1], {
          planCode: `AA-${match[1]}`,
          pathwayCode: match[1],
          credits: Number(match[2]),
          name: title,
          titleVerified: true,
        });
      };
      if (codes.length >= 2) {
        assign(codes[0], pendingLeft);
        assign(codes[1], pendingRight);
        pendingLeft = null;
        pendingRight = null;
      } else {
        const onRight = indent >= 20 || codes[0].index > 0;
        assign(codes[0], onRight ? pendingRight : pendingLeft);
        if (onRight) pendingRight = null;
        else pendingLeft = null;
      }
      const titleish = (value) =>
        value.length >= 3 &&
        value.length <= 60 &&
        !/[.]$/.test(value) &&
        !value.includes("  ") &&
        !/\b(offers|students|pathway|prepares|curriculum|college)\b/i.test(value);
      const before = trimmed.slice(0, codes[0].index).trim();
      const after = trimmed.slice(codes[codes.length - 1].index + codes[codes.length - 1][0].length).trim();
      if (titleish(before)) pendingLeft = before;
      if (titleish(after)) {
        const continues =
          pendingRight &&
          (/[,:(]$/.test(pendingRight) || (after.includes(")") && pendingRight.includes("(")));
        pendingRight = continues ? `${pendingRight} ${after}` : after;
      }
      continue;
    }
    const split = trimmed.match(/^(.*?)\s{4,}(\S.*)$/);
    if (split) {
      const left = split[1].trim();
      if (left.length >= 3 && left.length <= 60 && !/[.:,]$/.test(left) && !left.includes("  ")) pendingLeft = left;
    }
    const rightTitle = rightColumnTitle(raw);
    if (rightTitle) {
      const continues =
        pendingRight &&
        (/[,:(]$/.test(pendingRight) || /^[a-z]/.test(rightTitle) || (rightTitle.includes(")") && pendingRight.includes("(")));
      pendingRight = continues ? `${pendingRight} ${rightTitle}` : rightTitle;
      continue;
    }
    if (indent < 8 && trimmed.length <= 60 && !/[.:,]$/.test(trimmed) && !trimmed.includes("  ")) {
      pendingLeft = trimmed;
    }
  }
  const seen = new Map();
  const re = /Associate in Arts \| Code: (\d{5}) \| (\d+) credits/g;
  for (const match of text.matchAll(re)) {
    if (seen.has(match[1])) continue;
    const known = titled.get(match[1]);
    seen.set(
      match[1],
      known ?? {
        planCode: `AA-${match[1]}`,
        pathwayCode: match[1],
        credits: Number(match[2]),
        name: `Associate in Arts pathway ${match[1]}`,
        titleVerified: false,
      },
    );
  }
  return [...seen.values()];
}

function parsePrerequisite(text) {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  if (/department(?:al)? approval|permission|chairperson|advisor/i.test(cleaned) && !/[A-Z]{3}\s?\d{4}/.test(cleaned)) {
    return { op: "permission", detail: cleaned };
  }
  if (/test|placement|TEAS|TABE|score|Rule 6A/i.test(cleaned) && !/[A-Z]{3}\s?\d{4}/.test(cleaned)) {
    return { op: "test", name: cleaned, detail: cleaned };
  }
  const ids = [...cleaned.matchAll(/([A-Z]{3})\s?(\d{4}[A-Z]?)/g)].map((m) => `${m[1]} ${m[2]}`);
  const unique = [...new Set(ids)];
  if (unique.length === 0) return { op: "unknown", text: cleaned };
  if (unique.length === 1 && !/ or | and /i.test(cleaned)) return { op: "course", id: unique[0] };
  if (/ or /i.test(cleaned) && !/ and /i.test(cleaned)) return { op: "or", args: unique.map((id) => ({ op: "course", id })) };
  if (/ and /i.test(cleaned) && !/ or /i.test(cleaned)) return { op: "and", args: unique.map((id) => ({ op: "course", id })) };
  if (/ or /i.test(cleaned)) return { op: "or", args: unique.map((id) => ({ op: "course", id })), note: cleaned };
  return { op: "unknown", text: cleaned };
}

function parseSheet(text, planCode) {
  const flat = text.replace(/\u000c/g, "\n").replace(/[ \t]+/g, " ");
  const lines = flat.split(/\n/).map((line) => line.trim()).filter((line) => line && line !== "---OR---" && line !== "---AND---");
  const codeLine = (flat.match(/Code:\s*[A-Z0-9]+[^\n]+/) || [""])[0];
  const codeMatch = codeLine.match(/Code:\s*([A-Z0-9]+)/);
  const clockHeader = codeLine.match(/(\d+(?:\.\d+)?)\s+hours(?:\s*\((\d+(?:\.\d+)?) credit hours\))?/i);
  const creditMatch = clockHeader ? null : codeLine.match(/(\d+(?:\.\d+)?)\s+credits/i);
  const effective = (flat.match(/Effective Term:\s*([^\n]+)/) || [])[1]?.trim() ?? null;
  const courses = [];
  const groups = [];
  let current = { title: "Program requirements", minCredits: null, lines: [] };
  const courseRe = /^([A-Z]{3})\s*(\d{4}[A-Z]?)\s+(.+)$/;
  const headingRe = /^([A-Z][A-Z0-9 /,&'().:-]{6,}?)\s*\((\d+(?:\.\d+)?)\s+Credits\)/i;

  function flush() {
    if (current.lines.length === 0 && current.minCredits == null) return;
    groups.push(current);
    current = { title: "Program requirements", minCredits: null, lines: [] };
  }

  let pending = null;
  for (const line of lines) {
    if (/^---OR---$|^---AND---$/i.test(line)) {
      if (pending) pending.connector = line.includes("OR") ? "or" : "and";
      continue;
    }
    const heading = line.match(headingRe);
    if (heading && !courseRe.test(line)) {
      flush();
      current = { title: heading[1].trim(), minCredits: Number(heading[2]), lines: [] };
      pending = null;
      continue;
    }
    const course = line.match(courseRe);
    if (course) {
      const rest = course[3];
      const clock = rest.match(/(\d+(?:\.\d+)?)\s+hours\s*\|\s*(\d+(?:\.\d+)?)\s+credits/i)
        || rest.match(/(\d+(?:\.\d+)?)\s+contact hours\/(\d+(?:\.\d+)?)\s+credits/i);
      const credit = rest.match(/\((\d+(?:\.\d+)?) credits\)/i) || rest.match(/(\d+(?:\.\d+)?)\s+cr\.?(?:\s|$)/i);
      let prereqText = (rest.match(/Pre-?Reqs?:\s*(.+)$/i) || rest.match(/Prerequisites?:\s*(.+)$/i) || [])[1] ?? null;
      if (prereqText && /^none\b/i.test(prereqText.trim())) prereqText = null;
      const coreqText = (rest.match(/Corequisites?:\s*(.+)$/i) || [])[1] ?? null;
      const title = rest
        .replace(/\(\d+(?:\.\d+)? credits\).*/i, "")
        .replace(/\d+(?:\.\d+)?\s+hours\s*\|.*/i, "")
        .replace(/\s+/g, " ")
        .trim();
      const item = {
        courseId: `${course[1]} ${course[2]}`,
        title: title || null,
        credits: clock ? Number(clock[2]) : credit ? Number(credit[1]) : null,
        clockHours: clock ? Number(clock[1]) : null,
        prerequisite: parsePrerequisite(prereqText),
        corequisite: parsePrerequisite(coreqText),
        connector: null,
      };
      current.lines.push(item);
      courses.push(item);
      pending = item;
      continue;
    }
    if (pending && line.length < 80 && !/^[A-Z ]{12,}$/.test(line)) {
      pending.title = `${pending.title ?? ""} ${line}`.replace(/\s+/g, " ").trim();
    }
  }
  flush();

  const requirementGroups = groups
    .map((group) => {
      const listedCredits = group.lines.reduce((sum, item) => sum + (item.credits ?? 0), 0);
      const orLinked = group.lines.some((item) => item.connector === "or");
      const choose = orLinked || (group.minCredits != null && listedCredits - group.minCredits > 0.01 && group.lines.length > 1);
      return {
        kind: choose ? "choose" : "all",
        title: group.title,
        minCredits: group.minCredits,
        children: group.lines.map((item) => ({
          kind: "course",
          courseId: item.courseId,
          title: item.title,
          credits: item.credits,
          clockHours: item.clockHours ?? null,
          prerequisite: item.prerequisite,
          corequisite: item.corequisite,
        })),
      };
    })
    .filter((group) => group.children.length > 0 || group.minCredits != null);

  const wildcards = [...new Set([...flat.matchAll(/\b([A-Z]{3})\*/g)].map((m) => `${m[1]}*`))];
  let coverage = "sheet-unparsed";
  let confidence = "low";
  if (courses.length >= 3) {
    coverage = "requirements-extracted";
    confidence = "medium";
  } else if (courses.length > 0) {
    coverage = "requirements-partial";
    confidence = "low";
  }
  const unit = clockHeader ? "clock" : creditMatch ? "credit" : "unknown";
  return {
    sheetPlanCode: codeMatch?.[1] ?? planCode,
    credits: creditMatch ? Number(creditMatch[1]) : clockHeader?.[2] ? Number(clockHeader[2]) : null,
    clockHours: clockHeader ? Number(clockHeader[1]) : null,
    effectiveTerm: effective,
    unit,
    requirements: requirementGroups,
    wildcardElectives: wildcards,
    courseCount: courses.length,
    coverage,
    confidence,
    headerMatched: Boolean(codeMatch),
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSheet(planCode) {
  const file = path.join(sheetDir, `${planCode}.txt`);
  try {
    await stat(file);
    if (!fetchSheets) return { status: "cached", text: await readFile(file, "utf8") };
  } catch {
    /* fetch */
  }
  if (!fetchSheets) return { status: "missing", text: null };
  const url = `https://www.mdc.edu/academics/programs/ps/${planCode}.pdf`;
  await sleep(120);
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/pdf" } });
  if (!response.ok) return { status: String(response.status), text: null, url };
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.slice(0, 4).toString() !== "%PDF") return { status: "not-pdf", text: null, url };
  const pdfPath = path.join(sheetDir, `${planCode}.pdf`);
  await writeFile(pdfPath, bytes);
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8", maxBuffer: 8_000_000 });
  await writeFile(file, text);
  return { status: "fetched", text, url };
}

function feeTable() {
  return {
    checked: AS_OF,
    conflicts: [
      {
        field: "college-credit-resident-total-per-credit",
        values: [
          { source: TUITION_URL, value: 118.22, label: "Campus tuition page total, page heading prints 2022-2023" },
          { source: ONLINE_TUITION_URL, value: 130.22, label: "MDC Online fee table total; year not printed next to the table" },
        ],
      },
    ],
    schedules: {
      note: "Published term shapes from the academic calendar. These are not class section offerings.",
      url: CALENDAR_URL,
      checked: AS_OF,
      formats: ["16-week", "14-week", "12-week", "10-week", "8-week", "6-week"],
      termsMentioned: ["Fall Term 2026", "Spring Term 2027", "Summer Term 2027"],
      sectionOfferings: "unknown",
    },
    rates: [
      {
        id: "campus-college-credit-2022-23-page",
        appliesToAwardTypes: ["AA", "AS", "AAS", "CCC", "ATC"],
        modality: "unspecified",
        unit: "credit",
        residentPerCredit: 118.22,
        nonresidentPerCredit: 402.51,
        yearLabel: "2022-2023 as printed on the page",
        confidence: "low",
        source: source({ url: TUITION_URL, title: "MDC Tuition & Fees", note: "Heading: Important Information Regarding Certain Fees for the 2022-2023 Academic Year. College Credit Programs total cost per credit." }),
      },
      {
        id: "campus-baccalaureate-2022-23-page",
        appliesToAwardTypes: ["BS", "BAS"],
        modality: "unspecified",
        unit: "credit",
        residentPerCredit: 129.89,
        nonresidentPerCredit: 535.97,
        yearLabel: "2022-2023 as printed on the page",
        confidence: "low",
        source: source({ url: TUITION_URL, title: "MDC Tuition & Fees", note: "Baccalaureate Programs total cost per credit on the same page." }),
      },
      {
        id: "campus-cte-2022-23-page",
        appliesToAwardTypes: ["CTC"],
        modality: "unspecified",
        unit: "credit",
        residentPerCredit: 91.08,
        nonresidentPerCredit: 355.31,
        yearLabel: "2022-2023 as printed on the page",
        confidence: "low",
        source: source({ url: TUITION_URL, title: "MDC Tuition & Fees", note: "Career and Technical Education Programs table is labeled fee per credit hour, not per clock hour." }),
      },
      {
        id: "online-nonresident-distance-290",
        appliesToAwardTypes: ["AA", "AS", "CCC", "ATC", "BS", "BAS"],
        modality: "online",
        residency: "nonresident",
        unit: "credit",
        nonresidentPerCredit: 290,
        yearLabel: "Florida measure effective July 1, 2024, as printed",
        confidence: "medium",
        source: source({
          url: ONLINE_TUITION_URL,
          title: "MDC Online tuition and costs",
          note: "Page says nonresident distance learning is authorized at just $290 per credit hour. It does not itemize every fee. Not used as a complete cost.",
        }),
      },
    ],
  };
}

async function main() {
  await mkdir(sheetDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const inventoryText = await readFile(path.join(snap, "academic-programs-cip.txt"), "utf8");
  const inventory = parseInventory(inventoryText);
  const aaText = await readFile(path.join(snap, "catalog-2024-2026-aa-region.txt"), "utf8");
  const aaPathways = parseAaPathways(aaText);
  const fetchLog = [];
  const programs = [];

  for (const row of inventory) {
    const base = {
      id: row.planCode,
      planCode: row.planCode,
      awardType: row.awardType,
      name: row.name,
      cip6: row.cip6,
      cip10: row.cip10,
      soc: row.soc,
      unit: row.awardType === "CTC" || row.awardType === "APPR" ? "clock" : "credit",
      credits: null,
      clockHours: null,
      effectiveTerm: null,
      editionLabel: "inventory revised September 16, 2025",
      coverage: "inventory-only",
      confidence: "high",
      requirements: [],
      wildcardElectives: [],
      sources: [
        source({
          url: INVENTORY_URL,
          title: "MDC academic program inventory",
          edition: "Revised September 16, 2025; file checked November 7, 2026",
          note: "Award, CIP, plan code, name, and primary SOC only. Not a course list.",
        }),
      ],
      conflicts: [],
    };
    if (row.planCode.includes("*")) {
      base.coverage = "inventory-index-only";
      base.confidence = "high";
      base.notes = ["The inventory uses a wildcard plan code. Individual pathways are separate records when a public list was extracted."];
      programs.push(base);
      fetchLog.push({ planCode: row.planCode, sheet: "not-requested-wildcard" });
      continue;
    }
    const sheet = await fetchSheet(row.planCode);
    fetchLog.push({ planCode: row.planCode, sheet: sheet.status, url: sheet.url ?? `https://www.mdc.edu/academics/programs/ps/${row.planCode}.pdf` });
    if (!sheet.text) {
      base.coverage = sheet.status === "404" || sheet.status === "missing" ? "sheet-not-found" : "inventory-only";
      base.notes = [`Program sheet request status: ${sheet.status}. Requirements were not invented.`];
      programs.push(base);
      continue;
    }
    const parsed = parseSheet(sheet.text, row.planCode);
    if (parsed.sheetPlanCode && parsed.sheetPlanCode !== row.planCode) {
      base.conflicts.push({
        field: "planCode",
        values: [
          { source: INVENTORY_URL, value: row.planCode },
          { source: `https://www.mdc.edu/academics/programs/ps/${row.planCode}.pdf`, value: parsed.sheetPlanCode },
        ],
      });
    }
    base.credits = parsed.credits;
    base.clockHours = parsed.clockHours;
    base.effectiveTerm = parsed.effectiveTerm;
    base.editionLabel = parsed.effectiveTerm
      ? `program sheet effective ${parsed.effectiveTerm}`
      : "program sheet, effective term not printed";
    base.unit = parsed.unit === "unknown" ? base.unit : parsed.unit;
    base.requirements = parsed.requirements;
    base.wildcardElectives = parsed.wildcardElectives;
    base.coverage = parsed.coverage;
    base.confidence = parsed.confidence;
    base.sources.push(
      source({
        url: `https://www.mdc.edu/academics/programs/ps/${row.planCode}.pdf`,
        title: `Program sheet ${row.planCode}`,
        effectiveTerm: parsed.effectiveTerm,
        note: parsed.headerMatched ? "Header parsed from the PDF text." : "PDF text did not match the expected header.",
      }),
    );
    programs.push(base);
    process.stdout.write(`\r${programs.length}/${inventory.length} ${row.planCode} ${parsed.coverage}   `);
  }
  process.stdout.write("\n");

  for (const pathway of aaPathways) {
    programs.push({
      id: pathway.planCode,
      planCode: pathway.planCode,
      awardType: "AA-PATHWAY",
      name: pathway.name,
      cip6: "24.0101",
      cip10: "1192401010",
      soc: null,
      unit: "credit",
      credits: pathway.credits,
      clockHours: null,
      effectiveTerm: null,
      editionLabel: "2024-2026 catalog (previous edition, not 2026-2028)",
      coverage: "narrative-only",
      confidence: pathway.titleVerified ? "medium" : "low",
      requirements: [
        {
          kind: "note",
          text: "The 2024-2026 catalog says each AA pathway's courses are specified by universities and the Common Prerequisite Manual, and that the degree audit governs. This record does not contain a course list. It is not the single inventory row 1****.",
        },
      ],
      wildcardElectives: [],
      sources: [
        source({
          url: CATALOG_2024_URL,
          title: "MDC Catalog 2024-2026",
          edition: "2024-2026",
          page: "Associate in Arts section, physical pages near 231",
          note: "Previous edition. Not a 2026-2028 Curricunet extraction. Two-column layout can attach a neighboring title.",
        }),
      ],
      conflicts: [],
      pathwayCode: pathway.pathwayCode,
    });
  }

  programs.push({
    id: "CE-PUBLIC-SEARCH",
    planCode: null,
    awardType: "CE",
    name: "Continuing education public course search",
    cip6: null,
    cip10: null,
    soc: null,
    unit: "unknown",
    credits: null,
    clockHours: null,
    effectiveTerm: null,
    editionLabel: "continuing education search page checked 2026-11-07",
    coverage: "source-page-without-course-rows",
    confidence: "high",
    requirements: [],
    wildcardElectives: [],
    sources: [source({ url: CE_URL, title: "MDC continuing education public course search", note: "HTML loaded on November 7, 2026 contained a search form and no course result rows. Courses were not invented." })],
    conflicts: [],
    notes: ["Continuing education is a separate dataset. It is not omitted from the index, and it is not filled with credit-program rows."],
  });

  const byAward = {};
  for (const program of programs) byAward[program.awardType] = (byAward[program.awardType] ?? 0) + 1;
  const sheetCounts = fetchLog.reduce((acc, item) => {
    acc[item.sheet] = (acc[item.sheet] ?? 0) + 1;
    return acc;
  }, {});
  const coverageCounts = programs.reduce((acc, program) => {
    acc[program.coverage] = (acc[program.coverage] ?? 0) + 1;
    return acc;
  }, {});
  const catalog = {
    catalogVersion: 1,
    generatedAt: new Date().toISOString(),
    asOf: AS_OF,
    blockers: [
      {
        source: CURRICUNET_URL,
        issue: "The 2026-2028 catalog link on https://www.mdc.edu/catalog/ opens a CurriQunet page whose HTML shell has no program text. Requirements were not extracted from the current catalog.",
      },
    ],
    fees: feeTable(),
    programs,
  };
  const report = {
    asOf: AS_OF,
    inventoryRows: inventory.length,
    programs: programs.length,
    byAward,
    coverageCounts,
    sheetCounts,
    aaPathways: aaPathways.length,
    aaTitleUnverified: aaPathways.filter((item) => !item.titleVerified).length,
    continuingEducation: "indexed-without-course-rows",
    duplicates: findDuplicates(programs),
    unsupportedInventoryAwards: inventory.filter((row) => !["AA", "AS", "AAS", "ATC", "BAS", "BS", "CCC", "CPP", "CTC", "APPR"].includes(row.awardType)).map((row) => row.awardType),
  };
  await writeFile(path.join(outDir, "catalog.json"), JSON.stringify(catalog));
  await writeFile(path.join(outDir, "coverage-report.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(outDir, "fetch-log.json"), JSON.stringify(fetchLog, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

function findDuplicates(programs) {
  const counts = new Map();
  for (const program of programs) {
    counts.set(program.id, (counts.get(program.id) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
}

await main();
