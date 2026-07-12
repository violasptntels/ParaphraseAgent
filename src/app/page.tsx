"use client";

import { useState } from "react";
import type { StandardizedParaphraseResponse } from "../types/api";
import styles from "./page.module.css";

const INITIAL_PROMPT = "This paraphrase tool helps you rewrite text while keeping the meaning intact. Tolong parafrase menjadi bahasa akademik.";

export default function Home() {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runParaphrase() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setOutput("Masukkan teks dan prompt dulu.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetch("/api/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const data = (await result.json()) as StandardizedParaphraseResponse;

      if (data.success) {
        setOutput(data.data.text);
        return;
      }

      setOutput(data.error.message);
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <div className={styles.header}>
          <h1>Paraphrase Agent</h1>
          <p>Masukkan kalimat dan instruksi paraphrase, lalu tekan Enter. Bahasa output akan mengikuti bahasa teks sumber.</p>
        </div>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <label className={styles.fieldLabel} htmlFor="text-input">
              Input kalimat + prompt
            </label>

            <form
              className={styles.editorForm}
              onSubmit={(event) => {
                event.preventDefault();
                runParaphrase();
              }}
            >
              <textarea
                id="text-input"
                className={styles.textareaCompact}
                value={prompt}
                onChange={(event) => {
                  const nextPrompt = event.target.value;
                  setPrompt(nextPrompt);
                  if (!nextPrompt.trim()) setOutput("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.ctrlKey) {
                    event.preventDefault();
                    runParaphrase();
                  }
                }}
                placeholder="Contoh: Blabla kalimat panjang, tolong parafrase menjadi bahasa akademik."
              />

              <button className={styles.primaryButton} type="submit" disabled={isLoading}>
                {isLoading ? "Memproses..." : "Enter"}
              </button>
            </form>

            <p className={styles.helperText} aria-live="polite">
              {isLoading ? "Memproses paraphrase..." : "Ctrl+Enter juga bisa dipakai saat mengetik."}
            </p>
          </section>

          <section className={styles.panel}>
            <label className={styles.fieldLabel}>Hasil paraphrase</label>
            <div className={styles.outputBoxCompact}>
              {output || "Hasil akan muncul di sini."}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}