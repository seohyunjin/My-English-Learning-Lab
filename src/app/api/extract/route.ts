import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { chatLog } = await req.json();

        const chatText = chatLog
            .map((m: { role: string; content: string }) =>
                `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`
            )
            .join('\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze this English conversation between a student and teacher. 
Respond ONLY in this exact JSON format:
{
  "topic": "A short English topic name (e.g. Daily Life, Travel, Health)",
  "score": <number 1-100 based on grammar, vocabulary, fluency>,
  "key_expressions": [
    { "word": "expression", "meaning": "한국어 의미", "example": "example sentence from conversation" }
  ]
}

Extract 3-7 useful expressions/vocabulary from the TEACHER's messages that would benefit the student.
Score the STUDENT's English skill based on their messages.

Conversation:
${chatText}

Respond with ONLY the JSON:`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // 교정 횟수 계산
        const corrections_count = chatLog.filter(
            (m: { role: string; correction?: string }) =>
                m.role === 'user' && m.correction
        ).length;

        // Supabase에 대화 저장
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .insert({
                topic: parsed.topic,
                chat_log: chatLog,
                corrections_count,
                key_expressions: parsed.key_expressions,
                score: parsed.score,
            })
            .select()
            .single();

        if (convError) {
            console.error('Supabase conversations error:', convError);
        }

        // 단어장 저장
        if (convData && parsed.key_expressions?.length > 0) {
            const vocabRows = parsed.key_expressions.map(
                (e: { word: string; meaning: string; example: string }) => ({
                    conversation_id: convData.id,
                    word: e.word,
                    meaning: e.meaning,
                    example: e.example,
                })
            );
            const { error: vocabError } = await supabase
                .from('vocabulary')
                .insert(vocabRows);
            if (vocabError) console.error('Supabase vocabulary error:', vocabError);
        }

        return NextResponse.json({
            ...parsed,
            corrections_count,
            conversation_id: convData?.id,
        });
    } catch (error) {
        console.error('Extract API error:', error);
        return NextResponse.json(
            { error: 'Failed to extract expressions' },
            { status: 500 }
        );
    }
}
