import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fmt, ESTADOS } from '@/lib/tienda';
import { SubirComprobante } from '@/components/SubirComprobante';
import { Copiar } from '@/components/Copiar';
import { Repetir } from '@/components/Repetir';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tu pedido · Pianura', robots: { index: false } };

type Item = { nombre: string; detalle: string; subtotal: number; clave?: string; codigo: string; cantidad: number };

export default async function Pedido({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(codigo)) notFound();
  const sb = supabaseAdmin();
  const [{ data: p }, { data: cfg }] = await Promise.all([
    sb.from('pedidos').select('id,modo,cliente,items,subtotal,descuento,cupon,iva,envio,total,entrega,fecha_entrega,medio_pago,estado_pago,estado,comprobante,creado').eq('codigo', codigo).maybeSingle(),
    sb.from('config').select('banco_alias,banco_cbu,banco_titular,banco_cuit,banco_nombre,whatsapp').eq('id', 1).single(),
  ]);
  if (!p) notFound();
  const items = (p.items ?? []) as Item[];
  const f = p.fecha_entrega ? new Date(p.fecha_entrega + 'T12:00:00Z') : null;
  const fecha = f ? f.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '';
  const paso = p.estado === 'Cancelado' ? -1 : ESTADOS.indexOf(p.estado);
  const pagado = p.estado_pago === 'pagado';
  const wa = cfg?.whatsapp ? `https://wa.me/${String(cfg.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, les escribo por el pedido #${p.id}.`)}` : '';

  return (
    <main className="cart-page wrap">
      <section className="box">
        <div className="ok-box" style={{ textAlign: 'left' }}>
          <div className="eyebrow">Pedido #{p.id}</div>
          <h2 style={{ margin: '4px 0 6px' }}>{p.estado === 'Cancelado' ? 'Este pedido se canceló' : '¡Gracias! Recibimos tu pedido'}</h2>
          <p className="meta" style={{ margin: 0 }}>{p.entrega === 'retiro' ? 'Retiro en planta (Vila)' : p.entrega === 'reparto' ? 'Reparto en tu ruta' : `Envío a ${p.cliente?.direccion || ''}, ${p.cliente?.localidad || ''}`}{fecha ? ` · ${fecha}` : ''}</p>
        </div>
        {paso >= 0 && (
          <div className="steps" aria-label={`Estado del pedido: ${p.estado}`}>
            {ESTADOS.map((e, i) => <div key={e} className={i <= paso ? 'on' : ''}>{e}</div>)}
          </div>
        )}
        <h3>Detalle</h3>
        {items.map((l, i) => (
          <div className="row" key={i}><span>{l.nombre} <span className="meta">· {l.detalle}</span></span><span>{fmt(l.subtotal)}</span></div>
        ))}
        <div className="sep" />
        <div className="row"><span>Subtotal{p.modo === 'may' ? ' neto' : ''}</span><span>{fmt(p.subtotal)}</span></div>
        {Number(p.descuento) > 0 && <div className="row"><span>Descuentos{p.cupon ? ` (${p.cupon})` : ''}</span><span>− {fmt(p.descuento)}</span></div>}
        {Number(p.iva) > 0 && <div className="row"><span>IVA 21 %</span><span>{fmt(p.iva)}</span></div>}
        {p.modo === 'min' && p.entrega === 'envio' && <div className="row"><span>Envío</span><span>{Number(p.envio) ? fmt(p.envio) : 'Sin cargo'}</span></div>}
        <div className="row t"><span>Total</span><span>{fmt(p.total)}</span></div>
        <Repetir items={items} modo={p.modo} />
        {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noopener" style={{ marginTop: 14 }}>Escribirnos por WhatsApp</a>}
      </section>

      <aside className="box">
        <h2 style={{ marginTop: 0 }}>Pago</h2>
        {pagado ? (
          <div className="note"><b>Pago acreditado.</b> Ya está todo listo de tu lado.</div>
        ) : p.medio_pago === 'cuenta' ? (
          <div className="note">Lo cargamos a tu cuenta corriente.</div>
        ) : p.medio_pago === 'mp' ? (
          <div className="note">Si ya pagaste con Mercado Pago, la acreditación puede tardar unos minutos. Esta página se actualiza sola al volver a entrar.</div>
        ) : (
          <>
            <p className="meta" style={{ marginTop: 0 }}>Transferí <b>{fmt(p.total)}</b> a esta cuenta y subí el comprobante.</p>
            <div className="bank">
              {cfg?.banco_alias && <div className="bank-row"><span>Alias</span><b className="mono">{cfg.banco_alias}</b><Copiar texto={cfg.banco_alias} /></div>}
              {cfg?.banco_cbu && <div className="bank-row"><span>CBU</span><b className="mono">{cfg.banco_cbu}</b><Copiar texto={cfg.banco_cbu} /></div>}
              {cfg?.banco_titular && <div className="bank-row"><span>Titular</span><b>{cfg.banco_titular}</b></div>}
              {cfg?.banco_cuit && <div className="bank-row"><span>CUIT</span><b>{cfg.banco_cuit}</b></div>}
              {cfg?.banco_nombre && <div className="bank-row"><span>Banco</span><b>{cfg.banco_nombre}</b></div>}
              {!cfg?.banco_alias && !cfg?.banco_cbu && <div className="meta">Los datos bancarios todavía no están cargados. Te los pasamos por WhatsApp.</div>}
            </div>
            {p.comprobante ? <div className="note" style={{ marginTop: 12 }}><b>Comprobante recibido.</b> Lo revisamos y confirmamos el pago.</div> : <SubirComprobante codigo={codigo} />}
          </>
        )}
        <p className="meta" style={{ marginTop: 14 }}>Guardá este link para ver cómo va tu pedido.</p>
      </aside>
    </main>
  );
}
