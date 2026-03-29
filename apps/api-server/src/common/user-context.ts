export const DEFAULT_USER_ID = "user_local_default";

export function normalizeUserId(raw?: string): string {
  if (!raw || raw.trim().length === 0) {
    return DEFAULT_USER_ID;
  }
  return raw.trim();
}
