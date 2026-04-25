import { NextRequest, NextResponse } from 'next/server';
import { readDebugCode } from '@/lib/providers/sms';
import { normalizeCnPhoneNumber } from '@/lib/auth/phone';

/**
 * Dev-only endpoint that surfaces the most-recently-sent OTP for a phone
 * number. ONLY active when SMS_PROVIDER=stub AND NODE_ENV !== 'production'.
 *
 * Used by the register / forgot-password UIs to show a helper hint when the
 * operator is testing locally without a real SMS gateway.
 *
 * In production this returns 404 unconditionally — never leaks a code.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }
  if ((process.env.SMS_PROVIDER ?? 'stub') !== 'stub') {
    return new NextResponse(null, { status: 404 });
  }

  const raw = req.nextUrl.searchParams.get('phone');
  if (!raw) return NextResponse.json({ error: 'phone required' }, { status: 400 });

  const phone = normalizeCnPhoneNumber(raw);
  if (!phone) return NextResponse.json({ error: 'invalid phone' }, { status: 400 });

  const code = readDebugCode(phone);
  if (!code) return NextResponse.json({ code: null });

  return NextResponse.json({ code });
}
