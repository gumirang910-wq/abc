import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { keyword, news } = await request.json();
    if (!keyword || !Array.isArray(news) || news.length === 0) {
      return NextResponse.json(
        { error: "키워드와 뉴스 목록이 필요합니다." },
        { status: 400 }
      );
    }

    const newsText = news
      .map(
        (n: { title?: string; contentSnippet?: string }, i: number) =>
          `${i + 1}. ${n.title || ""}\n   ${(n.contentSnippet || "").slice(0, 150)}...`
      )
      .join("\n\n");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `당신은 뉴스 요약 전문가입니다. 아래는 "${keyword}" 키워드로 수집한 뉴스 10건입니다. 
한국어로 간결하고 읽기 쉽게 전체 요약을 작성해주세요. (3~5문단, 핵심만)

뉴스 목록:
${newsText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text =
      typeof (response as { text?: string }).text === "string"
        ? (response as { text: string }).text
        : String((response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0]?.content?.parts?.[0]?.text ?? "");

    return NextResponse.json({ summary: text.trim() });
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: "요약 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
