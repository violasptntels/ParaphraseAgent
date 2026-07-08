import { NextResponse } from "next/server";
import { paraphraseAgent } from "../../../agents/paraphraseAgent";
import type {
	ParaphraseRequest,
	StandardizedParaphraseResponse,
} from "../../../types/api";

function getStatusCode(response: StandardizedParaphraseResponse): number {
	if (response.success) {
		return 200;
	}

	switch (response.error.code) {
		case "validation_error":
			return 400;
		case "quality_error":
			return 422;
		case "rate_limit_error":
			return 429;
		case "gemini_error":
			return 502;
		default:
			return 500;
	}
}

export async function POST(request: Request) {
	let body: ParaphraseRequest;

	try {
		body = (await request.json()) as ParaphraseRequest;
	} catch {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "validation_error",
					message: "Request body must be valid JSON.",
				},
			},
			{ status: 400 },
		);
	}

	const response = await paraphraseAgent(body);

	return NextResponse.json(response, {
		status: getStatusCode(response),
	});
}
