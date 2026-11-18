'use client';
import { useCarrito } from './Carrito';
import { calcular, fmt, type Config, type Producto } from '@/lib/tienda';

/** Barra fija abajo en el celular con el total del carrito. */
export function BarraCarrito({ productos, config }: { productos: Producto[]; config: Config }) {
  const { carrito, modo, cupon } = useCarrito();
  const idx = Object.fromEntries(productos.map((p) => [p.codigo, p]));
  const t = calcular(carrito, idx, modo, config, { cupon });
  const n = t.lineas.length;
  return (
    <div className="mbar wrap" style={n ? undefined : { display: 'none' }}>
      <div className="in">
        <div><b>{fmt(t.total)}</b><div className="meta">{n} producto{n > 1 ? 's' : ''} en el carrito</div></div>
        <a className="btn btn-p" href="/carrito">Ver carrito</a>
      </div>
    </div>
  );
}
