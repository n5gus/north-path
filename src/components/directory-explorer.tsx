"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DirectoryIndex, DirectoryProgram } from "@/lib/directory/build";
import { ConstraintFields, PlanPanel, defaultConstraints, type ConstraintValue } from "./plan-panel";

const VISIBLE_PROGRAMS = 12;

export function DirectoryExplorer({ directory }: { directory: DirectoryIndex }) {
  const [query, setQuery] = useState("");
  const [award, setAward] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<ConstraintValue>(defaultConstraints);
  const [planOn, setPlanOn] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const byId = useMemo(() => new Map(directory.programs.map((program) => [program.id, program])), [directory.programs]);

  const needle = query.trim().toLowerCase();
  function matches(program: DirectoryProgram) {
    if (award && program.awardType !== award) return false;
    if (!needle) return true;
    return [program.name, program.id, program.planCode, program.cip6, program.cipTitle, program.awardType].some((value) =>
      String(value ?? "").toLowerCase().includes(needle),
    );
  }

  const visibleGroups = directory.groups
    .map((group) => ({ group, programs: group.programIds.map((id) => byId.get(id)!).filter(matches) }))
    .filter((item) => item.programs.length > 0);

  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const active = visibleGroups.find((item) => item.group.id === openGroup) ?? null;
  const shownPrograms = active ? active.programs.slice(0, VISIBLE_PROGRAMS) : [];

  useEffect(() => {
    if (selectedId) detailRef.current?.focus();
  }, [selectedId]);

  function chooseProgram(program: DirectoryProgram, source: HTMLElement) {
    returnFocus.current = source;
    setSelectedId(program.id);
    setOpenGroup(program.groupId);
    setPlanOn(false);
  }

  function closeDetail() {
    setSelectedId(null);
    setPlanOn(false);
    returnFocus.current?.focus();
  }

  const awards = [...new Set(directory.programs.map((program) => program.awardType))].sort();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Directory</p>
      <h1 className="mt-2 font-display text-5xl text-navy">How the {directory.programCount} indexed records sit together</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">
        Groups are CIP series from the inventory, plus continuing education and an unclassified set. A line means “same ingested catalog” or “same CIP series.” It is not transfer, stackability, or admission. Continuing education has no course rows. {directory.programCount} records are indexed; that is not {directory.programCount} verified roadmaps.
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
        <label className="flex-1 text-sm font-semibold text-navy">
          Search programs
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal" placeholder="Name, plan code, or CIP" />
        </label>
        <label className="text-sm font-semibold text-navy">
          Award
          <select value={award} onChange={(event) => setAward(event.target.value)} className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-normal">
            <option value="">All awards</option>
            {awards.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </form>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {visibleGroups.reduce((sum, item) => sum + item.programs.length, 0)} of {directory.programCount} records match. Hidden records stay in their groups until the filter includes them.
      </p>
      {visibleGroups.length === 0 ? <p className="mt-4 rounded-2xl border border-line bg-white px-4 py-4 text-sm">No indexed program matches that filter.</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section aria-label="Program map">
          <div className="mb-2 flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold" onClick={() => setScale((value) => Math.min(1.8, value + 0.15))}>
              Zoom in
            </button>
            <button type="button" className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold" onClick={() => setScale((value) => Math.max(0.6, value - 0.15))}>
              Zoom out
            </button>
            <button
              type="button"
              className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold"
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              Reset view
            </button>
          </div>
          <p className="mb-2 text-xs text-muted">Drag to pan. The list under the map has the same records for a keyboard or screen reader.</p>
          <div
            className="h-[70vh] overflow-auto rounded-3xl border border-line bg-white"
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              setOffset({ x: drag.current.ox + event.clientX - drag.current.x, y: drag.current.oy + event.clientY - drag.current.y });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
          >
            <div className="origin-top-left p-4" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
              <p className="text-xs font-semibold text-teal">Same ingested catalog · {directory.programCount} records. A line is a classification, not transfer.</p>
              {active ? (
                <div className="mt-4 border-l-2 border-teal pl-4">
                  <button type="button" onClick={() => setOpenGroup(null)} className="rounded-2xl border border-line bg-white px-3 py-2 text-left text-sm font-semibold text-navy">
                    All groups
                  </button>
                  <p className="mt-3 text-xs font-semibold text-teal">Same ingested catalog</p>
                  <div className="mt-1 max-w-md rounded-2xl bg-teal px-3 py-3 text-sm font-semibold text-white">
                    {active.group.id === "ce" ? "Continuing education" : active.group.id === "unclassified" ? "Unclassified" : `CIP ${active.group.cip2}`}
                    <span className="mt-1 block text-xs font-normal">{active.programs.length} match · {active.group.programIds.length} in the group</span>
                  </div>
                  <div className="mt-3 border-l-2 border-[#5B6770] pl-4">
                    <p className="text-xs font-semibold text-muted">Same CIP series, not transfer</p>
                    <div className="mt-2 grid gap-2">
                      {shownPrograms.map((program) => (
                        <button
                          key={program.id}
                          type="button"
                          onClick={(event) => chooseProgram(program, event.currentTarget)}
                          className={`max-w-md rounded-2xl border px-3 py-2 text-left text-sm font-semibold ${selectedId === program.id ? "border-teal bg-[#e7eefb] text-navy" : "border-line bg-white text-navy"}`}
                        >
                          {program.name}
                        </button>
                      ))}
                    </div>
                    {active.programs.length > VISIBLE_PROGRAMS ? (
                      <p className="mt-2 max-w-md text-sm text-muted">{active.programs.length - VISIBLE_PROGRAMS} more are hidden on the map and listed below.</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2 border-l-2 border-teal pl-4">
                  {visibleGroups.map((item) => (
                    <button
                      key={item.group.id}
                      type="button"
                      title={item.group.officialTitle ?? item.group.meaning}
                      onClick={(event) => {
                        setOpenGroup(item.group.id);
                        setSelectedId(null);
                        returnFocus.current = event.currentTarget;
                      }}
                      className="block w-full max-w-md rounded-2xl border border-line bg-white px-3 py-2 text-left text-sm"
                    >
                      <span className="block font-semibold text-navy">{item.group.id === "ce" ? "Continuing education" : item.group.id === "unclassified" ? "Unclassified" : `CIP ${item.group.cip2}`}</span>
                      <span className="block text-xs text-muted">{item.group.officialTitle ?? "No series title in the CIP 2020 list used here"}</span>
                      <span className="text-xs text-muted">
                        {item.programs.length} shown · {item.group.programIds.length} in the group
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        <aside ref={detailRef} tabIndex={-1} id="program-detail" className="rounded-3xl border border-line bg-white p-4 outline-none">
          {selected ? (
            <ProgramDetail program={selected} onClose={closeDetail} constraints={constraints} onConstraints={setConstraints} planOn={planOn} onPlan={() => setPlanOn(true)} />
          ) : (
            <div>
              <h2 className="font-display text-3xl text-navy">{active ? active.group.officialTitle ?? active.group.label : "Choose a group"}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{active?.group.meaning ?? "Open a CIP series to see its programs. The center node counts every indexed record, including ones outside the current filter."}</p>
              {active?.group.id === "ce" ? <p className="mt-3 text-sm text-warn">Course rows for continuing education are unavailable. The search page did not list them.</p> : null}
            </div>
          )}
        </aside>
      </div>

      <section className="mt-10" aria-labelledby="directory-list-heading">
        <h2 id="directory-list-heading" className="font-display text-3xl text-navy">
          Searchable list
        </h2>
        <p className="mt-2 text-sm text-muted">Same records as the map. Use this on a phone, with a keyboard, or with a screen reader.</p>
        {visibleGroups.map((item) => (
          <section key={item.group.id} className="mt-6">
            <h3 className="font-semibold text-navy">
              {item.group.officialTitle ?? item.group.label}{" "}
              <span className="font-normal text-muted">
                {item.programs.length} of {item.group.programIds.length}
              </span>
            </h3>
            <p className="text-sm text-muted">{item.group.meaning}</p>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
              {item.programs.map((program) => (
                <li key={program.id}>
                  <button type="button" onClick={(event) => chooseProgram(program, event.currentTarget)} className="w-full px-4 py-3 text-left">
                    <span className="font-semibold text-navy">{program.name}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {program.awardType} · {program.id} · {program.coverage} · {program.editionLabel}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </div>
  );
}

function ProgramDetail({
  program,
  onClose,
  constraints,
  onConstraints,
  planOn,
  onPlan,
}: {
  program: DirectoryProgram;
  onClose: () => void;
  constraints: ConstraintValue;
  onConstraints: (value: ConstraintValue) => void;
  planOn: boolean;
  onPlan: () => void;
}) {
  const groupNote = program.groupId === "ce" ? "Continuing education course rows are unavailable." : program.groupId === "unclassified" ? "No CIP series title was assigned, because the code is missing from the CIP 2020 list used here." : null;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-3xl text-navy">{program.name}</h2>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-teal">
          Close
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">
        {program.awardType} · {program.id} · {program.coverage} · {program.confidence} · {program.editionLabel}
      </p>
      <p className="mt-2 text-sm">
        {program.unit === "clock" ? `${program.clockHours ?? "Unknown"} clock hours` : `${program.credits ?? "Unknown"} credits`}
        {program.cipTitle ? ` · CIP ${program.cip6} ${program.cipTitle}` : program.cip6 ? ` · CIP ${program.cip6}` : ""}
      </p>
      {groupNote ? <p className="mt-2 text-sm text-warn">{groupNote}</p> : null}
      {program.completeness === "complete-small" ? (
        <p className="mt-2 text-sm text-navy">Printed sheet rows are the whole program. Coverage stays {program.coverage} because the list is short, not because courses were dropped.</p>
      ) : null}
      {program.completeness === "unresolved" || program.completeness === "suspected-unit" ? (
        <p className="mt-2 text-sm text-warn">{program.notes?.[0]}</p>
      ) : null}
      {program.coverage !== "requirements-extracted" && program.completeness !== "complete-small" && program.completeness !== "open-choice" ? (
        <p className="mt-2 text-sm text-warn">This is not a confirmed course sequence. Coverage is {program.coverage}.</p>
      ) : null}
      {program.sequenceGuide ? (
        <p className="mt-2 text-sm">
          Sequence guide {program.sequenceGuide.rowStatus === "missing" ? "was not found." : `${program.sequenceGuide.effectiveTerm}. ${program.sequenceGuide.candidateCourseCount} listed rows are candidates, not required courses.`}
          {program.sequenceGuide.url ? (
            <>
              {" "}
              <a className="underline" href={program.sequenceGuide.url}>
                Guide PDF
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {program.fiuAlignment ? (
        <p className="mt-2 text-sm">FIU 2026–2027 guide “{program.fiuAlignment.degree}” is a candidate name alignment only. {program.fiuAlignment.note}</p>
      ) : null}
      {program.verifiedFacts?.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {program.verifiedFacts.map((fact) => (
            <li key={fact.label}>
              {fact.status}: {fact.label}. {fact.value}
            </li>
          ))}
        </ul>
      ) : null}
      {program.sourceUrl ? (
        <p className="mt-2 text-sm">
          Source:{" "}
          <a className="underline" href={program.sourceUrl}>
            {program.sourceTitle ?? program.sourceUrl}
          </a>
        </p>
      ) : (
        <p className="mt-2 text-sm">No source URL was stored on this record.</p>
      )}
      <h3 className="mt-4 font-semibold text-navy">Relationships that are actually evidenced</h3>
      {program.relations.length === 0 ? (
        <p className="mt-1 text-sm text-muted">No other sheet lists the same required course often enough to draw a link. Courses on more than 12 sheets are omitted so a common course is not drawn as a pathway. Similarity is not transfer.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {program.relations.map((relation) => (
            <li key={`${relation.programId}-${relation.courseId}`}>
              Shares required course {relation.courseId} with {relation.programName}. Shared course, not transfer or admission.
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 space-y-3">
        <ConstraintFields value={constraints} onChange={onConstraints} />
        <button type="button" onClick={onPlan} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
          Build a plan
        </button>
        {planOn ? <PlanPanel programId={program.id} programName={program.name} coverage={program.coverage} editionLabel={program.editionLabel} completeness={program.completeness} constraints={constraints} /> : null}
      </div>
    </div>
  );
}
