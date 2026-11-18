import { datosComercio } from '@/lib/legal';

export const metadata = { title: 'Política de privacidad · Pianura' };
export const revalidate = 3600;

export default async function Privacidad() {
  const d = await datosComercio();
  return (
    <main className="wrap legal">
      <div className="eyebrow">Legales</div>
      <h1>Política de privacidad</h1>
      <p className="meta">Última actualización: noviembre de 2026</p>

      <h2>Quién es responsable de tus datos</h2>
      <p><b>{d.titular}</b>{d.cuit && <> (CUIT {d.cuit})</>}, PIANURA Lácteos, Vila, Santa Fe, Argentina.</p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Los que cargás al comprar: nombre, celular, mail y dirección de entrega.</li>
        <li>Tus pedidos, pagos y comprobantes de transferencia.</li>
        <li>Si sos mayorista: los datos de tu comercio que nos mandaste en la solicitud.</li>
      </ul>
      <p>No guardamos datos de tarjetas: los pagos con Mercado Pago se hacen en su sitio.</p>

      <h2>Para qué los usamos</h2>
      <p>Para preparar, entregar y cobrar tus pedidos, avisarte cómo vienen (por ejemplo por WhatsApp cuando el pedido sale) y atender consultas o reclamos. No vendemos ni compartimos tus datos con otros para publicidad.</p>

      <h2>Con quién los compartimos</h2>
      <p>Solo con los servicios que hacen funcionar la tienda: el alojamiento de la web y la base de datos, Mercado Pago para los pagos, y quien hace la entrega (nombre, dirección y celular).</p>

      <h2>Cookies y almacenamiento del navegador</h2>
      <p>Usamos cookies para mantener tu sesión iniciada y el almacenamiento del navegador para recordar tu carrito. No usamos cookies de publicidad.</p>

      <h2>Tus derechos</h2>
      <p>Podés pedirnos ver, corregir o borrar tus datos escribiéndonos {d.waLink ? <>por <a href={d.waLink} target="_blank" rel="noopener">WhatsApp</a></> : 'por WhatsApp'}. Los datos de pedidos los guardamos el tiempo que exige la ley por razones contables.</p>
      <p className="meta">El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>
    </main>
  );
}
