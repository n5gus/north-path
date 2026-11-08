import { NextResponse } from "next/server";
import { getCatalog, listPrograms } from "@/lib/catalog/load";
import { API_VERSION } from "@/lib/planner/engine";

export function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const award = (url.searchParams.get("award") ?? "").trim().toUpperCase();
  const coverage = (url.searchParams.get("coverage") ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 25) || 25));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  if (q.length > 80) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "q is limited to 80 characters." }, { status: 400 });
  }
  let rows = listPrograms();
  if (award) rows = rows.filter((program) => program.awardType === award);
  if (coverage) rows = rows.filter((program) => program.coverage === coverage);
  if (q) {
    rows = rows.filter((program) =>
      [program.name, program.planCode, program.id, program.cip6, program.cip10, program.soc, program.awardType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }
  return NextResponse.json({
    apiVersion: API_VERSION,
    catalogVersion: getCatalog().catalogVersion,
    asOf: getCatalog().asOf,
    total: rows.length,
    offset,
    limit,
    programs: rows.slice(offset, offset + limit).map((program) => ({
      id: program.id,
      planCode: program.planCode,
      awardType: program.awardType,
      name: program.name,
      unit: program.unit,
      credits: program.credits,
      clockHours: program.clockHours,
      coverage: program.coverage,
      confidence: program.confidence,
      effectiveTerm: program.effectiveTerm,
      editionLabel: program.editionLabel,
      soc: program.soc,
    })),
  });
}
