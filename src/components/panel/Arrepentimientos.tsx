'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';

export type Arrep = { id: number; tramite: string; pedido: number | null; nombre: string; contacto: string; motivo: string | null; creado: string };

/** Pedidos de cancelación hechos con el botón de arrepentimiento que falta resolver. */
export function Arrepentimientos({ inicial }: { inicial: Arrep[] }) {
  const [l, setL] = useState(inicial);
  const [err, setErr] = useState('');
  if (!l.length) return null;
  async function resolver(a: Arrep) {
    const { error } = await supabaseNavegador().from('arrepentimientos').update({ estado: 'Resuelto' }).eq('id', a.id);
    if (error) setErr('No se pudo marcar como resuelto.'); else setL((x) => x.filter((y) => y.id !== a.id));
  }
  return (
    <div className="box alerta">
      <h3>Botón de arrepentimiento <small>{l.length} sin resolver</small></h3>
      <p className="hint">Contactá al cliente, cancelá el pedido en Pedidos (el stock vuelve solo) y devolvé la plata por el mismo medio de pago.</p>
      <div className="bajos">{l.map((a) => (
        <div key={a.id}>
          <span><b>{a.nombre}</b> · {a.contacto}{a.pedido ? <> · <a className="plink" href={`/panel/pedidos#p${a.pedido}`}>pedido #{a.pedido}</a></> : ''} · trámite {a.tramite}{a.motivo ? ` · “${a.motivo}”` : ''}</span>
          <button className="adv" type="button" onClick={() => resolver(a)}>Marcar resuelto</button>
        </div>
      ))}</div>
      {err && <span className="err">{err}</span>}
    </div>
  );
}
