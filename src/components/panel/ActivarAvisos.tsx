'use client';
import { useEffect, useState } from 'react';

type Estado = 'cargando' | 'no-soporta' | 'iphone-instalar' | 'bloqueado' | 'apagado' | 'activo';

function b64aBytes(b64: string) {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(s);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Activa los avisos de pedidos nuevos en este celular o computadora. */
export function ActivarAvisos() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const instalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setEstado(ios && !instalada ? 'iphone-instalar' : 'no-soporta');
        return;
      }
      if (Notification.permission === 'denied') { setEstado('bloqueado'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setEstado('apagado'); return; }
      // Si el servidor cambió de claves (o no conoce este dispositivo), se vuelve a enganchar.
      const r = await fetch('/api/push/clave');
      const clave = r.ok ? (await r.json()).clave as string : '';
      const actual = sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
      const nueva = clave ? b64aBytes(clave) : null;
      const igual = !!actual && !!nueva && actual.length === nueva.length && actual.every((b, i) => b === nueva[i]);
      if (!igual) { await sub.unsubscribe(); setEstado('apagado'); return; }
      await fetch('/api/push/suscribir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
      setEstado('activo');
    })().catch(() => setEstado('no-soporta'));
  }, []);

  async function activar() {
    setOcupado(true); setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setEstado(perm === 'denied' ? 'bloqueado' : 'apagado'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const r = await fetch('/api/push/clave');
      if (!r.ok) throw new Error();
      const { clave } = await r.json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(clave) });
      const g = await fetch('/api/push/suscribir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...sub.toJSON(), probar: true }) });
      if (!g.ok) throw new Error();
      setEstado('activo');
      setMsg('Listo. Te mandamos un aviso de prueba.');
    } catch {
      setMsg('No se pudieron activar los avisos. Probá de nuevo.');
    } finally { setOcupado(false); }
  }
  async function probar() {
    setOcupado(true); setMsg('');
    const r = await fetch('/api/push/suscribir', { method: 'PUT' }).catch(() => null);
    setOcupado(false);
    setMsg(r?.ok ? 'Aviso de prueba enviado. Tiene que llegar en unos segundos.' : 'No se pudo enviar la prueba.');
  }
  async function desactivar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/suscribir', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setEstado('apagado'); setMsg('');
    } finally { setOcupado(false); }
  }

  if (estado === 'cargando') return null;
  return (
    <div className="box avisos">
      <h3>Avisos en este dispositivo</h3>
      {estado === 'activo' && <><p className="meta">Activados. Te llega un aviso con cada pedido nuevo, y cada pago de Mercado Pago.</p><div className="tools"><button className="btn btn-p" type="button" disabled={ocupado} onClick={probar}>Mandar aviso de prueba</button><button className="btn" type="button" disabled={ocupado} onClick={desactivar}>Desactivar en este dispositivo</button></div></>}
      {estado === 'apagado' && <><p className="meta">Recibí un aviso en el celular con cada pedido nuevo, aunque no tengas el panel abierto. Activalo en cada celular o computadora donde quieras recibirlos.</p><button className="btn btn-p" type="button" disabled={ocupado} onClick={activar}>{ocupado ? 'Activando…' : 'Activar avisos'}</button></>}
      {estado === 'iphone-instalar' && <p className="meta">En iPhone primero hay que agregar la tienda a la pantalla de inicio: en Safari tocá <b>Compartir</b> → <b>Agregar a inicio</b>. Abrila desde ese ícono, entrá al panel y volvé acá para activar los avisos.</p>}
      {estado === 'bloqueado' && <p className="meta">Las notificaciones están bloqueadas para este sitio. Habilitalas en los ajustes del navegador (o del iPhone, en Notificaciones → Pianura) y volvé a esta página.</p>}
      {estado === 'no-soporta' && <p className="meta">Este navegador no admite avisos. Probá con Chrome en Android o computadora, o en iPhone agregando la tienda a la pantalla de inicio.</p>}
      {msg && <p className="meta" role="status">{msg}</p>}
    </div>
  );
}
