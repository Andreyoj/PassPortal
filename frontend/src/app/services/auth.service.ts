import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ApiSuccessResponse } from '../models/api.model';
import type { EmpleadoAutenticado, LoginResponse, Rol } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly http = inject(HttpClient);
	private readonly router = inject(Router);
	readonly empleado = signal<EmpleadoAutenticado | null>(this.leerEmpleado());
	readonly autenticado = signal(Boolean(sessionStorage.getItem('passportal_token')));

	login(usuario: string, password: string) {
		return this.http.post<ApiSuccessResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/login`, { usuario, password }).pipe(
			map((response) => response.data),
			tap((resultado) => { sessionStorage.setItem('passportal_token', resultado.token); sessionStorage.setItem('passportal_empleado', JSON.stringify(resultado.empleado)); this.empleado.set(resultado.empleado); this.autenticado.set(true); }),
		);
	}
	logout(): void { sessionStorage.removeItem('passportal_token'); sessionStorage.removeItem('passportal_empleado'); this.empleado.set(null); this.autenticado.set(false); void this.router.navigate(['/login']); }
	tieneRol(...roles: Rol[]): boolean { const rol = this.empleado()?.rol; return rol !== undefined && roles.includes(rol); }
	token(): string | null { return sessionStorage.getItem('passportal_token'); }
	private leerEmpleado(): EmpleadoAutenticado | null { try { const value = sessionStorage.getItem('passportal_empleado'); return value ? JSON.parse(value) as EmpleadoAutenticado : null; } catch { return null; } }
}
