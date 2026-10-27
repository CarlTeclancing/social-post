const BASE = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";

export async function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  const isAuthRequest = path.startsWith("/auth/");
  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;
  const isJsonBody =
    typeof opts.body === "string" ||
    (opts.body !== undefined && opts.body !== null && !isFormData);

  const r = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(!isFormData && isJsonBody && { "Content-Type": "application/json" }),
      ...(!isAuthRequest && token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    body:
      opts.body !== undefined && typeof opts.body !== "string" && !isFormData
        ? JSON.stringify(opts.body)
        : opts.body,
  });

  const d = await r.json().catch(() => ({}));

  if (!r.ok) {
    if (r.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
    }
    throw new Error(d.error || "Request failed");
  }

  return d;
}
