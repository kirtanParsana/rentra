const AUTH_STORAGE_KEY = "rentra_auth";

export function readAuthFromStorage() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: "", user: null };
    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed?.token === "string" ? parsed.token : "",
      user: parsed?.user ?? null,
    };
  } catch {
    return { token: "", user: null };
  }
}

export function writeAuthToStorage(auth) {
  const safe = {
    token: typeof auth?.token === "string" ? auth.token : "",
    user: auth?.user ?? null,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

