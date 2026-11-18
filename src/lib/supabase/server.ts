import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Cliente de Supabase con la sesión de quien navega (respeta RLS). */
export async function supabaseServidor() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // En un Server Component no se pueden escribir cookies: el proxy renueva la sesión.
        }
      },
    },
  });
}
