import type { EstadoAlerta, EstadoDocumento } from './domain.model';

export interface DocumentoAlerta {
  id: number;
  ciudadanoId: number;
  dpi: string;
  nombreCiudadano: string;
  tipoDocumento: string;
  numero: string;
  fechaVencimiento: string;
  diasParaVencer: number;
  estadoDocumento: EstadoDocumento;
  estadoAlerta: EstadoAlerta;
}

export interface ResumenAlertas {
  vencidos: number;
  porVencer30: number;
  porVencer60: number;
  porVencer90: number;
  vigentes: number;
  total: number;
  multasPendientes: number;
  arraigosActivos: number;
}
