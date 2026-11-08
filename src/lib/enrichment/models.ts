/** Model ids copied from https://ai.google.dev/gemini-api/docs/models on 2026-11-07. */
export const SUPPORTED_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash"] as const;

export const DEFAULT_GEMINI_MODEL: (typeof SUPPORTED_GEMINI_MODELS)[number] = "gemini-3.8-flash";

export const GEMINI_API_REVISION = "2026-05-20";

export const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export const MAX_SOURCE_CHARS = 8000;

export const MAX_CLAIMS = 30;

export function resolveGeminiModel(env: Record<string, string | undefined>): { model: string } | { error: string } {
  const requested = env.NORTH_PATH_GEMINI_MODEL?.trim();
  if (!requested) return { model: DEFAULT_GEMINI_MODEL };
  if ((SUPPORTED_GEMINI_MODELS as readonly string[]).includes(requested)) return { model: requested };
  return { error: `NORTH_PATH_GEMINI_MODEL is not in the supported list: ${SUPPORTED_GEMINI_MODELS.join(", ")}` };
}

export function readGeminiKey(env: Record<string, string | undefined>): string | null {
  const key = env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}
