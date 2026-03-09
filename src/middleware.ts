import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 로그인 페이지와 API는 제외
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // 인증 쿠키 확인
    const auth = req.cookies.get('ell_auth')?.value;
    if (auth === process.env.APP_PASSWORD?.trim()) {
        return NextResponse.next();
    }

    // 미인증 → 로그인 페이지로 리다이렉트
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
