"use client";

import { useState } from "react";
import type { DirectoryGroup, DirectoryProgram } from "@/lib/directory/build";
import { rankDiscover, type DiscoverAward, type DiscoverRank } from "@/lib/match/goal";
import { ConstraintFields, PlanPanel, defaultConstraints, type ConstraintValue } from "./plan-panel";

const STEPS = ["Interests", "What you already do", "Award", "Time and money", "Results"];

export function DiscoverFlow({ groups, programs }: { groups: DirectoryGroup[]; programs: DirectoryProgram[] }) {
  const [step, setStep] = useState(0);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [activity, setActivity] = useState("");
  const [award, setAward] = useState<DiscoverAward>("any");
  const [constraints, setConstraints] = useState<ConstraintValue>(defaultConstraints);
  const [ranks, setRanks] = useState<DiscoverRank[] | null>(null);
  const [selected, setSelected] = useState<DirectoryProgram | null>(null);
  const titles = new Map(groups.map((group) => [group.id, group.officialTitle ?? group.label]));

  function toggle(id: string) {
    setGroupIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function finish() {
    setRanks(rankDiscover({ groupIds, activity, award }, programs, titles));
    setSelected(null);
    setStep(4);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Discover</p>
      <h1 className="mt-2 font-display text-5xl text-white">A few questions, then real programs.</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/90">
        This is not an aptitude test. Recommendations cite the answers you give and the catalog fields already stored. You can go back or skip a prompt. Nothing here is saved on a server.
      </p>
      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={step === index ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${step === index ? "bg-teal text-white" : "border border-white/30 bg-black/75 text-white"}`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-3xl border border-white/30 bg-black/80 p-5 text-white">
        {step === 0 ? (
          <fieldset>
            <legend className="font-display text-3xl text-white">Which areas should we look in?</legend>
            <p className="mt-2 text-sm text-white/80">These are CIP series that actually appear in the ingested inventory. Skip this if you would rather type what you do.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {groups
                .filter((group) => group.id !== "ce")
                .map((group) => (
                  <label key={group.id} className="flex gap-2 rounded-2xl border border-white/25 bg-black/70 px-3 py-2 text-sm">
                    <input type="checkbox" checked={groupIds.includes(group.id)} onChange={() => toggle(group.id)} />
                    <span>
                      <span className="font-semibold text-white">{group.officialTitle ?? group.label}</span>
                      <span className="block text-white/70">{group.programIds.length} records</span>
                    </span>
                  </label>
                ))}
            </div>
          </fieldset>
        ) : null}
        {step === 1 ? (
          <label className="block">
            <span className="font-display text-3xl text-white">What do you already spend time on?</span>
            <textarea value={activity} onChange={(event) => setActivity(event.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-white/40 bg-white px-3 py-3 text-navy" placeholder="Patients, engines, classrooms, kitchens. Optional." />
          </label>
        ) : null}
        {step === 2 ? (
          <fieldset>
            <legend className="font-display text-3xl text-white">What length of award are you considering?</legend>
            <div className="mt-4 grid gap-2">
              {(
                [
                  ["any", "Not sure"],
                  ["certificate", "A certificate (CCC, CTC, or ATC)"],
                  ["associate", "An associate degree or AA pathway"],
                  ["bachelor", "A bachelor’s degree (BS or BAS)"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex gap-2 text-sm">
                  <input type="radio" name="award" checked={award === value} onChange={() => setAward(value)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {step === 3 ? <ConstraintFields value={constraints} onChange={setConstraints} /> : null}
        {step === 4 ? (
          <div>
            <h2 className="font-display text-3xl text-white">Programs that follow those answers</h2>
            {ranks && ranks.length === 0 ? (
              <p className="mt-3 text-sm">
                There is nothing to rank yet. Pick an interest or describe an activity. North Path will not invent a recommendation, and it will not default to cybersecurity.
              </p>
            ) : null}
            {ranks && ranks.length > 0 ? (
              <ul className="mt-4 divide-y divide-line">
                {ranks.map((item) => (
                  <li key={item.program.id} className="py-3">
                    <button type="button" onClick={() => setSelected(item.program)} className="text-left">
                      <span className="block font-semibold text-white">{item.program.name}</span>
                      <span className="text-sm text-white/75">
                        {item.program.awardType} · {item.program.coverage} · {item.program.editionLabel}
                      </span>
                    </button>
                    <ul className="mt-1 list-disc pl-5 text-sm text-white">
                      {item.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white">
              Back
            </button>
          ) : null}
          {step < 3 ? (
            <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white">
              Skip
            </button>
          ) : null}
          {step < 4 ? (
            <button type="button" onClick={() => (step === 3 ? finish() : setStep((value) => value + 1))} className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
              {step === 3 ? "See programs" : "Continue"}
            </button>
          ) : null}
        </div>
      </div>
      {selected ? (
        <div className="mt-6">
          <PlanPanel programId={selected.id} programName={selected.name} coverage={selected.coverage} editionLabel={selected.editionLabel} constraints={constraints} />
        </div>
      ) : null}
    </div>
  );
}
