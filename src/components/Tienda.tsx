'use client';
import { useState } from 'react';
import { Comprar } from './Comprar';
import { BarraCarrito } from './BarraCarrito';
import { CONTROLAR_STOCK, FAMILIAS, detalleCombo, esCombo, fmt, num, precioMinorista, precioSuelto, tinta, visibleEn, type Config, type Modo, type Producto } from '@/lib/tienda';

export type Entrega = { dia: string; fecha: string; cierre: string; salto: { fecha: string; motivo: string } | null };

export function Tienda({ productos, config, modo, entrega, nombre }: { productos: Producto[]; config: Config; modo: Modo; entrega: Entrega; nombre: string | null }) {
  const [fam, setFam] = useState('Todos');
  const may = modo === 'may';
  const lista = productos.filter((p) => visibleEn(p, modo));
  const fams = FAMILIAS.filter((f) => lista.some((p) => p.familia === f));
  const ver = fam === 'Todos' ? fams : [fam];
  const idx = Object.fromEntries(productos.map((p) => [p.codigo, p]));
  return (
    <main className="store wrap">
      <section className="hero">
        <div className="hero-main" style={{ backgroundImage: 'url(/img/hero.jpg)' }}>
          <span className="kick">{may ? 'Venta mayorista' : 'Lo simple, bien hecho'}</span>
          <h1>{may ? 'Pedido mayorista, con tu lista y a cuenta' : 'Hay cosas buenas que merecen compartirse'}</h1>
          <p>{may ? `Hola${nombre ? ', ' + nombre : ''}. Ves la lista mayorista con precios netos + IVA. Armá el pedido por hormas y cajas cerradas.` : 'Quesos, cremas y dulce de leche de Pianura. Elegí, sumá al carrito y pagá como prefieras.'}</p>
        </div>
        <aside className="hero-side">
          <h3>{may ? 'Tu cuenta mayorista' : 'Cómo comprar'}</h3>
          {may ? (
            <>
              <div className="rule"><b>Pedido mínimo</b><span>{fmt(num(config.minimo_mayorista))} neto</span></div>
              <div className="rule"><b>Escala</b><span>{num(config.descuento_volumen_pct)} % menos desde {num(config.descuento_volumen_kg)} kg de queso</span></div>
              <div className="rule"><b>Reparto</b><span>Martes y viernes</span></div>
            </>
          ) : (
            <>
              <div className="rule"><b>1.</b><span>Elegí productos y cantidades</span></div>
              <div className="rule"><b>2.</b><span>Revisá el carrito</span></div>
              <div className="rule"><b>3.</b><span>Pagá por transferencia o Mercado Pago</span></div>
              <div className="rule"><b>Entrega</b><span>Pedidos hasta el {entrega.cierre}. Próxima entrega: {entrega.dia} {entrega.fecha}</span></div>
              <div className="rule"><b>Envío gratis</b><span>desde {fmt(num(config.envio_gratis_desde))}</span></div>
              <a className="btn" href="/mayoristas" style={{ marginTop: 'auto' }}>¿Tenés un comercio? Comprá por mayor</a>
            </>
          )}
        </aside>
      </section>
      {!may && (
        <div className="listbar">
          <b>{config.lista_nombre}</b><span>Precios finales con IVA</span><span>Horma entera 8 % menos · ½ horma 5 % menos · peso real</span>
          <span>Pedidos hasta el {entrega.cierre} · entrega el {entrega.dia} {entrega.fecha}</span>
          {entrega.salto && <span>El {entrega.salto.fecha.slice(8)}/{entrega.salto.fecha.slice(5, 7)} no hay reparto ({entrega.salto.motivo})</span>}
        </div>
      )}
      <div className="chips" role="group" aria-label="Categorías">
        {['Todos', ...fams].map((f) => <button key={f} className="chip" type="button" aria-pressed={fam === f} onClick={() => setFam(f)}>{f}</button>)}
      </div>
      {lista.length === 0 && <div className="empty-state"><b>Todavía no hay productos publicados</b>Se cargan desde el panel.</div>}
      {ver.map((f) => (
        <section key={f}>
          <div className="cat-title">{f}</div>
          <div className="grid">{lista.filter((p) => p.familia === f).map((p) => <Tarjeta key={p.codigo} p={p} modo={modo} idx={idx} />)}</div>
        </section>
      ))}
      <BarraCarrito productos={productos} config={config} />
    </main>
  );
}

function Tarjeta({ p, modo, idx }: { p: Producto; modo: Modo; idx: Record<string, Producto> }) {
  const may = modo === 'may';
  const precio = may ? num(p.precio_mayorista) : precioMinorista(p);
  const sinStock = CONTROLAR_STOCK && num(p.stock) <= 0;
  const combo = esCombo(p);
  const suelto = combo ? precioSuelto(p, idx) : 0;
  const meta = combo ? detalleCombo(p, idx) : may ? (p.unidad === 'kg' ? `Horma ≈ ${String(num(p.paso_mayorista)).replace('.', ',')} kg · se vende por horma` : `Se vende por ${p.envase_mayorista || 'unidad'}`) : (p.unidad === 'kg' ? 'Elegí la presentación' : 'Precio final con IVA');
  return (
    <article className="card">
      <a className="swatch" href={`/producto/${p.codigo}`} aria-label={`Ver ${p.nombre}`} style={{ backgroundImage: `url(${p.imagen})` }}>
        <span className="code" style={{ background: p.color, color: tinta(p.color) }}>{p.codigo}</span><span className="fam">{combo ? 'Combo' : p.familia}</span>
      </a>
      <div className="card-b">
        <h4><a className="plink" href={`/producto/${p.codigo}`}>{p.nombre}</a></h4>
        <div className="price">{fmt(precio)}<small>{p.unidad === 'kg' ? '/kg' : '/u'}{may ? ' + IVA' : ''}</small></div>
        {combo && suelto > precio && <div className="ahorro">Ahorrás {fmt(suelto - precio)} <s>{fmt(suelto)}</s></div>}
        <div className="meta">{meta}</div>
        {sinStock ? <div className="stock-out">Agotado</div> : CONTROLAR_STOCK && num(p.stock) <= (p.unidad === 'kg' ? 10 : 12) ? <div className="stock-low">Quedan pocos</div> : null}
        <Comprar p={p} />
      </div>
    </article>
  );
}


