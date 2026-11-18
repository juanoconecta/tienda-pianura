import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const OG_TAMANO = { width: 1200, height: 630 };
export const NARANJA = '#FF8200';
export const CREMA = '#FFF8EE';
export const TEXTO = '#2B2725';


/** Fuentes de la marca para las tarjetas que se ven al compartir un link. */
export async function fuentesOg() {
  const [semi, negrita] = await Promise.all([readFile(join(process.cwd(), 'assets/fonts/montserrat-latin-600-normal.woff')), readFile(join(process.cwd(), 'assets/fonts/montserrat-latin-800-normal.woff'))]);
  return [
    { name: 'Montserrat', data: semi, weight: 600 as const, style: 'normal' as const },
    { name: 'Montserrat', data: negrita, weight: 800 as const, style: 'normal' as const },
  ];
}

// Rutas escritas una por una para que Vercel incluya solo estos archivos en la función.
const IMAGENES: Record<string, () => Promise<Buffer>> = {
  '/img/logo.png': () => readFile(join(process.cwd(), 'public/img/logo.png')),
  '/img/hero.jpg': () => readFile(join(process.cwd(), 'public/img/hero.jpg')),
  '/img/blandos.jpg': () => readFile(join(process.cwd(), 'public/img/blandos.jpg')),
  '/img/semiduros.jpg': () => readFile(join(process.cwd(), 'public/img/semiduros.jpg')),
  '/img/duros.jpg': () => readFile(join(process.cwd(), 'public/img/duros.jpg')),
  '/img/quesosProd.jpg': () => readFile(join(process.cwd(), 'public/img/quesosProd.jpg')),
  '/img/ricota.jpg': () => readFile(join(process.cwd(), 'public/img/ricota.jpg')),
  '/img/cremas.jpg': () => readFile(join(process.cwd(), 'public/img/cremas.jpg')),
  '/img/cremaHome.jpg': () => readFile(join(process.cwd(), 'public/img/cremaHome.jpg')),
  '/img/dulces.jpg': () => readFile(join(process.cwd(), 'public/img/dulces.jpg')),
  '/img/ddlHome.jpg': () => readFile(join(process.cwd(), 'public/img/ddlHome.jpg')),
};

/** Imagen de /public como data URL (las tarjetas no pueden pedir archivos por la red). */
export async function imagenPublica(ruta: string) {
  const f = IMAGENES[ruta] || IMAGENES['/img/hero.jpg'];
  const b = await f().catch(() => null);
  if (!b) return null;
  return `data:image/${ruta.endsWith('.png') ? 'png' : 'jpeg'};base64,${b.toString('base64')}`;
}
