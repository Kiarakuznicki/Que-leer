import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>Contanos qué te gustó y te decimos qué leer.</h1>
      <p className="lead">
        Armamos tu perfil de lector y buscamos en el catálogo todos los libros que encajan con él. Cada uno viene con
        el porqué, qué tan exigente es y cuánto tiempo te llevaría leerlo.
      </p>
      <p>
        <Link className="btn" href="/test">Hacer el test</Link>
      </p>
      <form action="/buscar" className="search">
        <input name="q" placeholder="O buscá un libro por título o autor" aria-label="Buscar libro" />
        <button>Buscar</button>
      </form>
    </>
  );
}
