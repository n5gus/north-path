"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type RefObject, type SVGProps } from "react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import Stepper, { Step } from "@/components/ui/stepper";
import {
  allSteps,
  buildRoadmap,
  EXAMPLE_STUDENT,
  evidenceLabel,
  roadmapToText,
  stepsByCategory,
  type Goal,
  type Profile,
  type ReportedCourse,
  type Roadmap,
  type StartingPoint,
} from "@/lib/roadmap";
import { sources } from "@/lib/sources";

const STORAGE_KEY = "north-path.v1";

type Phase = "wizard" | "path";

interface SavedPlan {
  phase: Phase;
  wizardStep: number;
  career: "cybersecurity" | null;
  startingPoint: StartingPoint | "";
  goal: Goal | "";
  reportedCourses: ReportedCourse[];
  workingInTech: boolean;
  exampleOn: boolean;
  completed: string[];
}

const CAREERS = [
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    detail: "Mapped from current MDC program sheets, sequence guides, and program pages.",
    available: true,
  },
  {
    id: "networking",
    name: "Networking and IT support",
    detail: "MDC publishes networking and support programs. They are not mapped in this prototype.",
    available: false,
  },
  {
    id: "software",
    name: "Software development",
    detail: "Computer Programming and Analysis is in the MDC inventory. It is not mapped here.",
    available: false,
  },
  {
    id: "data",
    name: "Data and artificial intelligence",
    detail: "Applied Artificial Intelligence is a real MDC program. It is not mapped here.",
    available: false,
  },
  {
    id: "business",
    name: "Business and management",
    detail: "Business programs are in the MDC inventory. They are not mapped here.",
    available: false,
  },
] as const;

const STARTS: Array<{ id: StartingPoint; label: string; detail: string }> = [
  {
    id: "not-admitted",
    label: "I am not admitted to MDC yet",
    detail: "High school senior, GED, or career changer who still needs an application.",
  },
  {
    id: "admitted-no-degree",
    label: "I am admitted, and I do not have an associate degree yet",
    detail: "Includes students with some credits. This app will not judge those credits.",
  },
  {
    id: "associate-complete",
    label: "I have finished an associate degree",
    detail: "AA or AS, at MDC or elsewhere. An advisor still has to evaluate it.",
  },
];

const GOALS: Array<{ id: Goal; label: string; detail: string }> = [
  {
    id: "certificate",
    label: "Cybersecurity Analyst certificate first",
    detail: "College Credit Certificate, plan 66061, 24 credits on the published sheet.",
  },
  {
    id: "associate",
    label: "Associate in Science in Cybersecurity",
    detail: "Plan 25079, 60 credits on the Spring 2025 program sheet.",
  },
  {
    id: "bachelor",
    label: "Bachelor of Science in Cybersecurity",
    detail: "Plan S9515. Admission requires an associate or 60 credits before the bachelor's itself.",
  },
];

const COURSE_OPTIONS: Array<{ id: ReportedCourse; label: string }> = [
  { id: "cts1134", label: "CTS 1134 Networking Technologies" },
  { id: "cts1120", label: "CTS 1120 Cybersecurity Fundamentals" },
  { id: "cts1111", label: "CTS 1111 Linux+" },
  {
    id: "scripting",
    label: "One of CIS 1531, COP 1047C, or COP 1334",
  },
];

function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 8H20" />
    </svg>
  );
}

function IconSkill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8 7h11M8 12h11M8 17h11" />
      <path d="M4.5 7h.5M4.5 12h.5M4.5 17h.5" strokeLinecap="round" />
    </svg>
  );
}

function IconProject(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 15.5 10.2 12l2 2.2L16.5 9" />
    </svg>
  );
}

function IconNext(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 12h12" strokeLinecap="round" />
      <path d="M13 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function emptySaved(): SavedPlan {
  return {
    phase: "wizard",
    wizardStep: 1,
    career: null,
    startingPoint: "",
    goal: "",
    reportedCourses: [],
    workingInTech: false,
    exampleOn: false,
    completed: [],
  };
}

export function PathwayApp() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<Phase>("wizard");
  const [wizardStep, setWizardStep] = useState(1);
  const [career, setCareer] = useState<"cybersecurity" | null>(null);
  const [startingPoint, setStartingPoint] = useState<StartingPoint | "">("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [reportedCourses, setReportedCourses] = useState<ReportedCourse[]>([]);
  const [workingInTech, setWorkingInTech] = useState(false);
  const [exampleOn, setExampleOn] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [openStages, setOpenStages] = useState<string[]>(["stage-next"]);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const baseId = useId();

  const profile = useMemo<Profile | null>(() => {
    if (!startingPoint || !goal) return null;
    return { startingPoint, goal, reportedCourses, workingInTech };
  }, [startingPoint, goal, reportedCourses, workingInTech]);

  const roadmap = useMemo(() => (profile ? buildRoadmap(profile) : null), [profile]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedPlan;
        if (saved && typeof saved === "object" && (saved.phase === "wizard" || saved.phase === "path")) {
          setPhase(saved.phase);
          setWizardStep(saved.wizardStep === 2 ? 2 : 1);
          setCareer(saved.career === "cybersecurity" ? "cybersecurity" : null);
          setStartingPoint(saved.startingPoint ?? "");
          setGoal(saved.goal ?? "");
          setReportedCourses(Array.isArray(saved.reportedCourses) ? saved.reportedCourses : []);
          setWorkingInTech(Boolean(saved.workingInTech));
          setExampleOn(Boolean(saved.exampleOn));
          setCompleted(Array.isArray(saved.completed) ? saved.completed : []);
        } else {
          setLoadError("A saved plan was found on this device, but it could not be read. Start a new one.");
        }
      }
    } catch {
      setLoadError("Saved progress on this device could not be read. You can start a new plan.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload: SavedPlan = {
      phase,
      wizardStep,
      career,
      startingPoint,
      goal,
      reportedCourses,
      workingInTech,
      exampleOn,
      completed,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setLoadError("This browser blocked saving. Your plan will last only until you refresh.");
    }
  }, [
    ready,
    phase,
    wizardStep,
    career,
    startingPoint,
    goal,
    reportedCourses,
    workingInTech,
    exampleOn,
    completed,
  ]);

  const profileKey = profile
    ? `${profile.startingPoint}|${profile.goal}|${profile.reportedCourses.join(",")}|${profile.workingInTech}`
    : "";

  useEffect(() => {
    if (!roadmap) return;
    const first = roadmap.stages[0]?.id;
    const second = roadmap.stages[1]?.id;
    setOpenStages([first, second].filter((id): id is string => Boolean(id)));
  }, [profileKey, roadmap]);

  useEffect(() => {
    if (!pendingScroll) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(pendingScroll)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    setPendingScroll(null);
  }, [pendingScroll, openStages]);

  useEffect(() => {
    if (phase === "path") headingRef.current?.focus();
  }, [phase, profileKey]);

  function loadExample() {
    setCareer("cybersecurity");
    setStartingPoint(EXAMPLE_STUDENT.profile.startingPoint);
    setGoal(EXAMPLE_STUDENT.profile.goal);
    setReportedCourses([...EXAMPLE_STUDENT.profile.reportedCourses]);
    setWorkingInTech(EXAMPLE_STUDENT.profile.workingInTech);
    setExampleOn(true);
    setWizardStep(2);
    setPhase("wizard");
  }

  function resetPlan() {
    const fresh = emptySaved();
    setPhase(fresh.phase);
    setWizardStep(fresh.wizardStep);
    setCareer(fresh.career);
    setStartingPoint(fresh.startingPoint);
    setGoal(fresh.goal);
    setReportedCourses(fresh.reportedCourses);
    setWorkingInTech(fresh.workingInTech);
    setExampleOn(fresh.exampleOn);
    setCompleted(fresh.completed);
    setResetArmed(false);
    setLoadError("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      setLoadError("The saved plan could not be removed from this browser.");
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-16">
        <p className="text-lg text-navy">Checking this browser for a saved plan.</p>
      </main>
    );
  }

  const canLeaveCareer = career === "cybersecurity";
  const canShowPath = Boolean(profile);
  const steps = roadmap ? allSteps(roadmap) : [];
  const doneCount = steps.filter((item) => completed.includes(item.id)).length;

  return (
    <div className="min-h-screen">
      <a href="#pathway-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
              SharkByte 2026 · North Campus challenge
            </p>
            <p className="font-display text-3xl text-navy sm:text-4xl">North Path</p>
          </div>
          <div className="max-w-sm text-sm leading-relaxed text-muted">
            <p>Independent student prototype. Not an official Miami Dade College service, and not a place to sign in.</p>
            <a href="/catalog" className="mt-2 inline-block font-semibold text-teal underline underline-offset-4">
              Full catalog planner
            </a>
          </div>
        </div>
      </header>

      <main id="pathway-main" className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        {loadError ? (
          <p role="alert" className="mb-6 rounded-xl border border-[#e2c2a4] bg-[#f8efe4] px-4 py-3 text-sm text-warn">
            {loadError}
          </p>
        ) : null}

        {phase === "wizard" ? (
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">Your next step, made clear.</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
              Choose cybersecurity, say where you are starting, and get a sourced sequence that begins at Miami Dade College. Other careers stay closed until they are researched the same way.
            </p>
            <div className="mt-8">
              <Stepper
                step={wizardStep}
                onStepChange={setWizardStep}
                onFinalStepCompleted={() => {
                  if (profile) setPhase("path");
                }}
                theme="light"
                accentColor="#0f5f5c"
                width="100%"
                radius={22}
                linear
                nextButtonText="Continue"
                completeButtonText="Show my path"
                backButtonText="Back"
                nextButtonProps={{
                  disabled: wizardStep === 1 ? !canLeaveCareer : !canShowPath,
                }}
                style={
                  {
                    "--stepper-frame": "#fffdf8",
                    "--stepper-ink": "#142033",
                    "--stepper-muted": "#3e4c5f",
                    "--stepper-frame-shadow": "0 18px 40px -28px rgba(20, 32, 51, 0.45)",
                  } as CSSProperties
                }
              >
                <Step title="Career" description="One pathway is ready">
                  <CareerStep career={career} onChange={(value) => { setExampleOn(false); setCareer(value); }} />
                </Step>
                <Step title="Starting point" description="Goal and courses">
                  <StartStep
                    baseId={baseId}
                    startingPoint={startingPoint}
                    goal={goal}
                    reportedCourses={reportedCourses}
                    workingInTech={workingInTech}
                    exampleOn={exampleOn}
                    onStartingPoint={(value) => { setExampleOn(false); setStartingPoint(value); }}
                    onGoal={(value) => { setExampleOn(false); setGoal(value); }}
                    onCourse={(id, checked) => {
                      setExampleOn(false);
                      setReportedCourses((current) =>
                        checked ? [...current, id] : current.filter((item) => item !== id),
                      );
                    }}
                    onWorking={(value) => { setExampleOn(false); setWorkingInTech(value); }}
                    onExample={loadExample}
                  />
                </Step>
              </Stepper>
            </div>
          </div>
        ) : roadmap && profile ? (
          <Results
            roadmap={roadmap}
            profile={profile}
            exampleOn={exampleOn}
            completed={completed}
            doneCount={doneCount}
            total={steps.length}
            openStages={openStages}
            resetArmed={resetArmed}
            headingRef={headingRef}
            onToggleStage={(id) =>
              setOpenStages((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onReveal={(stepId) => {
              const stage = roadmap?.stages.find((item) => item.steps.some((entry) => entry.id === stepId));
              if (!stage) return;
              setOpenStages((current) => (current.includes(stage.id) ? current : [...current, stage.id]));
              setPendingScroll(stepId);
            }}
            onToggleStep={(id) =>
              setCompleted((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onEdit={() => {
              setPhase("wizard");
              setWizardStep(2);
            }}
            onArmReset={() => setResetArmed(true)}
            onCancelReset={() => setResetArmed(false)}
            onReset={resetPlan}
          />
        ) : null}
      </main>
    </div>
  );
}

function CareerStep({
  career,
  onChange,
}: {
  career: "cybersecurity" | null;
  onChange: (value: "cybersecurity") => void;
}) {
  return (
    <fieldset>
      <legend className="text-base font-semibold text-navy">Which career should this path follow?</legend>
      <p className="mt-1 text-sm text-muted" id="career-help">
        Cybersecurity is the pilot. The other cards are visible so the limit is obvious.
      </p>
      <div className="mt-4 grid gap-3" role="radiogroup" aria-describedby="career-help">
        {CAREERS.map((item) => {
          const selected = item.available && career === item.id;
          return (
            <label
              key={item.id}
              className={`block rounded-2xl border px-4 py-3 ${
                item.available
                  ? selected
                    ? "border-teal bg-[#e7f3f2]"
                    : "border-line bg-card"
                  : "border-dashed border-line bg-[#f3eee6] text-muted"
              }`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="career"
                  value={item.id}
                  checked={selected}
                  disabled={!item.available}
                  onChange={() => {
                    if (item.available) onChange("cybersecurity");
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-navy">{item.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed">
                    {item.available ? item.detail : "Not yet available. "}
                    {item.available ? "" : item.detail}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">
        Official program names live in the{" "}
        <a className="font-semibold text-teal underline underline-offset-4" href={sources.inventory.url}>
          MDC academic program inventory
        </a>
        . Checked {sources.inventory.checked}.
      </p>
    </fieldset>
  );
}

function StartStep({
  baseId,
  startingPoint,
  goal,
  reportedCourses,
  workingInTech,
  exampleOn,
  onStartingPoint,
  onGoal,
  onCourse,
  onWorking,
  onExample,
}: {
  baseId: string;
  startingPoint: StartingPoint | "";
  goal: Goal | "";
  reportedCourses: ReportedCourse[];
  workingInTech: boolean;
  exampleOn: boolean;
  onStartingPoint: (value: StartingPoint) => void;
  onGoal: (value: Goal) => void;
  onCourse: (id: ReportedCourse, checked: boolean) => void;
  onWorking: (value: boolean) => void;
  onExample: () => void;
}) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-base font-semibold text-navy">Where are you starting?</legend>
        <div className="mt-3 space-y-2">
          {STARTS.map((item) => (
            <label key={item.id} className="flex gap-3 rounded-xl border border-line bg-card px-3 py-3">
              <input
                type="radio"
                name="starting-point"
                value={item.id}
                checked={startingPoint === item.id}
                onChange={() => onStartingPoint(item.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-navy">{item.label}</span>
                <span className="mt-1 block text-sm text-muted">{item.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-navy">Which credential do you want to aim at?</legend>
        <div className="mt-3 space-y-2">
          {GOALS.map((item) => (
            <label key={item.id} className="flex gap-3 rounded-xl border border-line bg-card px-3 py-3">
              <input
                type="radio"
                name="goal"
                value={item.id}
                checked={goal === item.id}
                onChange={() => onGoal(item.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-navy">{item.label}</span>
                <span className="mt-1 block text-sm text-muted">{item.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-navy">Courses you are telling us you already finished</legend>
        <p id={`${baseId}-courses`} className="mt-1 text-sm text-muted">
          Self-reported. Checking a box does not read a transcript and does not award credit.
        </p>
        <div className="mt-3 space-y-2" aria-describedby={`${baseId}-courses`}>
          {COURSE_OPTIONS.map((item) => (
            <label key={item.id} className="flex gap-3 rounded-xl border border-line bg-card px-3 py-3">
              <input
                type="checkbox"
                checked={reportedCourses.includes(item.id)}
                onChange={(event) => onCourse(item.id, event.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-navy">{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex gap-3 rounded-xl border border-line bg-card px-3 py-3">
        <input
          type="checkbox"
          checked={workingInTech}
          onChange={(event) => onWorking(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block font-semibold text-navy">I already work in technology</span>
          <span className="mt-1 block text-sm text-muted">
            Adds the two professional certificates as reading, plus notes about credit for prior learning. It does not verify your job.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onExample}
          className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy"
        >
          Load fictional example
        </button>
        {!startingPoint || !goal ? (
          <p className="text-sm text-warn" role="status">
            Choose a starting point and a credential to open the path.
          </p>
        ) : null}
      </div>
      {exampleOn ? (
        <p role="status" className="rounded-xl border border-teal/30 bg-[#e7f3f2] px-3 py-3 text-sm text-navy">
          {EXAMPLE_STUDENT.label} The form is filled with that example. Change anything and the example label goes away.
        </p>
      ) : null}
    </div>
  );
}

function Results({
  roadmap,
  profile,
  exampleOn,
  completed,
  doneCount,
  total,
  openStages,
  resetArmed,
  headingRef,
  onToggleStage,
  onReveal,
  onToggleStep,
  onEdit,
  onArmReset,
  onCancelReset,
  onReset,
}: {
  roadmap: Roadmap;
  profile: Profile;
  exampleOn: boolean;
  completed: string[];
  doneCount: number;
  total: number;
  openStages: string[];
  resetArmed: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onToggleStage: (id: string) => void;
  onReveal: (stepId: string) => void;
  onToggleStep: (id: string) => void;
  onEdit: () => void;
  onArmReset: () => void;
  onCancelReset: () => void;
  onReset: () => void;
}) {
  const next = roadmap.stages[0]?.steps[0];
  const education = stepsByCategory(roadmap, "education");
  const skills = stepsByCategory(roadmap, "skill");
  const projects = stepsByCategory(roadmap, "project");
  const educationOpen = education.find((item) => !completed.includes(item.id)) ?? education[0];
  const skillOpen = skills.find((item) => !completed.includes(item.id)) ?? skills[0];
  const projectOpen = projects.find((item) => !completed.includes(item.id)) ?? projects[0];

  function download() {
    const text = roadmapToText(roadmap, profile, exampleOn ? EXAMPLE_STUDENT.label : undefined);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "north-path-roadmap.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Your path</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-[1.65rem] leading-tight text-navy sm:text-4xl">
            {roadmap.headline}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:mt-3 sm:text-base" aria-live="polite">
            {roadmap.lede}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy">
            Edit answers
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy">
            Print
          </button>
          <button type="button" onClick={download} className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
            Download text
          </button>
        </div>
      </div>

      {exampleOn ? (
        <p className="mt-4 rounded-xl border border-teal/30 bg-[#e7f3f2] px-3 py-3 text-sm text-navy" role="status">
          {EXAMPLE_STUDENT.label}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 lg:order-1">
          <ol className="space-y-4">
            {roadmap.stages.map((stage, index) => {
              const open = openStages.includes(stage.id);
              const panelId = `stage-panel-${stage.id}`;
              return (
                <li key={stage.id} className="rounded-2xl border border-line bg-card">
                  <h2 className="text-lg">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => onToggleStage(stage.id)}
                    >
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                          Stage {index + 1}
                        </span>
                        <span className="mt-1 block font-display text-2xl text-navy">{stage.title}</span>
                        <span className="mt-1 block text-sm font-normal leading-relaxed text-muted">{stage.summary}</span>
                      </span>
                      <span className="mt-1 text-sm font-semibold text-teal" aria-hidden="true">
                        {open ? "Hide" : "Show"}
                      </span>
                    </button>
                  </h2>
                  <div id={panelId} className={`stage-body border-t border-line px-4 py-2 ${open ? "" : "hidden"}`}>
                    <ol className="divide-y divide-line">
                      {stage.steps.map((item) => {
                        const checked = completed.includes(item.id);
                        const detailId = `detail-${item.id}`;
                        return (
                          <li key={item.id} id={item.id} className="py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                  {item.category === "education"
                                    ? "Education"
                                    : item.category === "skill"
                                      ? "Skill"
                                      : item.category === "project"
                                        ? "Project"
                                        : "Next action"}
                                  {" · "}
                                  {evidenceLabel(item.evidence)}
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-navy">{item.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted">{item.summary}</p>
                              </div>
                              <label className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-navy">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleStep(item.id)}
                                  aria-label={`Mark complete: ${item.title}`}
                                />
                                Done
                              </label>
                            </div>
                            <details className="mt-3" id={detailId}>
                              <summary className="cursor-pointer text-sm font-semibold text-teal">
                                Source and why this step is here
                              </summary>
                              <p className="mt-2 text-sm leading-relaxed text-navy">{item.detail}</p>
                              <ul className="mt-2 space-y-1">
                                {item.sources.map((itemSource) => (
                                  <li key={itemSource.url + itemSource.label} className="text-sm">
                                    <a className="font-semibold text-teal underline underline-offset-4" href={itemSource.url}>
                                      {itemSource.label}
                                    </a>
                                    <span className="text-muted"> · checked {itemSource.checked}</span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </li>
              );
            })}
          </ol>

          <section className="mt-6 rounded-2xl border border-line bg-[#f3eee6] px-4 py-4">
            <h2 className="font-display text-2xl text-navy">What this path will not do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy">
              {roadmap.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          <div
            className="mb-3 rounded-2xl border border-line bg-card px-4 py-3"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
            aria-valuetext={`${doneCount} of ${total} steps marked complete on this device`}
          >
            <p className="text-sm font-semibold text-navy">
              {doneCount} of {total} steps marked complete
            </p>
            <p className="mt-1 text-xs text-muted">Saved in this browser only.</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7dfd2]">
              <div
                className="h-full bg-teal"
                style={{ width: total === 0 ? "0%" : `${Math.round((doneCount / total) * 100)}%` }}
              />
            </div>
          </div>
          <BentoGrid
            onClick={(event) => {
              const anchor = (event.target as HTMLElement).closest("a");
              const stepId = anchor?.getAttribute("href")?.replace("#", "");
              if (!stepId) return;
              event.preventDefault();
              onReveal(stepId);
            }}
          >
            {next ? (
              <BentoCard
                emphasis
                name="Next action"
                description={next.summary}
                href={`#${next.id}`}
                cta="Go to this step"
                Icon={IconNext}
              />
            ) : null}
            {educationOpen ? (
              <BentoCard
                name="Education"
                description={`${education.length} documented or advisor steps. Next open: ${educationOpen.title}`}
                href={`#${educationOpen.id}`}
                cta="Open education"
                Icon={IconBook}
              />
            ) : null}
            {skillOpen ? (
              <BentoCard
                name="Skills"
                description={`${skills.length} recommended practice items. Next open: ${skillOpen.title}`}
                href={`#${skillOpen.id}`}
                cta="Open skills"
                Icon={IconSkill}
              />
            ) : null}
            {projectOpen ? (
              <BentoCard
                name="Projects"
                description={`${projects.length} prototype projects, not MDC assignments. Next open: ${projectOpen.title}`}
                href={`#${projectOpen.id}`}
                cta="Open projects"
                Icon={IconProject}
              />
            ) : null}
          </BentoGrid>
          <div className="no-print mt-3">
            {resetArmed ? (
              <div className="rounded-2xl border border-[#e2c2a4] bg-[#f8efe4] px-4 py-3">
                <p className="text-sm text-warn">This clears the saved plan and every checked step on this device.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={onReset} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                    Reset plan
                  </button>
                  <button type="button" onClick={onCancelReset} className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={onArmReset} className="text-sm font-semibold text-muted underline underline-offset-4">
                Reset saved progress
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
