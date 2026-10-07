import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { EmpleadoListado, Rol } from '../../models/auth.model';

@Component({
  selector: 'app-admin-users',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  template: `<section class="users-page"><header><p class="eyebrow">Administración</p><h1>Usuarios y roles</h1><p>Crea, edita, activa o desactiva cualquier cuenta del sistema.</p></header><mat-card><h2>{{editandoId() ? 'Editar usuario' : 'Nuevo usuario'}}</h2><form [formGroup]="form" (ngSubmit)="guardar()"><mat-form-field appearance="outline"><mat-label>Nombre completo</mat-label><input matInput formControlName="nombreCompleto" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Usuario</mat-label><input matInput formControlName="usuario" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput formControlName="correo" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Contraseña {{editandoId() ? '(opcional)' : ''}}</mat-label><input matInput type="password" formControlName="password" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Rol</mat-label><mat-select formControlName="rol">@for(rol of roles;track rol){<mat-option [value]="rol">{{rol}}</mat-option>}</mat-select></mat-form-field><button mat-flat-button type="submit">{{editandoId() ? 'Guardar cambios' : 'Crear usuario'}}</button>@if(editandoId()){<button mat-button type="button" (click)="cancelarEdicion()">Cancelar</button>}</form></mat-card><div class="user-grid">@for(user of usuarios();track user.id){<mat-card><h3>{{user.nombreCompleto}}</h3><p>{{user.usuario}} · {{user.correo}}</p><strong>{{user.rol}}</strong><span [class.inactive]="!user.activo">{{user.activo?'Activo':'Inactivo'}}</span><div><button mat-stroked-button (click)="editar(user)">Editar</button><button mat-stroked-button (click)="alternar(user)">{{user.activo?'Desactivar':'Activar'}}</button></div></mat-card>}</div></section>`,
  styles: [`.users-page{max-width:1100px;margin:auto}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase}.users-page>mat-card{padding:24px;margin:24px 0}.users-page form{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.user-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.user-grid mat-card{padding:20px;display:grid;gap:8px}.user-grid h3,.user-grid p{margin:0}.inactive{color:var(--pp-rojo)}@media(max-width:700px){.users-page form{grid-template-columns:1fr}}`],
})
export class AdminUsersComponent {
  private readonly http = inject(HttpClient); private readonly fb = inject(FormBuilder);
  protected readonly roles: Rol[] = ['USUARIO','PERSONAL','ADMINISTRADOR']; protected readonly usuarios = signal<EmpleadoListado[]>([]); protected readonly editandoId = signal<number | null>(null);
  protected readonly form = this.fb.nonNullable.group({nombreCompleto:['',Validators.required],usuario:['',Validators.required],correo:['',[Validators.required,Validators.email]],password:['',[Validators.required,Validators.minLength(10)]],rol:['USUARIO' as Rol,Validators.required]});
  constructor(){this.cargar();}
  private endpoint = `${environment.apiUrl}/api/auth`;
  protected cargar(): void {this.http.get<ApiSuccessResponse<EmpleadoListado[]>>(`${this.endpoint}/users`).subscribe({next:r=>this.usuarios.set(r.data)});}
  protected guardar(): void {this.form.markAllAsTouched();if(this.form.invalid)return;const value=this.form.getRawValue();if(this.editandoId()){this.http.put<ApiSuccessResponse<EmpleadoListado>>(`${this.endpoint}/users/${this.editandoId()}`,value).subscribe({next:()=>{this.cancelarEdicion();this.cargar();}});}else{this.http.post<ApiSuccessResponse<EmpleadoListado>>(`${this.endpoint}/users`,value).subscribe({next:()=>{this.form.reset({rol:'USUARIO'});this.cargar();}});}}
  protected editar(user: EmpleadoListado): void {this.editandoId.set(user.id);this.form.patchValue({nombreCompleto:user.nombreCompleto,usuario:user.usuario,correo:user.correo,rol:user.rol,password:''});this.form.controls.password.clearValidators();this.form.controls.password.updateValueAndValidity();}
  protected cancelarEdicion(): void {this.editandoId.set(null);this.form.reset({rol:'USUARIO'});this.form.controls.password.setValidators([Validators.required,Validators.minLength(10)]);this.form.controls.password.updateValueAndValidity();}
  protected alternar(user: EmpleadoListado): void {this.http.put<ApiSuccessResponse<EmpleadoListado>>(`${this.endpoint}/users/${user.id}`,{nombreCompleto:user.nombreCompleto,correo:user.correo,activo:!user.activo,rol:user.rol}).subscribe({next:()=>this.cargar()});}
}
