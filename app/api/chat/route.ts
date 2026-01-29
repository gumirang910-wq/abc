import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function getResponseText(response: unknown): string {
  if (response && typeof (response as { text?: string }).text === "string") {
    return (response as { text: string }).text;
  }
  const candidates = (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
    ?.candidates;
  return String(candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다. 환경 변수를 확인하세요." },
      { status: 500 }
    );
  }

  let body: { summary?: string; keyword?: string; message?: string; history?: { role: string; text: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON이 아닙니다." },
      { status: 400 }
    );
  }

  const { summary, keyword, message, history } = body;
  if (!summary || typeof summary !== "string") {
    return NextResponse.json(
      { error: "요약본이 없습니다. 먼저 '재미나이로 요약하기'를 실행해주세요." },
      { status: 400 }
    );
  }
  if (!message?.trim()) {
    return NextResponse.json(
      { error: "질문을 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let conversationText = "";
    if (Array.isArray(history) && history.length > 0) {
      conversationText = history
        .map((h: { role: string; text: string }) => {
          const who = h.role === "user" ? "사용자" : "어시스턴트";
          return `${who}: ${(h.text || "").trim()}`;
        })
        .join("\n\n");
      conversationText = "\n\n[이전 대화]\n" + conversationText + "\n\n";
    }

    const prompt = `당신은 뉴스 요약을 바탕으로 답변하는 친절한 뉴스 어시스턴트입니다. 아래 [뉴스 요약]만을 근거로 답변하세요. 요약에 없는 내용은 "해당 뉴스에서는 다루지 않았습니다"라고 하세요. 한국어로만 답변하세요.

[뉴스 요약]
${summary}
${conversationText}
사용자: ${message.trim()}

어시스턴트:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = getResponseText(response);
    if (!text) {
      return NextResponse.json(
        { error: "답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", err);

    if (message.includes("API key") || message.includes("401") || message.includes("403")) {
      return NextResponse.json(
        { error: "API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인하세요." },
        { status: 500 }
      );
    }
    if (message.includes("429") || message.includes("quota") || message.includes("rate")) {
      return NextResponse.json(
        { error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다. 서버 로그를 확인하세요." },
      { status: 500 }
    );
  }
}
