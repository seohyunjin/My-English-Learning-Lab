'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            router.push('/chat');
            router.refresh();
        } else {
            setError('비밀번호가 틀렸어요. 다시 시도해주세요.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🇬🇧</div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    English Learning Lab
                </h1>
                <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    비밀번호를 입력해주세요
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <input
                        type="password"
                        className="chat-input"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                    {error && (
                        <p style={{ color: 'var(--red, #f87171)', fontSize: '0.85rem' }}>{error}</p>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !password}
                    >
                        {loading ? '확인 중...' : '🔓 입장하기'}
                    </button>
                </form>
            </div>
        </div>
    );
}
