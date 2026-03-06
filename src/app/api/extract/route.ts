import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { chatLog } = await req.json();

        const chatText = chatLog
            .map((m: { role: string; content: string }) =>
                `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`
            )
            .join('\n');

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an English learning analyzer. Analyze the conversation and respond ONLY with valid JSON in this exact format:
{
  "topic": "A short English topic name (e.g. Daily Life, Travel, Health)",
  "score": <number 1-100 based on grammar, vocabulary, fluency>,
  "key_expressions": [
    { "word": "expression", "meaning": "한국어 의미", "example": "example sentence from conversation" }
  ]
}
Extract 3-7 useful expressions from the TEACHER's messages. Score the STUDENT's English. No other text.`,
                },
                {
                    role: 'user',
                    content: `Conversation:\n${chatText}\n\nRespond with ONLY the JSON:`,
                },
            ],
            temperature: 0.5,
            max_tokens: 1024,
        });

        const text = completion.choices[0]?.message?.content?.trim() ?? '';
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

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

        if (convError) console.error('Supabase conversations error:', convError);

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
            const { error: vocabError } = await supabase.from('vocabulary').insert(vocabRows);
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
