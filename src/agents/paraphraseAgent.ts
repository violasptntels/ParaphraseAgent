import { buildParaphrasePrompt } from "./promptBuilder";
import { checkParaphraseQuality } from "./qualityChecker";
import { type ParaphraseValidationInput, validateParaphraseInput } from "./validator";
import { getGeminiClient, GeminiConfigurationError } from "../lib/gemini";
import type { ParaphraseAgentOptions } from "../types/api";

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

// ========================================================================
// Strict API Contract & Meta Types Definition
// ========================================================================
export interface OrchestratorParaphraseRequest {
  task_id: string;
  agent_type: string;
  payload: {
    url?: string;
    keyword?: string;
    raw_text: string;
  };
}

// Mengambil tipe data riil langsung dari return value utility internal
export interface ParaphraseMetaInfo {
  validation?: ReturnType<typeof validateParaphraseInput>;
  quality?: ReturnType<typeof checkParaphraseQuality>;
  error_details?: unknown;
}

export interface OrchestratorParaphraseResponse {
  status: "success" | "error";
  task_id: string;
  data: {
    result: string | null;
    file_url: string | null;
  } | null;
  message: string;
  meta?: ParaphraseMetaInfo;
}

interface NormalizedGeminiError {
  message: string;
  status?: number;
  details?: unknown;
}

function normalizeGeminiError(error: unknown): NormalizedGeminiError {
  if (error instanceof GeminiConfigurationError) {
    return {
      message: error.message,
      details: error,
    };
  }

  if (error instanceof Error) {
    const message = error.message.trim();

    if (message.startsWith("{")) {
      try {
        const parsed = JSON.parse(message) as {
          error?: {
            message?: string;
            status?: number;
          };
        };

        return {
          message: parsed.error?.message?.trim() || message,
          status: parsed.error?.status,
          details: error,
        };
      } catch {
        return {
          message,
          details: error,
        };
      }
    }

    return {
      message,
      details: error,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  return {
    message: "Failed to generate paraphrase.",
    details: error,
  };
}

function normalizeModelOutput(text: string): string {
  return text.trim();
}

export async function paraphraseAgent(
  input: OrchestratorParaphraseRequest,
  options: ParaphraseAgentOptions = {},
): Promise<OrchestratorParaphraseResponse> {
  
  const taskId = input?.task_id || "unknown";

  if (!input?.task_id || !input?.agent_type || !input?.payload || typeof input.payload.raw_text !== "string") {
    return {
      status: "error",
      task_id: taskId,
      data: null,
      message: "Input validation failed. Missing required API Contract fields.",
    };
  }

  const validationInput: ParaphraseValidationInput = {
    prompt: input.payload.raw_text,
  };
  const validation = validateParaphraseInput(validationInput);

  if (!validation.valid) {
    return {
      status: "error",
      task_id: taskId,
      data: null,
      message: "Input validation failed based on internal prompt rules.",
      meta: { validation },
    };
  }

  const prompt = buildParaphrasePrompt({
    prompt: validation.value.prompt,
  });

  let generatedText = "";

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: options.model?.trim() || DEFAULT_GEMINI_MODEL,
      contents: prompt,
    });
    generatedText = normalizeModelOutput(response.text ?? "");
  } catch (error) {
    const normalizedError = normalizeGeminiError(error);
    return {
      status: "error",
      task_id: taskId,
      data: null,
      message: normalizedError.message,
      meta: {
        validation,
        error_details: normalizedError.details,
      },
    };
  }

  const quality = checkParaphraseQuality({
    inputText: validation.value.prompt,
    outputText: generatedText,
  });

  if (!quality.passed) {
    return {
      status: "error",
      task_id: taskId,
      data: null,
      message: "Generated output did not pass quality checks.",
      meta: { validation, quality },
    };
  }

  return {
    status: "success",
    task_id: taskId,
    data: {
      result: generatedText,
      file_url: null,
    },
    message: "Paraphrase processed successfully.",
    meta: {
      validation,
      quality,
    },
  };
}