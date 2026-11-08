"use client";

import { useEffect, useRef, useState } from "react";
import type { DirectoryProgram } from "@/lib/directory/build";
import { matchGoal, type GoalMatchResult } from "@/lib/match/goal";
import { phaseFromSpeechError, recognitionAvailable, type SpeechPhase } from "@/lib/speech/session";
import { ConstraintFields, PlanPanel, defaultConstraints, type ConstraintValue } from "./plan-panel";

const EXAMPLES = ["Nursing", "Accounting", "Culinary arts", "Elementary teaching", "Automotive service", "Cybersecurity"];

interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const scope = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  if (!recognitionAvailable(Ctor)) return null;
  return new Ctor!();
}

export function DescribeFlow({ programs }: { programs: DirectoryProgram[] }) {
  const [goal, setGoal] = useState("");
  const [speech, setSpeech] = useState<SpeechPhase>("idle");
  const [result, setResult] = useState<GoalMatchResult | null>(null);
  const [selected, setSelected] = useState<DirectoryProgram | null>(null);
  const [constraints, setConstraints] = useState<ConstraintValue>(defaultConstraints);
  const [showPlan, setShowPlan] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const baseText = useRef("");

  useEffect(() => {
    return () => recognition.current?.abort();
  }, []);

  function find(text = goal) {
    recognition.current?.abort();
    setSpeech((phase) => (phase === "listening" ? "idle" : phase));
    setResult(matchGoal(text, programs));
    setSelected(null);
    setShowPlan(false);
  }

  function startSpeech() {
    const session = getRecognition();
    if (!session) {
      setSpeech("unsupported");
      return;
    }
    baseText.current = goal.trim();
    session.continuous = true;
    session.interimResults = true;
    session.lang = "en-US";
    session.onresult = (event) => {
      let said = "";
      for (let index = 0; index < event.results.length; index += 1) {
        said += event.results[index][0]?.transcript ?? "";
      }
      const prefix = baseText.current ? `${baseText.current} ` : "";
      setGoal(`${prefix}${said}`.replace(/\s+/g, " ").trim());
    };
    session.onerror = (event) => setSpeech(phaseFromSpeechError(event.error));
    session.onend = () => setSpeech((phase) => (phase === "listening" ? "confirming" : phase));
    try {
      session.start();
      recognition.current = session;
      setSpeech("listening");
    } catch {
      setSpeech("error");
    }
  }

  function stopSpeech() {
    recognition.current?.stop();
  }

  function cancelSpeech() {
    recognition.current?.abort();
    setGoal(baseText.current);
    setSpeech("idle");
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Describe</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl text-white">What kind of work do you want?</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/90">
        Use your own words. North Path looks for those words in program names and CIP series titles. A match is relevance, not eligibility. Speech stays on this page until you edit it. North Path does not upload the audio. Your browser’s recognizer may still send it to the browser vendor.
      </p>
      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          find();
        }}
      >
        <label htmlFor="goal" className="text-sm font-semibold text-white">
          Career or goal
        </label>
        <textarea
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-3xl border border-white/40 bg-white px-4 py-4 text-xl leading-relaxed text-navy"
          placeholder="Example: I want to care for patients in a hospital"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {speech === "listening" ? (
            <>
              <button type="button" onClick={stopSpeech} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                Stop
              </button>
              <button type="button" onClick={cancelSpeech} className="rounded-full border border-white/40 bg-black/75 px-4 py-2 text-sm font-semibold text-white">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={startSpeech} className="rounded-full border border-white/40 bg-black/75 px-4 py-2 text-sm font-semibold text-white">
              Start speaking
            </button>
          )}
          <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
            Find programs
          </button>
        </div>
        <p className="mt-2 text-sm text-white/85" role="status" data-speech-state={speech}>
          {speech === "listening" ? "Listening. Speak, then stop and edit the text before you search." : null}
          {speech === "confirming" ? "Transcript captured. Edit it if needed, then find programs." : null}
          {speech === "unsupported" ? "This browser does not offer speech recognition. Type the goal instead." : null}
          {speech === "denied" ? "Microphone permission was denied. Type the goal instead. Nothing was recorded by North Path." : null}
          {speech === "error" ? "Speech recognition stopped with an error. The text box is still there." : null}
          {speech === "idle" ? "Speech starts only when you click Start speaking." : null}
        </p>
      </form>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Examples">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setGoal(example);
              find(example);
            }}
            className="rounded-full border border-white/30 bg-black/75 px-3 py-1 text-sm font-semibold text-white"
          >
            {example}
          </button>
        ))}
      </div>
      {result ? (
        <section className="mt-8" aria-live="polite">
          <h2 className="font-display text-3xl text-white">Programs whose text matches</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/85">{result.note}</p>
          {result.matches.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-white/30 bg-black/80 px-4 py-4 text-sm text-white">
              No match. Open Directory and search the same words, or try a subject that appears in a program name, such as nursing, accounting, or culinary.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/15 rounded-3xl border border-white/30 bg-black/80">
              {result.matches.map((item) => (
                <li key={item.program.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item.program);
                      setShowPlan(false);
                    }}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block font-semibold text-white">{item.program.name}</span>
                      <span className="text-sm text-white/75">
                        {item.program.awardType} · {item.program.id} · {item.program.coverage} · {item.program.editionLabel}
                      </span>
                      <span className="mt-1 block text-sm text-white">{item.reasons.join(" ")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      {selected ? (
        <section className="mt-8 space-y-4">
          <h2 className="font-display text-3xl text-white">Fit this program to your week</h2>
          <p className="max-w-3xl text-sm text-white/85">
            Choosing {selected.name} does not mean you are admitted. The planner uses the ingested requirements and the hours and budget you enter.
          </p>
          <ConstraintFields value={constraints} onChange={setConstraints} />
          <button type="button" onClick={() => setShowPlan(true)} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
            Build the plan
          </button>
          {showPlan ? (
            <PlanPanel
              programId={selected.id}
              programName={selected.name}
              coverage={selected.coverage}
              editionLabel={selected.editionLabel}
              constraints={constraints}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
