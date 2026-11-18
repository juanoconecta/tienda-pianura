'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';

type Datos = { nombre: string; telefono: string; direccion: string; localidad: string };

export function MisDatos({ id, inicial }: { id: string; inicial: Datos }) {
  const [d, setD] = useState(inicial);
  const [msg, setMsg] = useState('');
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMsg('Guardando…');
    const { error } = await supabaseNavegador().from('profiles').update(d).eq('id', id);
    setMsg(error ? 'No se pudo guardar.' : 'Guardado.');
  }
  const campo = (k: keyof Datos, l: string, ac: string) => (
    <div className="field"><label htmlFor={'md-' + k}>{l}</label><input id={'md-' + k} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} autoComplete={ac} /></div>
  );
  return (
    <form onSubmit={guardar}>
      <div className="form-grid">
        {campo('nombre', 'Nombre y apellido', 'name')}
        {campo('telefono', 'Celular', 'tel')}
        {campo('direccion', 'Dirección', 'street-address')}
        {campo('localidad', 'Localidad', 'address-level2')}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
        <button className="btn btn-p" type="submit">Guardar</button><span className="meta">{msg}</span>
      </div>
    </form>
  );
}
