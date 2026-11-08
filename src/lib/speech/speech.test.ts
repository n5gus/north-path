import { describe, expect, it } from "vitest";
import { phaseFromSpeechError, recognitionAvailable } from "./session";

describe("speech session", () => {
  it("treats a missing constructor as unsupported and permission errors as denied", () => {
    expect(recognitionAvailable(undefined)).toBe(false);
    expect(recognitionAvailable(function SpeechRecognition() {})).toBe(true);
    expect(phaseFromSpeechError("not-allowed")).toBe("denied");
    expect(phaseFromSpeechError("service-not-allowed")).toBe("denied");
    expect(phaseFromSpeechError("network")).toBe("error");
    expect(phaseFromSpeechError("aborted")).toBe("idle");
  });
});
