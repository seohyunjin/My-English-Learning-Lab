import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { password } = await req.json();

    if (password !== process.env.APP_PASSWORD?.trim()) {
        return NextResponse.json({ error: '비밀번호가 틀렸어요' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('ell_auth', process.env.APP_PASSWORD!.trim(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30일
        path: '/',
    });
    return res;
}
