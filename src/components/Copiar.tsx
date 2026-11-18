'use client';
import { useState } from 'react';

export function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="linkb" onClick={() => { navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }); }}>
      {ok ? 'Copiado' : 'Copiar'}
    </button>
  );
}
