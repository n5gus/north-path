"use client";

import { useState } from "react";

interface CeRow {
  courseId: string;
  number: string;
  title: string;
  url: string;
  sectionCount: number;
  sections: { dates: string; days: string; time: string; fee: string; delivery: string }[];
}

export function ContinuingEducationPanel() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CeRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);

  async function load(nextOffset: number, event?: { preventDefault: () => void }) {
    event?.preventDefault();
    setError("");
    const params = new URLSearchParams({ q, limit: "6", offset: String(nextOffset) });
    const response = await fetch(`/api/v1/continuing-education?${params}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "The continuing-education snapshot could not be read.");
      return;
    }
    setRows(body.courses);
    setTotal(body.total);
    setOffset(nextOffset);
  }

  return (
    <section className="mx-auto mt-10 max-w-6xl px-5 text-white" aria-labelledby="ce-snapshot-heading">
      <h2 id="ce-snapshot-heading" className="font-display text-3xl text-white">
        Continuing education snapshot
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/85">
        1,097 public noncredit course pages and 1,778 sections captured November 8, 2026. Fees are the prices printed on those pages, not college-credit tuition. A listed date can already have passed. This is not a seat count and not one of the 331 degree or certificate records.
      </p>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => load(0, event)}>
        <label className="flex-1 text-sm font-semibold text-white">
          Search course title or number
          <input value={q} onChange={(event) => setQ(event.target.value)} className="mt-1 w-full rounded-xl border border-white/40 bg-white px-3 py-2 font-normal text-navy" />
        </label>
        <button type="submit" className="self-end rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
          Search snapshot
        </button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm text-[#ffd7a8]">{error}</p> : null}
      {total != null ? <p className="mt-3 text-sm text-white/80">{total} courses match. Showing {rows.length} from offset {offset}.</p> : null}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.courseId} className="rounded-2xl border border-white/30 bg-black/80 px-4 py-3 text-sm text-white">
            <a className="font-semibold text-white underline" href={row.url}>
              {row.title}
            </a>
            <span className="mt-1 block text-white/75">
              {row.number} · {row.courseId} · {row.sectionCount} listed sections · noncredit
            </span>
            {row.sections[0] ? (
              <span className="mt-1 block">
                {row.sections[0].dates} · {row.sections[0].days} {row.sections[0].time} · {row.sections[0].fee} · {row.sections[0].delivery}
              </span>
            ) : (
              <span className="mt-1 block text-white/75">No section rows were on the page.</span>
            )}
          </li>
        ))}
      </ul>
      {total != null && total > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="rounded-full border border-white/40 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40" disabled={offset === 0} onClick={() => load(Math.max(0, offset - 6))}>
            Previous
          </button>
          <button type="button" className="rounded-full border border-white/40 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40" disabled={offset + rows.length >= total} onClick={() => load(offset + 6)}>
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
