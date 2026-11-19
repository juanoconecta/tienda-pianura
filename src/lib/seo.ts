import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { esCombo, precioMinorista, visibleEn, type Producto } from '@/lib/tienda';

export const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tiendapianura.com.ar').replace(/\/$/, '');
export const NEGOCIO = {
  nombre: 'Pianura Lácteos',
  descripcion: 'Quesos, cremas y dulce de leche de Pianura, elaborados en Vila, Santa Fe. Venta online por menor y por mayor, por encargo semanal: pedidos hasta el jueves 10:30 y entrega el viernes.',
  localidad: 'Vila',
  provincia: 'Santa Fe',
  pais: 'AR',
  instagram: 'https://www.instagram.com/pianuralacteos',
  web: 'https://www.pianura.com.ar',
};

/** Productos públicos (lista minorista), sin sesión: para sitemap, llms.txt y datos estructurados. */
export async function productosPublicos(): Promise<Producto[]> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.from('productos').select('*').eq('publicado', true).order('orden');
  return ((data ?? []) as Producto[]).filter((p) => visibleEn(p, 'min'));
}

/** Datos estructurados (schema.org) de un producto, para Google y asistentes de IA. */
export function jsonProducto(p: Producto) {
  const precio = precioMinorista(p);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    description: p.descripcion,
    image: `${SITIO}${p.imagen}`,
    sku: p.codigo,
    category: esCombo(p) ? 'Combos' : p.familia,
    brand: { '@type': 'Brand', name: 'Pianura' },
    url: `${SITIO}/producto/${p.codigo}`,
    ...(precio > 0 ? {
      offers: {
        '@type': 'Offer',
        url: `${SITIO}/producto/${p.codigo}`,
        priceCurrency: 'ARS',
        price: precio,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: NEGOCIO.nombre },
        ...(p.unidad === 'kg' ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: precio, priceCurrency: 'ARS', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'KGM' } } } : {}),
      },
    } : {}),
  };
}

/** Datos del negocio y del sitio para la portada. */
export function jsonNegocio(whatsapp: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Store',
      '@id': `${SITIO}/#negocio`,
      name: NEGOCIO.nombre,
      description: NEGOCIO.descripcion,
      url: SITIO,
      logo: `${SITIO}/img/logo.png`,
      image: `${SITIO}/img/hero.jpg`,
      ...(whatsapp ? { telephone: whatsapp } : {}),
      address: { '@type': 'PostalAddress', addressLocality: NEGOCIO.localidad, addressRegion: NEGOCIO.provincia, addressCountry: NEGOCIO.pais },
      areaServed: { '@type': 'State', name: NEGOCIO.provincia },
      sameAs: [NEGOCIO.instagram, NEGOCIO.web],
      paymentAccepted: 'Mercado Pago, transferencia bancaria',
      currenciesAccepted: 'ARS',
    },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Tienda Pianura', url: SITIO, inLanguage: 'es-AR', publisher: { '@id': `${SITIO}/#negocio` } },
  ];
}

/** Para incrustar JSON-LD en la página sin romper el HTML. */
export const ld = (x: unknown) => ({ __html: JSON.stringify(x).replace(/</g, '\\u003c') });
