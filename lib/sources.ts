import { config, endpoints, storeSearches } from "./config";
import { readCache, writeCache } from "./db";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  subjects: string[];
  cover: string | null;
};

export type FreeSource = { source: string; url: string };
export type BuyOffer = { store: string; url: string; price: number | null; currency: string | null };
export type StoreLink = { store: string; url: string };
export type Availability = { free: FreeSource[]; buy: BuyOffer[]; links: StoreLink[] };

type OpenLibraryDoc = {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  subject?: string[];
  number_of_pages_median?: number;
};

type GoogleVolume = {
  saleInfo?: { saleability?: string; buyLink?: string; listPrice?: { amount?: number; currencyCode?: string } };
  accessInfo?: { viewability?: string; webReaderLink?: string };
};

const FOR_SALE = "FOR_SALE";
const FULL_VIEW = "ALL_PAGES";

type FetchInit = RequestInit & { next?: { revalidate: number } };

function request(url: URL, init: FetchInit = {}): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": config.userAgent },
    signal: AbortSignal.timeout(config.fetchTimeoutMs),
    ...init,
  });
}

export function normalize(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function toBook(doc: OpenLibraryDoc): Book {
  return {
    id: doc.key,
    title: doc.title ?? "",
    author: doc.author_name?.slice(0, config.maxAuthors).join(", ") || null,
    year: doc.first_publish_year ?? null,
    pages: doc.number_of_pages_median ?? null,
    isbn: doc.isbn?.[0] ?? null,
    subjects: doc.subject?.slice(0, config.maxSubjects) ?? [],
    cover: doc.cover_i ? `${endpoints.openLibraryCover}/id/${doc.cover_i}-M.jpg` : null,
  };
}

export async function searchBooks(query: string, limit: number): Promise<Book[]> {
  const url = new URL(endpoints.openLibrary);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", endpoints.openLibraryFields);
  const response = await request(url, { next: { revalidate: config.searchRevalidateSeconds } });
  if (!response.ok) throw new Error(`Open Library respondió ${response.status}`);
  const { docs = [] } = (await response.json()) as { docs?: OpenLibraryDoc[] };
  return docs.filter((doc) => doc.title).map(toBook);
}

async function findPublicDomain(title: string, author: string | null): Promise<FreeSource[]> {
  const url = new URL(endpoints.gutendex);
  url.searchParams.set("search", [title, author].filter(Boolean).join(" "));
  const response = await request(url);
  if (!response.ok) return [];
  const { results = [] } = (await response.json()) as { results?: { id: number; title: string }[] };
  const wanted = normalize(title);
  const match = results.find((book) => {
    const found = normalize(book.title);
    return found && (found.includes(wanted) || wanted.includes(found));
  });
  return match ? [{ source: "Project Gutenberg, dominio público", url: `${endpoints.gutenbergBook}/${match.id}` }] : [];
}

async function findGoogleBooks(
  title: string,
  author: string | null,
  isbn: string | null,
): Promise<{ free: FreeSource[]; buy: BuyOffer[] }> {
  const url = new URL(endpoints.googleBooks);
  const query = isbn
    ? `isbn:${isbn}`
    : [`intitle:${title}`, author && `inauthor:${author.split(",")[0]}`].filter(Boolean).join(" ");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(config.googleResults));
  if (config.booksCountry) url.searchParams.set("country", config.booksCountry);
  const response = await request(url);
  if (!response.ok) return { free: [], buy: [] };
  const { items = [] } = (await response.json()) as { items?: GoogleVolume[] };
  const free: FreeSource[] = [];
  const buy: BuyOffer[] = [];
  for (const { saleInfo, accessInfo } of items) {
    if (saleInfo?.saleability === FOR_SALE && saleInfo.buyLink) {
      buy.push({
        store: "Google Play Libros",
        url: saleInfo.buyLink,
        price: saleInfo.listPrice?.amount ?? null,
        currency: saleInfo.listPrice?.currencyCode ?? null,
      });
    }
    if (accessInfo?.viewability === FULL_VIEW && accessInfo.webReaderLink) {
      free.push({ source: "Google Books, lectura completa", url: accessInfo.webReaderLink });
    }
  }
  return { free, buy };
}

function storeLinks(title: string, author: string | null): StoreLink[] {
  const text = [title, author].filter(Boolean).join(" ");
  const slug = normalize(text).split(" ").filter(Boolean).join("-");
  return storeSearches
    .filter((store) => store.enabled())
    .map((store) => ({ store: store.name, url: store.url(text, slug) }));
}

function uniqueByUrl<T extends { url: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.url, item])).values()];
}

export async function findAvailability(
  title: string,
  author: string | null,
  isbn: string | null,
): Promise<Availability> {
  const key = [isbn ?? "", normalize(title), normalize(author)].join("|");
  const cached = await readCache<Availability>(key).catch(() => null);
  if (cached) return cached;

  const [publicDomain, google] = await Promise.all([
    findPublicDomain(title, author).catch((): FreeSource[] => []),
    findGoogleBooks(title, author, isbn).catch(() => ({ free: [] as FreeSource[], buy: [] as BuyOffer[] })),
  ]);

  const result: Availability = {
    free: uniqueByUrl([...publicDomain, ...google.free]).slice(0, config.maxFree),
    buy: uniqueByUrl(google.buy).slice(0, config.maxBuy),
    links: storeLinks(title, author),
  };
  await writeCache(key, result).catch(() => undefined);
  return result;
}
