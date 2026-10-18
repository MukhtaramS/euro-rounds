import "server-only";

const base = process.env.N8N_WEBHOOK_BASE?.replace(/\/$/, "");
const key = process.env.EURO_ROUNDS_KEY;

export class N8nError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

// Calls a Euro Rounds – API webhook. Runs only on the server so the key never reaches the browser.
export async function callN8n<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  if (!base || !key) {
    throw new N8nError("N8N_WEBHOOK_BASE or EURO_ROUNDS_KEY is missing in .env.local", 500);
  }

  const res = await fetch(`${base}/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "x-euro-rounds-key": key,
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 404
        ? " (is the 'Euro Rounds – API' workflow published?)"
        : res.status === 403 || res.status === 401
          ? " (does EURO_ROUNDS_KEY match the n8n credential?)"
          : "";
    throw new N8nError(`n8n ${res.status}${hint}: ${text.slice(0, 200)}`, res.status);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new N8nError(`n8n returned non-JSON: ${text.slice(0, 200)}`);
  }
}
