import { NextResponse } from "next/server";
import { getCatalog, getProgram } from "@/lib/catalog/load";
import { API_VERSION } from "@/lib/planner/engine";

export function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return context.params.then((params) => {
    const id = decodeURIComponent(params.id);
    if (!/^[A-Za-z0-9*-]{1,40}$/.test(id)) {
      return NextResponse.json({ apiVersion: API_VERSION, error: "Invalid program id." }, { status: 400 });
    }
    const program = getProgram(id);
    if (!program) return NextResponse.json({ apiVersion: API_VERSION, error: "Program not in the ingested catalog." }, { status: 404 });
    return NextResponse.json({
      apiVersion: API_VERSION,
      catalogVersion: getCatalog().catalogVersion,
      program,
      fees: getCatalog().fees,
      blockers: getCatalog().blockers,
    });
  });
}
