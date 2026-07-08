import { NextResponse } from "next/server";
import { getGeminiClient } from "../../../lib/gemini";

export async function GET() {
	try {
		const geminiClient = getGeminiClient();
		const response = await geminiClient.models.generateContent({
			model: "gemini-2.5-flash",
			contents: "Hello Gemini",
		});

		return NextResponse.json(
			{
				success: true,
				message: "Gemini connection successful.",
				response: response.text ?? "",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Gemini test endpoint failed:", error);

		return NextResponse.json(
			{
				success: false,
				message: "Gemini connection failed.",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}