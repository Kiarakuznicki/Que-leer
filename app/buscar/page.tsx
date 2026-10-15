import BookCard from "@/components/BookCard";
import { config } from "@/lib/config";
import { searchBooks, type Book } from "@/lib/sources";

export const dynamic = "force-dynamic";

export default async function Buscar({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() ?? "";
  let books: Book[] = [];
  let failed = false;

  if (query.length >= config.minSearchLength) {
    try {
      books = await searchBooks(query, config.searchLimit);
    } catch {
      failed = true;
    }
  }

  return (
    <>
      <h1>Buscar un libro</h1>
      <form className="search">
        <input name="q" defaultValue={query} placeholder="Título o autor" aria-label="Buscar libro" />
        <button>Buscar</button>
      </form>
      {failed && <p className="error">No pudimos buscar ahora. Probá de nuevo en un momento.</p>}
      {query && !failed && books.length === 0 && (
        <p className="muted">No hay resultados para &ldquo;{query}&rdquo;. Probá con el autor o con parte del título.</p>
      )}
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </>
  );
}
