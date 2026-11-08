import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getProgram } from "@/lib/catalog/load";
import { MAX_SOURCE_CHARS } from "@/lib/enrichment/models";
import { hasStudentPayload, runEnrichment } from "@/lib/enrichment/pipeline";
import { API_VERSION } from "@/lib/planner/engine";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ apiVersion: API_VERSION, error: "Expected a JSON object." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "Expected a JSON object." }, { status: 400 });
  }
  if (hasStudentPayload(body)) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "Student fields are not accepted." }, { status: 400 });
  }
  const programId = (body as { programId?: unknown }).programId;
  if (typeof programId !== "string" || !/^[A-Za-z0-9*-]{1,40}$/.test(programId)) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "programId is required." }, { status: 400 });
  }
  const program = getProgram(programId);
  if (!program) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "Program is not in the ingested catalog." }, { status: 404 });
  }
  const loaded = loadBoundedSource(program.planCode ?? program.id, program.awardType);
  if (!loaded) {
    const result = await runEnrichment({
      programId: program.id,
      sourceId: "",
      sourceText: "",
      editionLabel: program.editionLabel,
    });
    return NextResponse.json({ apiVersion: API_VERSION, result });
  }
  const result = await runEnrichment({
    programId: program.id,
    sourceId: loaded.sourceId,
    sourceText: loaded.text,
    editionLabel: program.editionLabel,
    page: loaded.page,
  });
  return NextResponse.json({
    apiVersion: API_VERSION,
    sourceBounded: loaded.bounded,
    catalogCoverage: program.coverage,
    result,
  });
}

function loadBoundedSource(planCode: string, awardType: string): { text: string; sourceId: string; page: string | null; bounded: boolean } | null {
  if (awardType === "AA-PATHWAY") {
    const file = path.join(process.cwd(), "data/snapshots/catalog-2024-2026-aa-region.txt");
    if (!existsSync(file)) return null;
    const full = readFileSync(file, "utf8");
    const needle = planCode.replace(/^AA-/, "");
    const at = full.indexOf(`Code: ${needle}`);
    if (at < 0) return null;
    const start = Math.max(0, at - 400);
    const text = full.slice(start, start + MAX_SOURCE_CHARS);
    return { text, sourceId: `aa-region:${planCode}#${start}`, page: null, bounded: text.length < full.length - start };
  }
  if (awardType === "CE") return null;
  const file = path.join(process.cwd(), "data/snapshots/sheets", `${planCode}.txt`);
  if (!existsSync(file)) return null;
  const full = readFileSync(file, "utf8");
  const bounded = full.length > MAX_SOURCE_CHARS;
  return {
    text: full.slice(0, MAX_SOURCE_CHARS),
    sourceId: bounded ? `sheet:${planCode}#0-${MAX_SOURCE_CHARS}` : `sheet:${planCode}`,
    page: null,
    bounded,
  };
}
