import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../services/api.service';
import type { DocumentoAlerta, ResumenAlertas } from '../../models/alert.model';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, MatCardModule, MatIconModule, MatProgressBarModule, MatTableModule],
  template: `
    <header class="dashboard__header">
      <div><p class="eyebrow">Resumen operativo</p><h1>Panel de alertas</h1><p>Estado documental y restricciones activas.</p></div>
      <button mat-button type="button" (click)="cargar()">Actualizar</button>
    </header>
    @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando panel" /> }
    @if (error()) { <mat-card class="dashboard__error"><mat-icon>error</mat-icon><span>{{ error() }}</span><button mat-button type="button" (click)="cargar()">Reintentar</button></mat-card> }
    @if (resumen(); as datos) {
      <section class="dashboard__cards" aria-label="Métricas principales">
        <mat-card class="metric metric--rojo"><mat-icon>error</mat-icon><span>Vencidos</span><strong>{{ datos.vencidos }}</strong></mat-card>
        <mat-card class="metric metric--amarillo"><mat-icon>warning</mat-icon><span>Por vencer 30 días</span><strong>{{ datos.porVencer30 }}</strong></mat-card>
        <mat-card class="metric metric--amarillo"><mat-icon>warning</mat-icon><span>Por vencer 60 días</span><strong>{{ datos.porVencer60 }}</strong></mat-card>
        <mat-card class="metric metric--amarillo"><mat-icon>warning</mat-icon><span>Por vencer 90 días</span><strong>{{ datos.porVencer90 }}</strong></mat-card>
        <mat-card class="metric metric--verde"><mat-icon>check_circle</mat-icon><span>Vigentes</span><strong>{{ datos.vigentes }}</strong></mat-card>
        <mat-card class="metric"><mat-icon>payments</mat-icon><span>Multas pendientes</span><strong>{{ datos.multasPendientes }}</strong></mat-card>
        <mat-card class="metric"><mat-icon>gavel</mat-icon><span>Arraigos activos</span><strong>{{ datos.arraigosActivos }}</strong></mat-card>
      </section>
    }
    <section class="dashboard__critical">
      <div class="section-heading"><h2>Alertas críticas</h2><span>Documentos vencidos</span></div>
      @if (alertas().length === 0 && !cargando() && !error()) { <mat-card class="empty">No hay documentos vencidos.</mat-card> }
      @if (alertas().length > 0) {
        <div class="table-wrap"><table mat-table [dataSource]="alertas()" aria-label="Documentos vencidos">
          <ng-container matColumnDef="ciudadano"><th mat-header-cell *matHeaderCellDef>Ciudadano</th><td mat-cell *matCellDef="let alerta">{{ alerta.nombreCiudadano }}<small>{{ alerta.dpi }}</small></td></ng-container>
          <ng-container matColumnDef="documento"><th mat-header-cell *matHeaderCellDef>Documento</th><td mat-cell *matCellDef="let alerta">{{ alerta.tipoDocumento }} · {{ alerta.numero }}</td></ng-container>
          <ng-container matColumnDef="vencimiento"><th mat-header-cell *matHeaderCellDef>Vencimiento</th><td mat-cell *matCellDef="let alerta">{{ alerta.fechaVencimiento | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let alerta"><span class="status status--rojo"><mat-icon>error</mat-icon> VENCIDO ({{ -alerta.diasParaVencer }} días)</span></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columnas"></tr><tr mat-row *matRowDef="let row; columns: columnas;"></tr>
        </table></div>
      }
    </section>
  `,
  styles: [`.dashboard__header{display:flex;justify-content:space-between;align-items:start;margin-bottom:24px}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.08em;margin:0}.dashboard__header h1{margin:4px 0;font-size:32px}.dashboard__header p:last-child{margin:0;color:var(--mat-sys-on-surface-variant)}.dashboard__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:32px}.metric{padding:16px;display:grid;grid-template-columns:auto 1fr;gap:4px 10px}.metric mat-icon{grid-row:span 2}.metric span{font-size:13px;color:var(--mat-sys-on-surface-variant)}.metric strong{font-size:28px}.metric--rojo{border-left:4px solid var(--pp-rojo)}.metric--amarillo{border-left:4px solid var(--pp-amarillo)}.metric--verde{border-left:4px solid var(--pp-verde)}.section-heading{display:flex;justify-content:space-between;align-items:center}.section-heading h2{margin:0 0 12px}.section-heading span{color:var(--mat-sys-on-surface-variant)}.table-wrap{overflow:auto;border:1px solid var(--mat-sys-outline-variant);border-radius:12px}.table-wrap table{min-width:760px;width:100%}td small{display:block;color:var(--mat-sys-on-surface-variant)}.status{display:inline-flex;align-items:center;gap:4px;font-weight:600;color:var(--pp-rojo)}.status mat-icon{font-size:18px;width:18px;height:18px}.dashboard__error{padding:16px;display:flex;align-items:center;gap:10px;margin-bottom:16px}.empty{padding:24px;color:var(--mat-sys-on-surface-variant)}@media(max-width:600px){.dashboard__header{align-items:stretch;gap:12px;flex-direction:column}.dashboard__header h1{font-size:26px}}`],
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly resumen = signal<ResumenAlertas | null>(null);
  protected readonly alertas = signal<DocumentoAlerta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly columnas = ['ciudadano', 'documento', 'vencimiento', 'estado'];

  constructor() { this.cargar(); }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.obtenerResumen().subscribe({
      next: (resumen) => { this.resumen.set(resumen); this.cargarCriticas(); },
      error: () => { this.cargando.set(false); this.error.set('No se pudo cargar el resumen.'); },
    });
  }

  private cargarCriticas(): void {
    this.api.obtenerAlertas('ROJO').subscribe({
      next: (alertas) => { this.alertas.set(alertas); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set('No se pudieron cargar las alertas críticas.'); },
    });
  }
}
