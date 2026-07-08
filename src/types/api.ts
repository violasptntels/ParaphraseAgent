import type { ParaphraseMode, ValidationResult, ValidatedParaphraseInput } from "../agents/validator";
import type { QualityCheckIssue, QualityCheckResult } from "../agents/qualityChecker";

export interface ParaphraseRequest {
	text: string;
	mode: ParaphraseMode;
}

export interface ParaphraseResponse {
	success: true;
	data: {
		text: string;
		mode: ParaphraseMode;
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
	mode: ParaphraseMode;
	qualityIssues: QualityCheckIssue[];
}
