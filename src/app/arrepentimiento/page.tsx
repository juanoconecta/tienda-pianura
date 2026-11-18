import { datosComercio } from '@/lib/legal';
import { FormArrepentimiento } from '@/components/FormArrepentimiento';

export const metadata = { title: 'Botón de arrepentimiento · Pianura' };
export const revalidate = 3600;

export default async function Arrepentimiento() {
  const d = await datosComercio();
  return (
    <main className="wrap legal">
      <div className="eyebrow">Legales</div>
      <h1>Botón de arrepentimiento</h1>
      <p>Si te arrepentiste de una compra, podés cancelarla dentro de los 10 días corridos desde que la hiciste o la recibiste. Completá estos datos y te damos un código de trámite. Te contactamos para coordinar la devolución del dinero por el mismo medio con el que pagaste.</p>
      <p className="meta">Si el pedido ya se entregó, recordá que los productos frescos refrigerados abiertos o fuera de la heladera no se pueden devolver (ver <a href="/terminos">Términos y condiciones</a>, punto 6).</p>
      <FormArrepentimiento />
      {d.waLink && <p className="meta">¿Preferís hablar con alguien? <a href={d.waLink} target="_blank" rel="noopener">Escribinos por WhatsApp</a>.</p>}
    </main>
  );
}
