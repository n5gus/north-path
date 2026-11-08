import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { searchContinuingEducation, type CeCourse } from "@/lib/import/requirements";
import { API_VERSION } from "@/lib/planner/engine";

let courses: CeCourse[] | null = null;

function loadCourses(): CeCourse[] {
  if (!courses) {
    courses = JSON.parse(readFileSync(path.join(process.cwd(), "data/catalog/imports/ce-snapshot.json"), "utf8")) as CeCourse[];
  }
  return courses;
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length > 80) {
    return NextResponse.json({ apiVersion: API_VERSION, error: "q is limited to 80 characters." }, { status: 400 });
  }
  const result = searchContinuingEducation(loadCourses(), {
    q,
    offset: Number(url.searchParams.get("offset") ?? 0),
    limit: Number(url.searchParams.get("limit") ?? 25),
  });
  return NextResponse.json({
    apiVersion: API_VERSION,
    asOf: "2026-11-08",
    noncredit: true,
    feeMeaning: "published-noncredit-section-fee",
    limitation: "Snapshot of public continuing-education pages. Not college-credit tuition, not open seats, and not a degree plan. Listed dates can already have passed.",
    ...result,
  });
}
