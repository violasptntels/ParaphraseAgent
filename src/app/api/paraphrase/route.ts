import { NextResponse } from "next/server";
import { 
  paraphraseAgent, 
  type OrchestratorParaphraseResponse, 
  type OrchestratorParaphraseRequest 
} from "../../../agents/paraphraseAgent";

const corsHeaders = {
  "Access-Control-Allow-Origin": 'https://jokitugas.bananaunion.web.id',
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function getStatusCode(response: OrchestratorParaphraseResponse): number {
  if (response.status === "success") {
    return 200;
  }

  const message = response.message.toLowerCase();
  
  if (message.includes("missing required api contract fields") || response.meta?.validation?.valid === false) {
    return 400;
  }
  
  if (message.includes("did not pass quality checks") || response.meta?.quality?.passed === false) {
    return 422;
  }
  
  if (message.includes("rate limit") || message.includes("429")) {
    return 429;
  }
  
  if (message.includes("failed to generate paraphrase") || response.meta?.error_details) {
    return 502;
  }

  return 500;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  let taskId = "unknown";

  try {
    // 1. Parse JSON secara aman menggunakan Record<string, unknown>
    const jsonBody = (await request.json()) as Record<string, unknown>;
    taskId = typeof jsonBody?.task_id === "string" ? jsonBody.task_id : "unknown";

    // 2. Lakukan type assertion langsung ke interface OrchestratorParaphraseRequest
    const orchestratorRequest = jsonBody as unknown as OrchestratorParaphraseRequest;

    // 3. Panggil agent menggunakan variabel yang sudah type-safe
    const response = await paraphraseAgent(orchestratorRequest); 
    const statusCode = getStatusCode(response);

    return NextResponse.json(response, {
      status: statusCode,
      headers: corsHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        task_id: taskId,
        data: null,
        message: error instanceof Error ? error.message : "Internal Server Error pada level API Route.",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}