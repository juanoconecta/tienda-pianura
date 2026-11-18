import 'server-only';

const API = 'https://api.mercadopago.com';
export const mpActivo = () => !!process.env.MP_ACCESS_TOKEN;
const sitio = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Crea la preferencia de Checkout Pro y devuelve el link de pago. */
export async function crearPreferencia(p: { id: number; codigo: string; total: number; email?: string; titulo: string }) {
  const r = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: String(p.id), title: p.titulo, quantity: 1, unit_price: Math.round(p.total), currency_id: 'ARS' }],
      payer: p.email ? { email: p.email } : undefined,
      external_reference: p.codigo,
      back_urls: { success: `${sitio()}/pedido/${p.codigo}`, pending: `${sitio()}/pedido/${p.codigo}`, failure: `${sitio()}/pedido/${p.codigo}` },
      auto_return: 'approved',
      notification_url: `${sitio()}/api/mp/webhook`,
      statement_descriptor: 'PIANURA',
    }),
  });
  if (!r.ok) throw new Error('Mercado Pago no respondió (' + r.status + ')');
  const j = await r.json();
  return { id: String(j.id), url: String(j.init_point) };
}

/** Consulta un pago directo a Mercado Pago: nunca se confía en lo que llega al webhook. */
export async function consultarPago(id: string) {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }, cache: 'no-store' });
  if (!r.ok) return null;
  const j = await r.json();
  return { id: String(j.id), estado: String(j.status), referencia: String(j.external_reference || ''), monto: Number(j.transaction_amount) };
}
