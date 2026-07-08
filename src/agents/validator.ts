export const VALID_PARAPHRASE_MODES = [
	"academic",
	"formal",
	"casual",
	"humanize",
	"expand",
	"shorten",
] as const;

export type ParaphraseMode = (typeof VALID_PARAPHRASE_MODES)[number];

export interface ParaphraseValidationInput {
	text?: string;
	mode?: string;
	minLength?: number;
	maxLength?: number;
}

export interface ValidationIssue {
	field: "text" | "mode";
	code: "required" | "minLength" | "maxLength" | "invalidMode";
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
	text: string;
	mode: ParaphraseMode;
}

const DEFAULT_MIN_LENGTH = 1;
const DEFAULT_MAX_LENGTH = 5000;

function isParaphraseMode(mode: string): mode is ParaphraseMode {
	return (VALID_PARAPHRASE_MODES as readonly string[]).includes(mode);
}

export function validateParaphraseInput(
	input: ParaphraseValidationInput,
): ValidationResult<ValidatedParaphraseInput> {
	const errors: ValidationIssue[] = [];
	const text = input.text?.trim() ?? "";
	const mode = input.mode?.trim() ?? "";
	const minLength = input.minLength ?? DEFAULT_MIN_LENGTH;
	const maxLength = input.maxLength ?? DEFAULT_MAX_LENGTH;

	if (!text) {
		errors.push({
			field: "text",
			code: "required",
			message: "Text is required.",
		});
	} else {
		if (text.length < minLength) {
			errors.push({
				field: "text",
				code: "minLength",
				message: `Text must be at least ${minLength} characters long.`,
			});
		}

		if (text.length > maxLength) {
			errors.push({
				field: "text",
				code: "maxLength",
				message: `Text must be no more than ${maxLength} characters long.`,
			});
		}
	}

	if (!mode || !isParaphraseMode(mode)) {
		errors.push({
			field: "mode",
			code: "invalidMode",
			message: `Mode must be one of: ${VALID_PARAPHRASE_MODES.join(", ")}.`,
		});
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
			text,
			mode: mode as ParaphraseMode,
		},
		errors: [],
	};
}
