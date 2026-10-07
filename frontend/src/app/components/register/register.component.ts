import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { EmpleadoAutenticado } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  template: `<main class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="registrar()"><a routerLink="/login">← Volver al inicio</a><h1>Crear cuenta</h1><p>Las cuentas nuevas se crean como usuario normal.</p><mat-form-field appearance="outline"><mat-label>Nombre completo</mat-label><input matInput formControlName="nombreCompleto" />@if(form.controls.nombreCompleto.touched && form.controls.nombreCompleto.invalid){<mat-error>Ingresa tu nombre.</mat-error>}</mat-form-field><mat-form-field appearance="outline"><mat-label>Usuario</mat-label><input matInput formControlName="usuario" />@if(form.controls.usuario.touched && form.controls.usuario.invalid){<mat-error>Ingresa un usuario.</mat-error>}</mat-form-field><mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput type="email" formControlName="correo" />@if(form.controls.correo.touched && form.controls.correo.invalid){<mat-error>Ingresa un correo válido.</mat-error>}</mat-form-field><mat-form-field appearance="outline"><mat-label>Contraseña</mat-label><input matInput type="password" formControlName="password" />@if(form.controls.password.touched && form.controls.password.invalid){<mat-error>Usa al menos 10 caracteres.</mat-error>}</mat-form-field>@if(error()){<p class="error">{{error()}}</p>}<button mat-flat-button type="submit" [disabled]="cargando()">Crear cuenta</button></form></main>`,
  styles: [`.auth-page{min-height:100dvh;display:grid;place-items:center;padding:24px;background:var(--mat-sys-surface-container-low)}.auth-card{width:min(100%,460px);display:grid;gap:8px;background:var(--mat-sys-surface);padding:32px;border-radius:8px}.auth-card h1{margin:20px 0 0}.auth-card p{color:var(--mat-sys-on-surface-variant)}.error{color:var(--pp-rojo)}`],
})
export class RegisterComponent {
  private readonly http = inject(HttpClient); private readonly router = inject(Router); private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({ nombreCompleto: ['', Validators.required], usuario: ['', Validators.required], correo: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(10)]] });
  protected readonly cargando = signal(false); protected readonly error = signal('');
  protected registrar(): void { this.form.markAllAsTouched(); if (this.form.invalid) return; this.cargando.set(true); this.http.post<ApiSuccessResponse<EmpleadoAutenticado>>(`${environment.apiUrl}/api/auth/register`, this.form.getRawValue()).subscribe({ next: () => void this.router.navigate(['/login']), error: (e: { error?: { error?: { mensaje?: string } } }) => { this.error.set(e.error?.error?.mensaje ?? 'No se pudo crear la cuenta.'); this.cargando.set(false); } }); }
}
