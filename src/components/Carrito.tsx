'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Carrito, Cupon, Modo } from '@/lib/tienda';

type Ctx = {
  carrito: Carrito;
  modo: Modo;
  cupon: Cupon | null;
  listo: boolean;
  setCantidad: (clave: string, q: number) => void;
  vaciar: () => void;
  setCupon: (c: Cupon | null) => void;
};
const C = createContext<Ctx | null>(null);

// El carrito se guarda en el navegador, separado para minorista y mayorista.
export function CarritoProvider({ modo, children }: { modo: Modo; children: React.ReactNode }) {
  const key = `pianura-carrito-${modo}`;
  const [carrito, setCarrito] = useState<Carrito>({});
  const [cupon, setCuponSt] = useState<Cupon | null>(null);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) { const v = JSON.parse(raw); setCarrito(v.carrito || {}); setCuponSt(v.cupon || null); }
    } catch { /* sin almacenamiento */ }
    setListo(true);
  }, [key]);
  const guardar = useCallback((c: Carrito, cu: Cupon | null) => {
    try { localStorage.setItem(key, JSON.stringify({ carrito: c, cupon: cu })); } catch { /* nada */ }
  }, [key]);
  const setCantidad = useCallback((clave: string, q: number) => {
    setCarrito((prev) => {
      const n = { ...prev };
      if (q > 0) n[clave] = Math.round(q * 100) / 100; else delete n[clave];
      guardar(n, cupon);
      return n;
    });
  }, [guardar, cupon]);
  const vaciar = useCallback(() => { setCarrito({}); setCuponSt(null); guardar({}, null); }, [guardar]);
  const setCupon = useCallback((c: Cupon | null) => { setCuponSt(c); guardar(carrito, c); }, [guardar, carrito]);
  const v = useMemo(() => ({ carrito, modo, cupon, listo, setCantidad, vaciar, setCupon }), [carrito, modo, cupon, listo, setCantidad, vaciar, setCupon]);
  return <C.Provider value={v}>{children}</C.Provider>;
}

export function useCarrito() {
  const v = useContext(C);
  if (!v) throw new Error('useCarrito fuera de CarritoProvider');
  return v;
}

export function BotonCarrito() {
  const { carrito } = useCarrito();
  const n = Object.keys(carrito).length;
  return <a className="btn btn-p cartbtn" href="/carrito">Carrito<span className="n" aria-label={`${n} productos`}>{n}</span></a>;
}
