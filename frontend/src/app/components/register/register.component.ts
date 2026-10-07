import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { EmpleadoAutenticado } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <main class="auth-page">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="registrar()">
        <a routerLink="/login" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          <span>Volver al inicio</span>
        </a>

        <header class="auth-header">
          <h1>Crear cuenta</h1>
          <p>Las cuentas nuevas se crean como usuario normal.</p>
        </header>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre completo</mat-label>
          <input matInput formControlName="nombreCompleto" placeholder="Ej. Juan Pérez" />
          @if (form.controls.nombreCompleto.touched && form.controls.nombreCompleto.invalid) {
            <mat-error>Ingresa tu nombre completo.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Usuario</mat-label>
          <input matInput formControlName="usuario" placeholder="Ej. jperez" />
          @if (form.controls.usuario.touched && form.controls.usuario.invalid) {
            <mat-error>Ingresa un nombre de usuario.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" formControlName="correo" placeholder="correo@ejemplo.com" />
          @if (form.controls.correo.touched && form.controls.correo.invalid) {
            <mat-error>Ingresa un correo electrónico válido.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contraseña</mat-label>
          <input matInput type="password" formControlName="password" placeholder="••••••••••" />
          <mat-hint>Mínimo 10 caracteres.</mat-hint>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <mat-error>Usa al menos 10 caracteres.</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <div class="error-banner">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
        }

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="submit-button"
          [disabled]="cargando()"
        >
          {{ cargando() ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>
    </main>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--mat-sys-surface-container-low);
    }

    .auth-card {
      width: min(100%, 460px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--mat-sys-surface);
      padding: 36px 32px;
      border-radius: var(--border-radius-md, 12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--primary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 8px;
      align-self: flex-start;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .auth-header {
      margin-bottom: 8px;

      h1 {
        margin: 0 0 4px 0;
        font-size: 1.85rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }
    }

    .full-width {
      width: 100%;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--border-radius-sm, 6px);
      background: var(--pp-rojo-fondo);
      color: var(--pp-rojo);
      font-size: 0.9rem;
      font-weight: 500;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .submit-button {
      margin-top: 12px;
      height: 44px;
      font-size: 0.95rem;
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 24px 20px;
      }
    }
  `],
})
export class RegisterComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', Validators.required],
    usuario: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected registrar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.cargando.set(true);
    this.error.set('');

    this.http
      .post<ApiSuccessResponse<EmpleadoAutenticado>>(
        `${environment.apiUrl}/api/auth/register`,
        this.form.getRawValue()
      )
      .subscribe({
        next: () => void this.router.navigate(['/login']),
        error: (e: { error?: { error?: { mensaje?: string } } }) => {
          this.error.set(e.error?.error?.mensaje ?? 'No se pudo crear la cuenta.');
          this.cargando.set(false);
        },
      });
  }
}