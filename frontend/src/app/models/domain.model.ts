export type EstadoDocumento = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
export type EstadoAlerta = 'VERDE' | 'AMARILLO' | 'ROJO';
export type EstadoMulta = 'PENDIENTE' | 'PAGADA' | 'ANULADA';
export type TipoRestriccion = 'ARRAIGO' | 'BLOQUEO_LEGAL' | 'RESTRICCION_SALIDA';
export type EstadoSolicitudMovimiento = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface Ciudadano {
  id: number;
  dpi: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F' | 'X';
  nacionalidad: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  fotoUrl: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Documento {
  id: number;
  ciudadanoId: number;
  tipoDocumentoId: number;
  numero: string;
  paisEmisor: string;
  fechaEmision: string;
  fechaVencimiento: string;
  observaciones: string | null;
  estado: EstadoDocumento;
  estadoAlerta: EstadoAlerta;
}

export interface Multa {
  id: number;
  ciudadanoId: number;
  concepto: string;
  monto: number;
  moneda: string;
  estado: EstadoMulta;
  fechaRegistro: string;
  fechaPago: string | null;
  registradoPor: number | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Restriccion {
  id: number;
  ciudadanoId: number;
  tipo: TipoRestriccion;
  motivo: string;
  autoridad: string;
  numeroExpediente: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  registradoPor: number | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface MovimientoMigratorio {
  id: number;
  ciudadanoId: number;
  documentoId: number | null;
  tipo: 'ENTRADA' | 'SALIDA';
  fechaHora: string;
  puestoControl: string;
  paisOrigenDestino: string;
  creadoEn: string;
}

export interface SolicitudMovimiento {
  id: number;
  ciudadanoId: number;
  nombreCiudadano: string;
  dpiCiudadano: string;
  nacionalidadCiudadano: string;
  paisOrigen: string;
  paisDestino: string;
  fechaSolicitada: string;
  motivo: string;
  estado: EstadoSolicitudMovimiento;
  comentarioResolucion: string | null;
  revisadoPor: number | null;
  revisadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface FichaCiudadano extends Ciudadano {
  documentos: Documento[];
  multas: Multa[];
  restricciones: Restriccion[];
  movimientos: MovimientoMigratorio[];
  restriccionActiva: boolean;
  totalMultasPendientes: number;
}
