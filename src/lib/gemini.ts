import { GoogleGenAI } from "@google/genai";

class GeminiConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GeminiConfigurationError";
	}
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let geminiClientInstance: GoogleGenAI | null = null;

function getGeminiApiKey(): string {
	const apiKey = GEMINI_API_KEY?.trim();

	if (!apiKey) {
		throw new GeminiConfigurationError(
			"GEMINI_API_KEY is missing. Set it in .env.local before using the Gemini client.",
		);
	}

	return apiKey;
}

export function getGeminiClient(): GoogleGenAI {
	if (!geminiClientInstance) {
		geminiClientInstance = new GoogleGenAI({
			apiKey: getGeminiApiKey(),
		});
	}

	return geminiClientInstance;
}

export { GeminiConfigurationError };
