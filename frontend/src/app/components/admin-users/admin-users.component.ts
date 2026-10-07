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
  template: `
    <section class="users-page">
      <header class="header">
        <p class="eyebrow">Administración</p>
        <h1>Usuarios y roles</h1>
        <p class="subtitle">Crea, edita, activa o desactiva cualquier cuenta del sistema.</p>
      </header>

      <mat-card class="form-card card">
        <h2>{{editandoId() ? 'Editar usuario' : 'Nuevo usuario'}}</h2>
        <form [formGroup]="form" (ngSubmit)="guardar()">
          <mat-form-field appearance="outline">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="nombreCompleto" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Usuario</mat-label>
            <input matInput formControlName="usuario" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Correo</mat-label>
            <input matInput formControlName="correo" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>DPI de ficha ciudadana (opcional)</mat-label>
            <input matInput formControlName="dpiCiudadano" placeholder="Ej. 2000000000101" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña {{editandoId() ? '(opcional)' : ''}}</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Rol</mat-label>
            <mat-select formControlName="rol">
              @for(rol of roles; track rol){
                <mat-option [value]="rol">{{rol}}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit">
              {{editandoId() ? 'Guardar cambios' : 'Crear usuario'}}
            </button>
            @if(editandoId()){
              <button mat-button type="button" (click)="cancelarEdicion()">Cancelar</button>
            }
          </div>
        </form>
      </mat-card>

      <div class="user-grid">
        @for(user of usuarios(); track user.id){
          <mat-card class="user-card card">
            <div class="user-card__header">
              <h3>{{user.nombreCompleto}}</h3>
              <span class="status-badge" [class.inactive]="!user.activo">
                {{user.activo ? 'Activo' : 'Inactivo'}}
              </span>
            </div>
            <p class="user-info">{{user.usuario}} · {{user.correo}}</p>
            <div class="user-card__details">
              <span class="role-tag">{{user.rol}}</span>
              <span class="ficha-tag">{{user.ciudadanoId ? 'Ficha #' + user.ciudadanoId : 'Sin ficha vinculada'}}</span>
            </div>
            <div class="user-card__actions">
              <button mat-stroked-button (click)="editar(user)">Editar</button>
              <button mat-stroked-button (click)="alternar(user)">{{user.activo ? 'Desactivar' : 'Activar'}}</button>
            </div>
          </mat-card>
        }
      </div>
    </section>
  `,
  styles: [`
    .users-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px;
    }

    .header {
      margin-bottom: 24px;
    }

    .eyebrow {
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      margin: 0 0 4px 0;
    }

    .header h1 {
      margin: 0 0 8px 0;
      color: var(--text-primary);
      font-size: 1.85rem;
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
    }

    .form-card {
      padding: 24px;
      margin-bottom: 32px;
    }

    .form-card h2 {
      margin: 0 0 20px 0;
      color: var(--text-primary);
      font-size: 1.3rem;
    }

    .users-page form {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 8px;
    }

    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .user-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .user-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .user-card h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .user-info {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      word-break: break-all;
    }

    .user-card__details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .role-tag {
      background-color: var(--pp-marino-profundo);
      color: var(--primary);
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .ficha-tag {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background-color: rgba(46, 125, 50, 0.12);
      color: var(--pp-verde);

      &.inactive {
        background-color: rgba(183, 28, 28, 0.12);
        color: var(--pp-rojo);
      }
    }

    .user-card__actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 8px;

      button {
        flex: 1;
      }
    }

    @media (max-width: 768px) {
      .users-page form {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AdminUsersComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  protected readonly roles: Rol[] = ['USUARIO', 'PERSONAL', 'ADMINISTRADOR'];
  protected readonly usuarios = signal<EmpleadoListado[]>([]);
  protected readonly editandoId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', Validators.required],
    usuario: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    dpiCiudadano: [''],
    password: ['', [Validators.required, Validators.minLength(10)]],
    rol: ['USUARIO' as Rol, Validators.required]
  });

  constructor() {
    this.cargar();
  }

  private endpoint = `${environment.apiUrl}/api/auth`;

  protected cargar(): void {
    this.http.get<ApiSuccessResponse<EmpleadoListado[]>>(`${this.endpoint}/users`).subscribe({
      next: r => this.usuarios.set(r.data)
    });
  }

  protected guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const body = { ...value, ciudadanoId: value.dpiCiudadano || null };

    if (this.editandoId()) {
      this.http.put<ApiSuccessResponse<EmpleadoListado>>(`${this.endpoint}/users/${this.editandoId()}`, body).subscribe({
        next: () => {
          this.cancelarEdicion();
          this.cargar();
        }
      });
    } else {
      this.http.post<ApiSuccessResponse<EmpleadoListado>>(`${this.endpoint}/users`, body).subscribe({
        next: () => {
          this.form.reset({ rol: 'USUARIO', dpiCiudadano: '' });
          this.cargar();
        }
      });
    }
  }

  protected editar(user: EmpleadoListado): void {
    this.editandoId.set(user.id);
    this.form.patchValue({
      nombreCompleto: user.nombreCompleto,
      usuario: user.usuario,
      correo: user.correo,
      rol: user.rol,
      password: '',
      dpiCiudadano: user.ciudadanoId ? String(user.ciudadanoId) : ''
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset({ rol: 'USUARIO', dpiCiudadano: '' });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(10)]);
    this.form.controls.password.updateValueAndValidity();
  }

  protected alternar(user: EmpleadoListado): void {
    this.http.put<ApiSuccessResponse<EmpleadoListado>>(`${this.endpoint}/users/${user.id}`, {
      nombreCompleto: user.nombreCompleto,
      correo: user.correo,
      activo: !user.activo,
      rol: user.rol
    }).subscribe({
      next: () => this.cargar()
    });
  }
}