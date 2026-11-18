import 'server-only';
import { proximaEntrega, type Config, type DiaSinEntrega } from './tienda';

export function entregaPara(config: Config, dias: DiaSinEntrega[]) {
  const e = proximaEntrega(config, dias);
  return { dia: e.dia, fecha: e.fecha, iso: e.iso, cierre: e.cierre, salto: e.salto ? { fecha: e.salto.fecha, motivo: e.salto.motivo } : null };
}
