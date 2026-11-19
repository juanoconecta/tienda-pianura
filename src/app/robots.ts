import type { MetadataRoute } from 'next';
import { SITIO } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/panel', '/carrito', '/cuenta', '/pedido/', '/api/', '/auth/'] }],
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
