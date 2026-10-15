import { MAX_ANSWER_LENGTH, MAX_FREE_TEXT } from "./shared";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function numeric(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number(raw);
  return raw && Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get groqKey() {
    return required("GROQ_API_KEY");
  },
  get llmModel() {
    return required("LLM_MODEL");
  },
  get booksCountry() {
    return process.env.BOOKS_COUNTRY;
  },
  get mercadoLibreDomain() {
    return process.env.MERCADOLIBRE_DOMAIN;
  },
  userAgent: "QueLeer/1.0",
  hourlyLimit: numeric("RATE_LIMIT_PER_HOUR", 10),
  dailyCap: numeric("DAILY_CAP", 300),
  cacheHours: numeric("AVAILABILITY_CACHE_HOURS", 6),
  llmTemperature: numeric("LLM_TEMPERATURE", 0.3),
  llmMaxTokens: numeric("LLM_MAX_TOKENS", 8000),
  llmAttempts: numeric("LLM_ATTEMPTS", 2),
  llmTimeoutMs: numeric("LLM_TIMEOUT_MS", 100000),
  fetchTimeoutMs: numeric("FETCH_TIMEOUT_MS", 10000),
  searchRevalidateSeconds: numeric("SEARCH_REVALIDATE_SECONDS", 3600),
  minQueries: 8,
  maxQueries: 14,
  resultsPerQuery: 20,
  minCandidates: 30,
  maxCandidates: 90,
  maxResults: 45,
  fallbackQueries: 10,
  minWordLength: 5,
  maxAnswers: 20,
  maxAnswerKeyLength: 40,
  maxFreeText: MAX_FREE_TEXT,
  maxAnswerLength: MAX_ANSWER_LENGTH,
  maxTitleLength: 200,
  minSearchLength: 2,
  searchLimit: 12,
  maxAuthors: 2,
  maxSubjects: 6,
  googleResults: 3,
  maxFree: 3,
  maxBuy: 3,
  idBytes: 6,
};

export const endpoints = {
  openLibrary: "https://openlibrary.org/search.json",
  openLibraryFields: "key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median",
  openLibraryCover: "https://covers.openlibrary.org/b",
  gutendex: "https://gutendex.com/books",
  gutenbergBook: "https://www.gutenberg.org/ebooks",
  googleBooks: "https://www.googleapis.com/books/v1/volumes",
  groqChat: "https://api.groq.com/openai/v1/chat/completions",
};

export const storeSearches = [
  {
    name: "Mercado Libre",
    enabled: () => Boolean(config.mercadoLibreDomain),
    url: (_text: string, slug: string) => `https://listado.${config.mercadoLibreDomain}/${slug}`,
  },
  {
    name: "Google Shopping",
    enabled: () => true,
    url: (text: string) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(text)}`,
  },
];
