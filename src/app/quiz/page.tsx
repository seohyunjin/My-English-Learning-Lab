'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface VocabItem {
    id: string;
    word: string;
    meaning: string;
    example: string;
}

type QuizMode = 'multiple' | 'fill';

interface Question {
    word: string;
    meaning: string;
    example: string;
    options: string[];
    answer: string;
    mode: QuizMode;
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function generateQuestions(vocab: VocabItem[]): Question[] {
    return shuffle(vocab).slice(0, 10).map((item) => {
        const mode: QuizMode = Math.random() > 0.5 ? 'multiple' : 'fill';
        const wrongs = shuffle(vocab.filter((v) => v.id !== item.id))
            .slice(0, 3)
            .map((v) => v.meaning);
        return {
            word: item.word,
            meaning: item.meaning,
            example: item.example,
            options: shuffle([item.meaning, ...wrongs]),
            answer: item.meaning,
            mode,
        };
    });
}

export default function QuizPage() {
    const [vocab, setVocab] = useState<VocabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [fillInput, setFillInput] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        const fetchVocab = async () => {
            const { data, error } = await supabase.from('vocabulary').select('*');
            if (!error && data) setVocab(data);
            setLoading(false);
        };
        fetchVocab();
    }, []);

    const startQuiz = () => {
        setQuestions(generateQuestions(vocab));
        setCurrent(0);
        setSelected(null);
        setFillInput('');
        setIsCorrect(null);
        setScore(0);
        setFinished(false);
    };

    const handleMultipleChoice = (option: string) => {
        if (selected) return;
        setSelected(option);
        const correct = option === questions[current].answer;
        setIsCorrect(correct);
        if (correct) setScore((s) => s + 1);
    };

    const handleFillSubmit = () => {
        if (isCorrect !== null) return;
        const correct =
            fillInput.trim().toLowerCase() === questions[current].answer.toLowerCase();
        setIsCorrect(correct);
        if (correct) setScore((s) => s + 1);
    };

    const handleNext = () => {
        if (current + 1 >= questions.length) {
            setFinished(true);
        } else {
            setCurrent((c) => c + 1);
            setSelected(null);
            setFillInput('');
            setIsCorrect(null);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="page-header"><h1>🧩 퀴즈</h1></div>
                <div className="empty-state"><div className="emoji">⏳</div><p>불러오는 중...</p></div>
            </div>
        );
    }

    if (vocab.length < 4) {
        return (
            <div>
                <div className="page-header"><h1>🧩 퀴즈</h1></div>
                <div className="empty-state">
                    <div className="emoji">📭</div>
                    <p style={{ marginBottom: '0.5rem' }}>단어가 부족해요 (최소 4개 필요)</p>
                    <p style={{ fontSize: '0.85rem' }}>AI 회화를 더 진행하면 단어가 쌓입니다!</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div>
                <div className="page-header">
                    <h1>🧩 퀴즈</h1>
                    <p>단어장의 표현으로 퀴즈를 풀어보세요</p>
                </div>
                <div className="quiz-container card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>퀴즈 준비 완료!</h2>
                    <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>
                        단어장에 저장된 {vocab.length}개 표현으로 퀴즈를 시작합니다
                    </p>
                    <button className="btn btn-primary" onClick={startQuiz}>퀴즈 시작하기 🚀</button>
                </div>
            </div>
        );
    }

    if (finished) {
        const percent = Math.round((score / questions.length) * 100);
        return (
            <div>
                <div className="page-header"><h1>🧩 퀴즈 결과</h1></div>
                <div className="quiz-container card quiz-result">
                    <div className="big-score">{percent}%</div>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        {questions.length}문제 중 {score}개 정답!
                    </p>
                    <p style={{ color: 'var(--text2)', marginBottom: '2rem' }}>
                        {percent >= 80 ? '훌륭해요! 🎉' : percent >= 60 ? '잘 하고 있어요! 👍' : '복습을 더 해봐요! 💪'}
                    </p>
                    <button className="btn btn-primary" onClick={startQuiz}>다시 풀기</button>
                </div>
            </div>
        );
    }

    const q = questions[current];
    const progress = ((current) / questions.length) * 100;

    return (
        <div>
            <div className="page-header"><h1>🧩 퀴즈</h1></div>
            <div className="quiz-container">
                <div className="quiz-progress">
                    <span>{current + 1} / {questions.length}</span>
                    <span className={`badge ${q.mode === 'multiple' ? 'badge-purple' : 'badge-green'}`}>
                        {q.mode === 'multiple' ? '객관식' : '빈칸 채우기'}
                    </span>
                    <span>점수: {score}</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="card">
                    {q.mode === 'multiple' ? (
                        <>
                            <div className="quiz-question">
                                다음 표현의 뜻은? <br />
                                <span style={{ color: 'var(--accent2)', fontSize: '1.2rem', fontWeight: 700 }}>
                                    {q.word}
                                </span>
                            </div>
                            <div className="quiz-options">
                                {q.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        className={`quiz-option ${selected
                                                ? opt === q.answer
                                                    ? 'correct'
                                                    : opt === selected
                                                        ? 'wrong'
                                                        : ''
                                                : ''
                                            }`}
                                        disabled={!!selected}
                                        onClick={() => handleMultipleChoice(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="quiz-question">
                                빈칸을 채워보세요:<br />
                                <span style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
                                    의미: {q.meaning}
                                </span>
                            </div>
                            <input
                                type="text"
                                className="fill-input"
                                placeholder="영어 표현 입력..."
                                value={fillInput}
                                disabled={isCorrect !== null}
                                onChange={(e) => setFillInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFillSubmit()}
                            />
                            {isCorrect === null && (
                                <button className="btn btn-primary" onClick={handleFillSubmit} disabled={!fillInput.trim()}>
                                    확인
                                </button>
                            )}
                        </>
                    )}

                    {isCorrect !== null && (
                        <div className={`quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
                            {isCorrect ? '✅ 정답!' : `❌ 오답 — 정답: ${q.answer}`}
                            <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', opacity: 0.85 }}>
                                예문: "{q.example}"
                            </div>
                        </div>
                    )}

                    {isCorrect !== null && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="btn btn-primary" onClick={handleNext}>
                                {current + 1 >= questions.length ? '결과 보기 🎯' : '다음 문제 →'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
