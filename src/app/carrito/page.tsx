import { cargarTienda, modoDe, perfilActual } from '@/lib/datos';
import { entregaPara } from '@/lib/entrega';
import { CarritoVista } from '@/components/CarritoVista';

export const dynamic = 'force-dynamic';

export default async function PaginaCarrito() {
  const [datos, perfil] = await Promise.all([cargarTienda(), perfilActual()]);
  if (!datos.config) return null;
  const modo = modoDe(perfil);
  return (
    <CarritoVista
      productos={datos.productos}
      config={datos.config}
      zonas={datos.zonas}
      modo={modo}
      entrega={entregaPara(datos.config, datos.dias)}
      mpActivo={!!process.env.MP_ACCESS_TOKEN}
      perfil={perfil ? { nombre: perfil.razon_social || perfil.nombre || '', telefono: perfil.telefono || '', email: perfil.email || '', direccion: perfil.direccion || '', localidad: perfil.localidad || '', credito: Math.max(0, Number(perfil.limite_credito) - Number(perfil.saldo)) } : null}
    />
  );
}
