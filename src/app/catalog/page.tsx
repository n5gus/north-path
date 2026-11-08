"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface Summary {
  id: string;
  planCode: string | null;
  awardType: string;
  name: string;
  unit: string;
  credits: number | null;
  clockHours: number | null;
  coverage: string;
  confidence: string;
  editionLabel?: string;
}

interface Plan {
  feasible: boolean;
  unit: string;
  totals: { terms: number; creditsPlanned: number; clockHoursPlanned: number | null; estimatedCost: number | null; costStatus: string };
  diagnostics: { code: string; severity: string; message: string }[];
  assumptions: string[];
  terms: { index: number; weeklyLoadHours: number | null; clockHours: number | null; estimatedCost: number | null; courses: { courseId: string; title: string | null; credits: number | null }[] }[];
}

const emptyConstraints = {
  residency: "resident",
  modality: "unknown",
  weeklyHours: 12,
  budgetPerTerm: "",
  budgetTotal: "",
  completedCourseIds: "",
};

export default function CatalogPage() {
  const [q, setQ] = useState("");
  const [award, setAward] = useState("");
  const [rows, setRows] = useState<Summary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Summary | null>(null);
  const [left, setLeft] = useState(emptyConstraints);
  const [right, setRight] = useState({ ...emptyConstraints, weeklyHours: 6 });
  const [comparison, setComparison] = useState<{ why: string[]; left: Plan; right: Plan } | null>(null);
  const [coverageLine, setCoverageLine] = useState("Loading ingestion counts.");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/coverage")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Coverage report unavailable.");
        const report = body.report;
        const counts = report.coverageCounts ?? {};
        return `Inventory rows ${report.inventoryRows}. Requirements extracted ${counts["requirements-extracted"] ?? 0}. Partial ${counts["requirements-partial"] ?? 0}. Sheets not found ${counts["sheet-not-found"] ?? 0}. AA pathways ${report.aaPathways}, titles still unverified ${report.aaTitleUnverified}. These are parse counts, not a verified catalog.`;
      })
      .then((line) => {
        if (!cancelled) setCoverageLine(line);
      })
      .catch(() => {
        if (!cancelled) setCoverageLine("Ingestion counts could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const awards = useMemo(() => ["", "AS", "AA-PATHWAY", "BS", "BAS", "CCC", "CTC", "CPP", "ATC", "APPR", "AA", "CE"], []);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    const params = new URLSearchParams({ q, limit: "40" });
    if (award) params.set("award", award);
    const response = await fetch(`/api/v1/programs?${params}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Search failed.");
      return;
    }
    setRows(body.programs);
    setTotal(body.total);
  }

  async function compare(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setError("");
    const response = await fetch("/api/v1/plans/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        programId: selected.id,
        left: toPayload(left),
        right: toPayload(right),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError((body.errors ?? [body.error]).join(" "));
      setComparison(null);
      return;
    }
    setComparison(body);
  }

  return (
    <>
    <SiteHeader />
    <main id="content" className="mx-auto max-w-6xl px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Catalog planner · API v1</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">Every ingested MDC offering</h1>
        <Link href="/" className="text-sm font-semibold text-teal underline underline-offset-4">
          Back to the cybersecurity pilot
        </Link>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        Search uses the ingested inventory, program sheets, and the 2024–2026 AA pathway list. Coverage labels say when a course list was not extracted. This is not a degree audit or a class schedule.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy">{coverageLine}</p>
      <form onSubmit={search} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-sm font-semibold text-navy">
          Search
          <input value={q} onChange={(event) => setQ(event.target.value)} className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold text-navy">
          Award
          <select value={award} onChange={(event) => setAward(event.target.value)} className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 font-normal">
            {awards.map((item) => (
              <option key={item || "all"} value={item}>{item || "All awards"}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="self-end rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">Search</button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm text-warn">{error}</p> : null}
      <p className="mt-4 text-sm text-muted">{total ? `${total} matches. Showing ${rows.length}.` : "Run a search. An empty query still pages the catalog."}</p>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" onClick={() => { setSelected(row); setComparison(null); }} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
              <span>
                <span className="block font-semibold text-navy">{row.name}</span>
                <span className="text-sm text-muted">{row.awardType} · {row.planCode} · {row.coverage} · {row.unit}{row.editionLabel ? ` · ${row.editionLabel}` : ""}</span>
              </span>
              <span className="text-sm text-teal">{row.credits ?? row.clockHours ?? "—"}</span>
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <form onSubmit={compare} className="mt-8 grid gap-4 lg:grid-cols-2">
          <ConstraintFields title="Scenario A" value={left} onChange={setLeft} />
          <ConstraintFields title="Scenario B" value={right} onChange={setRight} />
          <button type="submit" className="lg:col-span-2 w-fit rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
            Compare plans for {selected.planCode}
          </button>
        </form>
      ) : null}
      {comparison ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-live="polite">
          <PlanCard label="A" plan={comparison.left} />
          <PlanCard label="B" plan={comparison.right} />
          <div className="lg:col-span-2 rounded-2xl border border-line bg-[#f3eee6] px-4 py-4">
            <h2 className="font-display text-2xl text-navy">Why these differ</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy">
              {comparison.why.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
    <SiteFooter />
    </>
  );
}

function toPayload(value: typeof emptyConstraints) {
  return {
    residency: value.residency,
    modality: value.modality,
    weeklyHours: Number(value.weeklyHours),
    budgetPerTerm: value.budgetPerTerm === "" ? null : Number(value.budgetPerTerm),
    budgetTotal: value.budgetTotal === "" ? null : Number(value.budgetTotal),
    completedCourseIds: value.completedCourseIds.split(",").map((item) => item.trim()).filter(Boolean),
  };
}

function ConstraintFields({ title, value, onChange }: { title: string; value: typeof emptyConstraints; onChange: (value: typeof emptyConstraints) => void }) {
  return (
    <fieldset className="rounded-2xl border border-line bg-card p-4">
      <legend className="font-semibold text-navy">{title}</legend>
      <label className="mt-2 block text-sm">Weekly hours
        <input type="number" min={0} max={80} value={value.weeklyHours} onChange={(event) => onChange({ ...value, weeklyHours: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-line px-2 py-1" />
      </label>
      <label className="mt-2 block text-sm">Residency
        <select value={value.residency} onChange={(event) => onChange({ ...value, residency: event.target.value })} className="mt-1 w-full rounded-lg border border-line px-2 py-1">
          <option value="resident">Florida resident table</option>
          <option value="nonresident">Nonresident table</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>
      <label className="mt-2 block text-sm">Modality
        <select value={value.modality} onChange={(event) => onChange({ ...value, modality: event.target.value })} className="mt-1 w-full rounded-lg border border-line px-2 py-1">
          <option value="unknown">Not specified</option>
          <option value="in-person">In person</option>
          <option value="online">Online</option>
        </select>
      </label>
      <label className="mt-2 block text-sm">Budget per term (optional)
        <input value={value.budgetPerTerm} onChange={(event) => onChange({ ...value, budgetPerTerm: event.target.value })} className="mt-1 w-full rounded-lg border border-line px-2 py-1" />
      </label>
      <label className="mt-2 block text-sm">Completed course ids, comma separated
        <input value={value.completedCourseIds} onChange={(event) => onChange({ ...value, completedCourseIds: event.target.value })} className="mt-1 w-full rounded-lg border border-line px-2 py-1" placeholder="CTS 1134" />
      </label>
    </fieldset>
  );
}

function PlanCard({ label, plan }: { label: string; plan: Plan }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-4">
      <h2 className="font-display text-2xl text-navy">Scenario {label}</h2>
      <p className="text-sm text-muted">{plan.feasible ? "No blocker diagnostic." : "Infeasible or insufficient evidence."} {plan.unit}. Terms: {plan.totals.terms}. Credits placed: {plan.totals.creditsPlanned}. Clock hours: {plan.totals.clockHoursPlanned ?? "n/a"}. Cost: {plan.totals.estimatedCost ?? "unknown"} ({plan.totals.costStatus}).</p>
      <ul className="mt-2 space-y-1 text-sm">
        {plan.diagnostics.slice(0, 4).map((item) => <li key={item.message}>{item.severity}: {item.message}</li>)}
      </ul>
    </article>
  );
}
