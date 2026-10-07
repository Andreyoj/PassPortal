export type Rol = 'OPERADOR' | 'SUPERVISOR' | 'ADMINISTRADOR';
export interface EmpleadoAutenticado { id: number; usuario: string; nombreCompleto: string; correo: string; rol: Rol; }
export interface LoginResponse { empleado: EmpleadoAutenticado; token: string; }
