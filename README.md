# 🇬🇧 English Learning Lab

> AI 선생님과 함께하는 영어 회화 학습 웹앱

**🎬 [데모 영상 보기 (Google Drive)](https://drive.google.com/your-link-here)**

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 💬 **AI 영어 회화** | Groq(LLaMA) 기반 AI 선생님과 자유 대화 |
| ✍️ **실시간 문법 교정** | 입력한 영어 문장의 문법 오류를 한국어로 즉시 설명 |
| 📊 **회화 점수 산출** | 대화 종료 시 1~100점으로 영어 실력 평가 |
| 📖 **개인 단어장** | 대화에서 추출된 핵심 표현을 Supabase DB에 자동 저장 |
| 🧩 **복습 퀴즈** | 단어장 기반 객관식 & 빈칸 채우기 퀴즈 |
| 📥 **Obsidian 내보내기** | 대화 로그를 YAML 메타데이터 포함 마크다운으로 내보내기 |

## 🛠 기술 스택

- **Frontend**: Next.js 16 (App Router, TypeScript)
- **AI**: [Groq API](https://groq.com) (LLaMA 3.3 70B) — 무료 티어
- **Database**: [Supabase](https://supabase.com) (PostgreSQL) — 무료 티어
- **Styling**: Vanilla CSS (Dark Theme)
- **Deployment**: Vercel

## 🚀 로컬 실행 방법

### 1. 사전 준비

아래 두 서비스에서 무료 계정 및 API 키를 발급하세요:
- [Groq Console](https://console.groq.com) → API Keys
- [Supabase](https://supabase.com) → 새 프로젝트 생성

### 2. 설치

```bash
git clone https://github.com/YOUR_USERNAME/english-learning-lab.git
cd english-learning-lab
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음을 입력하세요:

```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase DB 초기화

Supabase 대시보드 → SQL Editor에서 `supabase-schema.sql` 파일 내용을 실행하세요.

### 5. 실행

```bash
npm run dev
```

`http://localhost:3000` 접속

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── chat/          # AI 회화 탭
│   ├── vocabulary/    # 단어장 탭
│   ├── quiz/          # 퀴즈 탭
│   └── api/
│       ├── chat/      # Groq 채팅 API
│       └── extract/   # 표현 추출 + Supabase 저장
└── lib/
    ├── supabase.ts    # DB 클라이언트
    └── obsidian.ts    # 마크다운 생성기
```

## 📋 Obsidian 내보내기 형식

```yaml
---
aliases: ["Conversation Log - 2026-03-06"]
tags:
  - english/ai-chat
  - daily-review
date: 2026-03-06
topic: "Daily Life"
corrections_count: 2
key_expressions:
  - "look forward to"
score: 78
status: "archived"
---
```

## 📄 License

MIT
