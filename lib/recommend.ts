import { randomBytes } from "node:crypto";
import { config } from "./config";
import { saveResult } from "./db";
import { buildProfile, rankBooks, type Pick, type Profile } from "./llm";
import { HOURS_KEY } from "./shared";
import { searchBooks, type Book } from "./sources";

export type Answers = Record<string, string>;
export type RankedBook = Book & Partial<Omit<Pick, "id">>;
export type StoredResult = { profile: Profile; picks: RankedBook[] };

export class CatalogUnavailable extends Error {}

export function sanitizeAnswers(raw: unknown): Answers {
  if (!raw || typeof raw !== "object") return {};
  const clean: Answers = {};
  for (const [key, value] of Object.entries(raw).slice(0, config.maxAnswers)) {
    if (typeof value === "string" && value.trim()) {
      clean[key.slice(0, config.maxAnswerKeyLength)] = value.trim().slice(0, config.maxAnswerLength);
    }
  }
  return clean;
}

function interleave<T>(lists: T[][]): T[] {
  const merged: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let index = 0; index < longest; index++) {
    for (const list of lists) {
      if (index < list.length) merged.push(list[index]);
    }
  }
  return merged;
}

function unique(books: Book[]): Book[] {
  return [...new Map(books.map((book) => [book.id, book])).values()];
}

async function gather(queries: string[]): Promise<Book[]> {
  const settled = await Promise.allSettled(queries.map((query) => searchBooks(query, config.resultsPerQuery)));
  const lists = settled.flatMap((outcome) => (outcome.status === "fulfilled" ? [outcome.value] : []));
  if (settled.length > 0 && lists.length === 0) throw new CatalogUnavailable();
  return interleave(lists);
}

function fallbackQueries(profile: Profile, answers: Answers, freeText: string): string[] {
  const words = [profile.resumen, ...profile.generos, ...Object.values(answers), freeText]
    .join(" ")
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length >= config.minWordLength)
    .map((word) => word.toLowerCase());
  return [...new Set([...profile.generos, ...words])].slice(0, config.fallbackQueries);
}

async function rank(profile: Profile, candidates: Book[], hours: string | undefined): Promise<RankedBook[]> {
  try {
    const picks = await rankBooks(profile, candidates, hours);
    const byId = new Map(candidates.map((book) => [book.id, book]));
    const seen = new Set<string>();
    const ranked: RankedBook[] = [];
    for (const pick of picks) {
      const book = byId.get(pick.id);
      if (!book || seen.has(pick.id)) continue;
      seen.add(pick.id);
      ranked.push({ ...book, ...pick });
    }
    if (ranked.length) return ranked.slice(0, config.maxResults);
  } catch (error) {
    console.error(error);
  }
  return candidates.slice(0, config.maxResults);
}

export async function recommend(answers: Answers, freeText: string): Promise<string> {
  const { profile, queries } = await buildProfile(answers, freeText);

  let pool = unique(await gather(queries));
  if (pool.length < config.minCandidates) {
    const extra = await gather(fallbackQueries(profile, answers, freeText));
    pool = unique([...pool, ...extra]);
  }
  if (!pool.length) throw new CatalogUnavailable();

  const picks = await rank(profile, pool.slice(0, config.maxCandidates), answers[HOURS_KEY]);
  const id = randomBytes(config.idBytes).toString("base64url");
  await saveResult(id, { profile, picks } satisfies StoredResult);
  return id;
}
