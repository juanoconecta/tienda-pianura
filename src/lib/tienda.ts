// Reglas de la tienda que usan el navegador y el servidor por igual.
// El servidor vuelve a calcular todo antes de guardar un pedido: los precios del navegador nunca se aceptan tal cual.

export type Modo = 'min' | 'may';

export type Producto = {
  codigo: string;
  nombre: string;
  familia: string;
  unidad: 'kg' | 'u';
  orden: number;
  color: string;
  imagen: string;
  descripcion: string;
  precio_mayorista: number;
  paso_mayorista: number;
  envase_mayorista: string;
  precio_kg: number | null;
  precio_medio: number | null;
  precio_cuarto: number | null;
  precio_horma: number | null;
  kg_horma: number | null;
  etiqueta_horma: string;
  precio_unidad: number | null;
  stock: number;
  publicado: boolean;
};

export type Config = {
  banco_alias: string;
  banco_cbu: string;
  banco_titular: string;
  banco_cuit: string;
  banco_nombre: string;
  whatsapp: string;
  minimo_mayorista: number;
  descuento_volumen_kg: number;
  descuento_volumen_pct: number;
  envio_gratis_desde: number;
  cierre_dia: number;
  cierre_hora: string;
  entrega_dia: number;
  lista_nombre: string;
};

export type Zona = { localidad: string; costo: number };
export type DiaSinEntrega = { fecha: string; motivo: string; fecha_alternativa: string | null };

export const FAMILIAS = ['Quesos blandos', 'Pasta hilada', 'Quesos semiduros', 'Quesos duros', 'Ricotta y crema', 'Dulce de leche'];

export const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
export const fmt = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR');
const r100 = (n: number) => Math.round(n / 100) * 100;

/** Presentaciones minoristas de un queso: ¼ kg, ½ kg, 1 kg, ½ horma y horma. */
export type Presentacion = { k: string; l: string; kg: number; precio: number; aprox?: boolean };
export function presentaciones(p: Producto): Presentacion[] {
  if (p.unidad !== 'kg' || !p.precio_kg) return [];
  const a: Presentacion[] = [];
  if (p.precio_cuarto) a.push({ k: 'c', l: '¼ kg', kg: 0.25, precio: num(p.precio_cuarto) });
  if (p.precio_medio) a.push({ k: 'm', l: '½ kg', kg: 0.5, precio: num(p.precio_medio) });
  a.push({ k: 'k', l: '1 kg', kg: 1, precio: num(p.precio_kg) });
  const hkg = num(p.kg_horma);
  if (p.precio_horma && hkg) {
    if (p.etiqueta_horma === 'Horma entera') {
      // Media horma: 5 % menos sobre el precio por kg. Horma entera: el precio de la lista (8 % menos).
      a.push({ k: 'h', l: '½ horma', kg: hkg / 2, precio: r100((hkg / 2) * num(p.precio_kg) * 0.95), aprox: true });
      a.push({ k: 'H', l: 'Horma entera', kg: hkg, precio: num(p.precio_horma), aprox: true });
    } else {
      a.push({ k: 'H', l: p.etiqueta_horma, kg: hkg, precio: num(p.precio_horma), aprox: true });
    }
  }
  return a;
}

export const precioMinorista = (p: Producto) => (p.unidad === 'u' ? num(p.precio_unidad) : num(p.precio_kg));
export const visibleEn = (p: Producto, modo: Modo) =>
  p.publicado && (modo === 'may' ? num(p.precio_mayorista) > 0 : precioMinorista(p) > 0);

/** Clave de carrito: mayorista "QCR" (cantidad en kg o unidades); minorista "QCR|m" (cantidad = cuántas) o "C20". */
export type Carrito = Record<string, number>;

export type Linea = { clave: string; codigo: string; nombre: string; detalle: string; cantidad: number; precio: number; kg: number; subtotal: number; aprox: boolean };

export function linea(clave: string, cantidad: number, prod: Producto | undefined, modo: Modo): Linea | null {
  if (!prod || !(cantidad > 0)) return null;
  const [, pres] = clave.split('|');
  if (modo === 'may') {
    if (pres || num(prod.precio_mayorista) <= 0) return null;
    const paso = num(prod.paso_mayorista) || 1;
    const q = Math.round(cantidad / paso) * paso;
    if (q <= 0) return null;
    const unidades = q / paso;
    const detalle = prod.unidad === 'kg'
      ? `${unidades} ${unidades === 1 ? 'horma' : 'hormas'} · ${q.toLocaleString('es-AR')} kg aprox.`
      : paso === 1 ? `${q} u` : `${unidades} × ${prod.envase_mayorista || 'caja'}`;
    const precio = num(prod.precio_mayorista);
    return { clave, codigo: prod.codigo, nombre: prod.nombre, detalle, cantidad: q, precio, kg: prod.unidad === 'kg' ? q : 0, subtotal: precio * q, aprox: prod.unidad === 'kg' };
  }
  const n = Math.floor(cantidad);
  if (n <= 0) return null;
  if (pres) {
    const ps = presentaciones(prod).find((x) => x.k === pres);
    if (!ps) return null;
    return { clave, codigo: prod.codigo, nombre: prod.nombre, detalle: `${n} × ${ps.l}`, cantidad: n, precio: ps.precio, kg: ps.kg * n, subtotal: ps.precio * n, aprox: !!ps.aprox };
  }
  if (prod.unidad !== 'u') return null;
  const precio = num(prod.precio_unidad);
  if (!precio) return null;
  return { clave, codigo: prod.codigo, nombre: prod.nombre, detalle: `${n} u`, cantidad: n, precio, kg: 0, subtotal: precio * n, aprox: false };
}

/** Kg de un queso que ya hay en el carrito, sumando todas sus presentaciones. */
export function kgEnCarrito(carrito: Carrito, p: Producto, modo: Modo) {
  return Object.entries(carrito).reduce((a, [k, q]) => {
    if (k.split('|')[0] !== p.codigo) return a;
    const l = linea(k, q, p, modo);
    return a + (l ? l.kg : 0);
  }, 0);
}

export type Cupon = { codigo: string; porcentaje: number | null; envio_gratis: boolean; solo: Modo | null };

export type Totales = {
  lineas: Linea[];
  subtotal: number;
  descuentoVolumen: number;
  descuentoCupon: number;
  neto: number;
  iva: number;
  envio: number;
  total: number;
  kg: number;
  faltaMinimo: number;
};

export function calcular(carrito: Carrito, productos: Record<string, Producto>, modo: Modo, cfg: Config, opts: { cupon?: Cupon | null; entrega?: 'retiro' | 'envio' | 'reparto'; zona?: Zona | null }): Totales {
  const lineas = Object.entries(carrito)
    .map(([k, q]) => linea(k, q, productos[k.split('|')[0]], modo))
    .filter((l): l is Linea => !!l);
  const subtotal = lineas.reduce((a, l) => a + l.subtotal, 0);
  const kg = lineas.reduce((a, l) => a + l.kg, 0);
  const cupon = opts.cupon && (!opts.cupon.solo || opts.cupon.solo === modo) ? opts.cupon : null;
  if (modo === 'may') {
    const descuentoVolumen = kg >= num(cfg.descuento_volumen_kg) ? subtotal * num(cfg.descuento_volumen_pct) / 100 : 0;
    const descuentoCupon = cupon?.porcentaje ? (subtotal - descuentoVolumen) * num(cupon.porcentaje) / 100 : 0;
    const neto = subtotal - descuentoVolumen - descuentoCupon;
    const iva = neto * 0.21;
    return { lineas, subtotal, descuentoVolumen, descuentoCupon, neto, iva, envio: 0, total: Math.round(neto + iva), kg, faltaMinimo: Math.max(0, num(cfg.minimo_mayorista) - (subtotal - descuentoVolumen)) };
  }
  const descuentoCupon = cupon?.porcentaje ? subtotal * num(cupon.porcentaje) / 100 : 0;
  const envioBase = opts.entrega === 'envio' && opts.zona ? num(opts.zona.costo) : 0;
  const envio = subtotal >= num(cfg.envio_gratis_desde) || cupon?.envio_gratis ? 0 : envioBase;
  const neto = subtotal - descuentoCupon;
  return { lineas, subtotal, descuentoVolumen: 0, descuentoCupon, neto, iva: 0, envio, total: Math.round(neto + envio), kg, faltaMinimo: 0 };
}

// ---------- Fecha de entrega ----------
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const ddmm = (d: Date) => String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0');

/** Próxima entrega en hora de Argentina (UTC-3): hasta el día y hora de cierre entra en la entrega de esa semana. */
export function proximaEntrega(cfg: Pick<Config, 'cierre_dia' | 'cierre_hora' | 'entrega_dia'>, dias: DiaSinEntrega[], ahora = Date.now()) {
  const ar = new Date(ahora - 3 * 3600e3);
  const [hh, mm] = (cfg.cierre_hora || '10:30').split(':').map(Number);
  const minutos = ar.getUTCHours() * 60 + ar.getUTCMinutes();
  let hastaCierre = (cfg.cierre_dia - ar.getUTCDay() + 7) % 7;
  if (hastaCierre === 0 && minutos >= hh * 60 + mm) hastaCierre = 7;
  const delta = (cfg.entrega_dia - cfg.cierre_dia + 7) % 7 || 7;
  let f = new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate() + hastaCierre + delta, 12));
  let salto: DiaSinEntrega | null = null;
  for (let i = 0; i < 8; i++) {
    const iso = f.toISOString().slice(0, 10);
    const d = dias.find((x) => x.fecha === iso);
    if (!d) break;
    salto = salto || d;
    if (d.fecha_alternativa) { f = new Date(d.fecha_alternativa + 'T12:00:00Z'); break; }
    f = new Date(f.getTime() + 7 * 864e5);
  }
  return { iso: f.toISOString().slice(0, 10), dia: DIAS[f.getUTCDay()], fecha: ddmm(f), salto, cierre: `${DIAS[cfg.cierre_dia]} ${cfg.cierre_hora} h` };
}

export const ESTADOS = ['Nuevo', 'Confirmado', 'Armando', 'En camino', 'Entregado'] as const;
