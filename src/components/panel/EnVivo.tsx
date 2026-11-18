'use client';
import { useEffect, useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';
import { fmt } from '@/lib/tienda';

export type PedidoFeed = { id: number; modo: string; total: number; creado: string; cliente: { nombre?: string } };

/** Lista de últimos pedidos que se actualiza sola cuando entra uno nuevo. */
export function EnVivo({ inicial }: { inicial: PedidoFeed[] }) {
  const [lista, setLista] = useState(inicial);
  const [nuevos, setNuevos] = useState<number[]>([]);
  useEffect(() => {
    const sb = supabaseNavegador();
    const ch = sb.channel('feed-pedidos').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (m) => {
      const p = m.new as PedidoFeed;
      setLista((l) => [p, ...l].slice(0, 20));
      setNuevos((n) => [...n, p.id]);
    }).subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);
  if (!lista.length) return <div className="empty"><b>Todavía no hay pedidos</b>Cuando entre uno aparece acá al instante.</div>;
  return (
    <div className="feed">
      {lista.map((p) => (
        <a key={p.id} href={`/panel/pedidos#p${p.id}`} className={'ev' + (nuevos.includes(p.id) ? ' new' : '')} style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="ic">{p.modo === 'may' ? 'MAY' : 'MIN'}</span>
          <div style={{ minWidth: 0 }}><b>#{p.id}</b> {p.cliente?.nombre || ''}<div className="w">{new Date(p.creado).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div>
          <span className="m">{fmt(Number(p.total))}</span>
        </a>
      ))}
    </div>
  );
}
