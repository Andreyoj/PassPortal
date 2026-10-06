import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  exito(mensaje: string): void { this.snackBar.open(mensaje, 'Cerrar', { duration: 4000, panelClass: 'pp-snack-exito' }); }
  error(mensaje: string): void { this.snackBar.open(mensaje, 'Cerrar', { duration: 7000, panelClass: 'pp-snack-error' }); }
}
