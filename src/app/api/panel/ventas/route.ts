import { perfilActual, STAFF } from '@/lib/datos';
import { supabaseServidor } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MEDIO: Record<string, string> = { mp: 'Mercado Pago', transferencia: 'Transferencia', cuenta: 'Cuenta corriente' };
const ENTREGA: Record<string, string> = { retiro: 'Retiro', envio: 'Envío', reparto: 'Reparto' };

// Excel en español usa ";" como separador y "," como decimal.
const celda = (v: unknown) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(Math.round(v * 100) / 100).replace('.', ',');
  const s = String(v);
  return /[;"\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s;
};
const fila = (a: unknown[]) => a.map(celda).join(';');
const fechaAR = (iso: string) => {
  const d = new Date(new Date(iso).getTime() - 3 * 3600e3).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`;
};

type Item = { codigo: string; nombre: string; detalle: string; cantidad: number; precio: number; kg: number; subtotal: number };

export async function GET(req: Request) {
  const p = await perfilActual();
  if (!p || !STAFF.includes(p.rol)) return new Response('Solo personal.', { status: 403 });
  const u = new URL(req.url);
  const ok = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  const desde = ok(u.searchParams.get('desde'));
  const hasta = ok(u.searchParams.get('hasta'));
  if (!desde || !hasta) return new Response('Fechas inválidas.', { status: 400 });
  const tipo = u.searchParams.get('tipo') === 'productos' ? 'productos' : 'pedidos';
  // Días completos en hora de Argentina.
  const ini = new Date(desde + 'T03:00:00Z').toISOString();
  const fin = new Date(new Date(hasta + 'T03:00:00Z').getTime() + 864e5).toISOString();
  const sb = await supabaseServidor();
  const { data, error } = await sb.from('pedidos').select('id,creado,modo,cliente,items,subtotal,descuento,cupon,iva,envio,total,entrega,fecha_entrega,medio_pago,estado_pago,estado')
    .gte('creado', ini).lt('creado', fin).neq('estado', 'Cancelado').order('creado');
  if (error) return new Response('No se pudieron leer las ventas.', { status: 500 });
  const ps = data ?? [];
  const lineas: string[] = [];
  if (tipo === 'pedidos') {
    lineas.push(fila(['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Localidad', 'Tipo', 'Entrega', 'Fecha de entrega', 'Medio de pago', 'Pago', 'Estado', 'Subtotal', 'Descuento', 'Cupón', 'IVA', 'Envío', 'Total', 'Productos']));
    for (const x of ps) lineas.push(fila([
      x.id, fechaAR(x.creado), x.cliente?.nombre, x.cliente?.telefono, x.cliente?.localidad, x.modo === 'may' ? 'Mayorista' : 'Minorista', ENTREGA[x.entrega] || x.entrega,
      x.fecha_entrega ? `${x.fecha_entrega.slice(8)}/${x.fecha_entrega.slice(5, 7)}/${x.fecha_entrega.slice(0, 4)}` : '', MEDIO[x.medio_pago] || x.medio_pago, x.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente', x.estado,
      Number(x.subtotal), Number(x.descuento), x.cupon, Number(x.iva), Number(x.envio), Number(x.total), ((x.items || []) as Item[]).map((l) => `${l.nombre} (${l.detalle})`).join(' | '),
    ]));
    const tot = ps.reduce((a, x) => a + Number(x.total), 0);
    lineas.push(fila(['', '', '', '', '', '', '', '', '', '', 'TOTAL', '', '', '', '', '', tot, `${ps.length} pedidos`]));
  } else {
    lineas.push(fila(['Pedido', 'Fecha', 'Cliente', 'Tipo', 'Código', 'Producto', 'Presentación', 'Cantidad', 'Kg', 'Precio', 'Subtotal']));
    for (const x of ps) for (const l of (x.items || []) as Item[]) lineas.push(fila([
      x.id, fechaAR(x.creado), x.cliente?.nombre, x.modo === 'may' ? 'Mayorista' : 'Minorista', l.codigo, l.nombre, l.detalle, Number(l.cantidad), Number(l.kg) || '', Number(l.precio), Number(l.subtotal),
    ]));
  }
  const csv = '﻿' + lineas.join('\r\n') + '\r\n';
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="pianura-ventas-${tipo}-${desde}-a-${hasta}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
