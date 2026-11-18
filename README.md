# Tienda Pianura

Tienda online de Pianura Lácteos (Vila, Santa Fe) para venta minorista y mayorista, con panel para el personal.

Una creación y desarrollo de **JuanoConecta**.

## Qué incluye

- **Tienda:** lista minorista (¼ kg, ½ kg, 1 kg, ½ horma y horma) y lista mayorista (por horma o caja, precios netos más IVA). Hay carrito, cupones, envío por localidad y una fecha de entrega que se calcula sola según el cierre semanal y los feriados.
- **Pedidos:** el servidor recalcula todos los precios antes de guardar. Se paga por transferencia (con subida de comprobante), por Mercado Pago (opcional) o con cuenta corriente para mayoristas.
- **Cuenta:** entrada sin contraseña, con un link que llega por mail. Muestra los datos, los pedidos y la cuenta corriente.
- **Panel:**
  - tablero en vivo
  - pedidos en columnas por estado
  - precios y stock, con aumento general
  - clientes y solicitudes mayoristas
  - configuración: banco, reglas, zonas, feriados y cupones

## Puesta en marcha

1. **Supabase:** crear el proyecto y correr en orden, en el SQL Editor, los archivos de `supabase/migrations/` (0001 a 0005).
2. **Dueño:** en la tabla `config`, cargar en `mails_dueno` el mail del dueño. Al entrar por primera vez con ese mail, queda como dueño.
3. **Supabase, Authentication, URL Configuration:**
   - Site URL: la dirección de la tienda.
   - Redirect URLs: agregar `https://<dominio>/auth/callback`.
4. **Vercel:** importar el repositorio y cargar las variables de `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: en Supabase, Project Settings, API.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave secreta. Va solo en Vercel y nunca en el código.
   - `NEXT_PUBLIC_SITE_URL`: la dirección pública, por ejemplo `https://pianura-tienda.vercel.app`.
   - `MP_ACCESS_TOKEN`: opcional. Sin esta variable, Mercado Pago no aparece como medio de pago.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar
npm run dev
```

`npm run typecheck` y `npm run build` tienen que pasar antes de subir cambios.
