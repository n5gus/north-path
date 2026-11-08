import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { API_VERSION } from "@/lib/planner/engine";

export function GET() {
  const report = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/coverage-report.json"), "utf8"));
  return NextResponse.json({ apiVersion: API_VERSION, report });
}
