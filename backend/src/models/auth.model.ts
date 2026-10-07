import type { NombreRol } from './domain.model';

export interface EmpleadoAutenticado {
	id: number;
	usuario: string;
	nombreCompleto: string;
	correo: string;
	rol: NombreRol;
}

export interface JwtPayload {
	sub: string;
	usuario: string;
	rol: NombreRol;
}
