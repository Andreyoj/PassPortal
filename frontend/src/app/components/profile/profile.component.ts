import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { EmpleadoAutenticado } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `<section class="profile-page"><header><p class="eyebrow">Cuenta personal</p><h1>Mi perfil</h1><p>Revisa y actualiza tus datos de acceso.</p></header><mat-card><div class="identity"><span class="avatar">{{ iniciales() }}</span><div><h2>{{auth.empleado()?.nombreCompleto}}</h2><span>{{auth.empleado()?.rol}}</span></div></div><form [formGroup]="form" (ngSubmit)="guardar()"><mat-form-field appearance="outline"><mat-label>Nombre completo</mat-label><input matInput formControlName="nombreCompleto" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput formControlName="correo" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Nueva contraseña (opcional)</mat-label><input matInput type="password" formControlName="password" /><mat-hint>Mínimo 10 caracteres.</mat-hint></mat-form-field>@if(mensaje()){<p>{{mensaje()}}</p>}<button mat-flat-button type="submit">Guardar cambios</button></form></mat-card></section>`,
  styles: [`.profile-page{max-width:720px;margin:auto}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase}.identity{display:flex;align-items:center;gap:16px;margin-bottom:24px}.identity h2{margin:0 0 4px}.avatar{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:var(--pp-marino);color:#fff;font-weight:700}.profile-page mat-card{padding:24px}.profile-page form{display:grid;gap:8px}`],
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService); private readonly http = inject(HttpClient); private readonly fb = inject(FormBuilder);
  protected readonly mensaje = signal(''); protected readonly form = this.fb.nonNullable.group({ nombreCompleto: [this.auth.empleado()?.nombreCompleto ?? '', Validators.required], correo: [this.auth.empleado()?.correo ?? '', [Validators.required, Validators.email]], password: ['', Validators.minLength(10)] });
  protected iniciales(): string { return (this.auth.empleado()?.nombreCompleto ?? '').split(/\s+/).slice(0,2).map((x)=>x[0]).join('').toUpperCase(); }
  protected guardar(): void { if(this.form.invalid)return; this.http.put<ApiSuccessResponse<EmpleadoAutenticado>>(`${environment.apiUrl}/api/auth/me`, this.form.getRawValue()).subscribe({next:r=>{this.auth.empleado.set(r.data);this.mensaje.set('Perfil actualizado correctamente.');this.form.controls.password.reset();},error:()=>this.mensaje.set('No se pudo actualizar el perfil.')}); }
}
