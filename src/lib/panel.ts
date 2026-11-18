import 'server-only';
import { redirect } from 'next/navigation';
import { perfilActual, STAFF, ADMIN, type Perfil } from './datos';

/** Solo personal de Pianura. Con admin=true, solo dueño o admin. */
export async function exigirPersonal(admin = false): Promise<Perfil> {
  const p = await perfilActual();
  if (!p) redirect('/cuenta');
  if (!STAFF.includes(p.rol) || (admin && !ADMIN.includes(p.rol))) redirect('/');
  return p;
}
