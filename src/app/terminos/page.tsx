import { datosComercio } from '@/lib/legal';

export const metadata = { title: 'Términos y condiciones · Pianura' };
export const revalidate = 3600;

export default async function Terminos() {
  const d = await datosComercio();
  return (
    <main className="wrap legal">
      <div className="eyebrow">Legales</div>
      <h1>Términos y condiciones</h1>
      <p className="meta">Última actualización: noviembre de 2026</p>

      <h2>1. Quiénes somos</h2>
      <p>Esta tienda es de <b>{d.titular}</b>{d.cuit && <> (CUIT {d.cuit})</>}, marca PIANURA Lácteos, con planta en Vila, Santa Fe, Argentina. Podés escribirnos {d.waLink ? <>por <a href={d.waLink} target="_blank" rel="noopener">WhatsApp{d.whatsapp ? ` (${d.whatsapp})` : ''}</a></> : 'por WhatsApp'} por cualquier consulta o reclamo.</p>

      <h2>2. Uso de la tienda</h2>
      <p>Al hacer un pedido aceptás estos términos. Podés comprar sin crear una cuenta. Las cuentas mayoristas las aprobamos nosotros y pueden tener precios, pedido mínimo, formas de pago y entrega distintas a las de la compra minorista.</p>

      <h2>3. Precios y productos</h2>
      <p>Los precios están en pesos argentinos. En la compra minorista son precios finales con IVA incluido. En la compra mayorista los precios son netos y el IVA se muestra aparte en el carrito. Vale el precio que figura al confirmar el pedido.</p>
      <p>Los quesos en horma o fraccionados se venden por peso. El peso real puede variar un poco respecto del indicado, y se cobra el peso real; si la diferencia es importante te avisamos antes de entregar. Las fotos son ilustrativas.</p>
      <p>Los productos se preparan por encargo y están sujetos a disponibilidad en fábrica. Si por algún motivo no podemos cumplir con un producto, te avisamos y te devolvemos lo que hayas pagado por él.</p>

      <h2>4. Pagos</h2>
      <p>Aceptamos Mercado Pago, transferencia bancaria y, para clientes mayoristas aprobados, cuenta corriente. Con transferencia, el pedido se prepara cuando recibimos el comprobante.</p>

      <h2>5. Entregas</h2>
      <p>Podés retirar en planta, recibir el pedido por envío en las localidades habilitadas (con el costo que se indica en el carrito) o, si sos mayorista, por reparto. La fecha de entrega depende del día de cierre de pedidos que se muestra en el carrito. Son productos refrigerados: tiene que haber alguien para recibirlos y hay que guardarlos en la heladera enseguida.</p>

      <h2>6. Cancelación y derecho de arrepentimiento</h2>
      <p>Podés cancelar tu compra dentro de los 10 días corridos desde que la hiciste o desde que recibiste el producto, lo que ocurra último, sin dar motivos y sin costo (Ley 24.240, art. 34, y Código Civil y Comercial, art. 1110). Para hacerlo usá el <a href="/arrepentimiento">Botón de arrepentimiento</a> o escribinos. Te devolvemos el dinero por el mismo medio de pago.</p>
      <p>Si el pedido todavía no se entregó, lo cancelamos y te devolvemos el total. Una vez entregados, los productos frescos refrigerados pueden deteriorarse con rapidez, y por eso no se pueden devolver si se abrieron o se cortó la cadena de frío (Código Civil y Comercial, art. 1116). Esto no afecta tu derecho a reclamar por un producto en mal estado.</p>

      <h2>7. Productos en mal estado o con faltantes</h2>
      <p>Revisá el pedido al recibirlo. Si algo llegó en mal estado, vencido o falta un producto, avisanos dentro de las 48 horas con una foto y lo reponemos o te devolvemos el importe.</p>

      <h2>8. Datos personales</h2>
      <p>Usamos tus datos solo para gestionar tus pedidos. Leé la <a href="/privacidad">Política de privacidad</a>.</p>

      <h2>9. Reclamos</h2>
      <p>Ante cualquier problema escribinos primero y lo resolvemos. También podés hacer un reclamo ante Defensa del Consumidor en <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener">argentina.gob.ar/defensadelconsumidor</a>. Rigen las leyes de la República Argentina.</p>
    </main>
  );
}
