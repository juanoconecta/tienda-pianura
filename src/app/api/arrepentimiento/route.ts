import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { avisarPersonal } from '@/lib/avisos';

const txt = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** Botón de arrepentimiento: registra el pedido de cancelación y devuelve un código de trámite. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const nombre = txt(b?.nombre, 120);
  const contacto = txt(b?.contacto, 120);
  const motivo = txt(b?.motivo, 600) || null;
  const nro = Number(String(b?.pedido ?? '').replace(/\D/g, ''));
  if (!nombre || !contacto) return NextResponse.json({ error: 'Completá tu nombre y un celular o mail de contacto.' }, { status: 400 });

  const sb = supabaseAdmin();
  let pedido: number | null = null;
  if (nro) {
    const { data } = await sb.from('pedidos').select('id').eq('id', nro).maybeSingle();
    pedido = data?.id ?? null;
  }
  const { data, error } = await sb.from('arrepentimientos').insert({ nombre, contacto, motivo, pedido }).select('tramite').single();
  if (error || !data) return NextResponse.json({ error: 'No pudimos registrar el pedido. Probá de nuevo o escribinos por WhatsApp.' }, { status: 500 });

  after(() => avisarPersonal('Botón de arrepentimiento', `${nombre}${pedido ? ` · pedido #${pedido}` : nro ? ` · pedido #${nro} (no encontrado)` : ''} · ${contacto} · trámite ${data.tramite}`, '/panel'));
  return NextResponse.json({ tramite: data.tramite });
}
