import 'server-only';
import webpush from 'web-push';
import { supabaseAdmin } from './supabase/admin';

// Avisos al celular del personal (notificaciones push del navegador).
// Las claves se crean solas la primera vez y quedan guardadas en la base, solo visibles para el servidor.

let claves: { publica: string; privada: string } | null = null;

export async function clavesAvisos() {
  if (claves) return claves;
  const sb = supabaseAdmin();
  const { data } = await sb.from('ajustes_servidor').select('clave,valor').in('clave', ['vapid_publica', 'vapid_privada']);
  const m = Object.fromEntries((data ?? []).map((x) => [x.clave, x.valor]));
  if (m.vapid_publica && m.vapid_privada) {
    claves = { publica: m.vapid_publica, privada: m.vapid_privada };
    return claves;
  }
  const k = webpush.generateVAPIDKeys();
  // Si dos pedidos llegan juntos, gana la primera clave guardada.
  await sb.from('ajustes_servidor').upsert([{ clave: 'vapid_publica', valor: k.publicKey }, { clave: 'vapid_privada', valor: k.privateKey }], { onConflict: 'clave', ignoreDuplicates: true });
  const { data: d2 } = await sb.from('ajustes_servidor').select('clave,valor').in('clave', ['vapid_publica', 'vapid_privada']);
  const m2 = Object.fromEntries((d2 ?? []).map((x) => [x.clave, x.valor]));
  claves = { publica: m2.vapid_publica, privada: m2.vapid_privada };
  return claves;
}

/** Manda un aviso a todos los dispositivos del personal que lo activaron. Nunca tira error. */
export async function avisarPersonal(titulo: string, cuerpo: string, url = '/panel/pedidos') {
  try {
    const sb = supabaseAdmin();
    const { data: subs } = await sb.from('avisos_push').select('endpoint,p256dh,auth');
    if (!subs?.length) return;
    const k = await clavesAvisos();
    const sitio = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pianura-tienda.vercel.app').replace(/\/$/, '');
    webpush.setVapidDetails(sitio, k.publica, k.privada);
    const payload = JSON.stringify({ titulo, cuerpo, url });
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12, urgency: 'high' });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from('avisos_push').delete().eq('endpoint', s.endpoint);
      }
    }));
  } catch { /* un aviso que falla no frena la venta */ }
}
