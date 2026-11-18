import { perfilActual } from '@/lib/datos';
import { AltaMayorista } from '@/components/AltaMayorista';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cuenta mayorista · Pianura' };

export default async function Mayoristas() {
  const perfil = await perfilActual();
  return (
    <main className="wrap" style={{ paddingBlock: '24px 64px' }}>
      <div className="alta">
        <div className="eyebrow">Comercios</div>
        <h2>Comprá por mayor</h2>
        <p className="meta">Precios mayoristas, reparto sin cargo en tu ruta y cuenta corriente para clientes habituales. Completá los datos y te respondemos en el día.</p>
        {perfil?.rol === 'mayorista' ? <div className="box">Tu cuenta ya es mayorista. <a className="plink" href="/">Ir a la tienda</a>.</div> : <AltaMayorista email={perfil?.email || ''} />}
      </div>
    </main>
  );
}
