import { supabaseServidor } from '@/lib/supabase/server';
import { Kanban, type PedidoK } from '@/components/panel/Kanban';

export default async function Pedidos() {
  const sb = await supabaseServidor();
  const desde = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data } = await sb.from('pedidos').select('id,codigo,modo,cliente,items,total,entrega,fecha_entrega,medio_pago,estado_pago,estado,comprobante,notas,creado').or(`estado.neq.Entregado,creado.gte.${desde}`).order('creado', { ascending: false }).limit(300);
  return (
    <>
      <div className="h1"><div><div className="eyebrow">Pedidos</div><h1>Pedidos de la semana</h1></div></div>
      <p className="hint">Los pedidos nuevos aparecen solos. Avanzá cada uno de columna a medida que se arma y se entrega. El cliente ve el mismo estado en su link.</p>
      <Kanban inicial={(data ?? []) as PedidoK[]} />
    </>
  );
}
