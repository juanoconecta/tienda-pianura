import { supabaseServidor } from '@/lib/supabase/server';
import { CONTROLAR_STOCK, esCombo, fmt, minimoDe, num, type Producto } from '@/lib/tienda';
import { Arrepentimientos, type Arrep } from '@/components/panel/Arrepentimientos';
import { ActivarAvisos } from '@/components/panel/ActivarAvisos';
import { EnVivo, type PedidoFeed } from '@/components/panel/EnVivo';

type P = PedidoFeed & { estado: string; estado_pago: string; items: { nombre: string; subtotal: number }[] };

export default async function Tablero() {
  const sb = await supabaseServidor();
  const desde = new Date(Date.now() - 14 * 864e5).toISOString();
  const [{ data: ped }, { count: sol }, { data: prods }, { data: arr }] = await Promise.all([
    sb.from('pedidos').select('id,modo,total,creado,cliente,estado,estado_pago,items').gte('creado', desde).order('creado', { ascending: false }),
    sb.from('solicitudes_mayoristas').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
    sb.from('productos').select('codigo,nombre,stock,unidad,stock_minimo,componentes,publicado').order('stock'),
    sb.from('arrepentimientos').select('id,tramite,pedido,nombre,contacto,motivo,creado').eq('estado', 'Pendiente').order('creado'),
  ]);
  const ps = ((ped ?? []) as P[]).filter((p) => p.estado !== 'Cancelado');
  const ar = (d: string | number) => new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 10);
  const hoy = ar(Date.now());
  const semana = ps.filter((p) => Date.now() - new Date(p.creado).getTime() < 7 * 864e5);
  const venta = semana.reduce((a, p) => a + num(p.total), 0);
  const pendPago = ps.filter((p) => p.estado_pago !== 'pagado').length;
  const abiertos = ps.filter((p) => p.estado !== 'Entregado').length;
  const bajos = ((prods ?? []) as Producto[]).filter((p) => CONTROLAR_STOCK && p.publicado && !esCombo(p) && num(p.stock) <= minimoDe(p));

  // Ventas por día (14 días)
  const dias = Array.from({ length: 14 }, (_, i) => ar(Date.now() - (13 - i) * 864e5));
  const porDia = dias.map((d) => ps.filter((p) => ar(p.creado) === d).reduce((a, p) => a + num(p.total), 0));
  const max = Math.max(1, ...porDia);
  // Más vendidos
  const top: Record<string, number> = {};
  semana.forEach((p) => (p.items || []).forEach((l) => { top[l.nombre] = (top[l.nombre] || 0) + num(l.subtotal); }));
  const topL = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = Math.max(1, ...topL.map((x) => x[1]));

  return (
    <>
      <div className="h1"><div><div className="eyebrow">Tablero</div><h1>Cómo viene la semana</h1></div><span className="live"><i />En vivo</span></div>
      <div className="kpis">
        <div className="kpi hl"><div className="l">Ventas 7 días</div><div className="v">{fmt(venta)}</div><div className="s">{semana.length} pedidos</div></div>
        <div className="kpi"><div className="l">Pedidos hoy</div><div className="v">{ps.filter((p) => ar(p.creado) === hoy).length}</div><div className="s">{abiertos} sin entregar</div></div>
        <div className="kpi"><div className="l">Pago pendiente</div><div className="v">{pendPago}</div><div className={'s' + (pendPago ? ' bad' : '')}>{pendPago ? 'Revisar comprobantes' : 'Todo al día'}</div></div>
        <div className="kpi"><div className="l">Solicitudes mayoristas</div><div className="v">{sol ?? 0}</div><div className="s"><a className="plink" href="/panel/clientes">Ver</a></div></div>
        <div className="kpi"><div className="l">Stock bajo</div><div className="v">{bajos.length}</div><div className={'s' + (bajos.length ? ' bad' : '')}>{bajos.slice(0, 2).map((b) => b.nombre).join(', ') || 'Sin alertas'}</div></div>
      </div>
      <div className="cols">
        <div className="box">
          <h3>Ventas por día <small>últimos 14 días</small></h3>
          <div className="chart"><svg viewBox="0 0 700 200" role="img" aria-label="Ventas por día">
            {porDia.map((v, i) => { const h = (v / max) * 160; return <g key={i}><rect x={i * 50 + 8} y={170 - h} width={34} height={Math.max(h, 1)} rx={4} fill="var(--accent)" opacity={dias[i] === hoy ? 1 : 0.55}><title>{dias[i]}: {fmt(v)}</title></rect><text x={i * 50 + 25} y={190} textAnchor="middle">{dias[i].slice(8)}/{dias[i].slice(5, 7)}</text></g>; })}
          </svg></div>
        </div>
        <div className="box"><h3>Últimos pedidos</h3><EnVivo inicial={ps.slice(0, 20)} /></div>
      </div>
      <Arrepentimientos inicial={(arr ?? []) as Arrep[]} />
      {bajos.length > 0 && (
        <div className="box alerta">
          <h3>Stock bajo <small>reponer pronto</small></h3>
          <div className="bajos">{bajos.map((b) => <div key={b.codigo}><b>{b.nombre}</b><span className={num(b.stock) <= 0 ? 'stock-out' : 'stock-low'}>{num(b.stock) <= 0 ? 'Agotado' : `Quedan ${num(b.stock).toLocaleString('es-AR')} ${b.unidad === 'kg' ? 'kg' : 'u'}`}</span></div>)}</div>
          <a className="plink" href="/panel/productos">Cargar stock</a>
        </div>
      )}
      <ActivarAvisos />
      <div className="box">
        <h3>Más vendidos <small>7 días, en pesos</small></h3>
        {!topL.length ? <div className="meta">Sin ventas esta semana todavía.</div> : <div className="bars">{topL.map(([n, v]) => <div className="bar" key={n}><div className="t"><b>{n}</b><span>{fmt(v)}</span></div><div className="k"><i style={{ width: `${(v / topMax) * 100}%` }} /></div></div>)}</div>}
      </div>
    </>
  );
}
