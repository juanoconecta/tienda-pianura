import { supabaseServidor } from '@/lib/supabase/server';
import { waNumero } from '@/lib/tienda';

/** Datos del comercio para las páginas legales (salen de Configuración). */
export async function datosComercio() {
  let c: { banco_titular?: string; banco_cuit?: string; whatsapp?: string } = {};
  try {
    const { data } = await (await supabaseServidor()).from('config').select('banco_titular,banco_cuit,whatsapp').eq('id', 1).single();
    c = data ?? {};
  } catch { c = {}; }
  const wa = c.whatsapp ? waNumero(c.whatsapp) : '';
  return {
    titular: c.banco_titular || 'Pianura Lácteos',
    cuit: c.banco_cuit || '',
    whatsapp: c.whatsapp || '',
    waLink: wa ? `https://wa.me/${wa}` : '',
  };
}
