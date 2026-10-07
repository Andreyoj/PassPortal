import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import type { FichaCiudadano, Multa, Restriccion, TipoRestriccion } from '../../models/domain.model';
import { AdministrativeDialogComponent, ConfirmDialogComponent } from './administrative-dialog.component';
import { AuthService } from '../../services/auth.service';
import { colorAvatar, etiquetaEstado, textoDias } from '../../utils/presentation';

@Component({
  selector: 'app-ficha',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  template: `
    @if (cargando()) {
      <mat-progress-bar mode="indeterminate" aria-label="Cargando ficha" />
    }

    @if (error()) {
      <mat-card class="card message">
        <mat-icon class="error-icon">error</mat-icon>
        <span>{{ error() }}</span>
        <button mat-button (click)="cargar()">Reintentar</button>
      </mat-card>
    }

    @if (ficha(); as c) {
      @if (c.restriccionActiva) {
        <div class="banner">
          <mat-icon>gpp_maybe</mat-icon>
          <span><strong>Restricción activa:</strong> esta persona tiene un arraigo o bloqueo vigente.</span>
        </div>
      }

      <header class="profile">
        <div class="photo-wrap">
          <img
            [src]="fotoPreview() || foto(c.fotoUrl)"
            [alt]="'Fotografía de ' + c.nombres + ' ' + c.apellidos"
          />
          @if (auth.tieneRol('USUARIO', 'PERSONAL', 'ADMINISTRADOR')) {
            <label class="upload">
              <mat-icon>photo_camera</mat-icon>
              <span>Cambiar foto</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                (change)="seleccionarFoto($event)"
              />
            </label>
          }
        </div>

        <div class="profile__info">
          <p class="eyebrow">Ficha ciudadana</p>
          <h1>{{ c.nombres }} {{ c.apellidos }}</h1>
          <div class="chips">
            <span class="chip">DPI {{ c.dpi }}</span>
            <span class="chip">{{ c.nacionalidad }}</span>
            <span class="chip">{{ edad(c.fechaNacimiento) }} años</span>
          </div>
        </div>

        <button mat-stroked-button class="print-button" (click)="imprimir()">
          <mat-icon>print</mat-icon>
          Imprimir ficha
        </button>
      </header>

      <mat-tab-group>
        <mat-tab label="Documentos">
          <div class="tab-content">
            @for (d of c.documentos; track d.id) {
              <mat-card class="card row credential">
                <div class="doc-details">
                  <strong>{{ d.tipoDocumentoId }} · {{ d.numero }}</strong>
                  <span class="doc-sub">
                    {{ d.paisEmisor }} · vence {{ d.fechaVencimiento | date:'dd/MM/yyyy' }}
                  </span>
                  <div class="validity">
                    <span
                      [class]="'validity__fill ' + d.estadoAlerta.toLowerCase()"
                      [style.width.%]="vigencia(d.fechaEmision, d.fechaVencimiento)"
                    ></span>
                  </div>
                </div>
                <span
                  class="status"
                  [class.status--rojo]="d.estadoAlerta === 'ROJO'"
                  [class.status--amarillo]="d.estadoAlerta === 'AMARILLO'"
                >
                  <mat-icon>
                    {{ d.estadoAlerta === 'ROJO' ? 'error' : d.estadoAlerta === 'AMARILLO' ? 'warning' : 'check_circle' }}
                  </mat-icon>
                  <span class="status-label">{{ etiquetaEstado(d.estado) }}</span>
                  <small>({{ textoDias(diasDocumento(d.fechaVencimiento)) }})</small>
                </span>
              </mat-card>
            }
            @if (!c.documentos.length) {
              <div class="card empty-state">
                <svg viewBox="0 0 120 80" aria-hidden="true" class="empty-icon">
                  <rect x="30" y="14" width="60" height="52" rx="5" fill="none" stroke="currentColor" stroke-width="4" />
                  <path d="M42 30h36M42 43h28M42 56h18" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                </svg>
                <span>No hay documentos registrados.</span>
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab label="Multas">
          <div class="tab-content">
            <div class="tab-heading">
              <p class="total">
                Pendiente: <strong>Q {{ c.totalMultasPendientes | number:'1.2-2' }}</strong>
              </p>
              @if (auth.tieneRol('PERSONAL', 'ADMINISTRADOR')) {
                <button mat-flat-button color="primary" (click)="abrirFormulario('multa')">
                  <mat-icon>add</mat-icon>Registrar multa
                </button>
              }
            </div>
            @for (m of c.multas; track m.id) {
              <mat-card class="card row">
                <div>
                  <strong>{{ m.concepto }}</strong>
                  <span class="doc-sub">{{ m.fechaRegistro | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="actions">
                  <span class="amount-badge">Q {{ m.monto | number:'1.2-2' }} · {{ m.estado }}</span>
                  @if (m.estado === 'PENDIENTE' && auth.tieneRol('USUARIO', 'PERSONAL', 'ADMINISTRADOR')) {
                    <button mat-button color="primary" (click)="confirmarMulta(m, 'pagar')">
                      Pagar
                    </button>
                  }
                  @if (m.estado === 'PENDIENTE' && auth.tieneRol('PERSONAL', 'ADMINISTRADOR')) {
                    <button mat-button color="warn" (click)="confirmarMulta(m, 'anular')">
                      Anular
                    </button>
                  }
                </div>
              </mat-card>
            }
            @if (!c.multas.length) {
              <div class="card empty-state">
                <svg viewBox="0 0 120 80" aria-hidden="true" class="empty-icon">
                  <rect x="22" y="20" width="76" height="42" rx="5" fill="none" stroke="currentColor" stroke-width="4" />
                  <path d="M32 34h56M32 47h28" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                </svg>
                <span>No hay multas registradas.</span>
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab label="Arraigos">
          <div class="tab-content">
            <div class="tab-heading">
              <span></span>
              @if (auth.tieneRol('PERSONAL', 'ADMINISTRADOR')) {
                <button mat-flat-button color="primary" (click)="abrirFormulario('arraigo')">
                  <mat-icon>add</mat-icon>Registrar arraigo
                </button>
              }
            </div>
            @for (r of c.restricciones; track r.id) {
              <mat-card class="card row">
                <div>
                  <strong>{{ r.tipo }}</strong>
                  <span class="doc-sub">{{ r.motivo }} · {{ r.autoridad }}</span>
                </div>
                <div class="actions">
                  <span class="status-tag" [class.status-tag--active]="r.activo">
                    {{ r.activo ? 'ACTIVO' : 'LEVANTADO' }}
                  </span>
                  @if (r.activo && auth.tieneRol('PERSONAL', 'ADMINISTRADOR')) {
                    <button mat-button color="warn" (click)="confirmarArraigo(r)">
                      Levantar
                    </button>
                  }
                </div>
              </mat-card>
            }
            @if (!c.restricciones.length) {
              <div class="card empty-state">
                <svg viewBox="0 0 120 80" aria-hidden="true" class="empty-icon">
                  <path d="M60 13 94 27v20c0 17-14 26-34 32-20-6-34-15-34-32V27z" fill="none" stroke="currentColor" stroke-width="4" />
                  <path d="m45 47 10 10 21-23" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>No hay arraigos ni bloqueos registrados.</span>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>

      <section class="movements">
        <h2>Movimientos migratorios</h2>
        @if (c.movimientos.length) {
          <div class="movements-list">
            @for (m of c.movimientos; track m.id) {
              <div class="movement">
                <mat-icon class="movement-icon">{{ m.tipo === 'ENTRADA' ? 'login' : 'logout' }}</mat-icon>
                <div class="movement-details">
                  <strong>{{ m.tipo }}</strong>
                  <span>{{ m.puestoControl }} · {{ m.paisOrigenDestino }}</span>
                </div>
                <time>{{ m.fechaHora | date:'dd/MM/yyyy HH:mm' }}</time>
              </div>
            }
          </div>
        } @else {
          <div class="card empty-state">
            <svg viewBox="0 0 120 80" aria-hidden="true" class="empty-icon">
              <path d="M22 58h76M32 58V24h56v34M44 35h32M44 46h20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>No hay movimientos registrados.</span>
          </div>
        }
      </section>

      <p class="print-footer">
        Pass Portal · Ficha emitida el {{ fechaImpresion | date:'dd/MM/yyyy HH:mm' }} · {{ auth.empleado()?.nombreCompleto }}
      </p>
    }
  `,
  styles: [`
    mat-progress-bar {
      margin-bottom: 20px;
      border-radius: var(--border-radius-sm);
    }

    .banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: var(--pp-rojo-fondo);
      color: var(--pp-rojo);
      border-radius: var(--border-radius-md);
      margin-bottom: 24px;
      font-size: 0.95rem;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .profile {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
    }

    .photo-wrap {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;

      img {
        display: block;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        background: var(--mat-sys-surface-container-high);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .upload {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      color: var(--primary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      input {
        display: none;
      }
    }

    .profile__info {
      flex: 1;

      h1 {
        margin: 2px 0 10px 0;
        font-size: 2rem;
        color: var(--text-primary);
      }
    }

    .eyebrow {
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .chip {
      padding: 6px 14px;
      border-radius: 999px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font-size: 0.82rem;
      font-weight: 500;
    }

    .print-button {
      margin-left: auto;
    }

    .tab-content {
      padding: 20px 0;
      display: grid;
      gap: 12px;
    }

    .tab-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .total {
      font-size: 1.1rem;
      margin: 0;
      color: var(--text-secondary);

      strong {
        color: var(--text-primary);
        font-size: 1.25rem;
      }
    }

    .row {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      strong {
        display: block;
        color: var(--text-primary);
        font-size: 1.05rem;
      }
    }

    .doc-details {
      flex: 1;
    }

    .doc-sub {
      display: block;
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-top: 4px;
    }

    .validity {
      height: 6px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 6px;
      margin-top: 10px;
      overflow: hidden;
      max-width: 320px;
    }

    .validity__fill {
      display: block;
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease;

      &.rojo { background: var(--pp-rojo); }
      &.amarillo { background: var(--pp-amarillo); }
      &.verde { background: var(--pp-verde); }
    }

    .status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--pp-verde);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      small {
        font-weight: 400;
        color: var(--text-secondary);
      }
    }

    .status--rojo { color: var(--pp-rojo); }
    .status--amarillo { color: var(--pp-amarillo); }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .amount-badge {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .status-tag {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-secondary);

      &--active {
        background: var(--pp-rojo-fondo);
        color: var(--pp-rojo);
      }
    }

    .movements {
      margin-top: 32px;

      h2 {
        font-size: 1.25rem;
        color: var(--text-primary);
        margin: 0 0 16px 0;
      }
    }

    .movements-list {
      display: flex;
      flex-direction: column;
    }

    .movement {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-left: 3px solid var(--primary);
      background: var(--mat-sys-surface);
      margin-bottom: 8px;
      border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;

      .movement-icon {
        color: var(--primary);
      }
    }

    .movement-details {
      flex: 1;

      strong {
        display: block;
        color: var(--text-primary);
        font-size: 0.95rem;
      }

      span {
        display: block;
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin-top: 2px;
      }
    }

    .movement time {
      color: var(--text-muted);
      font-size: 0.82rem;
    }

    .empty-state {
      padding: 36px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-secondary);
      text-align: center;

      .empty-icon {
        width: 70px;
        height: 50px;
        color: var(--text-muted);
      }
    }

    .message {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;

      .error-icon {
        color: var(--pp-rojo);
      }
    }

    .print-footer {
      display: none;
    }

    @media print {
      .print-footer {
        display: block;
        border-top: 1px solid #ccc;
        padding-top: 12px;
        margin-top: 24px;
        font-size: 11px;
        color: #666;
      }

      .shell__barra,
      .banner,
      .upload,
      .print-button,
      mat-tab-header,
      button {
        display: none !important;
      }

      .shell__pagina {
        padding: 0;
      }

      .profile,
      .movements {
        break-inside: avoid;
      }
    }

    @media (max-width: 600px) {
      .profile {
        align-items: flex-start;
        flex-direction: column;

        h1 {
          font-size: 1.6rem;
        }
      }

      .print-button {
        margin-left: 0;
        width: 100%;
      }

      .row {
        align-items: flex-start;
        flex-direction: column;
      }

      .actions {
        align-items: flex-start;
        flex-wrap: wrap;
        width: 100%;
        justify-content: space-between;
      }

      .tab-heading {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `],
})
export class FichaComponent {
  protected readonly colorAvatar = colorAvatar;
  protected readonly etiquetaEstado = etiquetaEstado;
  protected readonly textoDias = textoDias;

  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly ficha = signal<FichaCiudadano | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly fotoPreview = signal('');
  protected readonly fechaImpresion = new Date();

  protected imprimir(): void {
    window.print();
  }

  protected edad(fecha: string): number {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate())) años--;
    return años;
  }

  protected vigencia(inicio: string, fin: string): number {
    const total = new Date(fin).getTime() - new Date(inicio).getTime();
    const transcurrido = Date.now() - new Date(inicio).getTime();
    return Math.max(3, Math.min(100, Math.round((1 - transcurrido / total) * 100)));
  }

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const id = Number(this.route.snapshot.paramMap.get('id')) || this.ficha()?.id || 0;
    const solicitud = id > 0 ? this.api.obtenerFicha(id) : this.api.obtenerMiFicha();
    solicitud.subscribe({
      next: (data) => {
        this.ficha.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la ficha.');
        this.cargando.set(false);
      },
    });
  }

  protected seleccionarFoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (
      !file ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      this.error.set('Selecciona una imagen JPG, PNG o WebP de máximo 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.fotoPreview.set(String(reader.result));
    reader.readAsDataURL(file);

    const id = Number(this.route.snapshot.paramMap.get('id')) || this.ficha()?.id || 0;
    this.api.subirFoto(id, file).subscribe({
      next: (result) => {
        const actual = this.ficha();
        if (actual) this.ficha.set({ ...actual, fotoUrl: result.fotoUrl });
      },
      error: () => this.error.set('No se pudo guardar la fotografía.'),
    });
  }

  protected abrirFormulario(mode: 'multa' | 'arraigo'): void {
    const ref = this.dialog.open(AdministrativeDialogComponent, {
      width: 'min(520px, calc(100vw - 32px))',
      data: { mode },
    });

    ref.afterClosed().subscribe((value: unknown) => {
      if (!value) return;
      const id = Number(this.route.snapshot.paramMap.get('id')) || this.ficha()?.id || 0;

      if (mode === 'multa') {
        this.api
          .crearMulta(id, value as { concepto: string; monto: number; moneda: string })
          .subscribe({
            next: () => {
              this.snackBar.open('Registro guardado correctamente', 'Cerrar', { duration: 3000 });
              this.cargar();
            },
            error: () =>
              this.snackBar.open('No se pudo guardar el registro', 'Cerrar', { duration: 4000 }),
          });
      } else {
        this.api
          .crearArraigo(
            id,
            value as {
              tipo: TipoRestriccion;
              motivo: string;
              autoridad: string;
              fechaInicio: string;
              numeroExpediente?: string;
              fechaFin?: string;
            }
          )
          .subscribe({
            next: () => {
              this.snackBar.open('Registro guardado correctamente', 'Cerrar', { duration: 3000 });
              this.cargar();
            },
            error: () =>
              this.snackBar.open('No se pudo guardar el registro', 'Cerrar', { duration: 4000 }),
          });
      }
    });
  }

  protected confirmarMulta(multa: Multa, accion: 'pagar' | 'anular'): void {
    const texto =
      accion === 'pagar'
        ? '¿Confirmas marcar esta multa como pagada?'
        : '¿Confirmas anular esta multa? Esta acción no se puede deshacer.';

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(420px, calc(100vw - 32px))',
        data: texto,
      })
      .afterClosed()
      .subscribe((confirmado: boolean) => {
        if (!confirmado) return;
        const request =
          accion === 'pagar' ? this.api.pagarMulta(multa.id) : this.api.anularMulta(multa.id);

        request.subscribe({
          next: () => {
            this.snackBar.open('Multa actualizada', 'Cerrar', { duration: 3000 });
            this.cargar();
          },
          error: () =>
            this.snackBar.open('No se pudo actualizar la multa', 'Cerrar', { duration: 4000 }),
        });
      });
  }

  protected confirmarArraigo(arraigo: Restriccion): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(420px, calc(100vw - 32px))',
        data: '¿Confirmas levantar esta restricción?',
      })
      .afterClosed()
      .subscribe((confirmado: boolean) => {
        if (!confirmado) return;
        this.api.levantarArraigo(arraigo.id).subscribe({
          next: () => {
            this.snackBar.open('Restricción levantada', 'Cerrar', { duration: 3000 });
            this.cargar();
          },
          error: () =>
            this.snackBar.open('No se pudo levantar la restricción', 'Cerrar', { duration: 4000 }),
        });
      });
  }

  protected foto(url: string | null): string {
    return url ? `${environment.apiUrl}${url}` : '/images/avatar-default.svg';
  }

  protected diasDocumento(fecha: string): number {
    return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
  }
}