import { NextResponse } from "next/server";
import { getCatalog, getProgram } from "@/lib/catalog/load";
import { API_VERSION, buildPlan, explainDifference, normalizeConstraints, type StudentConstraints } from "@/lib/planner/engine";

export async function POST(request: Request) {
  let body: { programId?: string; left?: unknown; right?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ apiVersion: API_VERSION, error: "Body must be JSON." }, { status: 400 });
  }
  const programId = String(body.programId ?? "");
  const program = getProgram(programId);
  if (!program) return NextResponse.json({ apiVersion: API_VERSION, error: "Program not in the ingested catalog." }, { status: 404 });
  const left = normalizeConstraints(body.left as Partial<StudentConstraints> | null);
  const right = normalizeConstraints(body.right as Partial<StudentConstraints> | null);
  if (!left.value || !right.value) {
    return NextResponse.json({ apiVersion: API_VERSION, errors: [...left.errors, ...right.errors] }, { status: 400 });
  }
  const rates = getCatalog().fees.rates;
  const leftPlan = buildPlan(program, left.value, rates);
  const rightPlan = buildPlan(program, right.value, rates);
  return NextResponse.json({
    apiVersion: API_VERSION,
    left: leftPlan,
    right: rightPlan,
    why: explainDifference(leftPlan, rightPlan, left.value, right.value),
  });
}
