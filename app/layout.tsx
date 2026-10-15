import Link from "next/link";
import { EB_Garamond, Courier_Prime, IM_Fell_English } from "next/font/google";
import "./globals.css";

const titulo = IM_Fell_English({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-titulo" });
const texto = EB_Garamond({ subsets: ["latin"], variable: "--font-texto" });
const maquina = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-maquina" });

export const metadata = {
  title: "Qué leer",
  description: "Elegí tu próximo libro y encontrá dónde conseguirlo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titulo.variable} ${texto.variable} ${maquina.variable}`}>
      <body>
        <header>
          <Link href="/" className="logo">Qué leer</Link>
          <nav>
            <Link href="/test">Test de lector</Link>
            <Link href="/buscar">Buscar un libro</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
