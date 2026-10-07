export type Rol = 'USUARIO' | 'PERSONAL' | 'ADMINISTRADOR';
export interface EmpleadoAutenticado { id: number; usuario: string; nombreCompleto: string; correo: string; rol: Rol; }
export interface LoginResponse { empleado: EmpleadoAutenticado; token: string; }
export interface EmpleadoListado extends EmpleadoAutenticado { activo: boolean; creadoEn: string; }
