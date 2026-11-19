import type { MetadataRoute } from 'next';
import { SITIO, productosPublicos } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ps = await productosPublicos().catch(() => []);
  const fijas: MetadataRoute.Sitemap = [
    { url: `${SITIO}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITIO}/mayoristas`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITIO}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITIO}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITIO}/arrepentimiento`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  return [...fijas, ...ps.map((p) => ({ url: `${SITIO}/producto/${p.codigo}`, lastModified: (p as { actualizado?: string }).actualizado ? new Date((p as { actualizado?: string }).actualizado!) : undefined, changeFrequency: 'weekly' as const, priority: 0.8, images: p.imagen ? [`${SITIO}${p.imagen}`] : undefined }))];
}
