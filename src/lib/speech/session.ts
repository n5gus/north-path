export type SpeechPhase = "idle" | "listening" | "confirming" | "denied" | "unsupported" | "error";

export function recognitionAvailable(constructor: unknown): boolean {
  return typeof constructor === "function";
}

export function phaseFromSpeechError(error: string): SpeechPhase {
  if (error === "not-allowed" || error === "service-not-allowed") return "denied";
  if (error === "aborted") return "idle";
  return "error";
}
