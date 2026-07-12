import { buildParaphrasePrompt } from "./promptBuilder";
import { checkParaphraseQuality } from "./qualityChecker";
import { type ParaphraseValidationInput, validateParaphraseInput } from "./validator";
import { getGeminiClient, GeminiConfigurationError } from "../lib/gemini";
import type {
	ParaphraseAgentOptions,
	ParaphraseErrorResponse,
	ParaphraseRequest,
	ParaphraseResponse,
	StandardizedParaphraseResponse,
} from "../types/api";

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

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

function createValidationErrorResponse(
	validation: ReturnType<typeof validateParaphraseInput>,
): ParaphraseErrorResponse {
	return {
		success: false,
		error: {
			code: "validation_error",
			message: "Input validation failed.",
			details: validation.errors,
		},
		validation,
	};
}

function createQualityErrorResponse(
	message: string,
	details: unknown,
	validation: ReturnType<typeof validateParaphraseInput>,
	quality: ReturnType<typeof checkParaphraseQuality>,
): ParaphraseErrorResponse {
	return {
		success: false,
		error: {
			code: "quality_error",
			message,
			details,
		},
		validation,
		quality,
	};
}

function createGeminiErrorResponse(
	message: string,
	details: unknown,
	code: "gemini_error" | "rate_limit_error",
	validation: ReturnType<typeof validateParaphraseInput>,
): ParaphraseErrorResponse {
	return {
		success: false,
		error: {
			code,
			message,
			details,
		},
		validation,
	};
}

function normalizeModelOutput(text: string): string {
	return text.trim();
}

export async function paraphraseAgent(
	input: ParaphraseRequest,
	options: ParaphraseAgentOptions = {},
): Promise<StandardizedParaphraseResponse> {
	const validationInput: ParaphraseValidationInput = {
		prompt: input.prompt,
	};
	const validation = validateParaphraseInput(validationInput);

	if (!validation.valid) {
		return createValidationErrorResponse(validation);
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
		const errorCode = normalizedError.status === 429 ? "rate_limit_error" : "gemini_error";

		return createGeminiErrorResponse(
			normalizedError.message,
			normalizedError.details,
			errorCode,
			validation,
		);
	}

	const quality = checkParaphraseQuality({
		inputText: validation.value.prompt,
		outputText: generatedText,
	});

	if (!quality.passed) {
		return createQualityErrorResponse(
			"Generated output did not pass quality checks.",
			quality.issues,
			validation,
			quality,
		);
	}

	const successResponse: ParaphraseResponse = {
		success: true,
		data: {
			text: generatedText,
		},
		validation,
		quality,
	};

	return successResponse;
}
