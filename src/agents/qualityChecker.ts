export interface QualityCheckInput {
	inputText: string;
	outputText: string;
}

export interface QualityCheckIssue {
	code: "emptyOutput" | "unchangedOutput" | "citationMismatch";
	message: string;
}

export interface QualityCheckResult {
	passed: boolean;
	issues: QualityCheckIssue[];
}

const CITATION_PATTERN = /\[[^\]]+\]|\([^\)]+\d{4}[^\)]*\)|\bhttps?:\/\/\S+/g;

function normalizeText(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

function extractCitations(text: string): string[] {
	return text.match(CITATION_PATTERN) ?? [];
}

export function checkParaphraseQuality({
	inputText,
	outputText,
}: QualityCheckInput): QualityCheckResult {
	const issues: QualityCheckIssue[] = [];
	const normalizedOutput = normalizeText(outputText);

	if (!normalizedOutput) {
		issues.push({
			code: "emptyOutput",
			message: "The model returned an empty paraphrase.",
		});
	}

	if (normalizeText(inputText) === normalizedOutput) {
		issues.push({
			code: "unchangedOutput",
			message: "The model output matches the input and was not paraphrased.",
		});
	}

	const inputCitations = extractCitations(inputText);
	const outputCitations = extractCitations(outputText);

	if (inputCitations.join("\u0000") !== outputCitations.join("\u0000")) {
		issues.push({
			code: "citationMismatch",
			message: "Citations were not preserved exactly.",
		});
	}

	return {
		passed: issues.length === 0,
		issues,
	};
}
