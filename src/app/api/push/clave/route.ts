import { NextResponse } from 'next/server';
import { clavesAvisos } from '@/lib/avisos';
import { perfilActual, STAFF } from '@/lib/datos';

export const dynamic = 'force-dynamic';

/** Clave pública para que el navegador del personal se suscriba a los avisos. */
export async function GET() {
  const p = await perfilActual();
  if (!p || !STAFF.includes(p.rol)) return NextResponse.json({ error: 'Solo personal.' }, { status: 403 });
  const k = await clavesAvisos();
  return NextResponse.json({ clave: k.publica });
}
