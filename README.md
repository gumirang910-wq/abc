# 뉴스 챗봇

키워드를 입력하면 **구글 뉴스 10건**을 수집하고, **재미나이(Gemini 2.5 Flash)**로 요약한 뒤, 요약 내용을 바탕으로 **대화**할 수 있는 웹 챗봇입니다.

## 기능

- **키워드 검색**: 구글 뉴스 RSS에서 해당 키워드 뉴스 10건 수집
- **AI 요약**: Gemini 2.5 Flash로 수집 뉴스 요약
- **챗봇**: 요약된 뉴스에 대해 질문·대화

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수

`.env.local` 파일을 만들고 다음을 설정하세요.

```env
GEMINI_API_KEY=your_gemini_api_key
```

(재미나이 API 키는 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급할 수 있습니다.)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

### 4. 빌드

```bash
npm run build
npm start
```

## Vercel 배포

1. [Vercel](https://vercel.com)에 로그인 후, 이 저장소를 연결하거나 `vercel` CLI로 배포합니다.

2. **환경 변수 설정**  
   Vercel 프로젝트 → **Settings** → **Environment Variables** 에서 다음을 추가합니다.

   | 이름            | 값                    |
   |-----------------|------------------------|
   | `GEMINI_API_KEY` | (재미나이 API 키)      |

3. **Redeploy** 하면 새 환경 변수가 적용됩니다.

### CLI로 배포

```bash
npm i -g vercel
vercel
```

프롬프트에서 환경 변수 `GEMINI_API_KEY` 를 입력하거나, 대시보드에서 나중에 설정할 수 있습니다.

## 기술 스택

- **Next.js 14** (App Router)
- **재미나이(Gemini) 2.5 Flash** (`@google/genai`)
- **rss-parser** (구글 뉴스 RSS 파싱)
- **Vercel** 배포

## 주의사항

- API 키는 반드시 서버 환경 변수(`.env.local` 또는 Vercel 환경 변수)로만 사용하고, 클라이언트 코드에 노출하지 마세요.
- 구글 뉴스 RSS는 지역/언어에 따라 결과가 달라질 수 있습니다. (현재 `hl=ko-KR`, `gl=KR` 사용)
