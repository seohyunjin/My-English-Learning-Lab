'use client';

import { useState, useRef, useEffect } from 'react';
import { KeyExpression, ExtractionResult, generateObsidianMarkdown } from '@/lib/obsidian';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    correction?: string | null;
    corrected_sentence?: string | null;
}

const STORAGE_KEY = 'ell_chat_messages';
const STORAGE_DONE_KEY = 'ell_chat_done';
const STORAGE_RESULT_KEY = 'ell_chat_result';

const INITIAL_MESSAGE: ChatMessage = {
    role: 'model',
    content: "Hello! I'm your English teacher today 😊 Let's have a casual conversation! How are you doing? What have you been up to lately?",
};

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [result, setResult] = useState<ExtractionResult | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // localStorage에서 이전 대화 복원
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const savedDone = localStorage.getItem(STORAGE_DONE_KEY);
            const savedResult = localStorage.getItem(STORAGE_RESULT_KEY);
            if (saved) setMessages(JSON.parse(saved));
            if (savedDone === 'true') setIsDone(true);
            if (savedResult) setResult(JSON.parse(savedResult));
        } catch { /* 무시 */ }
    }, []);

    // 대화 변경 시 localStorage에 저장
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch { /* 무시 */ }
    }, [messages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading || isDone) return;
        const userMsg = input.trim();
        setInput('');

        const newMsg: ChatMessage = { role: 'user', content: userMsg };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error('API error:', res.status, errData);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'model' as const,
                        content: '⚠️ AI 응답 오류가 발생했어요. 잠시 후 다시 시도해주세요.\n(분당 요청 한도 초과 시 1~2분 기다리면 해결됩니다)',
                    },
                ]);
                return;
            }

            const data = await res.json();

            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    correction: data.correction || null,
                    corrected_sentence: data.corrected_sentence || null,
                };
                return [...updated, { role: 'model' as const, content: data.reply }];
            });
        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'model' as const,
                    content: '⚠️ 네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinish = async () => {
        if (messages.length < 3) return;
        setIsExtracting(true);
        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatLog: messages }),
            });

            if (!res.ok) {
                // API 쿼터 초과 등 서버 오류
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'model' as const,
                        content: '⏰ AI 분석 오류가 발생했어요.\nGemini API 무료 사용량이 초과됐을 수 있어요. 잠시 후 다시 시도하거나 내일 다시 와주세요!',
                    },
                ]);
                return;
            }

            const data = await res.json();

            // 유효한 데이터가 있을 때만 모달 열기
            if (!data.score || !data.topic) {
                alert('AI 분석 결과를 가져오지 못했어요. 잠시 후 다시 시도해주세요.');
                return;
            }

            setResult(data);
            setIsDone(true);
            localStorage.setItem(STORAGE_DONE_KEY, 'true');
            localStorage.setItem(STORAGE_RESULT_KEY, JSON.stringify(data));
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'model' as const,
                    content: '⚠️ 네트워크 오류로 분석에 실패했어요. 인터넷 연결을 확인해주세요.',
                },
            ]);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleObsidianExport = () => {
        if (!result) return;
        const today = new Date().toISOString().split('T')[0];
        const md = generateObsidianMarkdown(today, result, messages);
        const filename = `${today}_회화`;
        const uri = `obsidian://new?file=${encodeURIComponent(filename)}&content=${encodeURIComponent(md)}`;
        window.location.href = uri;
        setTimeout(() => {
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.md`;
            a.click();
            URL.revokeObjectURL(url);
        }, 1500);
    };

    const handleNewChat = () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_DONE_KEY);
        localStorage.removeItem(STORAGE_RESULT_KEY);
        setMessages([INITIAL_MESSAGE]);
        setResult(null);
        setIsDone(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1>💬 AI 영어 회화</h1>
                <p>AI 선생님과 자유롭게 영어로 대화하고 문법 교정을 받아보세요</p>
            </div>

            <div className="card chat-container">
                <div className="chat-window">
                    {messages.map((msg, i) => (
                        <div key={i} className="message-group">
                            <div className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                                {msg.content}
                            </div>
                            {msg.role === 'user' && msg.correction && (
                                <div className="bubble-correction">
                                    ✍️ <strong>교정</strong>: {msg.corrected_sentence}
                                    <br />
                                    <span style={{ opacity: 0.85 }}>{msg.correction}</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="bubble-typing">
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="chat-input-area">
                    <textarea
                        className="chat-input"
                        rows={1}
                        placeholder={isDone ? '학습이 완료되었습니다 🎉' : '영어로 입력하세요... (Enter로 전송)'}
                        value={input}
                        disabled={isDone || isLoading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || isDone}
                    >
                        전송
                    </button>
                </div>

                <div className="chat-actions">
                    {!isDone ? (
                        <button
                            className="btn btn-success"
                            onClick={handleFinish}
                            disabled={messages.length < 3 || isExtracting}
                        >
                            {isExtracting ? '⏳ 분석 중...' : '✅ 학습 완료'}
                        </button>
                    ) : (
                        <button className="btn btn-outline" onClick={handleNewChat}>
                            🔄 새 대화 시작
                        </button>
                    )}
                </div>
            </div>

            {result && isDone && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>🎉 오늘의 학습 결과</h2>
                        <div className="score-badge">⭐ 회화 점수: {result.score}점</div>
                        <div style={{ marginBottom: '0.5rem', color: 'var(--text2)', fontSize: '0.85rem' }}>
                            교정 횟수: {result.corrections_count}회 &nbsp;·&nbsp; 주제: {result.topic}
                        </div>
                        <h3 style={{ margin: '1rem 0 0.6rem', fontSize: '0.95rem', color: 'var(--text2)' }}>
                            📚 오늘의 핵심 표현
                        </h3>
                        <div className="expression-list">
                            {result.key_expressions?.map((e: KeyExpression, i: number) => (
                                <div key={i} className="expression-item">
                                    <strong>{e.word}</strong>
                                    <div className="meaning">{e.meaning}</div>
                                    <div className="example">"{e.example}"</div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={handleObsidianExport}>
                                📥 옵시디언으로 내보내기
                            </button>
                            <button className="btn btn-outline" onClick={handleNewChat}>
                                🔄 새 대화 시작
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
