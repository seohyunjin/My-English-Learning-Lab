export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    correction?: string | null;
}

export interface KeyExpression {
    word: string;
    meaning: string;
    example: string;
}

export interface ExtractionResult {
    topic: string;
    key_expressions: KeyExpression[];
    corrections_count: number;
    score: number;
    conversation_id?: string;
}

/**
 * 옵시디언 YAML 프론트매터 + 마크다운 템플릿 생성
 */
export function generateObsidianMarkdown(
    date: string,
    result: ExtractionResult,
    chatLog: ChatMessage[]
): string {
    const yamlExpressions = result.key_expressions
        .map((e) => `  - "${e.word}"`)
        .join('\n');

    const expressionList = result.key_expressions
        .map(
            (e) =>
                `- **${e.word}**: ${e.meaning} / *예문: ${e.example}*`
        )
        .join('\n');

    const corrections = chatLog
        .filter((m) => m.role === 'user' && m.correction)
        .map(
            (m) =>
                `- **내 입력**: ${m.content}\n  - **AI 교정**: ${m.correction}`
        )
        .join('\n');

    const chatSummary = chatLog
        .map((m) => `**${m.role === 'user' ? 'Me' : 'AI'}**: ${m.content}`)
        .join('\n');

    return `---
aliases: ["Conversation Log - ${date}"]
tags:
  - english/ai-chat
  - daily-review
date: ${date}
topic: "${result.topic}"
corrections_count: ${result.corrections_count}
key_expressions:
${yamlExpressions}
score: ${result.score}
status: "archived"
---

# 🗓 AI 회화 로그: ${result.topic}

## 📚 주요 학습 표현 (Key Expressions)
> 오늘 대화에서 추출된 핵심 숙어와 단어들입니다.

${expressionList || '- (표현 없음)'}

## ✍️ 문법 교정 피드백 (Grammar Corrections)
${corrections || '- (교정 없음)'}

## 💬 전체 대화 내역 (Chat Log)
${chatSummary}
`;
}
