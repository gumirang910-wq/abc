"use client";

import { useState, useRef, useEffect } from "react";

type NewsItem = {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
};

type ChatMessage = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [summary, setSummary] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchNews = async () => {
    if (!keyword.trim()) {
      setError("키워드를 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    setNews([]);
    setSummary("");
    setChatMessages([]);
    try {
      const res = await fetch(`/api/news?keyword=${encodeURIComponent(keyword.trim())}`);
      let data: { error?: string; news?: NewsItem[] };
      try {
        data = await res.json();
      } catch {
        setError("연결 오류. 서버를 확인하세요.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "뉴스 조회 실패");
      setNews(data.news || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "뉴스 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const summarizeNews = async () => {
    if (news.length === 0) {
      setError("먼저 키워드로 뉴스를 수집해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), news }),
      });
      let data: { error?: string; summary?: string };
      try {
        data = await res.json();
      } catch {
        setError("연결 오류. 서버를 확인하세요.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "요약 실패");
      setSummary(data.summary || "");
      setChatMessages([
        {
          role: "assistant",
          text: "뉴스 요약이 완료되었습니다. 요약 내용을 바탕으로 궁금한 점을 물어보세요.",
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "요약 실패");
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !summary) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setChatLoading(true);
    setError("");
    try {
      const history = chatMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          keyword: keyword.trim(),
          message: userMessage,
          history,
        }),
      });
      let data: { error?: string; reply?: string };
      try {
        data = await res.json();
      } catch {
        setError("연결 오류. 서버를 확인하세요.");
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: "연결 오류. 서버를 확인하세요." },
        ]);
        return;
      }
      if (!res.ok) {
        const msg = data.error || "답변 생성 중 오류가 발생했습니다.";
        setError(msg);
        setChatMessages((prev) => [...prev, { role: "assistant", text: msg }]);
        return;
      }
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply || "" }]);
    } catch (e) {
      const isNetworkError =
        e instanceof TypeError && (e.message === "Failed to fetch" || e.message?.includes("fetch"));
      const msg = isNetworkError
        ? "연결 오류. 서버를 확인하세요."
        : (e instanceof Error ? e.message : "답변 실패");
      setError(msg);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: msg },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>뉴스 챗봇</h1>
        <p>키워드로 구글 뉴스 10건을 수집하고, AI로 요약·대화해보세요.</p>
      </header>

      <section className="search-section">
        <div className="input-row">
          <input
            type="text"
            placeholder="검색할 키워드 입력 (예: 인공지능, 삼성전자)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchNews()}
            disabled={loading}
            className="keyword-input"
          />
          <button
            type="button"
            onClick={fetchNews}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "수집 중..." : "뉴스 수집"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      {news.length > 0 && (
        <section className="news-section">
          <div className="section-header">
            <h2>수집된 뉴스 ({news.length}건)</h2>
            <button
              type="button"
              onClick={summarizeNews}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? "요약 중..." : "재미나이로 요약하기"}
            </button>
          </div>
          <ul className="news-list">
            {news.map((item, i) => (
              <li key={i} className="news-item">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                {item.pubDate && (
                  <span className="news-meta">{new Date(item.pubDate).toLocaleDateString("ko-KR")}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary && (
        <section className="summary-section">
          <h2>뉴스 요약</h2>
          <div className="summary-box">{summary}</div>
        </section>
      )}

      {summary && (
        <section className="chat-section">
          <h2>뉴스에 대해 질문하기</h2>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                <span className="chat-role">{msg.role === "user" ? "나" : "챗봇"}</span>
                <p>{msg.text}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble assistant">
                <span className="chat-role">챗봇</span>
                <p className="typing">답변 생성 중...</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              placeholder="요약된 뉴스에 대해 궁금한 것을 입력하세요"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              disabled={chatLoading}
              className="chat-input"
            />
            <button
              type="button"
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="btn btn-primary"
            >
              전송
            </button>
          </div>
        </section>
      )}

      <footer className="footer">
        <p>Gemini 2.5 Flash · Vercel 배포</p>
      </footer>
    </main>
  );
}
