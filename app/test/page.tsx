"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DROPPED_KEY, LIKED_KEY, MAX_FREE_TEXT, questions } from "@/lib/shared";

export default function Test() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState("");
  const [dropped, setDropped] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    const extras: Record<string, string> = {};
    if (liked.trim()) extras[LIKED_KEY] = liked.trim();
    if (dropped.trim()) extras[DROPPED_KEY] = dropped.trim();
    try {
      const { id } = await api<{ id: string }>("/recommend", {
        method: "POST",
        body: JSON.stringify({ answers: { ...answers, ...extras }, free_text: text }),
      });
      router.push(`/r/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Test de lector</h1>
      <p className="lead">Respondé lo que quieras: las preguntas, el texto libre o las dos cosas.</p>

      {questions.map((question) => (
        <fieldset key={question.key}>
          <legend>{question.label}</legend>
          <div className="opts">
            {question.options.map((option) => (
              <label key={option} className={answers[question.key] === option ? "on" : ""}>
                <input
                  type="radio"
                  name={question.key}
                  checked={answers[question.key] === option}
                  onChange={() => setAnswers({ ...answers, [question.key]: option })}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <label className="field">
        Libros que te gustaron
        <input value={liked} onChange={(e) => setLiked(e.target.value)} placeholder="El nombre de la rosa, Dune" />
      </label>
      <label className="field">
        Libros que abandonaste
        <input value={dropped} onChange={(e) => setDropped(e.target.value)} placeholder="Ulises" />
      </label>
      <label className="field">
        Contanos con tus palabras qué buscás
        <textarea
          rows={4}
          maxLength={MAX_FREE_TEXT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Algo corto, de misterio, que no sea muy oscuro"
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button onClick={submit} disabled={busy}>{busy ? "Armando tu lista" : "Recomendame libros"}</button>
    </>
  );
}
