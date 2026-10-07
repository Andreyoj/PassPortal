import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import type { Rol } from '../models/auth.model';

export const authGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	return auth.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	return auth.esAdministrador() ? true : inject(Router).createUrlTree(['/perfil']);
};

export function roleGuard(...roles: Rol[]): CanActivateFn {
	return () => {
		const auth = inject(AuthService);
		return auth.tieneRol(...roles) ? true : inject(Router).createUrlTree(['/perfil']);
	};
}
