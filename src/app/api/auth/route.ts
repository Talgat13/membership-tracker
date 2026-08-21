import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PASSWORD = process.env.APP_PASSWORD || 'fitpass2026';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const appPassword = process.env.APP_PASSWORD || DEFAULT_PASSWORD;

    if (!password || password !== appPassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Set authentication cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'app_session',
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'app_session',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
