import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const configured = Boolean(process.env.ADMIN_KEY);
  const isAdmin = configured && request.headers.get('x-admin-key') === process.env.ADMIN_KEY;

  return NextResponse.json({
    configured,
    isAdmin
  });
}
