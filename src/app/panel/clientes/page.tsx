import { exigirPersonal } from '@/lib/panel';
import { ADMIN } from '@/lib/datos';
import { supabaseServidor } from '@/lib/supabase/server';
import { Clientes, type Solicitud, type Usuario } from '@/components/panel/Clientes';

export default async function PaginaClientes() {
  const p = await exigirPersonal();
  const sb = await supabaseServidor();
  const [s, u] = await Promise.all([
    sb.from('solicitudes_mayoristas').select('*').order('creado', { ascending: false }).limit(200),
    sb.from('profiles').select('id,email,nombre,razon_social,telefono,localidad,rol,limite_credito,saldo,creado').order('creado', { ascending: false }).limit(1000),
  ]);
  return (
    <>
      <div className="h1"><div><div className="eyebrow">Clientes</div><h1>Clientes y mayoristas</h1></div></div>
      <Clientes solicitudes={(s.data ?? []) as Solicitud[]} usuarios={(u.data ?? []) as Usuario[]} admin={ADMIN.includes(p.rol)} />
    </>
  );
}
