// Persists an invite code across the login (and admin-approval) gap.
// Stored shape: { code, savedAt }. Ignored/cleared after 7 days so a stale
// invite never hijacks a later, unrelated login.
const KEY = 'pendingInviteCode';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const setPendingInvite = (code) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, savedAt: Date.now() }));
  } catch { /* storage unavailable — link still works on re-open */ }
};

export const getPendingInvite = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, savedAt } = JSON.parse(raw);
    if (!code || typeof savedAt !== 'number' || Date.now() - savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
};

export const clearPendingInvite = () => {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
};
