"use client";

import { useEffect, useState } from "react";
import type { PlanResult, StudentConstraints } from "@/lib/planner/engine";

export interface ConstraintValue {
  weeklyHours: number;
  budgetPerTerm: string;
  residency: "resident" | "nonresident" | "unknown";
  modality: "in-person" | "online" | "unknown";
  commitments: string;
}

export const defaultConstraints: ConstraintValue = {
  weeklyHours: 12,
  budgetPerTerm: "",
  residency: "resident",
  modality: "unknown",
  commitments: "",
};

export function toApiConstraints(value: ConstraintValue, weeklyHours = value.weeklyHours): StudentConstraints {
  const budget = value.budgetPerTerm.trim() === "" ? null : Number(value.budgetPerTerm);
  return {
    residency: value.residency,
    modality: value.modality,
    weeklyHours,
    budgetPerTerm: budget,
    budgetTotal: null,
    completedCourseIds: [],
    termLengthWeeks: 16,
    hoursPerCreditPerWeek: 3,
  };
}

export function ConstraintFields({ value, onChange }: { value: ConstraintValue; onChange: (value: ConstraintValue) => void }) {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-white/30 bg-black/80 p-4 text-white sm:grid-cols-2">
      <legend className="px-1 font-semibold text-white">Time, budget, and commitments</legend>
      <label className="text-sm font-semibold text-white">
        Hours you can study each week
        <input
          type="number"
          min={0}
          max={80}
          value={value.weeklyHours}
          onChange={(event) => onChange({ ...value, weeklyHours: Number(event.target.value) })}
          className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy"
        />
      </label>
      <label className="text-sm font-semibold text-white">
        Budget per term, dollars (optional)
        <input
          inputMode="decimal"
          value={value.budgetPerTerm}
          onChange={(event) => onChange({ ...value, budgetPerTerm: event.target.value })}
          className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy"
          placeholder="Leave blank if unknown"
        />
      </label>
      <label className="text-sm font-semibold text-white">
        Residency table
        <select
          value={value.residency}
          onChange={(event) => onChange({ ...value, residency: event.target.value as ConstraintValue["residency"] })}
          className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy"
        >
          <option value="resident">Florida resident table</option>
          <option value="nonresident">Nonresident table</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>
      <label className="text-sm font-semibold text-white">
        Modality
        <select
          value={value.modality}
          onChange={(event) => onChange({ ...value, modality: event.target.value as ConstraintValue["modality"] })}
          className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy"
        >
          <option value="unknown">Not specified</option>
          <option value="in-person">In person</option>
          <option value="online">Online</option>
        </select>
      </label>
      <label className="sm:col-span-2 text-sm font-semibold text-white">
        Commitments already on your calendar
        <textarea
          value={value.commitments}
          onChange={(event) => onChange({ ...value, commitments: event.target.value })}
          rows={2}
          className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy"
          placeholder="A job, caregiving, a team. This stays on this page."
        />
      </label>
      <p className="sm:col-span-2 text-sm text-white/80">
        Study-load math uses 3 hours a week per credit and a 16-week term. Those are planning assumptions, not published MDC rules. Section meeting times stay unknown.
      </p>
    </fieldset>
  );
}

export function PlanPanel({
  programId,
  programName,
  coverage,
  editionLabel,
  constraints,
  completeness,
}: {
  programId: string;
  programName: string;
  coverage: string;
  editionLabel: string;
  constraints: ConstraintValue;
  completeness?: string;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [left, setLeft] = useState<PlanResult | null>(null);
  const [right, setRight] = useState<PlanResult | null>(null);
  const [why, setWhy] = useState<string[]>([]);
  const tighter = constraints.weeklyHours >= 8 ? Math.floor(constraints.weeklyHours / 2) : null;

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    const payload = tighter
      ? {
          programId,
          left: toApiConstraints(constraints),
          right: toApiConstraints(constraints, tighter),
        }
      : null;
    const request = payload
      ? fetch("/api/v1/plans/compare", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
      : fetch("/api/v1/plans", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ programId, constraints: toApiConstraints(constraints) }),
          signal: controller.signal,
        });
    request
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error((body.errors ?? [body.error ?? "The planner could not run."]).join(" "));
        if (payload) {
          setLeft(body.left);
          setRight(body.right);
          setWhy(body.why ?? []);
        } else {
          setLeft(body.plan);
          setRight(null);
          setWhy([]);
        }
        setStatus("ready");
      })
      .catch((reason: Error) => {
        if (reason.name === "AbortError") return;
        setStatus("error");
        setError(reason.message);
      });
    return () => controller.abort();
  }, [programId, constraints, tighter]);

  const incomplete = coverage !== "requirements-extracted" && completeness !== "complete-small" && completeness !== "open-choice";
  return (
    <section aria-live="polite" className="rounded-3xl border border-white/30 bg-black/80 p-4 text-white">
      <h3 className="font-display text-3xl text-white">{programName}</h3>
      <p className="mt-1 text-sm text-white/80">
        {programId} · {coverage} · {editionLabel}
      </p>
      {completeness === "complete-small" ? (
        <p className="mt-3 text-sm text-white">The printed rows on the sheet are the whole program. A short list was not treated as missing courses.</p>
      ) : null}
      {completeness === "open-choice" ? (
        <p className="mt-3 text-sm text-white">Some groups are open choices or prefix wildcards. They were not filled with invented courses.</p>
      ) : null}
      {completeness === "suspected-unit" ? (
        <p className="mt-3 text-sm text-[#ffd7a8]">The sheet lists vocational credits. A clock-hour total was not verified, and credit tuition was not applied.</p>
      ) : null}
      {incomplete ? (
        <p className="mt-3 rounded-2xl bg-[#fff4e8] px-3 py-2 text-sm text-warn">
          This record is not a confirmed course sequence. Coverage is {coverage}. The planner will not fill missing courses.
        </p>
      ) : null}
      {constraints.commitments.trim() ? (
        <p className="mt-3 text-sm text-white">You noted: {constraints.commitments.trim()}. That note is not a catalog rule and stays on this page.</p>
      ) : null}
      {status === "loading" ? <p className="mt-4 text-sm">Building a plan from the ingested catalog…</p> : null}
      {status === "error" ? (
        <p role="alert" className="mt-4 text-sm text-[#ffd7a8]">
          {error}
        </p>
      ) : null}
      {status === "ready" && left ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PlanColumn label={`${constraints.weeklyHours} hours a week`} plan={left} />
          {right && tighter != null ? <PlanColumn label={`${tighter} hours a week`} plan={right} /> : null}
          {why.length > 0 ? (
            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white">What changed when the week got shorter</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {why.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PlanColumn({ label, plan }: { label: string; plan: PlanResult }) {
  return (
    <article className="rounded-2xl border border-white/25 bg-black/75 p-4">
      <h4 className="font-semibold text-white">{label}</h4>
      <p className="mt-1 text-sm text-white/80">
        {plan.feasible ? "No blocker diagnostic." : "Infeasible or insufficient evidence."} Terms: {plan.totals.terms}. Credits placed: {plan.totals.creditsPlanned}. Clock hours:{" "}
        {plan.totals.clockHoursPlanned ?? "n/a"}. Cost: {plan.totals.estimatedCost ?? "unknown"} ({plan.totals.costStatus}). Sections: {plan.sectionOfferings}.
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {plan.diagnostics.slice(0, 4).map((item) => (
          <li key={item.message}>
            {item.severity}: {item.message}
          </li>
        ))}
      </ul>
      {plan.terms.length > 0 ? (
        <ol className="mt-3 space-y-2 text-sm">
          {plan.terms.map((term) => (
            <li key={term.index}>
              <span className="font-semibold">Term {term.index}</span>
              <ul className="mt-1 list-disc pl-5">
                {term.courses.map((course) => (
                  <li key={course.courseId}>
                    {course.courseId}
                    {course.title ? ` ${course.title}` : ""} {course.credits != null ? `· ${course.credits} credits` : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm">No courses were placed.</p>
      )}
      {plan.assumptions.length > 0 ? <p className="mt-3 text-xs text-white/70">{plan.assumptions[0]}</p> : null}
    </article>
  );
}
