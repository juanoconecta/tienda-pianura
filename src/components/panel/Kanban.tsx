'use client';
import { useEffect, useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';
import { ESTADOS, fmt } from '@/lib/tienda';

export type PedidoK = {
  id: number; codigo: string; modo: string; cliente: { nombre?: string; telefono?: string; direccion?: string; localidad?: string };
  items: { nombre: string; detalle: string }[]; total: number; entrega: string; fecha_entrega: string | null;
  medio_pago: string; estado_pago: string; estado: string; comprobante: string | null; notas: string | null; creado: string;
};

const MEDIO: Record<string, string> = { mp: 'Mercado Pago', transferencia: 'Transferencia', cuenta: 'Cuenta corriente' };
const ENTREGA: Record<string, string> = { retiro: 'Retiro', envio: 'Envío', reparto: 'Reparto' };

/** Celular argentino a formato de WhatsApp (549 + área + número, sin 0 ni 15). */
function waNumero(tel: string) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.startsWith('549')) return d;
  if (d.startsWith('54')) d = d.slice(2);
  d = d.replace(/^0/, '');
  if (d.length === 12) {
    for (const area of [2, 3, 4]) if (d.slice(area, area + 2) === '15') { d = d.slice(0, area) + d.slice(area + 2); break; }
  }
  return '549' + d;
}

/** Mensaje de aviso al cliente cuando el pedido sale. */
function avisoEnCamino(p: PedidoK) {
  const nombre = (p.cliente?.nombre || '').split(' ')[0];
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  const donde = p.entrega === 'retiro' ? 'ya está listo para retirar' : `ya está en camino${p.cliente?.direccion ? ` a ${p.cliente.direccion}${p.cliente.localidad ? ', ' + p.cliente.localidad : ''}` : ''}`;
  const pago = p.estado_pago === 'pagado' ? 'Ya está pagado.' : `Total a abonar: ${fmt(Number(p.total))}.`;
  const txt = `¡Hola${nombre ? ' ' + nombre : ''}! Te escribimos de Tienda Pianura. Tu pedido #${p.id} ${donde}. ${pago}\nPodés seguirlo acá: ${sitio}/pedido/${p.codigo}\n¡Gracias por elegirnos!`;
  return `https://wa.me/${waNumero(p.cliente?.telefono || '')}?text=${encodeURIComponent(txt)}`;
}

export function Kanban({ inicial }: { inicial: PedidoK[] }) {
  const [ps, setPs] = useState(inicial);
  const [nuevos, setNuevos] = useState<number[]>([]);
  const [filtro, setFiltro] = useState<'todos' | 'min' | 'may'>('todos');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const sb = supabaseNavegador();
    const ch = sb.channel('kanban').on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (m) => {
      const p = m.new as PedidoK;
      if (!p?.id) return;
      setPs((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [p, ...l]));
      if (m.eventType === 'INSERT') setNuevos((n) => [...n, p.id]);
    }).subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  async function cambiar(p: PedidoK, cambios: Partial<PedidoK>) {
    setPs((l) => l.map((x) => (x.id === p.id ? { ...x, ...cambios } : x)));
    const { error } = await supabaseNavegador().from('pedidos').update({ ...cambios, actualizado: new Date().toISOString() }).eq('id', p.id);
    if (error) { setMsg('No se pudo guardar el cambio del pedido #' + p.id); setPs((l) => l.map((x) => (x.id === p.id ? p : x))); }
  }
  async function verComprobante(ruta: string) {
    const { data } = await supabaseNavegador().storage.from('comprobantes').createSignedUrl(ruta, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
    else setMsg('No se pudo abrir el comprobante.');
  }

  const vis = ps.filter((p) => filtro === 'todos' || p.modo === filtro);
  const cancelados = vis.filter((p) => p.estado === 'Cancelado');
  return (
    <>
      <div className="tools">
        <div className="seg" role="group" aria-label="Filtrar">
          {(['todos', 'min', 'may'] as const).map((f) => <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>{f === 'todos' ? 'Todos' : f === 'min' ? 'Minoristas' : 'Mayoristas'}</button>)}
        </div>
        <span className="live"><i />En vivo</span>
        {msg && <span className="err">{msg}</span>}
      </div>
      <div className="kanban">
        {ESTADOS.map((e, i) => {
          const col = vis.filter((p) => p.estado === e);
          return (
            <div className="col" key={e}>
              <h4><span>{e}</span><span>{col.length}</span></h4>
              {col.map((p) => (
                <div className={'oc' + (nuevos.includes(p.id) ? ' new' : '')} key={p.id} id={'p' + p.id}>
                  <div className="r1"><span>#{p.id} · {p.modo === 'may' ? 'May' : 'Min'}</span><span>{fmt(Number(p.total))}</span></div>
                  <div><b>{p.cliente?.nombre}</b>{p.cliente?.telefono && <> · <a href={`https://wa.me/${waNumero(p.cliente.telefono)}`} target="_blank" rel="noopener">{p.cliente.telefono}</a></>}</div>
                  <div className="items">{(p.items || []).map((l) => `${l.nombre} (${l.detalle})`).join(' · ')}</div>
                  <div className="meta">{ENTREGA[p.entrega]}{p.entrega === 'envio' ? `: ${p.cliente?.direccion || ''}, ${p.cliente?.localidad || ''}` : ''}{p.fecha_entrega ? ` · ${p.fecha_entrega.slice(8)}/${p.fecha_entrega.slice(5, 7)}` : ''}</div>
                  {p.notas && <div className="meta">Nota: {p.notas}</div>}
                  <div><span className={'pill ' + (p.estado_pago === 'pagado' ? 'g' : 'w')}>{MEDIO[p.medio_pago]} · {p.estado_pago === 'pagado' ? 'pagado' : 'pendiente'}</span></div>
                  {e === 'En camino' && p.cliente?.telefono && <a className="btn wa" href={avisoEnCamino(p)} target="_blank" rel="noopener">Avisar por WhatsApp</a>}
                  <div className="acts">
                    {i < ESTADOS.length - 1 && <button className="adv" type="button" onClick={() => cambiar(p, { estado: ESTADOS[i + 1] })}>Pasar a {ESTADOS[i + 1]}</button>}
                    {p.estado_pago !== 'pagado' && <button className="adv" type="button" onClick={() => cambiar(p, { estado_pago: 'pagado' })}>Marcar pagado</button>}
                    {p.comprobante && <button className="adv" type="button" onClick={() => verComprobante(p.comprobante!)}>Comprobante</button>}
                    {i > 0 && <button className="adv" type="button" onClick={() => cambiar(p, { estado: ESTADOS[i - 1] })}>Volver</button>}
                    {e === 'Nuevo' && <button className="adv" type="button" onClick={() => { if (confirm(`¿Cancelar el pedido #${p.id}?`)) cambiar(p, { estado: 'Cancelado' }); }}>Cancelar</button>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {cancelados.length > 0 && <p className="hint" style={{ marginTop: 12 }}>Cancelados: {cancelados.map((p) => `#${p.id}`).join(', ')}</p>}
    </>
  );
}
