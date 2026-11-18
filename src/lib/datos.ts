import 'server-only';
import { supabaseServidor } from './supabase/server';
import { CONFIG_PUBLICA, conStockCombos, type Config, type DiaSinEntrega, type Modo, type Producto, type Zona } from './tienda';

export type Perfil = {
  id: string; email: string | null; nombre: string | null; telefono: string | null; direccion: string | null; localidad: string | null;
  cuit: string | null; razon_social: string | null; rol: string; limite_credito: number; saldo: number; puntos: number;
};

export const STAFF = ['dueno', 'admin', 'ventas', 'expedicion'];
export const ADMIN = ['dueno', 'admin'];

export async function perfilActual(): Promise<Perfil | null> {
  const sb = await supabaseServidor();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return (data as Perfil) ?? { id: user.id, email: user.email ?? null, nombre: null, telefono: null, direccion: null, localidad: null, cuit: null, razon_social: null, rol: 'cliente', limite_credito: 0, saldo: 0, puntos: 0 };
}

export function modoDe(perfil: Perfil | null, pedido?: string): Modo {
  if (perfil?.rol === 'mayorista') return 'may';
  // El personal puede ver la tienda como mayorista para probar: /?modo=may
  if (perfil && STAFF.includes(perfil.rol) && pedido === 'may') return 'may';
  return 'min';
}

export async function cargarTienda() {
  const sb = await supabaseServidor();
  const [p, c, z, d] = await Promise.all([
    sb.from('productos').select('*').eq('publicado', true).order('orden'),
    sb.from('config').select(CONFIG_PUBLICA).eq('id', 1).single(),
    sb.from('zonas_envio').select('localidad,costo').eq('activa', true).order('localidad'),
    sb.from('dias_sin_entrega').select('*').gte('fecha', new Date(Date.now() - 864e5).toISOString().slice(0, 10)),
  ]);
  return {
    productos: conStockCombos((p.data ?? []) as Producto[]),
    config: c.data as unknown as Config,
    zonas: (z.data ?? []) as Zona[],
    dias: (d.data ?? []) as DiaSinEntrega[],
    error: p.error?.message || c.error?.message || null,
  };
}
