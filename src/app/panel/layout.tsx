import { exigirPersonal } from '@/lib/panel';
import { ADMIN } from '@/lib/datos';
import { PanelNav } from '@/components/panel/PanelNav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panel · Pianura', robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const p = await exigirPersonal();
  const admin = ADMIN.includes(p.rol);
  return (
    <>
      <PanelNav admin={admin} modo="tabs" />
      <div className="crm">
        <PanelNav admin={admin} modo="side" />
        <div className="main">{children}</div>
      </div>
    </>
  );
}
