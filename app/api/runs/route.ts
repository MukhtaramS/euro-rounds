import { NextResponse } from "next/server";
import { callN8n, N8nError } from "@/lib/n8n";
import type { Run } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await callN8n<{ runs: Run[] }>("euro-rounds/runs");
    return NextResponse.json({ runs: data.runs ?? [] });
  } catch (e) {
    const err = e as N8nError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
