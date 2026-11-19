import { NEGOCIO, SITIO, productosPublicos } from '@/lib/seo';
import { fmt, precioMinorista } from '@/lib/tienda';

export const revalidate = 3600;

// Resumen de la tienda para asistentes de IA (formato llms.txt).
export async function GET() {
  const ps = await productosPublicos().catch(() => []);
  const fams = [...new Set(ps.map((p) => p.familia))];
  const lineas = [
    `# Tienda Pianura (${NEGOCIO.nombre})`,
    '',
    `> ${NEGOCIO.descripcion}`,
    '',
    '## Cómo comprar',
    `- Tienda online: ${SITIO}`,
    '- Venta por menor (precios finales con IVA) y por mayor para comercios con cuenta mayorista.',
    '- Por encargo: pedidos hasta el jueves 10:30, entrega el viernes. Retiro en Vila, envío o reparto.',
    '- Pago con Mercado Pago o transferencia.',
    '- Quesos por ¼ kg, ½ kg, 1 kg u horma (hormas por peso real, con descuento).',
    `- Más info: ${NEGOCIO.web} · Instagram: ${NEGOCIO.instagram}`,
    '',
    ...fams.flatMap((f) => [`## ${f}`, ...ps.filter((p) => p.familia === f).map((p) => {
      const pr = precioMinorista(p);
      return `- [${p.nombre}](${SITIO}/producto/${p.codigo})${pr > 0 ? `: ${fmt(pr)}${p.unidad === 'kg' ? ' el kg' : ''}` : ''}. ${p.descripcion || ''}`.trim();
    }), '']),
    '## Legales',
    `- [Términos y condiciones](${SITIO}/terminos)`,
    `- [Privacidad](${SITIO}/privacidad)`,
    `- [Botón de arrepentimiento](${SITIO}/arrepentimiento)`,
  ];
  return new Response(lineas.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
