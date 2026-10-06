import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { esApiErrorResponse } from '../models/api.model';
import { NotificationService } from './notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      const message = error.status === 0
        ? 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.'
        : esApiErrorResponse(error.error) ? error.error.error.mensaje : 'Ocurrió un error inesperado. Intenta nuevamente.';
      notifications.error(message);
    }
    return throwError(() => error);
  }));
};
