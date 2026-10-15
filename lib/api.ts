export type Book = {
  id: string;
  title: string;
  author?: string | null;
  year?: number | null;
  pages?: number | null;
  isbn?: string | null;
  cover?: string | null;
  why?: string;
  difficulty?: string;
  weeks?: number;
  not_for?: string;
};

export type Availability = {
  free: { source: string; url: string }[];
  buy: { store: string; url: string; price: number | null; currency: string | null }[];
  links: { store: string; url: string }[];
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Algo salió mal. Probá de nuevo.");
  }
  return response.json();
}
