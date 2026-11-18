import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { consultarPago, mpActivo } from '@/lib/mp';
import { avisarPersonal } from '@/lib/avisos';

// Mercado Pago avisa acá. Se vuelve a consultar el pago a MP antes de marcar nada como pagado.
export async function POST(req: Request) {
  if (!mpActivo()) return NextResponse.json({ ok: true });
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const tipo = body?.type || url.searchParams.get('type') || url.searchParams.get('topic');
  const id = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
  if (tipo !== 'payment' || !id) return NextResponse.json({ ok: true });
  const pago = await consultarPago(String(id));
  if (!pago || !pago.referencia) return NextResponse.json({ ok: true });
  const sb = supabaseAdmin();
  const { data: ped } = await sb.from('pedidos').select('id,total,estado_pago').eq('codigo', pago.referencia).maybeSingle();
  if (!ped) return NextResponse.json({ ok: true });
  if (pago.estado === 'approved' && pago.monto + 1 >= Number(ped.total) && ped.estado_pago !== 'pagado') {
    await sb.from('pedidos').update({ estado_pago: 'pagado', mp_pago: pago.id, actualizado: new Date().toISOString() }).eq('id', ped.id);
    await avisarPersonal(`Pago recibido #${ped.id}`, `Mercado Pago aprobó $ ${Math.round(pago.monto).toLocaleString('es-AR')}.`, `/panel/pedidos#p${ped.id}`);
  }
  return NextResponse.json({ ok: true });
}
