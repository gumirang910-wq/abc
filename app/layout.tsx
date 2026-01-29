import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "뉴스 챗봇 | 키워드 뉴스 요약 & 대화",
  description: "키워드로 구글 뉴스를 수집하고, AI로 요약·대화하는 챗봇",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
