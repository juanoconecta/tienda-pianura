'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';

export function Entrar({ siguiente = '/cuenta', errorLink = false }: { siguiente?: string; errorLink?: boolean }) {
  const [modo, setModo] = useState<'link' | 'clave'>('link');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok'>('');
  const [error, setError] = useState(errorLink ? 'El link venció o ya se usó. Pedí uno nuevo.' : '');

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setEstado('enviando');
    const sb = supabaseNavegador();
    if (modo === 'clave') {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: clave });
      if (error) { setEstado(''); setError('El mail o la contraseña no coinciden.'); return; }
      window.location.href = siguiente;
      return;
    }
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(siguiente)}` },
    });
    if (error) { setEstado(''); setError(error.status === 429 ? 'Pediste muchos links seguidos. Esperá un minuto.' : 'No pudimos mandar el mail. Revisá la dirección.'); return; }
    setEstado('ok');
  }

  return (
    <main className="wrap"><div className="login box">
      <h2>Entrar</h2>
      {estado === 'ok' ? (
        <p>Te mandamos un link a <b>{email}</b>. Abrilo desde este mismo dispositivo para entrar. Si no aparece, mirá en spam.</p>
      ) : (
        <form onSubmit={enviar}>
          <div className="seg" role="group" aria-label="Forma de entrar" style={{ marginTop: 8 }}>
            <button type="button" aria-pressed={modo === 'link'} onClick={() => { setModo('link'); setError(''); }}>Link al mail</button>
            <button type="button" aria-pressed={modo === 'clave'} onClick={() => { setModo('clave'); setError(''); }}>Con contraseña</button>
          </div>
          <p className="meta">{modo === 'link' ? 'Sin contraseña: te mandamos un link al mail para entrar.' : 'Para el personal de Pianura y cuentas con contraseña.'}</p>
          <div className="field"><label htmlFor="em">Tu mail</label><input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete={modo === 'clave' ? 'username' : 'email'} /></div>
          {modo === 'clave' && <div className="field"><label htmlFor="pw">Contraseña</label><input id="pw" type="password" required value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" /></div>}
          {error && <div className="err" role="alert" style={{ marginTop: 10 }}>{error}</div>}
          <button className="btn btn-p btn-lg" type="submit" style={{ marginTop: 14, width: '100%' }} disabled={estado === 'enviando'}>{estado === 'enviando' ? (modo === 'clave' ? 'Entrando…' : 'Enviando…') : modo === 'clave' ? 'Entrar' : 'Mandame el link'}</button>
          <p className="meta" style={{ marginTop: 14 }}>¿Tenés un comercio? <a className="plink" href="/mayoristas">Pedí tu cuenta mayorista</a>.</p>
        </form>
      )}
    </div></main>
  );
}
