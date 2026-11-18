import { NextResponse } from 'next/server';
import { cuponVigente } from '@/lib/cupones';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { cupon, error } = await cuponVigente(body?.codigo);
  if (!cupon) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ cupon });
}
