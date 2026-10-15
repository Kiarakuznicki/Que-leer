"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  return <button onClick={copy}>{copied ? "Enlace copiado" : "Copiar enlace de esta lista"}</button>;
}
