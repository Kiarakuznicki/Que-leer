# Qué leer

Una aplicación web para decidir qué libro leer y averiguar dónde conseguirlo. El lector responde un test (preguntas guiadas, texto libre, o ambos) y recibe una lista de libros reales que encajan con su perfil, cada uno con una explicación de por qué, una estimación de dificultad y de cuánto tiempo llevaría leerlo. Para cada libro se puede consultar si existe una versión gratuita y legal, o dónde comprarlo.

No requiere cuenta ni inicio de sesión. Cada lista queda guardada con un enlace corto que se puede compartir.

## Qué hace

- **Test de lector.** Cinco preguntas de opción múltiple, campos para libros que gustaron y libros abandonados, y un cuadro de texto libre. Se puede completar todo, una parte, o solo el texto.
- **Recomendaciones amplias.** En lugar de una lista corta, devuelve todos los libros del catálogo que razonablemente encajan con el perfil (hasta 45), ordenados del que mejor encaja al que menos.
- **Explicación por libro.** Por qué encaja, nivel de dificultad (ligero, medio o exigente), semanas estimadas según las horas de lectura semanales y para quién no es.
- **Dónde conseguirlo.** Lectura gratuita cuando el libro es de dominio público (Project Gutenberg) o tiene lectura completa en Google Books, precio de venta cuando Google Books lo informa, y enlaces de búsqueda a tiendas.
- **Buscador de libros.** Búsqueda directa por título o autor sobre el mismo catálogo.
- **Listas compartibles.** Cada resultado se guarda y se abre desde `/r/<id>`.

## Cómo funciona

Las recomendaciones salen de un proceso fijo en el que el modelo de lenguaje nunca inventa libros:

1. El test se convierte en un **perfil de lector** estructurado y en una tanda de entre 8 y 14 consultas cortas para el catálogo. El modelo recibe la instrucción de no combinar preferencias en una misma consulta, porque las consultas largas devuelven cero resultados.
2. Las consultas se ejecutan en paralelo contra **Open Library**. Los resultados se intercalan para que ninguna consulta domine la lista y se eliminan los duplicados.
3. Si quedan pocos candidatos, se lanza una segunda tanda de consultas más amplias derivadas del perfil.
4. Hasta 90 candidatos reales se envían al modelo, que decide cuáles encajan, los ordena y escribe la explicación de cada uno. Solo se aceptan identificadores que existan en la lista enviada.
5. Si el modelo falla o devuelve una respuesta inválida, se muestran igualmente los candidatos del catálogo, sin explicación, en lugar de un error.
6. La lista se guarda en Postgres con un identificador aleatorio.

La disponibilidad de cada libro se consulta bajo demanda a Project Gutenberg y Google Books, y se cachea en la base de datos durante seis horas.

## Decisiones de diseño

- **Libros reales, no generados.** El modelo clasifica y explica, pero los candidatos vienen siempre del catálogo, lo que evita títulos inexistentes.
- **Proceso fijo en lugar de agente libre.** Buscar, filtrar y explicar sigue una secuencia determinada. Es más barato, más predecible y más fácil de probar que un agente que decide qué herramientas usar.
- **Contenido del usuario tratado como dato.** El texto libre se recorta, se valida y se envía al modelo con la instrucción explícita de ignorar cualquier orden que contenga.
- **Sin inicio de sesión, con protección de costos.** Hay un límite de pedidos por IP y por hora, y un tope diario global. Los contadores viven en Postgres, así que se mantienen entre ejecuciones del servidor sin estado.
- **Solo fuentes legales.** El proyecto enlaza a obras de dominio público, a lectura autorizada y a tiendas. No busca ni enlaza copias no autorizadas.
- **Configuración centralizada.** Los límites, tiempos y direcciones de las APIs están en `lib/config.ts`. Los secretos y el modelo vienen de variables de entorno, y nada depende de un país concreto.

## Stack

| Capa                      | Tecnología                                                |
| ------------------------- | --------------------------------------------------------- |
| Aplicación                | Next.js 14 (App Router), React 18, TypeScript             |
| API                       | Rutas de API de Next.js                                   |
| Base de datos             | PostgreSQL en Neon, con el driver serverless              |
| Modelo de lenguaje        | Groq, con el modelo configurable por variable de entorno  |
| Catálogo y disponibilidad | Open Library, Project Gutenberg (Gutendex) y Google Books |
| Despliegue                | Vercel                                                    |

La interfaz no usa librerías de componentes ni de estilos. Está escrita en CSS propio, con una estética de ficha de catálogo de biblioteca antigua.

## Estructura

```
app/
  api/recommend/      genera y guarda las recomendaciones
  api/availability/   consulta dónde conseguir un libro
  test/               test de lector
  buscar/             buscador de libros
  r/[id]/             lista compartible
components/           tarjeta de libro y botón de compartir
lib/
  config.ts           ajustes, direcciones de APIs y tiendas
  llm.ts              prompts y llamadas al modelo
  recommend.ts        proceso de recomendación
  sources.ts          catálogo y disponibilidad
  db.ts               acceso a Postgres y creación de tablas
  limits.ts           límites por IP y tope diario
  shared.ts           preguntas del test y constantes compartidas
```

## Ejecutar en local

Requisitos: Node 18 o superior, una base de datos de Neon y una clave de Groq.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Completar `DATABASE_URL`, `GROQ_API_KEY` y `LLM_MODEL` en `.env.local` antes de iniciar. La aplicación queda disponible en `http://localhost:3000`. Las tablas se crean solas la primera vez que se usa la base.

## Despliegue

El proyecto está pensado para Vercel con el plan gratuito.

1. Subir el repositorio a GitHub e importarlo en Vercel.
2. Crear una base Neon desde la pestaña Storage del proyecto. Vercel define `DATABASE_URL` automáticamente.
3. Cargar las demás variables de entorno en Settings, Environment Variables.
4. Hacer el deploy.

La generación de recomendaciones puede tardar varios segundos por la cantidad de candidatos. La ruta que la ejecuta declara una duración máxima de 300 segundos, que es el tope del plan gratuito de Vercel con Fluid Compute activado.

## Limitaciones conocidas

- Los precios solo aparecen cuando Google Books los informa. El resto de las tiendas se ofrece como enlace de búsqueda, no como precio verificado.
- No se consulta el stock de librerías físicas.
- La cobertura de títulos en español depende de lo que tenga Open Library.
- La dificultad y las semanas de lectura son estimaciones del modelo, no datos del catálogo.
- Los planes gratuitos de Vercel, Neon y Groq tienen límites de uso que pueden cambiar.

## Próximos pasos

- Un conjunto de pedidos de prueba con resultados esperados, para medir qué porcentaje de recomendaciones son libros reales y coinciden con lo pedido.
- Extracción de precios de varias tiendas online, con validación contra el texto de cada página.
- Embeddings con pgvector para mejorar la búsqueda de candidatos.
- Inicio de sesión y un mercado de libros usados.
