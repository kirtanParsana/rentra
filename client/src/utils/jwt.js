function base64UrlToJson(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const json = atob(padded);
  return JSON.parse(json);
}

export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    return base64UrlToJson(parts[1]);
  } catch {
    return null;
  }
}

export function isJwtExpired(token, skewSeconds = 15) {
  const payload = decodeJwt(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false; // token without exp -> treat as non-expiring (server may still reject)
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
}

