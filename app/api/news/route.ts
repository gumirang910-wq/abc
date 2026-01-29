import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export type NewsItem = {
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
  contentSnippet?: string;
};

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");
  if (!keyword || keyword.trim() === "") {
    return NextResponse.json(
      { error: "키워드를 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const rssUrl = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ko-KR&gl=KR&ceid=KR:ko`;
    const feed = await parser.parseURL(rssUrl);
    const items: NewsItem[] = (feed.items || [])
      .slice(0, 10)
      .map((item) => ({
        title: item.title || "",
        link: item.link || item.guid || "",
        pubDate: item.pubDate,
        source: item.creator || undefined,
        contentSnippet: item.contentSnippet?.slice(0, 200),
      }));

    return NextResponse.json({ keyword: keyword.trim(), news: items });
  } catch (err) {
    console.error("News fetch error:", err);
    return NextResponse.json(
      { error: "뉴스를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
