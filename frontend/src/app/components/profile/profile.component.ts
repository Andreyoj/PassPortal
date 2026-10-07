import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { EmpleadoAutenticado } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <section class="profile-page">
      <header class="header">
        <p class="eyebrow">Cuenta personal</p>
        <h1>Mi perfil</h1>
        <p class="subtitle">Revisa y actualiza tus datos de acceso.</p>
      </header>

      <mat-card class="profile-card">
        <div class="identity">
          <span class="avatar">{{ iniciales() }}</span>
          <div class="identity-info">
            <h2>{{ auth.empleado()?.nombreCompleto }}</h2>
            <span class="role-badge">{{ auth.empleado()?.rol }}</span>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()" class="profile-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="nombreCompleto" placeholder="Tu nombre completo" maxlength="120" />
            @if (form.controls.nombreCompleto.hasError('required')) {
              <mat-error>El nombre completo es obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Correo electrónico</mat-label>
            <input matInput formControlName="correo" type="email" placeholder="correo@ejemplo.com" maxlength="120" />
            @if (form.controls.correo.hasError('required')) {
              <mat-error>El correo es obligatorio</mat-error>
            }
            @if (form.controls.correo.hasError('email')) {
              <mat-error>Ingresa un correo electrónico válido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nueva contraseña (opcional)</mat-label>
            <input matInput type="password" formControlName="password" placeholder="••••••••••" />
            <mat-hint>Mínimo 10 caracteres.</mat-hint>
            @if (form.controls.password.hasError('minlength')) {
              <mat-error>La contraseña debe tener al menos 10 caracteres</mat-error>
            }
          </mat-form-field>

          @if (mensaje()) {
            <p class="status-message" [class.error]="esError()">
              <mat-icon>{{ esError() ? 'error' : 'check_circle' }}</mat-icon>
              <span>{{ mensaje() }}</span>
            </p>
          }

          <div class="form-actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || guardando()"
            >
              {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </mat-card>
    </section>
  `,
  styles: [`
    .profile-page {
      max-width: 680px;
      margin: 0 auto;
      padding: 16px 0;
    }

    .header {
      margin-bottom: 24px;

      .eyebrow {
        color: var(--primary);
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
        margin: 0 0 4px 0;
      }

      h1 {
        margin: 0 0 6px 0;
        font-size: 1.85rem;
        color: var(--text-primary);
      }

      .subtitle {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }
    }

    .profile-card {
      padding: 28px;
      border-radius: var(--border-radius-md);
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);

      .avatar {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--pp-marino, #1b365d);
        color: #ffffff;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
      }

      .identity-info {
        h2 {
          margin: 0 0 6px 0;
          font-size: 1.25rem;
          color: var(--text-primary);
        }
      }

      .role-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .full-width {
        width: 100%;
      }
    }

    .status-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      padding: 10px 14px;
      border-radius: var(--border-radius-sm);
      background: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
      font-size: 0.9rem;
      font-weight: 500;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.error {
        background: var(--pp-rojo-fondo);
        color: var(--pp-rojo);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;

      button {
        padding: 0 24px;
        height: 44px;
      }
    }

    @media (max-width: 600px) {
      .profile-card {
        padding: 20px 16px;
      }

      .identity {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `],
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  protected readonly mensaje = signal('');
  protected readonly esError = signal(false);
  protected readonly guardando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombreCompleto: [this.auth.empleado()?.nombreCompleto ?? '', Validators.required],
    correo: [this.auth.empleado()?.correo ?? '', [Validators.required, Validators.email]],
    password: ['', Validators.minLength(10)],
  });

  protected iniciales(): string {
    return (this.auth.empleado()?.nombreCompleto ?? '')
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase();
  }

  protected guardar(): void {
    if (this.form.invalid) return;

    this.guardando.set(true);
    this.mensaje.set('');
    this.esError.set(false);

    this.http
      .put<ApiSuccessResponse<EmpleadoAutenticado>>(
        `${environment.apiUrl}/api/auth/me`,
        this.form.getRawValue()
      )
      .subscribe({
        next: (r) => {
          this.auth.empleado.set(r.data);
          this.mensaje.set('Perfil actualizado correctamente.');
          this.esError.set(false);
          this.guardando.set(false);
          this.form.controls.password.reset();
        },
        error: () => {
          this.mensaje.set('No se pudo actualizar el perfil.');
          this.esError.set(true);
          this.guardando.set(false);
        },
      });
  }
}