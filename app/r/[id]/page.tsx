import { notFound } from "next/navigation";
import BookCard from "@/components/BookCard";
import ShareButton from "@/components/ShareButton";
import { getResult } from "@/lib/db";
import type { StoredResult } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export default async function Result({ params }: { params: { id: string } }) {
  const result = await getResult<StoredResult>(params.id);
  if (!result) notFound();
  const { profile, picks } = result;

  return (
    <>
      <h1>Tu próxima lectura</h1>
      {profile.resumen && <p className="lead">{profile.resumen}</p>}
      <p className="muted">
        {picks.length === 1
          ? "Encontramos 1 libro"
          : `Encontramos ${picks.length} libros`}{" "}
        que encajan con tu perfil.
      </p>
      <div className="listado catalogo">
        {picks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
      <p>
        <ShareButton />
      </p>
    </>
  );
}
