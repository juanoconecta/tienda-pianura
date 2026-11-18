import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'application/pdf': 'pdf' };

export async function POST(req: Request, ctx: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(codigo)) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  const form = await req.formData().catch(() => null);
  const f = form?.get('archivo');
  if (!(f instanceof File)) return NextResponse.json({ error: 'Elegí una foto o un PDF del comprobante.' }, { status: 400 });
  const ext = TIPOS[f.type];
  if (!ext) return NextResponse.json({ error: 'El comprobante tiene que ser una foto o un PDF.' }, { status: 400 });
  if (f.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'El archivo pesa más de 8 MB.' }, { status: 400 });
  const sb = supabaseAdmin();
  const { data: ped } = await sb.from('pedidos').select('id').eq('codigo', codigo).maybeSingle();
  if (!ped) return NextResponse.json({ error: 'No encontramos el pedido.' }, { status: 404 });
  const ruta = `${ped.id}/${Date.now()}.${ext}`;
  const up = await sb.storage.from('comprobantes').upload(ruta, f, { contentType: f.type, upsert: false });
  if (up.error) return NextResponse.json({ error: 'No se pudo subir el archivo. Probá de nuevo.' }, { status: 500 });
  await sb.from('pedidos').update({ comprobante: ruta, actualizado: new Date().toISOString() }).eq('id', ped.id);
  return NextResponse.json({ ok: true });
}
