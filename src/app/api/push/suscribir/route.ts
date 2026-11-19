import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { perfilActual, STAFF } from '@/lib/datos';
import { avisarPersonal } from '@/lib/avisos';

const solo = () => NextResponse.json({ error: 'Solo personal.' }, { status: 403 });

/** Guarda (o borra) el dispositivo del personal que activó los avisos. */
export async function POST(req: Request) {
  const p = await perfilActual();
  if (!p || !STAFF.includes(p.rol)) return solo();
  const b = await req.json().catch(() => null);
  const endpoint = String(b?.endpoint || '');
  const p256dh = String(b?.keys?.p256dh || '');
  const auth = String(b?.keys?.auth || '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  const { error } = await supabaseAdmin().from('avisos_push').upsert({ endpoint, usuario: p.id, p256dh, auth }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
  if (b?.probar) await avisarPersonal('Avisos activados', 'Vas a recibir acá cada pedido nuevo y cada pago de Mercado Pago.', '/panel');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const p = await perfilActual();
  if (!p || !STAFF.includes(p.rol)) return solo();
  const b = await req.json().catch(() => null);
  await supabaseAdmin().from('avisos_push').delete().eq('endpoint', String(b?.endpoint || '')).eq('usuario', p.id);
  return NextResponse.json({ ok: true });
}

/** Manda un aviso de prueba a todos los dispositivos y al WhatsApp configurado. */
export async function PUT() {
  const p = await perfilActual();
  if (!p || !STAFF.includes(p.rol)) return solo();
  await avisarPersonal('Aviso de prueba', 'Si ves esto, los avisos de la tienda funcionan.', '/panel');
  return NextResponse.json({ ok: true });
}
