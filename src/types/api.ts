import type { ValidationResult, ValidatedParaphraseInput } from "../agents/validator";
import type { QualityCheckIssue, QualityCheckResult } from "../agents/qualityChecker";

export interface ParaphraseRequest {
	prompt: string;
}

export interface ParaphraseResponse {
	success: true;
	data: {
		text: string;
	};
	validation: ValidationResult<ValidatedParaphraseInput>;
	quality: QualityCheckResult;
}

export interface ParaphraseErrorResponse {
	success: false;
	error: {
		code: "validation_error" | "quality_error" | "gemini_error" | "rate_limit_error" | "unexpected_error";
		message: string;
		details?: unknown;
	};
	validation?: ValidationResult<ValidatedParaphraseInput>;
	quality?: QualityCheckResult;
}

export type StandardizedParaphraseResponse = ParaphraseResponse | ParaphraseErrorResponse;

export interface ParaphraseAgentOptions {
	model?: string;
}

export interface ParaphraseAgentSuccess {
	text: string;
	qualityIssues: QualityCheckIssue[];
}
