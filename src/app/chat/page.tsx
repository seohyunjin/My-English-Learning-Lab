'use client';

import { useState, useRef, useEffect } from 'react';
import { KeyExpression, ExtractionResult, generateObsidianMarkdown } from '@/lib/obsidian';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    correction?: string | null;
    corrected_sentence?: string | null;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            content: "Hello! I'm your English teacher today 😊 Let's have a casual conversation! How are you doing? What have you been up to lately?",
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [result, setResult] = useState<ExtractionResult | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

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
            const data = await res.json();

            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    correction: data.correction || null,
                    corrected_sentence: data.corrected_sentence || null,
                };
                return [
                    ...updated,
                    { role: 'model', content: data.reply },
                ];
            });
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'model', content: '⚠️ 연결 오류가 발생했습니다. 다시 시도해주세요.' },
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
            const data = await res.json();
            setResult(data);
            setIsDone(true);
        } catch {
            alert('표현 추출 중 오류가 발생했습니다.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleObsidianExport = () => {
        if (!result) return;
        const today = new Date().toISOString().split('T')[0];
        const md = generateObsidianMarkdown(today, result, messages);

        // obsidian:// URI 시도
        const encoded = encodeURIComponent(md);
        const filename = `${today}_회화`;
        const uri = `obsidian://new?file=${encodeURIComponent(filename)}&content=${encoded}`;
        window.location.href = uri;

        // Fallback: .md 파일 다운로드
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
        setMessages([
            {
                role: 'model',
                content: "Hello again! Let's start a new conversation 😊 What would you like to talk about today?",
            },
        ]);
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
                    {!isDone && (
                        <button
                            className="btn btn-success"
                            onClick={handleFinish}
                            disabled={messages.length < 3 || isExtracting}
                        >
                            {isExtracting ? '⏳ 분석 중...' : '✅ 학습 완료'}
                        </button>
                    )}
                </div>
            </div>

            {/* 결과 모달 */}
            {result && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>🎉 오늘의 학습 결과</h2>

                        <div className="score-badge">
                            ⭐ 회화 점수: {result.score}점
                        </div>

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
