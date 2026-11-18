import { NextResponse, after } from 'next/server';
import { avisarPersonal } from '@/lib/avisos';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { perfilActual, modoDe } from '@/lib/datos';
import { cuponVigente } from '@/lib/cupones';
import { crearPreferencia, mpActivo } from '@/lib/mp';
import { calcular, consumo, conStockCombos, minimoDe, num, proximaEntrega, type Carrito, type Config, type Cupon, type DiaSinEntrega, type Producto, type Zona } from '@/lib/tienda';

const txt = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.carrito !== 'object' || !body.carrito) return err('Pedido inválido.');

  const perfil = await perfilActual();
  const modo = modoDe(perfil);
  const sb = supabaseAdmin();

  // Carrito: solo claves y cantidades; los precios salen de la base.
  const carrito: Carrito = {};
  for (const [k, q] of Object.entries(body.carrito as Record<string, unknown>).slice(0, 80)) {
    const n = Number(q);
    if (typeof k === 'string' && k.length <= 20 && Number.isFinite(n) && n > 0 && n < 10000) carrito[k] = n;
  }
  const codigos = [...new Set(Object.keys(carrito).map((k) => k.split('|')[0]))];
  if (!codigos.length) return err('El carrito está vacío.');

  const [pr, cf, zn, ds] = await Promise.all([
    sb.from('productos').select('*').eq('publicado', true),
    sb.from('config').select('*').eq('id', 1).single(),
    sb.from('zonas_envio').select('localidad,costo').eq('activa', true),
    sb.from('dias_sin_entrega').select('*'),
  ]);
  if (pr.error || cf.error) return err('No pudimos leer la lista de precios. Probá de nuevo.', 500);
  const todos = pr.data as Producto[];
  const productos = Object.fromEntries(conStockCombos(todos).map((p) => [p.codigo, p]));
  const reales = Object.fromEntries(todos.map((p) => [p.codigo, p]));
  const config = cf.data as Config;

  const entrega = ['retiro', 'envio', 'reparto'].includes(body.entrega) ? body.entrega as 'retiro' | 'envio' | 'reparto' : 'retiro';
  if (modo === 'min' && entrega === 'reparto') return err('El reparto es solo para mayoristas.');
  if (modo === 'may' && entrega === 'envio') return err('Para mayoristas la entrega es por reparto o retiro.');
  const zona = entrega === 'envio' ? ((zn.data ?? []) as Zona[]).find((z) => z.localidad === body.localidad) || null : null;
  if (entrega === 'envio' && !zona) return err('Elegí una localidad de envío.');

  let cupon: Cupon | null = null;
  if (body.cupon) {
    const r = await cuponVigente(body.cupon);
    if (!r.cupon) return err(r.error || 'Cupón inválido.');
    cupon = r.cupon;
  }

  const t = calcular(carrito, productos, modo, config, { cupon, entrega, zona });
  if (!t.lineas.length) return err('Ningún producto del carrito está disponible.');
  if (modo === 'may' && t.faltaMinimo > 0) return err(`El pedido mayorista mínimo es de $ ${num(config.minimo_mayorista).toLocaleString('es-AR')}.`);

  // Stock: kg o unidades por producto real (los combos descuentan sus componentes)
  const usado = consumo(t.lineas, reales);
  for (const [c, q] of Object.entries(usado)) {
    const p = reales[c];
    if (!p) return err('Uno de los productos ya no está disponible.');
    if (q > num(p.stock) + 1e-6) return err(`No hay stock suficiente de ${p.nombre}. Quedan ${num(p.stock).toLocaleString('es-AR')}.`);
  }

  const cliente = {
    nombre: txt(body.cliente?.nombre, 120), telefono: txt(body.cliente?.telefono, 40), email: txt(body.cliente?.email, 120),
    direccion: txt(body.cliente?.direccion, 200), localidad: zona?.localidad || txt(body.cliente?.localidad, 80),
  };
  if (!cliente.nombre || !cliente.telefono) return err('Completá tu nombre y tu celular.');
  if (entrega === 'envio' && !cliente.direccion) return err('Completá la dirección de entrega.');

  let medio = ['mp', 'transferencia', 'cuenta'].includes(body.medio) ? body.medio as 'mp' | 'transferencia' | 'cuenta' : 'transferencia';
  if (medio === 'mp' && !mpActivo()) medio = 'transferencia';
  if (medio === 'cuenta') {
    if (modo !== 'may' || !perfil) return err('La cuenta corriente es solo para mayoristas con cuenta.');
    if (t.total > num(perfil.limite_credito) - num(perfil.saldo)) return err('El pedido supera tu crédito disponible.');
  }

  const fecha = proximaEntrega(config, (ds.data ?? []) as DiaSinEntrega[]).iso;
  const { data: ped, error } = await sb.from('pedidos').insert({
    usuario: perfil?.id ?? null, modo, canal: 'Web', cliente,
    items: t.lineas.map((l) => ({ clave: l.clave, codigo: l.codigo, nombre: l.nombre, detalle: l.detalle, cantidad: l.cantidad, precio: l.precio, kg: l.kg, subtotal: l.subtotal })),
    subtotal: t.subtotal, descuento: t.descuentoVolumen + t.descuentoCupon, cupon: cupon?.codigo ?? null, iva: t.iva, envio: t.envio, total: t.total,
    entrega, fecha_entrega: fecha, medio_pago: medio, notas: txt(body.notas, 500) || null,
  }).select('id,codigo').single();
  if (error || !ped) return err('No se pudo guardar el pedido. Probá de nuevo.', 500);

  // Descontar stock, sumar uso del cupón y cargar la cuenta corriente.
  await Promise.all([
    ...Object.entries(usado).map(([c, q]) => sb.rpc('descontar_stock', { p_codigo: c, p_cantidad: q })),
    cupon ? sb.rpc('usar_cupon', { p_codigo: cupon.codigo }) : null,
    medio === 'cuenta' && perfil ? sb.rpc('cargar_cuenta', { p_usuario: perfil.id, p_monto: t.total }) : null,
  ]);

  // Aviso al celular del personal y alerta si algún producto quedó con poco stock.
  after(async () => {
    const quien = cliente.nombre + (modo === 'may' ? ' (mayorista)' : '');
    await avisarPersonal(`Pedido nuevo #${ped.id} · $ ${Math.round(t.total).toLocaleString('es-AR')}`, `${quien} · ${t.lineas.length} producto${t.lineas.length > 1 ? 's' : ''} · ${entrega === 'retiro' ? 'retira' : entrega === 'envio' ? 'envío a ' + cliente.localidad : 'reparto'}`, `/panel/pedidos#p${ped.id}`);
    const bajos = Object.entries(usado).filter(([c, q]) => {
      const p = reales[c];
      const min = minimoDe(p);
      return num(p.stock) > min && num(p.stock) - q <= min;
    }).map(([c, q]) => `${reales[c].nombre}: quedan ${Math.max(0, num(reales[c].stock) - q).toLocaleString('es-AR')} ${reales[c].unidad === 'kg' ? 'kg' : 'u'}`);
    if (bajos.length) await avisarPersonal('Stock bajo', bajos.join(' · '), '/panel/productos');
  });

  if (medio === 'mp') {
    try {
      const pref = await crearPreferencia({ id: ped.id, codigo: ped.codigo, total: t.total, email: cliente.email, titulo: `Pedido Pianura #${ped.id}` });
      await sb.from('pedidos').update({ mp_preferencia: pref.id }).eq('id', ped.id);
      return NextResponse.json({ codigo: ped.codigo, id: ped.id, redirect: pref.url });
    } catch {
      // Si Mercado Pago falla, el pedido queda y se puede pagar por transferencia.
      await sb.from('pedidos').update({ medio_pago: 'transferencia' }).eq('id', ped.id);
    }
  }
  return NextResponse.json({ codigo: ped.codigo, id: ped.id });
}
