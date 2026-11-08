import type { DirectoryProgram } from "../directory/build";

export interface GoalMatch {
  program: DirectoryProgram;
  score: number;
  reasons: string[];
}

export interface GoalMatchResult {
  query: string;
  matches: GoalMatch[];
  broad: boolean;
  note: string;
}

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "my",
  "i",
  "want",
  "be",
  "become",
  "career",
  "job",
  "work",
  "with",
  "at",
  "mdc",
  "into",
  "as",
  "on",
  "me",
]);

export function goalTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP.has(token));
}

function wordHit(token: string, words: string[]): boolean {
  return words.some((word) => word === token || (token.length >= 4 && word.startsWith(token)));
}

export function matchGoal(text: string, programs: DirectoryProgram[]): GoalMatchResult {
  const tokens = goalTokens(text);
  if (tokens.length === 0) {
    return {
      query: text.trim(),
      matches: [],
      broad: false,
      note: "Type a career or subject. North Path matches those words to program names and CIP series titles. It does not guess a job from a blank line.",
    };
  }
  const matches: GoalMatch[] = [];
  for (const program of programs) {
    if (program.awardType === "CE") continue;
    const nameWords = goalTokens(program.name);
    const cipWords = goalTokens(program.cipTitle ?? "");
    const reasons: string[] = [];
    let score = 0;
    for (const token of tokens) {
      if (wordHit(token, nameWords)) {
        score += 5;
        reasons.push(`The program name contains “${token}”.`);
      } else if (wordHit(token, cipWords)) {
        score += 2;
        reasons.push(`The CIP series title contains “${token}”. That is a classification, not a career placement.`);
      }
    }
    if (score > 0) matches.push({ program, score, reasons: [...new Set(reasons)] });
  }
  matches.sort((a, b) => b.score - a.score || a.program.name.localeCompare(b.program.name) || a.program.id.localeCompare(b.program.id));
  const broad = matches.length > 12;
  const shown = matches.slice(0, 8);
  let note = "A match means the words appear in the program name or its CIP series title. It is not eligibility, admission, or a job offer.";
  if (matches.length === 0) {
    note = "No indexed program name or CIP series title contains those words. Try another phrase, or search the Directory. Nothing was invented to fill the gap.";
  } else if (broad) {
    note = `Those words appear on ${matches.length} records. Showing the eight strongest name matches. Add another word, or open Directory to see the rest.`;
  } else if (shown.every((item) => item.reasons.every((reason) => reason.includes("CIP series")))) {
    note = "No program name contains those words. The rows below only share a word with a CIP series title. That is not a career-to-program crosswalk.";
  }
  return { query: text.trim(), matches: shown, broad, note };
}

export type DiscoverAward = "any" | "certificate" | "associate" | "bachelor";

const AWARD_SETS: Record<Exclude<DiscoverAward, "any">, string[]> = {
  certificate: ["CCC", "CTC", "ATC"],
  associate: ["AS", "AA", "AAS", "AA-PATHWAY"],
  bachelor: ["BS", "BAS"],
};

export interface DiscoverAnswers {
  groupIds: string[];
  activity: string;
  award: DiscoverAward;
}

export interface DiscoverRank {
  program: DirectoryProgram;
  score: number;
  reasons: string[];
}

export function rankDiscover(answers: DiscoverAnswers, programs: DirectoryProgram[], groupTitles: Map<string, string>): DiscoverRank[] {
  const activityTokens = goalTokens(answers.activity);
  if (answers.groupIds.length === 0 && activityTokens.length === 0) return [];
  const ranks: DiscoverRank[] = [];
  for (const program of programs) {
    if (program.awardType === "CE") continue;
    if (answers.groupIds.length > 0 && !answers.groupIds.includes(program.groupId)) continue;
    if (answers.award !== "any" && !AWARD_SETS[answers.award].includes(program.awardType)) continue;
    const reasons: string[] = [];
    let score = 1;
    if (answers.groupIds.includes(program.groupId)) {
      reasons.push(`You selected ${groupTitles.get(program.groupId) ?? program.groupId}.`);
    }
    if (answers.award !== "any") {
      reasons.push(`You asked for a ${answers.award} award, and this record is ${program.awardType}.`);
      score += 1;
    }
    if (activityTokens.length > 0) {
      const nameWords = goalTokens(program.name);
      const hits = activityTokens.filter((token) => wordHit(token, nameWords));
      if (answers.groupIds.length === 0 && hits.length === 0) continue;
      if (hits.length > 0) {
        score += hits.length * 3;
        reasons.push(`Your words match the program name: ${hits.join(", ")}.`);
      }
    }
    ranks.push({ program, score, reasons });
  }
  ranks.sort((a, b) => b.score - a.score || a.program.name.localeCompare(b.program.name) || a.program.id.localeCompare(b.program.id));
  return ranks.slice(0, 12);
}
