export type Sexo = 'M' | 'F' | 'X';
export type TipoDocumento = 'PASAPORTE' | 'RESIDENCIA' | 'VISA' | 'PERMISO_TEMPORAL';
export type EstadoDocumento = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
export type EstadoAlerta = 'VERDE' | 'AMARILLO' | 'ROJO';
export type EstadoMulta = 'PENDIENTE' | 'PAGADA' | 'ANULADA';
export type TipoRestriccion = 'ARRAIGO' | 'BLOQUEO_LEGAL' | 'RESTRICCION_SALIDA';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export type NombreRol = 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR';

export interface Rol {
	id: number;
	nombre: NombreRol;
	descripcion: string;
}

export interface Empleado {
	id: number;
	rolId: number;
	nombreCompleto: string;
	usuario: string;
	correo: string;
	activo: boolean;
	creadoEn: string;
	actualizadoEn: string;
}

export interface TipoDocumentoCatalogo {
	id: number;
	codigo: TipoDocumento;
	nombre: string;
}

export interface Ciudadano {
	id: number;
	dpi: string;
	nombres: string;
	apellidos: string;
	fechaNacimiento: string;
	sexo: Sexo;
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
	tipo: TipoMovimiento;
	fechaHora: string;
	puestoControl: string;
	paisOrigenDestino: string;
	creadoEn: string;
}

export interface FichaCiudadano extends Ciudadano {
	documentos: Documento[];
	multas: Multa[];
	restricciones: Restriccion[];
	movimientos: MovimientoMigratorio[];
}
