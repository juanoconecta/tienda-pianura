'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';

const VACIO = { razon_social: '', cuit: '', rubro: '', localidad: '', contacto: '', whatsapp: '', email: '', compra_estimada: '', pide_cuenta_corriente: false };

export function AltaMayorista({ email }: { email: string }) {
  const [d, setD] = useState({ ...VACIO, email });
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok'>('');
  const [error, setError] = useState('');
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{2}-?\d{8}-?\d$/.test(d.cuit.trim())) return setError('El CUIT tiene que tener 11 números.');
    setEstado('enviando');
    const { error } = await supabaseNavegador().from('solicitudes_mayoristas').insert({ ...d, email: d.email.trim().toLowerCase(), estado: 'Pendiente' });
    if (error) { setEstado(''); setError('No se pudo enviar. Probá de nuevo.'); return; }
    setEstado('ok');
  }
  if (estado === 'ok') return <div className="box"><h2>¡Listo! Recibimos tu solicitud</h2><p>La revisamos y te avisamos por WhatsApp. Cuando esté aprobada, entrá con <b>{d.email}</b> y vas a ver la lista mayorista.</p><a className="btn btn-p" href="/">Volver a la tienda</a></div>;
  const c = (k: keyof typeof VACIO, l: string, extra: Record<string, unknown> = {}) => (
    <div className="field"><label htmlFor={'am-' + k}>{l}</label><input id={'am-' + k} value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value })} {...extra} /></div>
  );
  return (
    <form className="box" onSubmit={enviar}>
      <div className="form-grid">
        {c('razon_social', 'Razón social', { required: true, autoComplete: 'organization' })}
        {c('cuit', 'CUIT', { required: true, inputMode: 'numeric', placeholder: '30-12345678-9' })}
        {c('rubro', 'Rubro', { placeholder: 'Almacén, fiambrería, restaurante…' })}
        {c('localidad', 'Localidad', { autoComplete: 'address-level2' })}
        {c('contacto', 'Persona de contacto', { autoComplete: 'name' })}
        {c('whatsapp', 'WhatsApp', { required: true, inputMode: 'tel', autoComplete: 'tel' })}
        {c('email', 'Mail', { required: true, type: 'email', autoComplete: 'email' })}
        <div className="field"><label htmlFor="am-ce">Compra estimada por semana</label><select id="am-ce" value={d.compra_estimada} onChange={(e) => setD({ ...d, compra_estimada: e.target.value })}><option value="">Elegí</option><option>Hasta $ 300.000</option><option>$ 300.000 a $ 800.000</option><option>Más de $ 800.000</option></select></div>
        <label className="chk full" style={{ marginTop: 12 }}><input type="checkbox" checked={d.pide_cuenta_corriente} onChange={(e) => setD({ ...d, pide_cuenta_corriente: e.target.checked })} />Quiero pedir cuenta corriente</label>
      </div>
      {error && <div className="err" role="alert" style={{ marginTop: 10 }}>{error}</div>}
      <button className="btn btn-p btn-lg" type="submit" style={{ marginTop: 16 }} disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}</button>
    </form>
  );
}
