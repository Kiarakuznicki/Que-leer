"use client";

import { useState } from "react";
import { api, type Availability, type Book } from "@/lib/api";

export default function BookCard({ book }: { book: Book }) {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ title: book.title });
    if (book.author) params.set("author", book.author);
    if (book.isbn) params.set("isbn", book.isbn);
    try {
      setAvailability(await api<Availability>(`/availability?${params}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const byline = [book.author, book.year, book.pages ? `${book.pages} págs.` : null].filter(Boolean).join(", ");
  const reading = [
    book.difficulty ? `Dificultad: ${book.difficulty}` : null,
    book.weeks ? `lectura de unas ${book.weeks} semanas` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="book">
      {book.cover ? <img src={book.cover} alt="" width={92} /> : <div className="nocover" aria-hidden="true" />}
      <div>
        <h3>{book.title}</h3>
        {byline && <p className="byline">{byline}</p>}
        {book.why && <p>{book.why}</p>}
        {reading && <p className="reading">{reading}</p>}
        {book.not_for && <p className="notfor">No es para: {book.not_for}</p>}

        {availability ? (
          <ul className="avail">
            {availability.free.map((item) => (
              <li key={item.url} className="free">
                <a href={item.url} target="_blank" rel="noreferrer">Leer gratis: {item.source}</a>
              </li>
            ))}
            {availability.buy.map((offer) => (
              <li key={offer.url}>
                <a href={offer.url} target="_blank" rel="noreferrer">
                  Comprar en {offer.store}
                  {offer.price ? `, ${offer.price} ${offer.currency ?? ""}` : ""}
                </a>
              </li>
            ))}
            {availability.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer">Buscar en {link.store}</a>
              </li>
            ))}
          </ul>
        ) : (
          <button onClick={load} disabled={loading}>
            {loading ? "Buscando" : "Ver dónde conseguirlo"}
          </button>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </article>
  );
}
