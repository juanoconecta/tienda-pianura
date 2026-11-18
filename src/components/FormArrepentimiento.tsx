'use client';
import { useState } from 'react';

export function FormArrepentimiento() {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'ok'>('listo');
  const [tramite, setTramite] = useState('');
  const [error, setError] = useState('');

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado('enviando'); setError('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/arrepentimiento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(f)) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    if (!r?.ok || !j?.tramite) { setError(j?.error || 'No pudimos enviar el pedido. Probá de nuevo.'); setEstado('listo'); return; }
    setTramite(j.tramite); setEstado('ok');
  }

  if (estado === 'ok') return (
    <div className="box ok-box" role="status">
      <h3>Recibimos tu pedido de cancelación</h3>
      <p>Tu código de trámite es <b className="tramite">{tramite}</b>. Guardalo: te contactamos dentro de las 24 horas hábiles.</p>
    </div>
  );
  return (
    <form className="box" onSubmit={enviar}>
      <div className="field"><label htmlFor="ar-pedido">Número de pedido (si lo tenés)</label><input id="ar-pedido" name="pedido" inputMode="numeric" placeholder="Ej: 5003" maxLength={12} /></div>
      <div className="field"><label htmlFor="ar-nombre">Nombre y apellido</label><input id="ar-nombre" name="nombre" required maxLength={120} autoComplete="name" /></div>
      <div className="field"><label htmlFor="ar-contacto">Celular o mail</label><input id="ar-contacto" name="contacto" required maxLength={120} autoComplete="tel" /></div>
      <div className="field"><label htmlFor="ar-motivo">Motivo (opcional)</label><textarea id="ar-motivo" name="motivo" rows={3} maxLength={600} /></div>
      {error && <div className="err" role="alert" style={{ marginTop: 10 }}>{error}</div>}
      <button className="btn btn-p btn-lg" type="submit" style={{ marginTop: 14 }} disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Enviando…' : 'Cancelar mi compra'}</button>
    </form>
  );
}
