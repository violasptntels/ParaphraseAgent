export const PARAPHRASE_PROMPT_MODES = [
	"academic",
	"formal",
	"casual",
	"humanize",
	"expand",
	"shorten",
] as const;

export type ParaphrasePromptMode = (typeof PARAPHRASE_PROMPT_MODES)[number];

const MODE_INSTRUCTIONS: Record<ParaphrasePromptMode, string> = {
	academic:
		"Use an academic tone with precise wording, measured phrasing, and clear structure.",
	formal:
		"Use a formal tone with professional language and polished sentence structure.",
	casual:
		"Use a casual tone that sounds natural, friendly, and conversational.",
	humanize:
		"Rewrite the text so it sounds more natural, fluent, and human while preserving the original meaning.",
	expand:
		"Expand the text with helpful detail and clarity without changing its meaning or introducing new claims.",
	shorten:
		"Shorten the text while preserving meaning, important details, and the original intent.",
};

export interface BuildParaphrasePromptInput {
	text: string;
	mode: ParaphrasePromptMode;
}

export function buildParaphrasePrompt({ text, mode }: BuildParaphrasePromptInput): string {
	const normalizedText = text.trim();
	const modeInstruction = MODE_INSTRUCTIONS[mode];

	return [
		"You are a high-precision paraphrasing assistant for Gemini.",
		modeInstruction,
		"Preserve the original meaning exactly unless the selected mode explicitly requires expansion or shortening.",
		"Keep citations unchanged, including inline citations, footnotes, parenthetical references, bracketed references, URLs, and reference markers.",
		"Keep technical terms unchanged, including product names, APIs, library names, code identifiers, acronyms, formulas, version numbers, and file paths.",
		"Do not add explanations, prefacing text, bullet points, or markdown unless the input already contains them and they must be preserved.",
		"Return only the rewritten text.",
		"",
		"Text to rewrite:",
		normalizedText,
	].join("\n");
}
