import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import type { EstadoSolicitudMovimiento, SolicitudMovimiento } from '../../models/domain.model';

@Component({
  selector: 'app-movement-requests',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `
    <header class="page-header">
      <div>
        <p class="eyebrow">Revisión operativa</p>
        <h1>Solicitudes de movimiento</h1>
        <p class="subtitle">Revisa el trayecto, consulta la ficha y decide antes de registrar el movimiento.</p>
      </div>
      <mat-form-field appearance="outline" class="status-filter">
        <mat-label>Mostrar</mat-label>
        <mat-select [value]="filtro()" (selectionChange)="cambiarFiltro($event.value)">
          <mat-option value="PENDIENTE">Pendientes</mat-option>
          <mat-option value="APROBADA">Aprobadas</mat-option>
          <mat-option value="RECHAZADA">Rechazadas</mat-option>
          <mat-option value="TODAS">Todas</mat-option>
        </mat-select>
      </mat-form-field>
    </header>

    @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando solicitudes" /> }

    @if (error()) {
      <mat-card class="card message"><mat-icon>error</mat-icon><span>{{ error() }}</span><button mat-button (click)="cargar()">Reintentar</button></mat-card>
    }

    @if (!cargando() && !error() && solicitudes().length === 0) {
      <mat-card class="card empty-state"><mat-icon>inbox</mat-icon><strong>No hay solicitudes en este estado.</strong><span>Cuando un ciudadano envíe una solicitud aparecerá aquí.</span></mat-card>
    }

    <section class="request-grid" aria-label="Solicitudes de movimiento">
      @for (solicitud of solicitudes(); track solicitud.id) {
        <mat-card class="card request-card" [class.request-card--pending]="solicitud.estado === 'PENDIENTE'">
          <div class="request-card__top">
            <div>
              <p class="request-label">Solicitud #{{ solicitud.id }}</p>
              <h2>{{ solicitud.nombreCiudadano }}</h2>
              <p class="identity">DPI {{ solicitud.dpiCiudadano }} · {{ solicitud.nacionalidadCiudadano }}</p>
            </div>
            <span class="status" [class]="'status status--' + solicitud.estado.toLowerCase()">{{ solicitud.estado }}</span>
          </div>

          <div class="route">
            <div><small>ORIGEN</small><strong>{{ solicitud.paisOrigen }}</strong></div>
            <mat-icon>arrow_forward</mat-icon>
            <div><small>DESTINO</small><strong>{{ solicitud.paisDestino }}</strong></div>
          </div>

          <div class="request-details">
            <span><mat-icon>event</mat-icon>{{ solicitud.fechaSolicitada | date:'dd/MM/yyyy' }}</span>
            <span><mat-icon>schedule</mat-icon>Recibida {{ solicitud.creadoEn | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <p class="reason"><strong>Motivo:</strong> {{ solicitud.motivo }}</p>
          @if (solicitud.comentarioResolucion) { <p class="resolution"><strong>Resolución:</strong> {{ solicitud.comentarioResolucion }}</p> }

          <div class="request-actions">
            <a mat-stroked-button [routerLink]="['/ciudadanos', solicitud.ciudadanoId]"><mat-icon>visibility</mat-icon>Ver ficha</a>
            @if (solicitud.estado === 'PENDIENTE') {
              <span class="actions-spacer"></span>
              <button mat-button color="warn" type="button" (click)="resolver(solicitud, 'RECHAZADA')"><mat-icon>close</mat-icon>Rechazar</button>
              <button mat-flat-button color="primary" type="button" (click)="resolver(solicitud, 'APROBADA')"><mat-icon>check</mat-icon>Aprobar</button>
            }
          </div>
        </mat-card>
      }
    </section>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
    .eyebrow { margin: 0 0 4px; color: var(--primary); font-size: .85rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
    h1 { margin: 0 0 8px; color: var(--text-primary); font-size: 1.85rem; }
    .subtitle { margin: 0; color: var(--text-secondary); }
    .status-filter { width: 180px; }
    mat-progress-bar { margin-bottom: 16px; }
    .request-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
    .request-card { padding: 20px; border-top: 3px solid transparent; }
    .request-card--pending { border-top-color: var(--pp-amarillo, #d69e2e); }
    .request-card__top { display: flex; justify-content: space-between; gap: 16px; }
    .request-label { margin: 0 0 4px; color: var(--text-muted); font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    h2 { margin: 0; color: var(--text-primary); font-size: 1.12rem; }
    .identity { margin: 5px 0 0; color: var(--text-secondary); font-size: .84rem; }
    .status { flex: none; align-self: flex-start; padding: 5px 9px; border-radius: 999px; font-size: .7rem; font-weight: 800; }
    .status--pendiente { background: rgba(214,158,46,.16); color: #8a5e00; }
    .status--aprobada { background: rgba(46,125,50,.14); color: var(--pp-verde); }
    .status--rechazada { background: var(--pp-rojo-fondo); color: var(--pp-rojo); }
    .route { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin: 20px 0 16px; padding: 16px; border-radius: var(--border-radius-md); background: var(--pp-marino-profundo); }
    .route div { display: flex; flex-direction: column; gap: 4px; }
    .route small { color: var(--text-muted); font-size: .68rem; font-weight: 800; letter-spacing: .07em; }
    .route strong { color: var(--text-primary); font-size: 1rem; }
    .route mat-icon { color: var(--primary); }
    .request-details { display: flex; flex-wrap: wrap; gap: 12px; color: var(--text-secondary); font-size: .82rem; }
    .request-details span { display: inline-flex; align-items: center; gap: 5px; }
    .request-details mat-icon { width: 17px; height: 17px; font-size: 17px; color: var(--primary); }
    .reason, .resolution { margin: 14px 0 0; color: var(--text-secondary); font-size: .88rem; line-height: 1.45; }
    .reason strong, .resolution strong { color: var(--text-primary); }
    .resolution { color: var(--pp-verde); }
    .request-actions { display: flex; align-items: center; gap: 8px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-color); }
    .actions-spacer { flex: 1; }
    .message, .empty-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 28px; color: var(--text-secondary); }
    .empty-state { flex-direction: column; min-height: 180px; }
    .empty-state mat-icon { color: var(--text-muted); font-size: 42px; width: 42px; height: 42px; }
    @media (max-width: 700px) {
      .page-header { flex-direction: column; }
      .status-filter { width: 100%; }
      .request-grid { grid-template-columns: 1fr; }
      .request-card__top { flex-direction: column; }
      .request-actions { flex-wrap: wrap; }
      .actions-spacer { display: none; }
    }
  `],
})
export class MovementRequestsComponent {
  private readonly api = inject(ApiService);
  protected readonly solicitudes = signal<SolicitudMovimiento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly filtro = signal<EstadoSolicitudMovimiento | 'TODAS'>('PENDIENTE');

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const filtro = this.filtro();
    const estado = filtro === 'TODAS' ? undefined : filtro;
    this.api.obtenerSolicitudesMovimiento(estado).subscribe({
      next: solicitudes => { this.solicitudes.set(solicitudes); this.cargando.set(false); },
      error: () => { this.error.set('No se pudieron cargar las solicitudes.'); this.cargando.set(false); },
    });
  }

  protected cambiarFiltro(estado: EstadoSolicitudMovimiento | 'TODAS'): void {
    this.filtro.set(estado);
    this.cargar();
  }

  protected resolver(solicitud: SolicitudMovimiento, estado: 'APROBADA' | 'RECHAZADA'): void {
    const accion = estado === 'APROBADA' ? 'aprobar' : 'rechazar';
    if (!window.confirm(`¿Confirmas ${accion} la solicitud de ${solicitud.nombreCiudadano}?`)) return;
    this.api.resolverSolicitudMovimiento(solicitud.id, estado).subscribe({
      next: () => this.cargar(),
      error: error => this.error.set(error.error?.error?.mensaje ?? 'No se pudo resolver la solicitud.'),
    });
  }
}
