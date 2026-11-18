import { exigirPersonal } from '@/lib/panel';
import { supabaseServidor } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Configuracion, type ConfigFull, type CuponFull, type Dia, type ZonaFull } from '@/components/panel/Configuracion';

export default async function PaginaConfig() {
  await exigirPersonal(true);
  const sb = await supabaseServidor();
  const [c, z, d, k] = await Promise.all([
    supabaseAdmin().from('config').select('*').eq('id', 1).single(), // incluye mails_dueno: solo el servidor lo lee
    sb.from('zonas_envio').select('*').order('localidad'),
    sb.from('dias_sin_entrega').select('*').order('fecha'),
    sb.from('cupones').select('*').order('codigo'),
  ]);
  const { actualizado: _a, id: _i, ...config } = (c.data ?? {}) as ConfigFull & { actualizado: string; id: number };
  void _a; void _i;
  return (
    <>
      <div className="h1"><div><div className="eyebrow">Configuración</div><h1>Reglas de la tienda</h1></div></div>
      <Configuracion config={config as ConfigFull} zonas={(z.data ?? []) as ZonaFull[]} dias={(d.data ?? []) as Dia[]} cupones={(k.data ?? []) as CuponFull[]} />
    </>
  );
}
