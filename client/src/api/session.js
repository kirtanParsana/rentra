import { apiFetch } from "./http";

export function verifySession(token, { signal } = {}) {
  return apiFetch("/private", {
    method: "GET",
    token,
    signal,
  });
}

