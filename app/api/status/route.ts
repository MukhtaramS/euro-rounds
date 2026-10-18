import { NextResponse } from "next/server";
import { callN8n, N8nError } from "@/lib/n8n";

const ALLOWED = ["pending", "approved", "rejected"];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
  const id = Number(body?.id);
  const status = String(body?.status ?? "");

  if (!Number.isInteger(id) || id <= 0 || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Expected { id: number, status: pending|approved|rejected }" }, { status: 400 });
  }

  try {
    const data = await callN8n<{ ok: boolean; updated: number }>("euro-rounds/status", {
      method: "POST",
      body: { id, status },
    });
    return NextResponse.json(data);
  } catch (e) {
    const err = e as N8nError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
