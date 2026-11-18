import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import type { Cupon } from './tienda';

/** Busca un cupón vigente (activo, sin vencer y con usos disponibles). */
export async function cuponVigente(codigo: string): Promise<{ cupon: Cupon | null; error?: string }> {
  const c = String(codigo || '').trim().toUpperCase();
  if (!c || c.length > 40) return { cupon: null, error: 'Escribí un código.' };
  const { data } = await supabaseAdmin().from('cupones').select('*').eq('codigo', c).maybeSingle();
  if (!data || !data.activo) return { cupon: null, error: 'Ese cupón no existe o ya no está activo.' };
  const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  if (data.vence && data.vence < hoy) return { cupon: null, error: 'Ese cupón ya venció.' };
  if (data.tope_usos > 0 && data.usos >= data.tope_usos) return { cupon: null, error: 'Ese cupón ya se usó todas las veces posibles.' };
  return { cupon: { codigo: data.codigo, porcentaje: data.porcentaje === null ? null : Number(data.porcentaje), envio_gratis: data.envio_gratis, solo: data.solo } };
}
