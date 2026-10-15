import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { clientIp, enforceLimits, LimitError } from "@/lib/limits";
import { CatalogUnavailable, recommend, sanitizeAnswers } from "@/lib/recommend";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function fail(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const answers = sanitizeAnswers(body?.answers);
  const freeText = typeof body?.free_text === "string" ? body.free_text.trim().slice(0, config.maxFreeText) : "";

  if (!Object.keys(answers).length && !freeText) {
    return fail("Respondé alguna pregunta o escribí qué te gustaría leer.", 400);
  }

  try {
    await enforceLimits(clientIp(request));
    const id = await recommend(answers, freeText);
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof LimitError) return fail(error.message, error.status);
    console.error(error);
    if (error instanceof CatalogUnavailable) {
      return fail("No pudimos consultar el catálogo de libros. Probá de nuevo en unos minutos.", 502);
    }
    return fail("No pudimos generar las recomendaciones. Probá de nuevo.", 502);
  }
}
