import { exigirPersonal } from '@/lib/panel';
import { supabaseServidor } from '@/lib/supabase/server';
import { fmt, num, proximaEntrega, type Config, type DiaSinEntrega } from '@/lib/tienda';
import { Imprimir } from '@/components/panel/Imprimir';

export const metadata = { title: 'Hoja de reparto · Pianura' };

type Item = { codigo: string; nombre: string; detalle: string; cantidad: number; kg: number };
type P = {
  id: number; modo: string; cliente: { nombre?: string; telefono?: string; direccion?: string; localidad?: string };
  items: Item[]; total: number; entrega: string; fecha_entrega: string; medio_pago: string; estado_pago: string; estado: string; notas: string | null;
};

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const larga = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return `${DIAS[d.getUTCDay()]} ${iso.slice(8)}/${iso.slice(5, 7)}`; };
const MEDIO: Record<string, string> = { mp: 'Mercado Pago', transferencia: 'Transferencia', cuenta: 'Cuenta corriente' };

export default async function Reparto({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  await exigirPersonal();
  const sb = await supabaseServidor();
  const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const hace14 = new Date(Date.now() - 3 * 3600e3 - 14 * 864e5).toISOString().slice(0, 10);
  // Fechas de entrega con pedidos (últimas 2 semanas y próximas), para elegir.
  const [{ data: conPedidos }, { data: cfg }, { data: dias }] = await Promise.all([
    sb.from('pedidos').select('fecha_entrega,estado').gte('fecha_entrega', hace14).neq('estado', 'Cancelado').order('fecha_entrega'),
    sb.from('config').select('cierre_dia,cierre_hora,entrega_dia').eq('id', 1).single(),
    sb.from('dias_sin_entrega').select('*'),
  ]);
  const fechas = [...new Set((conPedidos ?? []).map((x) => x.fecha_entrega as string).filter(Boolean))];
  // Por defecto: el próximo día con pedidos sin entregar; si no hay, la próxima entrega.
  const abierta = (conPedidos ?? []).find((x) => x.fecha_entrega >= hoy && x.estado !== 'Entregado')?.fecha_entrega as string | undefined;
  const proxima = cfg ? proximaEntrega(cfg as Pick<Config, 'cierre_dia' | 'cierre_hora' | 'entrega_dia'>, (dias ?? []) as DiaSinEntrega[]).iso : hoy;
  const q = (await searchParams).fecha;
  const fecha = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : abierta || proxima;
  if (!fechas.includes(fecha)) fechas.push(fecha);
  fechas.sort();

  const { data } = await sb.from('pedidos').select('id,modo,cliente,items,total,entrega,fecha_entrega,medio_pago,estado_pago,estado,notas').eq('fecha_entrega', fecha).neq('estado', 'Cancelado').order('id');
  const ps = (data ?? []) as P[];

  // Para cargar: total por producto y presentación.
  const carga: Record<string, { nombre: string; kg: number; u: number; det: Record<string, number> }> = {};
  for (const p of ps) for (const l of p.items || []) {
    const c = (carga[l.codigo] ||= { nombre: l.nombre, kg: 0, u: 0, det: {} });
    if (num(l.kg) > 0) c.kg += num(l.kg); else c.u += num(l.cantidad);
    const m = String(l.detalle || '').match(/^(\d+(?:[.,]\d+)?)\s*(?:×\s*)?(.*?)(?: · .*)?$/);
    const n = m ? Number(m[1].replace(',', '.')) : num(l.cantidad);
    const pres = (m?.[2] || 'u').replace(/^hormas$/, 'horma').replace(/^cajas?/, 'caja');
    c.det[pres] = (c.det[pres] || 0) + n;
  }
  const cargaL = Object.values(carga).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Grupos: reparto y envío por localidad; retiro aparte.
  const grupos: Record<string, P[]> = {};
  for (const p of ps) {
    const g = p.entrega === 'retiro' ? 'Retiran en Vila' : (p.cliente?.localidad || 'Sin localidad');
    (grupos[g] ||= []).push(p);
  }
  const orden = Object.keys(grupos).sort((a, b) => (a === 'Retiran en Vila' ? 1 : b === 'Retiran en Vila' ? -1 : a.localeCompare(b)));
  const cobrar = ps.filter((p) => p.estado_pago !== 'pagado' && p.medio_pago !== 'cuenta').reduce((a, p) => a + num(p.total), 0);

  return (
    <div className="reparto">
      <div className="h1 no-print">
        <div><div className="eyebrow">Hoja de reparto</div><h1>Entrega del {larga(fecha)}</h1></div>
        <Imprimir />
      </div>
      <form className="tools no-print" method="get">
        <div className="field"><label htmlFor="fecha">Día de entrega</label>
          <select id="fecha" name="fecha" defaultValue={fecha}>{fechas.map((f) => <option key={f} value={f}>{larga(f)}</option>)}</select>
        </div>
        <button className="btn" type="submit">Ver</button>
      </form>
      <div className="print-only"><h1>Pianura · Reparto del {larga(fecha)}</h1></div>
      <div className="kpis">
        <div className="kpi"><div className="l">Pedidos</div><div className="v">{ps.length}</div></div>
        <div className="kpi"><div className="l">Localidades</div><div className="v">{orden.filter((g) => g !== 'Retiran en Vila').length}</div></div>
        <div className="kpi"><div className="l">A cobrar en la entrega</div><div className="v">{fmt(cobrar)}</div></div>
      </div>
      {!ps.length && <div className="box"><b>No hay pedidos para ese día.</b></div>}
      {ps.length > 0 && (
        <div className="box">
          <h3>Para cargar</h3>
          <table className="hoja">
            <thead><tr><th>Producto</th><th>Detalle</th><th className="num">Total</th><th className="chk">✓</th></tr></thead>
            <tbody>{cargaL.map((c) => (
              <tr key={c.nombre}><td><b>{c.nombre}</b></td><td>{Object.entries(c.det).map(([k, v]) => `${v} × ${k}`).join(' · ')}</td><td className="num">{c.kg > 0 ? `${c.kg.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg` : ''}{c.kg > 0 && c.u > 0 ? ' + ' : ''}{c.u > 0 ? `${c.u} u` : ''}</td><td className="chk">☐</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {orden.map((g) => (
        <div className="box grupo" key={g}>
          <h3>{g} <small>{grupos[g].length} pedido{grupos[g].length > 1 ? 's' : ''}</small></h3>
          {grupos[g].map((p) => (
            <div className="parada" key={p.id}>
              <div className="r1"><b>#{p.id} · {p.cliente?.nombre}</b><span>{p.estado_pago === 'pagado' ? 'Pagado' : p.medio_pago === 'cuenta' ? 'A cuenta corriente' : `Cobrar ${fmt(num(p.total))}`}</span></div>
              <div className="meta">{[p.cliente?.direccion, p.cliente?.telefono, p.modo === 'may' ? 'Mayorista' : null, MEDIO[p.medio_pago]].filter(Boolean).join(' · ')}</div>
              <div>{(p.items || []).map((l) => `${l.nombre} (${l.detalle})`).join(' · ')}</div>
              {p.notas && <div className="meta">Nota: {p.notas}</div>}
              <div className="firma">Entregado ☐ &nbsp; Firma: ____________________</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
