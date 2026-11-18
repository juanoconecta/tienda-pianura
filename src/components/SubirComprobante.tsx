'use client';
import { useState } from 'react';

export function SubirComprobante({ codigo }: { codigo: string }) {
  const [estado, setEstado] = useState<'' | 'subiendo' | 'ok'>('');
  const [error, setError] = useState('');
  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(''); setEstado('subiendo');
    const fd = new FormData();
    fd.append('archivo', f);
    const r = await fetch(`/api/pedidos/${codigo}/comprobante`, { method: 'POST', body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setEstado(''); setError(j.error || 'No se pudo subir.'); return; }
    setEstado('ok');
  }
  if (estado === 'ok') return <div className="note" style={{ marginTop: 12 }}><b>Comprobante recibido.</b> Lo revisamos y confirmamos el pago.</div>;
  return (
    <div style={{ marginTop: 12 }}>
      <label className="btn btn-p" style={{ display: 'inline-flex', cursor: 'pointer' }}>
        {estado === 'subiendo' ? 'Subiendo…' : 'Subir comprobante'}
        <input type="file" accept="image/*,application/pdf" onChange={subir} disabled={estado === 'subiendo'} style={{ display: 'none' }} />
      </label>
      {error && <div className="err" role="alert" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
