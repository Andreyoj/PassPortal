import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { FichaCiudadano, SolicitudMovimiento } from '../../models/domain.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-citizen-self',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
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
              @if (form.controls.dpi.hasError('required') && form.controls.dpi.touched) {
                <mat-error>El DPI es obligatorio.</mat-error>
              } @else if (form.controls.dpi.hasError('pattern') && form.controls.dpi.touched) {
                <mat-error>El DPI debe contener entre 8 y 20 dígitos.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Nombres</mat-label>
              <input matInput formControlName="nombres" />
              @if (form.controls.nombres.hasError('required') && form.controls.nombres.touched) {
                <mat-error>Los nombres son obligatorios.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Apellidos</mat-label>
              <input matInput formControlName="apellidos" />
              @if (form.controls.apellidos.hasError('required') && form.controls.apellidos.touched) {
                <mat-error>Los apellidos son obligatorios.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>Fecha de nacimiento</mat-label>
              <input matInput type="date" formControlName="fechaNacimiento" />
              @if (form.controls.fechaNacimiento.hasError('required') && form.controls.fechaNacimiento.touched) {
                <mat-error>La fecha de nacimiento es obligatoria.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>Sexo</mat-label>
              <mat-select formControlName="sexo">
                <mat-option value="F">Femenino</mat-option>
                <mat-option value="M">Masculino</mat-option>
                <mat-option value="X">Otro</mat-option>
              </mat-select>
              @if (form.controls.sexo.hasError('required') && form.controls.sexo.touched) {
                <mat-error>Selecciona un sexo.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-1">
              <mat-label>Nacionalidad</mat-label>
              <input matInput formControlName="nacionalidad" />
              @if (form.controls.nacionalidad.hasError('required') && form.controls.nacionalidad.touched) {
                <mat-error>La nacionalidad es obligatoria.</mat-error>
              }
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

        <section class="requests-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Trámite personal</p>
              <h2>Solicitar movimiento migratorio</h2>
              <p>Indica desde dónde viajas, hacia dónde vas y la fecha prevista. El personal revisará tu solicitud.</p>
            </div>
            <mat-icon aria-hidden="true">flight_takeoff</mat-icon>
          </div>

          <mat-card class="card request-card">
            <form [formGroup]="solicitudForm" (ngSubmit)="solicitarMovimiento()" class="request-form">
              <mat-form-field appearance="outline">
                <mat-label>País de origen</mat-label>
                <input matInput formControlName="paisOrigen" placeholder="Ej. Guatemala" />
                @if (solicitudForm.controls.paisOrigen.hasError('required') && solicitudForm.controls.paisOrigen.touched) {
                  <mat-error>Indica el país de origen.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>País de destino</mat-label>
                <input matInput formControlName="paisDestino" placeholder="Ej. México" />
                @if (solicitudForm.controls.paisDestino.hasError('required') && solicitudForm.controls.paisDestino.touched) {
                  <mat-error>Indica el país de destino.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha prevista</mat-label>
                <input matInput type="date" formControlName="fechaSolicitada" />
                @if (solicitudForm.controls.fechaSolicitada.hasError('required') && solicitudForm.controls.fechaSolicitada.touched) {
                  <mat-error>Selecciona una fecha.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="request-reason">
                <mat-label>Motivo del movimiento</mat-label>
                <textarea matInput rows="3" formControlName="motivo" placeholder="Describe brevemente el motivo del viaje"></textarea>
                @if (solicitudForm.controls.motivo.hasError('required') && solicitudForm.controls.motivo.touched) {
                  <mat-error>El motivo es obligatorio.</mat-error>
                }
              </mat-form-field>

              @if (solicitudError()) {
                <p class="request-error" role="alert"><mat-icon>error</mat-icon>{{ solicitudError() }}</p>
              }

              <button mat-flat-button color="primary" type="submit" [disabled]="solicitudGuardando()">
                <mat-icon>send</mat-icon>
                {{ solicitudGuardando() ? 'Enviando...' : 'Enviar solicitud' }}
              </button>
            </form>
          </mat-card>

          <div class="requests-heading">
            <h2>Mis solicitudes</h2>
            <span>{{ solicitudes().length }} registradas</span>
          </div>
          @if (solicitudes().length) {
            <div class="requests-list">
              @for (solicitud of solicitudes(); track solicitud.id) {
                <mat-card class="card request-item">
                  <div class="request-route">
                    <span>{{ solicitud.paisOrigen }}</span>
                    <mat-icon>arrow_forward</mat-icon>
                    <strong>{{ solicitud.paisDestino }}</strong>
                  </div>
                  <div class="request-meta">
                    <span>Fecha prevista: {{ solicitud.fechaSolicitada | date:'dd/MM/yyyy' }}</span>
                    <span class="request-status" [class]="'request-status request-status--' + solicitud.estado.toLowerCase()">
                      {{ solicitud.estado }}
                    </span>
                  </div>
                  @if (solicitud.comentarioResolucion) {
                    <small class="request-comment">{{ solicitud.comentarioResolucion }}</small>
                  }
                </mat-card>
              }
            </div>
          } @else {
            <mat-card class="card empty-request"><mat-icon>map</mat-icon><span>Aún no has enviado solicitudes.</span></mat-card>
          }
        </section>
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

    .requests-section {
      margin-top: 32px;
    }

    .section-heading, .requests-heading {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;

      h2, p { margin: 0; }
      h2 { color: var(--text-primary); font-size: 1.3rem; }
      p:not(.eyebrow) { margin-top: 6px; color: var(--text-secondary); font-size: 0.92rem; }
      > mat-icon { color: var(--primary); font-size: 32px; width: 32px; height: 32px; }
    }

    .request-form {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      mat-form-field { width: 100%; }
      .request-reason { grid-column: 1 / -1; }
      button { justify-self: end; }
    }

    .request-error {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--pp-rojo);
      font-size: 0.88rem;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .requests-heading {
      align-items: center;
      margin-top: 28px;
      margin-bottom: 12px;
      span { color: var(--text-secondary); font-size: 0.82rem; }
    }

    .requests-list { display: grid; gap: 10px; }

    .request-item { padding: 16px 20px; }
    .request-route { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 1rem; mat-icon { color: var(--primary); } strong { color: var(--text-primary); } }
    .request-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; color: var(--text-secondary); font-size: 0.85rem; }
    .request-status { padding: 4px 9px; border-radius: 999px; font-weight: 700; font-size: 0.72rem; }
    .request-status--pendiente { background: rgba(214, 158, 46, 0.15); color: #8a5e00; }
    .request-status--aprobada { background: rgba(46, 125, 50, 0.13); color: var(--pp-verde); }
    .request-status--rechazada { background: var(--pp-rojo-fondo); color: var(--pp-rojo); }
    .request-comment { display: block; margin-top: 10px; color: var(--text-secondary); }
    .empty-request { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--text-secondary); }

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

      .request-form { grid-template-columns: 1fr; .request-reason, .request-error { grid-column: auto; } button { width: 100%; } }
      .request-meta { align-items: flex-start; flex-direction: column; }
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
  protected readonly solicitudes = signal<SolicitudMovimiento[]>([]);
  protected readonly solicitudGuardando = signal(false);
  protected readonly solicitudError = signal('');

  protected readonly solicitudForm = this.fb.nonNullable.group({
    paisOrigen: ['', Validators.required],
    paisDestino: ['', Validators.required],
    fechaSolicitada: [new Date().toISOString().slice(0, 10), Validators.required],
    motivo: ['', Validators.required],
  });

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
      next: f => {
        this.ficha.set(f);
        this.cargarSolicitudes();
      },
      error: () => {}
    });
  }

  private cargarSolicitudes(): void {
    this.api.obtenerMisSolicitudesMovimiento().subscribe({
      next: solicitudes => this.solicitudes.set(solicitudes),
      error: () => this.solicitudError.set('No se pudieron cargar tus solicitudes.'),
    });
  }

  protected solicitarMovimiento(): void {
    this.solicitudForm.markAllAsTouched();
    if (this.solicitudForm.invalid) return;
    this.solicitudGuardando.set(true);
    this.solicitudError.set('');
    this.api.crearSolicitudMovimiento(this.solicitudForm.getRawValue()).subscribe({
      next: solicitud => {
        this.solicitudes.update(actuales => [solicitud, ...actuales]);
        this.solicitudForm.reset({ fechaSolicitada: new Date().toISOString().slice(0, 10), paisOrigen: '', paisDestino: '', motivo: '' });
        this.solicitudGuardando.set(false);
      },
      error: error => {
        this.solicitudError.set(error.error?.error?.mensaje ?? 'No se pudo enviar la solicitud.');
        this.solicitudGuardando.set(false);
      },
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