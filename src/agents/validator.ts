export interface ParaphraseValidationInput {
	prompt?: string;
	minLength?: number;
	maxLength?: number;
}

export interface ValidationIssue {
	field: "prompt";
	code: "required" | "minLength" | "maxLength" | "invalidIntent";
	message: string;
}

export interface ValidationSuccess<T> {
	valid: true;
	value: T;
	errors: [];
}

export interface ValidationFailure {
	valid: false;
	value: null;
	errors: ValidationIssue[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface ValidatedParaphraseInput {
	prompt: string;
}

const DEFAULT_MIN_LENGTH = 1;
const DEFAULT_MAX_LENGTH = 5000;

const DISALLOWED_INTENT_PATTERNS = [
	/\btranslate\b/i,
	/\bterjemah(?:kan)?\b/i,
	/\bsummar(?:y|ize|ise)\b/i,
	/\bringk(?:as|asan)\b/i,
	/\bexplain\b/i,
	/\bjelaskan\b/i,
	/\bconvert\b/i,
	/\bgenerate\b/i,
	/\banswer\b/i,
	/\bjawab\b/i,
	/\bexpand\b/i,
	/\bshorten\b/i,
];

function hasDisallowedIntent(prompt: string): boolean {
	return DISALLOWED_INTENT_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function validateParaphraseInput(
	input: ParaphraseValidationInput,
): ValidationResult<ValidatedParaphraseInput> {
	const errors: ValidationIssue[] = [];
	const prompt = input.prompt?.trim() ?? "";
	const minLength = input.minLength ?? DEFAULT_MIN_LENGTH;
	const maxLength = input.maxLength ?? DEFAULT_MAX_LENGTH;

	if (!prompt) {
		errors.push({
			field: "prompt",
			code: "required",
			message: "Prompt is required.",
		});
	} else {
		if (prompt.length < minLength) {
			errors.push({
				field: "prompt",
				code: "minLength",
				message: `Prompt must be at least ${minLength} characters long.`,
			});
		}

		if (prompt.length > maxLength) {
			errors.push({
				field: "prompt",
				code: "maxLength",
				message: `Prompt must be no more than ${maxLength} characters long.`,
			});
		}

		if (hasDisallowedIntent(prompt)) {
			errors.push({
				field: "prompt",
				code: "invalidIntent",
				message: "Prompt contains disallowed tasks. Translation or other tasks are not supported.",
			});
		}
	}

	if (errors.length > 0) {
		return {
			valid: false,
			value: null,
			errors,
		};
	}

	return {
		valid: true,
		value: {
			prompt,
		},
		errors: [],
	};
}
