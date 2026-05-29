const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function readResponseBody(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(path, { token, ...init } = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body != null) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && data.message) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, { status: response.status, data });
  }

  return data;
}

