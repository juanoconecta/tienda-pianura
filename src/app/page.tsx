import { cargarTienda, modoDe, perfilActual } from '@/lib/datos';
import { entregaPara } from '@/lib/entrega';
import { Tienda } from '@/components/Tienda';

export const dynamic = 'force-dynamic';

export default async function Inicio({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const sp = await searchParams;
  const [datos, perfil] = await Promise.all([cargarTienda(), perfilActual()]);
  if (!datos.config) return <main className="store wrap"><div className="empty-state"><b>La tienda todavía no está configurada</b>Falta conectar la base de datos.</div></main>;
  const modo = modoDe(perfil, sp.modo);
  return <Tienda productos={datos.productos} config={datos.config} modo={modo} entrega={entregaPara(datos.config, datos.dias)} nombre={perfil?.razon_social || perfil?.nombre || null} />;
}
