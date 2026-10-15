export const MAX_FREE_TEXT = 1000;
export const MAX_ANSWER_LENGTH = 300;
export const HOURS_KEY = "horas";
export const LIKED_KEY = "me_gustaron";
export const DROPPED_KEY = "abandone";

export type Question = { key: string; label: string; options: string[] };

export const questions: Question[] = [
  {
    key: "genero",
    label: "¿Qué tipo de libro tenés ganas de leer?",
    options: ["Ficción literaria", "Misterio o thriller", "Ciencia ficción o fantasía", "Ensayo o no ficción", "Historia o biografía", "Sorprendeme"],
  },
  {
    key: "animo",
    label: "¿Con qué ánimo querés salir del libro?",
    options: ["Entretenido y ligero", "Pensando", "Conmovido", "Habiendo aprendido algo"],
  },
  {
    key: "extension",
    label: "¿Qué extensión preferís?",
    options: ["Corto, menos de 200 páginas", "Mediano", "Largo y envolvente"],
  },
  {
    key: "ritmo",
    label: "¿Qué ritmo te engancha?",
    options: ["Rápido desde el inicio", "Pausado, de prosa cuidada"],
  },
  {
    key: HOURS_KEY,
    label: "¿Cuánto leés por semana?",
    options: ["1 a 2 horas", "3 a 5 horas", "6 horas o más"],
  },
];
