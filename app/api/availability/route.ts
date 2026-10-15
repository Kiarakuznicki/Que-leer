import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { findAvailability } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = params.get("title")?.trim().slice(0, config.maxTitleLength);
  if (!title) return NextResponse.json({ detail: "Falta el título del libro." }, { status: 400 });

  try {
    return NextResponse.json(await findAvailability(title, params.get("author"), params.get("isbn")));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "No pudimos consultar dónde conseguirlo." }, { status: 502 });
  }
}
