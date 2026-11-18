'use client';
import { useState } from 'react';
import { useCarrito } from './Carrito';
import { fmt, kgEnCarrito, num, presentaciones, type Producto } from '@/lib/tienda';

export function Comprar({ p, grande }: { p: Producto; grande?: boolean }) {
  const { carrito, modo, setCantidad } = useCarrito();
  const pres = modo === 'min' ? presentaciones(p) : [];
  const [sel, setSel] = useState(pres.find((x) => x.k === 'm') ? 'm' : pres[0]?.k);
  const selP = pres.find((x) => x.k === sel);
  const clave = modo === 'may' || !pres.length ? p.codigo : `${p.codigo}|${sel}`;
  const q = carrito[clave] || 0;
  const paso = modo === 'may' ? num(p.paso_mayorista) || 1 : 1;
  const sinStock = num(p.stock) <= 0;
  // Control de stock: en kg para quesos (sumando todas las presentaciones), en unidades para el resto
  const usado = p.unidad === 'kg' ? kgEnCarrito(carrito, p, modo) : q;
  const sumaUno = p.unidad === 'kg' ? (modo === 'may' ? paso : selP?.kg ?? 1) : paso;
  const puede = usado + sumaUno <= num(p.stock) + 1e-9;
  const etiqueta = () => {
    if (modo === 'may') {
      const u = q / paso;
      return p.unidad === 'kg' ? `${u} ${u === 1 ? 'horma' : 'hormas'}` : paso === 1 ? `${q} u` : `${u} ${(p.envase_mayorista || 'caja').replace(/ x.*/, '')}${u > 1 ? 's' : ''}`;
    }
    return selP ? `${q} × ${selP.l}` : `${q} u`;
  };
  return (
    <>
      {pres.length > 0 && (
        <div className="pres" role="group" aria-label={`Presentación de ${p.nombre}`}>
          {pres.map((x) => (
            <button key={x.k} type="button" className="pchip" aria-pressed={x.k === sel} onClick={() => setSel(x.k)}>
              <b>{x.l}</b><span>{fmt(x.precio)}</span>
            </button>
          ))}
        </div>
      )}
      {selP?.aprox && <div className="meta">≈ {String(selP.kg).replace('.', ',')} kg · {selP.k === 'H' && selP.l === 'Horma entera' ? '8 % menos' : selP.k === 'h' ? '5 % menos' : 'precio aprox.'} · se cobra por peso real</div>}
      <div className="add">
        {q > 0 ? (
          <div className="qty">
            <button type="button" aria-label="Quitar" onClick={() => setCantidad(clave, q - paso)}>−</button>
            <span>{etiqueta()}</span>
            <button type="button" aria-label="Agregar" disabled={!puede} onClick={() => setCantidad(clave, q + paso)}>+</button>
          </div>
        ) : (
          <button className={`btn btn-p ${grande ? 'btn-lg' : ''}`} type="button" disabled={sinStock || !puede} onClick={() => setCantidad(clave, paso)}>
            {sinStock ? 'Sin stock' : `Agregar${selP ? ' ' + selP.l : ' al carrito'}`}
          </button>
        )}
      </div>
    </>
  );
}
