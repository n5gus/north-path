"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DirectoryIndex, DirectoryProgram } from "@/lib/directory/build";
import { directoryPage } from "@/lib/directory/page";
import { ConstraintFields, PlanPanel, defaultConstraints, type ConstraintValue } from "./plan-panel";

const PAGE_SIZE = 12;

export function DirectoryExplorer({ directory }: { directory: DirectoryIndex }) {
  const [query, setQuery] = useState("");
  const [award, setAward] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<ConstraintValue>(defaultConstraints);
  const [planOn, setPlanOn] = useState(false);
  const [page, setPage] = useState(0);
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

  const filtered = useMemo(
    () => directory.programs.filter((program) => (openGroup ? program.groupId === openGroup : true) && matches(program)),
    // matches closes over the current query and award.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [directory.programs, openGroup, query, award],
  );
  const windowed = directoryPage(filtered, page, PAGE_SIZE);
  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const activeGroup = directory.groups.find((group) => group.id === openGroup) ?? null;

  useEffect(() => {
    setPage(0);
  }, [query, award, openGroup]);

  useEffect(() => {
    if (selectedId) detailRef.current?.focus();
  }, [selectedId]);

  function chooseProgram(program: DirectoryProgram, source: HTMLElement) {
    returnFocus.current = source;
    setSelectedId(program.id);
    setPlanOn(false);
  }

  function closeDetail() {
    setSelectedId(null);
    setPlanOn(false);
    returnFocus.current?.focus();
  }

  const awards = [...new Set(directory.programs.map((program) => program.awardType))].sort();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">Directory</p>
      <h1 className="mt-2 font-display text-5xl text-white">How the {directory.programCount} indexed records sit together</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/75">
        Groups are CIP series from the inventory, plus continuing education and an unclassified set. A line means “same ingested catalog” or “same CIP series.” It is not transfer, stackability, or admission. Continuing education has no course rows. {directory.programCount} records are indexed; that is not {directory.programCount} verified roadmaps.
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
        <label className="flex-1 text-sm font-semibold text-white">
          Search programs
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy" placeholder="Name, plan code, or CIP" />
        </label>
        <label className="text-sm font-semibold text-white">
          Award
          <select value={award} onChange={(event) => setAward(event.target.value)} className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy">
            <option value="">All awards</option>
            {awards.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="CIP series">
        <button type="button" aria-pressed={openGroup === null} onClick={() => setOpenGroup(null)} className={`rounded-full px-3 py-1 text-sm font-semibold ${openGroup === null ? "bg-teal text-white" : "border border-white/40 bg-black/70 text-white"}`}>
          All series
        </button>
        {directory.groups.map((group) => (
          <button
            key={group.id}
            type="button"
            aria-pressed={openGroup === group.id}
            title={group.meaning}
            onClick={() => setOpenGroup(group.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${openGroup === group.id ? "bg-teal text-white" : "border border-white/40 bg-black/70 text-white"}`}
          >
            {group.id === "ce" ? "Continuing education" : group.id === "unclassified" ? "Unclassified" : `CIP ${group.cip2}`} · {group.programIds.length}
          </button>
        ))}
        <button
          type="button"
          className="rounded-full border border-white/40 px-3 py-1 text-sm font-semibold text-white"
          onClick={() => {
            setQuery("");
            setAward("");
            setOpenGroup(null);
            setPage(0);
          }}
        >
          Reset filters
        </button>
      </div>
      <p className="mt-3 text-sm text-white/90" aria-live="polite">
        {windowed.total === 0
          ? `No indexed program matches. ${directory.programCount} records remain available after a reset.`
          : `Showing ${windowed.start + 1}–${windowed.end} of ${windowed.total} matches. Page ${windowed.page + 1} of ${windowed.pages}. Same CIP series is a classification, not transfer or admission.`}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {windowed.items.map((program) => (
          <button
            key={program.id}
            type="button"
            aria-pressed={selectedId === program.id}
            onClick={(event) => chooseProgram(program, event.currentTarget)}
            className={`rounded-2xl border p-4 text-left ${selectedId === program.id ? "border-teal bg-black/80" : "border-white/30 bg-black/80"}`}
          >
            <span className="block font-semibold text-white">{program.name}</span>
            <span className="mt-1 block text-sm text-white/80">
              {program.awardType} · {program.id} · {program.coverage}
            </span>
            <span className="mt-1 block text-xs text-white/70">{program.editionLabel}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-full border border-white/40 bg-black/80 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40" disabled={windowed.page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
          Previous
        </button>
        <button type="button" className="rounded-full border border-white/40 bg-black/80 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40" disabled={windowed.page + 1 >= windowed.pages} onClick={() => setPage((value) => value + 1)}>
          Next
        </button>
      </div>
      {activeGroup ? <p className="mt-3 max-w-3xl text-sm text-white/80">{activeGroup.meaning}</p> : null}
      <aside ref={detailRef} tabIndex={-1} id="program-detail" className="mt-6 rounded-3xl border border-white/30 bg-black/80 p-4 text-white outline-none">
        {selected ? (
          <ProgramDetail program={selected} onClose={closeDetail} constraints={constraints} onConstraints={setConstraints} planOn={planOn} onPlan={() => setPlanOn(true)} />
        ) : (
          <p>Choose a card to see its source, coverage, and any shared-course links. A shared course is not transfer or admission.</p>
        )}
      </aside>
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
    <div className="text-white">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-3xl text-white">{program.name}</h2>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-white/85">
          Close
        </button>
      </div>
      <p className="mt-2 text-sm text-white/75">
        {program.awardType} · {program.id} · {program.coverage} · {program.confidence} · {program.editionLabel}
      </p>
      <p className="mt-2 text-sm text-white/90">
        {program.unit === "clock" ? `${program.clockHours ?? "Unknown"} clock hours` : `${program.credits ?? "Unknown"} credits`}
        {program.cipTitle ? ` · CIP ${program.cip6} ${program.cipTitle}` : program.cip6 ? ` · CIP ${program.cip6}` : ""}
      </p>
      {groupNote ? <p className="mt-2 text-sm text-[#ffd7a8]">{groupNote}</p> : null}
      {program.completeness === "complete-small" ? (
        <p className="mt-2 text-sm text-white">Printed sheet rows are the whole program. Coverage stays {program.coverage} because the list is short, not because courses were dropped.</p>
      ) : null}
      {program.completeness === "unresolved" || program.completeness === "suspected-unit" ? (
        <p className="mt-2 text-sm text-[#ffd7a8]">{program.notes?.[0]}</p>
      ) : null}
      {program.coverage !== "requirements-extracted" && program.completeness !== "complete-small" && program.completeness !== "open-choice" ? (
        <p className="mt-2 text-sm text-[#ffd7a8]">This is not a confirmed course sequence. Coverage is {program.coverage}.</p>
      ) : null}
      {program.sequenceGuide ? (
        <p className="mt-2 text-sm text-white/90">
          Sequence guide {program.sequenceGuide.rowStatus === "missing" ? "was not found." : `${program.sequenceGuide.effectiveTerm}. ${program.sequenceGuide.candidateCourseCount} listed rows are candidates, not required courses.`}
          {program.sequenceGuide.url ? (
            <>
              {" "}
              <a className="text-white underline" href={program.sequenceGuide.url}>
                Guide PDF
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {program.fiuAlignment ? (
        <p className="mt-2 text-sm text-white/90">FIU 2026–2027 guide “{program.fiuAlignment.degree}” is a candidate name alignment only. {program.fiuAlignment.note}</p>
      ) : null}
      {program.verifiedFacts?.length ? (
        <ul className="mt-2 space-y-1 text-sm text-white/90">
          {program.verifiedFacts.map((fact) => (
            <li key={fact.label}>
              {fact.status}: {fact.label}. {fact.value}
            </li>
          ))}
        </ul>
      ) : null}
      {program.sourceUrl ? (
        <p className="mt-2 text-sm text-white/90">
          Source:{" "}
          <a className="text-white underline" href={program.sourceUrl}>
            {program.sourceTitle ?? program.sourceUrl}
          </a>
        </p>
      ) : (
        <p className="mt-2 text-sm text-white/90">No source URL was stored on this record.</p>
      )}
      <h3 className="mt-4 font-semibold text-white">Relationships that are actually evidenced</h3>
      {program.relations.length === 0 ? (
        <p className="mt-1 text-sm text-white/75">No other sheet lists the same required course often enough to draw a link. Courses on more than 12 sheets are omitted so a common course is not drawn as a pathway. Similarity is not transfer.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-white/90">
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
