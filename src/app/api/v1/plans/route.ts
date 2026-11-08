import { NextResponse } from "next/server";
import { getCatalog, getProgram } from "@/lib/catalog/load";
import { API_VERSION, buildPlan, normalizeConstraints } from "@/lib/planner/engine";

export async function POST(request: Request) {
  let body: { programId?: string; constraints?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ apiVersion: API_VERSION, error: "Body must be JSON." }, { status: 400 });
  }
  const programId = String(body.programId ?? "");
  if (!/^[A-Za-z0-9*-]{1,40}$/.test(programId)) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "programId is required and must be a catalog id." }, { status: 400 });
  }
  const program = getProgram(programId);
  if (!program) return NextResponse.json({ apiVersion: API_VERSION, error: "Program not in the ingested catalog." }, { status: 404 });
  const constraints = normalizeConstraints((body.constraints ?? null) as never);
  if (!constraints.value) {
    return NextResponse.json({ apiVersion: API_VERSION, errors: constraints.errors }, { status: 400 });
  }
  const plan = buildPlan(program, constraints.value, getCatalog().fees.rates);
  return NextResponse.json({ apiVersion: API_VERSION, plan });
}
