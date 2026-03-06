'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface VocabItem {
    id: string;
    word: string;
    meaning: string;
    example: string;
    created_at: string;
}

export default function VocabularyPage() {
    const [vocab, setVocab] = useState<VocabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchVocab();
    }, []);

    const fetchVocab = async () => {
        const { data, error } = await supabase
            .from('vocabulary')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setVocab(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 단어를 삭제할까요?')) return;
        setDeletingId(id);
        const { error } = await supabase.from('vocabulary').delete().eq('id', id);
        if (!error) {
            setVocab((prev) => prev.filter((v) => v.id !== id));
        } else {
            alert('삭제 중 오류가 발생했습니다.');
        }
        setDeletingId(null);
    };

    const filtered = vocab.filter(
        (v) =>
            v.word.toLowerCase().includes(search.toLowerCase()) ||
            v.meaning.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <h1>📖 나의 단어장</h1>
                <p>AI 회화를 통해 수집된 핵심 표현들을 복습하세요</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <input
                    type="text"
                    className="chat-input"
                    style={{ maxWidth: 320 }}
                    placeholder="🔍 단어 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="badge badge-purple">{filtered.length}개</span>
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="emoji">⏳</div>
                    <p>불러오는 중...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">📭</div>
                    <p style={{ marginBottom: '0.5rem' }}>
                        {search ? '검색 결과가 없어요' : '아직 저장된 단어가 없어요'}
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                        AI 회화를 마치고 [학습 완료]를 누르면 자동으로 저장됩니다
                    </p>
                </div>
            ) : (
                <div className="vocab-grid">
                    {filtered.map((item) => (
                        <div key={item.id} className="vocab-card" style={{ position: 'relative' }}>
                            {/* 삭제 버튼 */}
                            <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                style={{
                                    position: 'absolute',
                                    top: '0.6rem',
                                    right: '0.6rem',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text3)',
                                    fontSize: '1rem',
                                    lineHeight: 1,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    transition: 'color 0.2s, background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.target as HTMLButtonElement).style.color = 'var(--red)';
                                    (e.target as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.color = 'var(--text3)';
                                    (e.target as HTMLButtonElement).style.background = 'transparent';
                                }}
                                title="삭제"
                            >
                                {deletingId === item.id ? '...' : '✕'}
                            </button>

                            <div className="vocab-word" style={{ paddingRight: '1.5rem' }}>{item.word}</div>
                            <div className="vocab-meaning">{item.meaning}</div>
                            <div className="vocab-example">"{item.example}"</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
