'use client';
import { useCarrito } from './Carrito';
import type { Modo } from '@/lib/tienda';

type Item = { clave?: string; codigo: string; cantidad: number };

/** Vuelve a cargar en el carrito lo mismo de un pedido anterior (con los precios de hoy). */
export function Repetir({ items, modo, chico }: { items: Item[]; modo: Modo; chico?: boolean }) {
  const { modo: actual, setCantidad } = useCarrito();
  if (!items?.length) return null;
  if (modo !== actual) return chico ? null : <p className="meta">Para repetir este pedido entrá con tu cuenta {modo === 'may' ? 'mayorista' : 'de cliente'}.</p>;
  const repetir = () => {
    for (const it of items) setCantidad(it.clave || it.codigo, Number(it.cantidad) || 0);
    location.href = '/carrito';
  };
  return <button type="button" className={chico ? 'linkb' : 'btn btn-p'} onClick={repetir} style={chico ? undefined : { marginTop: 14 }}>Repetir pedido</button>;
}
