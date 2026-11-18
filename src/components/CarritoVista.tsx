'use client';
import { useMemo, useState } from 'react';
import { useCarrito } from './Carrito';
import { calcular, fmt, num, type Config, type Modo, type Producto, type Zona } from '@/lib/tienda';
import type { Entrega } from './Tienda';

type PerfilMin = { nombre: string; telefono: string; email: string; direccion: string; localidad: string; credito: number } | null;

export function CarritoVista({ productos, config, zonas, modo, entrega, mpActivo, perfil }: { productos: Producto[]; config: Config; zonas: Zona[]; modo: Modo; entrega: Entrega & { iso: string }; mpActivo: boolean; perfil: PerfilMin }) {
  const { carrito, cupon, listo, setCantidad, setCupon, vaciar } = useCarrito();
  const may = modo === 'may';
  const idx = useMemo(() => Object.fromEntries(productos.map((p) => [p.codigo, p])), [productos]);
  const [ent, setEnt] = useState<'retiro' | 'envio' | 'reparto'>(may ? 'reparto' : 'retiro');
  const [loc, setLoc] = useState(perfil?.localidad && zonas.some((z) => z.localidad === perfil.localidad) ? perfil.localidad : zonas[0]?.localidad || '');
  const zona = zonas.find((z) => z.localidad === loc) || null;
  const [pago, setPago] = useState<'transferencia' | 'mp' | 'cuenta'>(mpActivo ? 'mp' : 'transferencia');
  const [cli, setCli] = useState({ nombre: perfil?.nombre || '', telefono: perfil?.telefono || '', email: perfil?.email || '', direccion: perfil?.direccion || '' });
  const [notas, setNotas] = useState('');
  const [cupIn, setCupIn] = useState('');
  const [cupMsg, setCupMsg] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const t = calcular(carrito, idx, modo, config, { cupon, entrega: ent, zona });
  const credito = perfil?.credito ?? 0;

  async function aplicarCupon(e: React.FormEvent) {
    e.preventDefault();
    setCupMsg('');
    const r = await fetch('/api/cupon', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ codigo: cupIn }) });
    const j = await r.json();
    if (!r.ok) return setCupMsg(j.error || 'No se pudo validar el cupón.');
    if (j.cupon.solo && j.cupon.solo !== modo) return setCupMsg(`Ese cupón es solo para compras ${j.cupon.solo === 'min' ? 'minoristas' : 'mayoristas'}.`);
    setCupon(j.cupon);
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!cli.nombre.trim() || !cli.telefono.trim()) return setError('Completá tu nombre y tu celular.');
    if (ent === 'envio' && !cli.direccion.trim()) return setError('Completá la dirección de entrega.');
    setEnviando(true);
    try {
      const r = await fetch('/api/pedidos', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ carrito, cupon: cupon?.codigo || null, entrega: ent, localidad: ent === 'envio' ? loc : null, cliente: { ...cli, localidad: ent === 'envio' ? loc : perfil?.localidad || '' }, medio: pago, notas }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || 'No se pudo confirmar el pedido.'); setEnviando(false); return; }
      vaciar();
      window.location.href = j.redirect || `/pedido/${j.codigo}`;
    } catch {
      setError('Se cortó la conexión. Probá de nuevo.');
      setEnviando(false);
    }
  }

  if (!listo) return <main className="cart-page wrap"><div className="box">Cargando el carrito…</div></main>;
  if (!t.lineas.length) return <main className="cart-page wrap" style={{ gridTemplateColumns: '1fr' }}><div className="box empty-state"><b>Tu carrito está vacío</b>Elegí productos en la tienda.<div style={{ marginTop: 14 }}><a className="btn btn-p" href="/">Ir a la tienda</a></div></div></main>;

  return (
    <main className="cart-page wrap">
      <section className="box">
        <h2 style={{ marginTop: 0 }}>Tu carrito</h2>
        {t.lineas.map((l) => {
          const p = idx[l.codigo];
          const paso = may ? num(p.paso_mayorista) || 1 : 1;
          return (
            <div className="line" key={l.clave}>
              <div className="dot" style={{ background: p.color }}>{p.codigo}</div>
              <div style={{ minWidth: 0 }}><h5>{l.nombre}</h5><div className="meta">{l.detalle} · {fmt(l.precio)}{may ? (p.unidad === 'kg' ? '/kg' : '/u') : ' c/u'}{l.aprox ? ' · peso real' : ''}</div></div>
              <div className="r"><b>{fmt(l.subtotal)}</b>
                <div className="qty"><button type="button" aria-label="Quitar" onClick={() => setCantidad(l.clave, (carrito[l.clave] || 0) - paso)}>−</button><span>{l.cantidad}{may && p.unidad === 'kg' ? ' kg' : ''}</span><button type="button" aria-label="Agregar" onClick={() => setCantidad(l.clave, (carrito[l.clave] || 0) + paso)}>+</button></div>
              </div>
            </div>
          );
        })}
        <a className="back" href="/" style={{ display: 'inline-block', marginTop: 12 }}>← Seguir comprando</a>

        <form onSubmit={confirmar} id="checkout">
          <h3>Entrega</h3>
          <div className="opts">
            {may ? (
              <label className="opt"><input type="radio" name="ent" checked={ent === 'reparto'} onChange={() => setEnt('reparto')} /><div><b>Reparto en tu ruta</b><span>Sin cargo</span></div></label>
            ) : (
              <label className="opt"><input type="radio" name="ent" checked={ent === 'envio'} onChange={() => setEnt('envio')} /><div><b>Envío a domicilio</b><span>El {entrega.dia} {entrega.fecha} · {t.subtotal >= num(config.envio_gratis_desde) ? 'sin cargo' : 'según la localidad'}</span></div></label>
            )}
            <label className="opt"><input type="radio" name="ent" checked={ent === 'retiro'} onChange={() => setEnt('retiro')} /><div><b>Retiro en planta</b><span>Vila, Santa Fe · el {entrega.dia} {entrega.fecha}</span></div></label>
          </div>
          {ent === 'envio' && (
            <div className="form-grid">
              <div className="field"><label htmlFor="loc">Localidad</label><select id="loc" value={loc} onChange={(e) => setLoc(e.target.value)}>{zonas.map((z) => <option key={z.localidad} value={z.localidad}>{z.localidad} · {num(z.costo) && t.subtotal < num(config.envio_gratis_desde) ? fmt(num(z.costo)) : 'sin cargo'}</option>)}</select></div>
              <div className="field"><label htmlFor="dir">Dirección</label><input id="dir" value={cli.direccion} onChange={(e) => setCli({ ...cli, direccion: e.target.value })} autoComplete="street-address" /></div>
            </div>
          )}
          <h3>Tus datos</h3>
          <div className="form-grid">
            <div className="field"><label htmlFor="nom">{may ? 'Comercio' : 'Nombre y apellido'}</label><input id="nom" value={cli.nombre} onChange={(e) => setCli({ ...cli, nombre: e.target.value })} autoComplete="name" required /></div>
            <div className="field"><label htmlFor="tel">Celular</label><input id="tel" value={cli.telefono} onChange={(e) => setCli({ ...cli, telefono: e.target.value })} inputMode="tel" autoComplete="tel" required /></div>
            <div className="field"><label htmlFor="mail">Mail (para avisarte)</label><input id="mail" type="email" value={cli.email} onChange={(e) => setCli({ ...cli, email: e.target.value })} autoComplete="email" /></div>
            <div className="field"><label htmlFor="notas">Notas (opcional)</label><input id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej.: timbre 2B" /></div>
          </div>
          <h3>Pago</h3>
          <div className="opts">
            {mpActivo && <label className="opt"><input type="radio" name="pago" checked={pago === 'mp'} onChange={() => setPago('mp')} /><div><b>Mercado Pago</b><span>Tarjeta, débito o dinero en cuenta.</span></div></label>}
            <label className="opt"><input type="radio" name="pago" checked={pago === 'transferencia'} onChange={() => setPago('transferencia')} /><div><b>Transferencia bancaria</b><span>Al confirmar te mostramos el alias y el CBU.</span></div></label>
            {may && <label className="opt"><input type="radio" name="pago" checked={pago === 'cuenta'} disabled={t.total > credito} onChange={() => setPago('cuenta')} /><div><b>Cargar a mi cuenta corriente</b><span>{t.total > credito ? `Supera tu crédito disponible (${fmt(credito)})` : `Disponible ${fmt(credito)}`}</span></div></label>}
          </div>
        </form>
      </section>

      <aside className="box">
        <h2 style={{ marginTop: 0 }}>Resumen</h2>
        <form className="cupon" onSubmit={aplicarCupon} autoComplete="off">
          {cupon ? (
            <div className="cup-ok"><span><b>{cupon.codigo}</b> aplicado</span><button type="button" className="linkb" onClick={() => setCupon(null)}>Quitar</button></div>
          ) : (
            <><label htmlFor="cuponIn">¿Tenés un cupón de descuento?</label><div className="cup-row"><input id="cuponIn" value={cupIn} onChange={(e) => setCupIn(e.target.value.toUpperCase())} placeholder="Ej.: BIENVENIDA10" /><button className="btn" type="submit">Aplicar</button></div>{cupMsg && <div className="cup-err">{cupMsg}</div>}</>
          )}
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          <div className="row"><span>Subtotal{may ? ' neto' : ''}</span><span>{fmt(t.subtotal)}</span></div>
          {t.descuentoVolumen > 0 && <div className="row"><span>Descuento por volumen</span><span>− {fmt(t.descuentoVolumen)}</span></div>}
          {t.descuentoCupon > 0 && <div className="row"><span>Cupón {cupon?.codigo}</span><span>− {fmt(t.descuentoCupon)}</span></div>}
          {may ? <div className="row"><span>IVA 21 %</span><span>{fmt(t.iva)}</span></div> : <div className="row"><span>Envío</span><span>{ent === 'envio' ? (t.envio ? fmt(t.envio) : 'Sin cargo') : 'Retiro en planta'}</span></div>}
          <div className="row t"><span>Total</span><span>{fmt(t.total)}</span></div>
        </div>
        {may && t.faltaMinimo > 0 && <div className="note" style={{ marginTop: 10 }}>Te faltan <b>{fmt(t.faltaMinimo)}</b> para el pedido mínimo de {fmt(num(config.minimo_mayorista))}.</div>}
        {!may && t.subtotal < num(config.envio_gratis_desde) && <div className="note" style={{ marginTop: 10 }}>Sumá {fmt(num(config.envio_gratis_desde) - t.subtotal)} más y el envío es gratis.</div>}
        <div className="note" style={{ marginTop: 8 }}>Pedidos hasta el {entrega.cierre}. Entrega el {entrega.dia} {entrega.fecha}.{t.lineas.some((l) => l.aprox) ? ' Las hormas se cobran por peso real: el total puede variar un poco.' : ''}</div>
        {error && <div className="err" role="alert" style={{ marginTop: 10 }}>{error}</div>}
        <button className="btn btn-p btn-lg" type="submit" form="checkout" style={{ marginTop: 12 }} disabled={enviando || t.faltaMinimo > 0}>{enviando ? 'Confirmando…' : pago === 'mp' ? 'Pagar con Mercado Pago' : 'Confirmar pedido'}</button>
      </aside>
    </main>
  );
}
