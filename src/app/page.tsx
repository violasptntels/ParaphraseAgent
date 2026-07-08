"use client";

import { useMemo, useState } from "react";
import { PARAPHRASE_PROMPT_MODES, type ParaphrasePromptMode } from "../agents/promptBuilder";
import type { StandardizedParaphraseResponse } from "../types/api";
import styles from "./page.module.css";

type ApiState = "idle" | "loading" | "success" | "error";

const SAMPLE_TEXTS = [
  {
    label: "Contoh formal",
    mode: "formal" as ParaphrasePromptMode,
    text: "Please review the attached proposal and share your feedback by Friday.",
  },
  {
    label: "Contoh santai",
    mode: "casual" as ParaphrasePromptMode,
    text: "Can you take a quick look at this and tell me what you think?",
  },
  {
    label: "Contoh akademik",
    mode: "academic" as ParaphrasePromptMode,
    text: "This study examines how small UI changes can improve task completion time in internal tools.",
  },
] as const;

const INITIAL_TEXT = "This paraphrase tool helps you rewrite text while keeping the meaning intact.";

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function Home() {
  const [text, setText] = useState(INITIAL_TEXT);
  const [mode, setMode] = useState<ParaphrasePromptMode>("formal");
  const [output, setOutput] = useState("");
  const [response, setResponse] = useState<StandardizedParaphraseResponse | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("Siap.");
  const [status, setStatus] = useState<ApiState>("idle");
  const [responseJsonOpen, setResponseJsonOpen] = useState(false);
  const [requestJson, setRequestJson] = useState(() =>
    formatJson({ text: INITIAL_TEXT, mode: "formal" }),
  );

  const characterCount = text.trim().length;
  const estimatedLines = Math.max(1, Math.ceil(characterCount / 56));

  const payload = useMemo(
    () => ({
      text: text.trim(),
      mode,
    }),
    [mode, text],
  );

  async function runParaphrase(nextText: string = text, nextMode: ParaphrasePromptMode = mode) {
    const trimmedText = nextText.trim();
    const payloadBody = { text: trimmedText, mode: nextMode };

    setText(nextText);
    setMode(nextMode);
    setRequestJson(formatJson(payloadBody));
    setStatus("loading");
    setConnectionMessage("Mengirim request ke /api/paraphrase...");

    try {
      const result = await fetch("/api/paraphrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadBody),
      });

      const data = (await result.json()) as StandardizedParaphraseResponse;

      setResponse(data);

      if (data.success) {
        setOutput(data.data.text);
        setStatus("success");
        setConnectionMessage("Paraphrase berhasil diproses.");
        setResponseJsonOpen(true);
        return;
      }

      setOutput("");
      setStatus("error");
      setConnectionMessage(data.error.message);
      setResponseJsonOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.";

      setResponse({
        success: false,
        error: {
          code: "unexpected_error",
          message,
          details: error,
        },
      });
      setOutput("");
      setStatus("error");
      setConnectionMessage(message);
      setResponseJsonOpen(true);
    }
  }

  async function testGeminiConnection() {
    setStatus("loading");
    setConnectionMessage("Menguji koneksi...");

    try {
      const result = await fetch("/api/test");
      const data = (await result.json()) as {
        success: boolean;
        message: string;
        response?: string;
        error?: string;
      };

      if (data.success) {
        setStatus("success");
        setConnectionMessage(data.message);
        setResponseJsonOpen(true);
        return;
      }

      setStatus("error");
      setConnectionMessage(data.error ?? data.message);
      setResponseJsonOpen(true);
    } catch (error) {
      setStatus("error");
      setConnectionMessage(error instanceof Error ? error.message : "Koneksi gagal.");
    }
  }

  function loadSample(sampleText: string, sampleMode: ParaphrasePromptMode) {
    setText(sampleText);
    setMode(sampleMode);
    setRequestJson(formatJson({ text: sampleText, mode: sampleMode }));
  }

  async function copyOutput() {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setConnectionMessage("Hasil sudah disalin ke clipboard.");
  }

  async function copyRequestJson() {
    await navigator.clipboard.writeText(requestJson);
    setConnectionMessage("Payload request sudah disalin.");
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.headerRow}>
            <div>
              <h1>Paraphrase Agent</h1>
              <p>UI sederhana untuk menulis input, memilih mode, dan menguji hasil dalam satu layar.</p>
            </div>
            <div className={styles.headerStats}>
              <span>{mode}</span>
              <span>{characterCount} karakter</span>
              <span>{status === "idle" ? "siap" : status}</span>
            </div>
          </div>

          <div className={styles.singleScreenGrid}>
            <article className={styles.panelCompact}>
              <div className={styles.compactTopRow}>
                <label className={styles.fieldLabel} htmlFor="text-input">
                  Teks
                </label>
                <button className={styles.ghostButton} type="button" onClick={testGeminiConnection}>
                  Test koneksi
                </button>
              </div>

              <textarea
                id="text-input"
                className={styles.textareaCompact}
                value={text}
                onChange={(event) => {
                  const nextText = event.target.value;
                  setText(nextText);
                  setRequestJson(formatJson({ text: nextText.trim(), mode }));
                }}
                placeholder="Tempel atau ketik teks di sini..."
              />

              <div className={styles.sampleRowCompact}>
                {SAMPLE_TEXTS.map((sample) => (
                  <button
                    key={sample.label}
                    className={styles.sampleButton}
                    type="button"
                    onClick={() => loadSample(sample.text, sample.mode)}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <div className={styles.modeStrip}>
                {PARAPHRASE_PROMPT_MODES.map((candidateMode) => (
                  <button
                    key={candidateMode}
                    type="button"
                    className={`${styles.modePill} ${candidateMode === mode ? styles.modePillActive : ""}`}
                    onClick={() => {
                      setMode(candidateMode);
                      setRequestJson(formatJson({ text: text.trim(), mode: candidateMode }));
                    }}
                  >
                    {candidateMode}
                  </button>
                ))}
              </div>

              <div className={styles.actionRowCompact}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => runParaphrase()}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Memproses..." : "Paraphrase"}
                </button>
                <button className={styles.secondaryButton} type="button" onClick={copyRequestJson}>
                  Copy request
                </button>
                <button className={styles.secondaryButton} type="button" onClick={() => runParaphrase(payload.text, payload.mode)}>
                  Ulangi
                </button>
              </div>
            </article>

            <article className={styles.panelCompact}>
              <div className={styles.compactTopRow}>
                <label className={styles.fieldLabel}>Hasil</label>
                <button className={styles.ghostButton} type="button" onClick={copyOutput} disabled={!output}>
                  Copy hasil
                </button>
              </div>

              <div className={styles.statusBannerCompact} data-status={status}>
                {connectionMessage}
              </div>

              <div className={styles.outputBoxCompact}>
                {output ? output : "Hasil akan muncul di sini."}
              </div>

              <div className={styles.metaRowCompact}>
                <span>/api/paraphrase</span>
                <span>{requestJson.length} chars</span>
                <span>{estimatedLines} line est.</span>
              </div>

              <div className={styles.detailsBox}>
                <button
                  className={styles.responseToggle}
                  type="button"
                  onClick={() => setResponseJsonOpen((current) => !current)}
                  aria-expanded={responseJsonOpen}
                >
                  <span>Response JSON</span>
                  <span className={styles.toggleState}>{responseJsonOpen ? "Tutup" : "Buka"}</span>
                </button>

                <div className={`${styles.responseBody} ${responseJsonOpen ? styles.responseBodyOpen : ""}`}>
                  <pre className={styles.codeBlockCompact}>
                    {response ? formatJson(response) : "Belum ada response."}
                  </pre>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
