import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { FichaCiudadano } from '../../models/domain.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-citizen-self',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <section class="self-page">
      <header class="header">
        <p class="eyebrow">Ciudadano</p>
        <h1>Mi información migratoria</h1>
        <p class="subtitle">Completa tu ficha para consultar tus documentos, movimientos y obligaciones.</p>
      </header>

      @if(!ficha()){
        <mat-card class="card form-card">
          <div class="card-header">
            <h2>Crear mi ficha</h2>
            <p>Estos datos se guardan en tu registro migratorio y solo tú y el personal autorizado podrán consultarlos.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>DPI</mat-label>
              <input matInput formControlName="dpi" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Nombres</mat-label>
              <input matInput formControlName="nombres" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Apellidos</mat-label>
              <input matInput formControlName="apellidos" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>Fecha de nacimiento</mat-label>
              <input matInput type="date" formControlName="fechaNacimiento" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>Sexo</mat-label>
              <mat-select formControlName="sexo">
                <mat-option value="F">Femenino</mat-option>
                <mat-option value="M">Masculino</mat-option>
                <mat-option value="X">Otro</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>Nacionalidad</mat-label>
              <input matInput formControlName="nacionalidad" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="telefono" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Dirección</mat-label>
              <input matInput formControlName="direccion" />
            </mat-form-field>

            @if(error()){
              <div class="error-container col-span-2">
                <p class="error">{{error()}}</p>
              </div>
            }

            <div class="form-actions col-span-2">
              <button mat-flat-button color="primary" type="submit" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar ficha' }}
              </button>
            </div>
          </form>
        </mat-card>
      } @else {
        <mat-card class="card ready-card">
          <div class="ready-content">
            <span class="status-badge">Ficha activa</span>
            <h2>Ficha creada correctamente</h2>
            <p class="user-details">{{ficha()?.nombres}} {{ficha()?.apellidos}} · <strong>DPI:</strong> {{ficha()?.dpi}}</p>
            <button mat-flat-button color="primary" (click)="abrirFicha()">Ver mi ficha completa</button>
          </div>
        </mat-card>
      }
    </section>
  `,
  styles: [`
    .self-page {
      max-width: 760px;
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
      padding: 28px;
    }

    .card-header {
      margin-bottom: 20px;

      h2 {
        margin: 0 0 6px 0;
        color: var(--text-primary);
        font-size: 1.3rem;
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.92rem;
      }
    }

    .self-page form {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .col-span-1 {
      grid-column: span 1;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    .error-container {
      margin-top: 4px;
    }

    .error {
      color: var(--pp-rojo);
      font-size: 0.88rem;
      margin: 0;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;

      button {
        padding: 0 24px;
      }
    }

    .ready-card {
      padding: 32px;
      text-align: center;
    }

    .ready-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.4rem;
      }
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 12px;
      background-color: rgba(46, 125, 50, 0.12);
      color: var(--pp-verde);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .user-details {
      margin: 0 0 12px 0;
      color: var(--text-secondary);
      font-size: 1.05rem;

      strong {
        color: var(--text-primary);
      }
    }

    @media (max-width: 650px) {
      .self-page form {
        grid-template-columns: 1fr;
      }

      .col-span-1, .col-span-2 {
        grid-column: span 1 !important;
      }

      .form-actions {
        button {
          width: 100%;
        }
      }
    }
  `],
})
export class CitizenSelfComponent {
  private readonly http = inject(HttpClient); 
  private readonly api = inject(ApiService); 
  private readonly router = inject(Router); 
  private readonly fb = inject(FormBuilder);

  protected readonly auth = inject(AuthService); 
  protected readonly ficha = signal<FichaCiudadano | null>(null); 
  protected readonly error = signal(''); 
  protected readonly guardando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    dpi: ['', [Validators.required, Validators.pattern(/^\d{8,20}$/)]],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    sexo: ['F' as 'M' | 'F' | 'X', Validators.required],
    nacionalidad: ['Guatemalteca', Validators.required],
    telefono: [''],
    direccion: ['']
  });

  constructor() {
    this.api.obtenerMiFicha().subscribe({
      next: f => this.ficha.set(f),
      error: () => {}
    });
  }

  protected guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.guardando.set(true);
    this.error.set('');

    this.http.put<ApiSuccessResponse<FichaCiudadano>>(`${environment.apiUrl}/api/auth/me/ficha`, this.form.getRawValue()).subscribe({
      next: r => {
        this.ficha.set(r.data);
        this.guardando.set(false);
      },
      error: e => {
        this.error.set(e.error?.error?.mensaje ?? 'No se pudo guardar la ficha.');
        this.guardando.set(false);
      }
    });
  }

  protected abrirFicha(): void { 
    void this.router.navigate(['/mi-informacion/ficha']); 
  }
}