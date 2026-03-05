import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a friendly and encouraging English teacher having a casual conversation with a Korean learner.

Your response MUST be in the following JSON format exactly:
{
  "correction": "문법 교정 내용 (한국어로 설명). 오류가 없으면 null",
  "corrected_sentence": "교정된 영어 문장. 오류가 없으면 null",
  "reply": "영어로 된 자연스러운 대화 응답"
}

Rules:
1. If the user's English has grammar mistakes, provide a correction in Korean and the corrected sentence.
2. If the English is correct, set correction and corrected_sentence to null.
3. Your reply should be natural, engaging, and appropriate for casual conversation.
4. Keep replies concise (1-3 sentences).
5. Respond with ONLY the JSON, no other text.`;

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // 대화 이력을 텍스트로 변환
        const historyText = history
            .map((m: { role: string; content: string }) =>
                `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`
            )
            .join('\n');

        const prompt = `${SYSTEM_PROMPT}

Previous conversation:
${historyText}

Student's new message: "${message}"

Respond in JSON:`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // JSON 파싱 (코드블록 제거)
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to get response from AI' },
            { status: 500 }
        );
    }
}
