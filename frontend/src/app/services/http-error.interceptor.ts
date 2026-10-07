import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { esApiErrorResponse } from '../models/api.model';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 && !req.url.endsWith('/auth/login')) auth.logout();
      const message = error.status === 0
        ? 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.'
        : esApiErrorResponse(error.error) ? error.error.error.mensaje : 'Ocurrió un error inesperado. Intenta nuevamente.';
      notifications.error(message);
    }
    return throwError(() => error);
  }));
};
