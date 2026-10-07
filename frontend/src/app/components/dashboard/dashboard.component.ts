import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import type { DocumentoAlerta, ResumenAlertas } from '../../models/alert.model';
import { AuthService } from '../../services/auth.service';
import { colorAvatar, etiquetaEstado, iniciales, textoDias } from '../../utils/presentation';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <header class="dashboard__header">
      <div>
        <p class="eyebrow">Resumen operativo · {{ fechaLarga() }}</p>
        <h1>Buenos días, {{ nombreEmpleado() }}</h1>
        <p class="subtitle">Anticipa vencimientos y toma decisiones con información clara.</p>
      </div>
      <button mat-stroked-button type="button" (click)="cargar()" matTooltip="Actualizar resumen">
        <mat-icon>refresh</mat-icon>Actualizar
      </button>
    </header>

    @if (cargando()) {
      <mat-progress-bar mode="indeterminate" aria-label="Cargando panel" />
    }

    @if (error()) {
      <mat-card class="card dashboard__error">
        <mat-icon class="error-icon">error</mat-icon>
        <span>{{ error() }}</span>
        <button mat-button type="button" (click)="cargar()">Reintentar</button>
      </mat-card>
    }

    @if (resumen(); as datos) {
      <section class="dashboard__cards" aria-label="Métricas principales">
        <mat-card class="metric metric--rojo">
          <mat-icon>error</mat-icon>
          <span>Vencidos</span>
          <strong>{{ datos.vencidos }}</strong>
          <small>Requieren atención</small>
        </mat-card>

        <mat-card class="metric metric--amarillo metric--warning-30">
          <mat-icon>warning</mat-icon>
          <span>Por vencer 30 días</span>
          <strong>{{ datos.porVencer30 }}</strong>
          <small>Próxima gestión</small>
        </mat-card>

        <mat-card class="metric metric--amarillo metric--warning-60">
          <mat-icon>warning</mat-icon>
          <span>Por vencer 60 días</span>
          <strong>{{ datos.porVencer60 }}</strong>
          <small>Planifica renovación</small>
        </mat-card>

        <mat-card class="metric metric--amarillo metric--warning-90">
          <mat-icon>warning</mat-icon>
          <span>Por vencer 90 días</span>
          <strong>{{ datos.porVencer90 }}</strong>
          <small>Seguimiento preventivo</small>
        </mat-card>

        <mat-card class="metric metric--verde">
          <mat-icon>check_circle</mat-icon>
          <span>Vigentes</span>
          <strong>{{ datos.vigentes }}</strong>
          <small>Sin alertas activas</small>
        </mat-card>

        <mat-card class="metric">
          <mat-icon>payments</mat-icon>
          <span>Multas pendientes</span>
          <strong>{{ datos.multasPendientes }}</strong>
          <small>Gestión administrativa</small>
        </mat-card>

        <mat-card class="metric">
          <mat-icon>gavel</mat-icon>
          <span>Arraigos activos</span>
          <strong>{{ datos.arraigosActivos }}</strong>
          <small>Revisión prioritaria</small>
        </mat-card>
      </section>

      <section class="insights">
        <mat-card class="card chart">
          <h2 id="chart-title">Distribución documental</h2>
          <div class="donut-wrap">
            <svg viewBox="0 0 42 42" class="donut" role="img" aria-labelledby="chart-title">
              <circle class="donut__track" cx="21" cy="21" r="15.9" />
              <circle
                class="donut__segment donut__segment--rojo"
                cx="21"
                cy="21"
                r="15.9"
                [attr.stroke-dasharray]="porcentaje(datos.vencidos, datos.total) + ' ' + (100 - porcentaje(datos.vencidos, datos.total))"
              />
              <circle
                class="donut__segment donut__segment--amarillo"
                cx="21"
                cy="21"
                r="15.9"
                [attr.stroke-dasharray]="porcentaje(datos.porVencer30 + datos.porVencer60 + datos.porVencer90, datos.total) + ' ' + (100 - porcentaje(datos.porVencer30 + datos.porVencer60 + datos.porVencer90, datos.total))"
                [attr.stroke-dashoffset]="-porcentaje(datos.vencidos, datos.total)"
              />
              <circle
                class="donut__segment donut__segment--verde"
                cx="21"
                cy="21"
                r="15.9"
                [attr.stroke-dasharray]="porcentaje(datos.vigentes, datos.total) + ' ' + (100 - porcentaje(datos.vigentes, datos.total))"
                [attr.stroke-dashoffset]="-(porcentaje(datos.vencidos, datos.total) + porcentaje(datos.porVencer30 + datos.porVencer60 + datos.porVencer90, datos.total))"
              />
            </svg>
            <div class="donut-center">
              <strong>{{ datos.total }}</strong>
              <span>documentos</span>
            </div>
          </div>
          <div class="legend">
            <span><i class="dot rojo"></i>Vencidos <b>{{ datos.vencidos }}</b> ({{ porcentaje(datos.vencidos, datos.total) }}%)</span>
            <span><i class="dot amarillo"></i>Por vencer <b>{{ datos.porVencer30 + datos.porVencer60 + datos.porVencer90 }}</b> ({{ porcentaje(datos.porVencer30 + datos.porVencer60 + datos.porVencer90, datos.total) }}%)</span>
            <span><i class="dot verde"></i>Vigentes <b>{{ datos.vigentes }}</b> ({{ porcentaje(datos.vigentes, datos.total) }}%)</span>
          </div>
        </mat-card>

        <mat-card class="card priority">
          <h2>Atención prioritaria</h2>
          <div class="priority-list">
            @for (a of urgentes(); track a.id) {
              <a [routerLink]="['/ciudadanos', a.ciudadanoId]" class="priority-item">
                <span class="avatar" [style.background]="colorAvatar(a.nombreCiudadano)">
                  {{ iniciales(a.nombreCiudadano) }}
                </span>
                <span class="priority-info">
                  <strong>{{ a.nombreCiudadano }}</strong>
                  <small>{{ a.tipoDocumento }} · {{ textoDias(a.diasParaVencer) }}</small>
                </span>
                <mat-icon class="arrow-icon">chevron_right</mat-icon>
              </a>
            }
          </div>
        </mat-card>
      </section>
    }

    <section class="dashboard__critical">
      <div class="section-heading">
        <div>
          <h2>Alertas documentales</h2>
          <span class="counter-badge">{{ dataSource.filteredData.length }} resultados</span>
        </div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [value]="estadoFiltro()" (selectionChange)="filtrarEstado($event.value)">
            <mat-option value="CRITICAS">Críticas</mat-option>
            <mat-option value="ROJO">Vencidos</mat-option>
            <mat-option value="AMARILLO">Por vencer</mat-option>
            <mat-option value="TODOS">Todos</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de documento</mat-label>
          <mat-select [value]="tipoFiltro()" (selectionChange)="tipoFiltro.set($event.value); aplicarFiltros()">
            <mat-option value="">Todos</mat-option>
            @for (tipo of tiposDocumentos(); track tipo) {
              <mat-option [value]="tipo">{{ tipo }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rango</mat-label>
          <mat-select [value]="rangoFiltro()" (selectionChange)="rangoFiltro.set($event.value); aplicarFiltros()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="30">Hasta 30 días</mat-option>
            <mat-option value="60">31 a 60 días</mat-option>
            <mat-option value="90">61 a 90 días</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar nombre o DPI</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput (input)="cambiarTexto($event)" />
        </mat-form-field>
      </div>

      @if (!cargando() && !error() && dataSource.filteredData.length === 0) {
        <mat-card class="card empty empty-state">
          <svg viewBox="0 0 120 80" aria-hidden="true" class="empty-icon">
            <path d="M18 56h84M28 56V25l32-12 32 12v31M44 56V35h16v21M72 56V35h16v21" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
            <path d="M38 22h44" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <span>No hay alertas para los filtros seleccionados.</span>
        </mat-card>
      }

      @if (dataSource.filteredData.length > 0) {
        <div class="table-wrap">
          <table mat-table [dataSource]="dataSource" matSort aria-label="Alertas documentales">
            <ng-container matColumnDef="ciudadano">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Ciudadano</th>
              <td mat-cell *matCellDef="let a">
                <a class="citizen-link" [routerLink]="['/ciudadanos', a.ciudadanoId]">
                  <span class="avatar" [style.background]="colorAvatar(a.nombreCiudadano)">
                    {{ iniciales(a.nombreCiudadano) }}
                  </span>
                  <span class="citizen-info">
                    <strong>{{ a.nombreCiudadano }}</strong>
                    <small>DPI {{ a.dpi }}</small>
                  </span>
                  <mat-icon class="row-chevron">chevron_right</mat-icon>
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="documento">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Documento</th>
              <td mat-cell *matCellDef="let a">
                <strong>{{ a.tipoDocumento }}</strong>
                <small>N° {{ a.numero }}</small>
              </td>
            </ng-container>

            <ng-container matColumnDef="vencimiento">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Vencimiento</th>
              <td mat-cell *matCellDef="let a">
                {{ a.fechaVencimiento | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let a">
                <span class="status" [class.status--rojo]="a.estadoAlerta === 'ROJO'" [class.status--amarillo]="a.estadoAlerta === 'AMARILLO'">
                  <mat-icon>{{ a.estadoAlerta === 'ROJO' ? 'error' : 'warning' }}</mat-icon>
                  <span>{{ etiquetaEstado(a.estadoDocumento) }}</span>
                  <small>({{ textoDias(a.diasParaVencer) }})</small>
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnas"></tr>
            <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
          </table>

          <mat-paginator [pageSize]="10" [pageSizeOptions]="[5,10,25]" aria-label="Paginación de alertas" />
        </div>
      }
    </section>
  `,
  styles: [`
    .dashboard__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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

    .dashboard__header h1 {
      margin: 0 0 4px 0;
      color: var(--text-primary);
      font-size: 1.85rem;
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
    }

    mat-progress-bar {
      margin-bottom: 20px;
      border-radius: var(--border-radius-sm);
    }

    .dashboard__cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .metric {
      padding: 16px;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 12px;
      min-height: 104px;
      border: 1px solid rgba(51, 46, 43, 0.08);
      border-top: 3px solid var(--mat-sys-outline-variant);
      box-shadow: 0 6px 18px rgba(51, 46, 43, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px rgba(51, 46, 43, 0.11);
      }

      mat-icon {
        grid-row: span 3;
        align-self: start;
        display: grid;
        place-items: center;
        font-size: 28px;
        width: 28px;
        height: 28px;
        padding: 8px;
        border-radius: 12px;
        color: var(--text-secondary);
      }

      span {
        font-size: 0.82rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      strong {
        font-size: 1.6rem;
        color: var(--text-primary);
        line-height: 1.2;
      }

      small {
        grid-column: 2;
        color: var(--text-muted);
        font-size: 0.75rem;
      }
    }

    .metric--rojo {
      border-top-color: var(--pp-rojo);
      background: linear-gradient(135deg, rgba(183, 28, 28, 0.11), var(--mat-sys-surface) 62%);
      mat-icon { color: var(--pp-rojo); background: rgba(183, 28, 28, 0.12); }
    }

    .metric--amarillo {
      border-top-color: var(--pp-amarillo);
      mat-icon { color: #9a6500; background: rgba(214, 158, 46, 0.16); }
    }

    .metric--warning-30 {
      background: linear-gradient(135deg, rgba(214, 158, 46, 0.16), var(--mat-sys-surface) 68%);
    }

    .metric--warning-60 {
      background: linear-gradient(135deg, rgba(214, 158, 46, 0.1), var(--mat-sys-surface) 68%);
    }

    .metric--warning-90 {
      background: linear-gradient(135deg, rgba(214, 158, 46, 0.06), var(--mat-sys-surface) 68%);
    }

    .metric--verde {
      border-top-color: var(--pp-verde);
      background: linear-gradient(135deg, rgba(46, 125, 50, 0.11), var(--mat-sys-surface) 62%);
      mat-icon { color: var(--pp-verde); background: rgba(46, 125, 50, 0.12); }
    }

    .insights {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }

    .chart, .priority {
      padding: 24px;
      border: 1px solid rgba(51, 46, 43, 0.08);
      box-shadow: 0 8px 24px rgba(51, 46, 43, 0.06);

      h2 {
        margin: 0 0 20px 0;
        color: var(--text-primary);
        font-size: 1.2rem;
      }
    }

    .donut-wrap {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 0 auto 20px auto;
    }

    .donut {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      border-radius: 50%;
    }

    .donut__track {
      fill: none;
      stroke: rgba(0, 0, 0, 0.05);
      stroke-width: 3.8;
    }

    .donut__segment {
      fill: none;
      stroke-width: 3.8;
      transition: stroke-dasharray 0.3s ease;
    }

    .donut__segment--rojo { stroke: var(--pp-rojo); }
    .donut__segment--amarillo { stroke: var(--pp-amarillo); }
    .donut__segment--verde { stroke: var(--pp-verde); }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;

      strong {
        font-size: 1.6rem;
        color: var(--text-primary);
        line-height: 1;
      }

      span {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.88rem;
      color: var(--text-secondary);

      span {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      b {
        color: var(--text-primary);
      }
    }

    .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.rojo { background-color: var(--pp-rojo); }
      &.amarillo { background-color: var(--pp-amarillo); }
      &.verde { background-color: var(--pp-verde); }
    }

    .priority-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .priority-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--border-radius-sm);
      text-decoration: none;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: rgba(0, 0, 0, 0.03);

        .arrow-icon {
          color: var(--primary);
          transform: translateX(2px);
        }
      }
    }

    .priority-info {
      display: flex;
      flex-direction: column;
      flex: 1;

      strong {
        color: var(--text-primary);
        font-size: 0.95rem;
      }

      small {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
    }

    .arrow-icon {
      color: var(--text-muted);
      transition: transform 0.15s ease, color 0.15s ease;
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.3rem;
      }
    }

    .counter-badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;

      mat-form-field {
        min-width: 160px;
        flex: 1;
      }

      .search-field {
        min-width: 220px;
      }
    }

    .table-wrap {
      overflow-x: auto;
      border-radius: var(--border-radius-md);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      table {
        width: 100%;
        min-width: 700px;
      }
    }

    .citizen-link {
      display: flex;
      align-items: center;
      gap: 12px;
      color: inherit;
      text-decoration: none;

      &:hover {
        .row-chevron {
          color: var(--primary);
        }
      }
    }

    .citizen-info {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--text-primary);
      }

      small {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: #FFFFFF;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .row-chevron {
      color: var(--text-muted);
      margin-left: auto;
    }

    td strong {
      display: block;
      color: var(--text-primary);
    }

    td small {
      display: block;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 0.88rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      small {
        font-weight: 400;
        margin-left: 2px;
      }
    }

    .status--rojo { color: var(--pp-rojo); }
    .status--amarillo { color: var(--pp-amarillo); }

    .dashboard__error {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;

      .error-icon {
        color: var(--pp-rojo);
      }
    }

    .empty {
      padding: 40px 24px;
      color: var(--text-secondary);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .empty-icon {
        width: 80px;
        height: 60px;
        color: var(--text-muted);
      }
    }

    mat-paginator {
      background: transparent !important;
      color: var(--text-secondary) !important;
    }

    @media (max-width: 850px) {
      .insights {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .dashboard__header {
        align-items: stretch;
        gap: 12px;
        flex-direction: column;
      }

      .filters {
        flex-direction: column;

        mat-form-field {
          width: 100%;
        }
      }
    }
  `],
})
export class DashboardComponent implements AfterViewInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  protected readonly fechaActual = new Date();
  @ViewChild(MatPaginator) private paginator?: MatPaginator;
  @ViewChild(MatSort) private sort?: MatSort;
  protected readonly resumen = signal<ResumenAlertas | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly estadoFiltro = signal('CRITICAS');
  protected readonly tipoFiltro = signal('');
  protected readonly rangoFiltro = signal('');
  protected readonly textoFiltro = signal('');
  protected readonly tiposDocumentos = signal<string[]>([]);
  protected readonly dataSource = new MatTableDataSource<DocumentoAlerta>([]);
  protected readonly columnas = ['ciudadano', 'documento', 'vencimiento', 'estado'];
  protected readonly colorAvatar = colorAvatar;
  protected readonly iniciales = iniciales;
  protected readonly etiquetaEstado = etiquetaEstado;
  protected readonly textoDias = textoDias;

  protected nombreEmpleado(): string {
    return this.auth.empleado()?.nombreCompleto?.split(' ')[0] ?? 'equipo';
  }

  protected fechaLarga(): string {
    return new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(this.fechaActual);
  }

  protected porcentaje(valor: number, total: number): number {
    return total ? Math.round((valor / total) * 100) : 0;
  }

  protected urgentes(): DocumentoAlerta[] {
    return [...this.dataSource.data]
      .sort((a, b) => a.diasParaVencer - b.diasParaVencer)
      .slice(0, 3);
  }

  constructor() {
    this.dataSource.filterPredicate = (a, filter) => {
      const [estado, tipo, rango, texto] = filter.split('|');
      const coincideEstado =
        estado === 'TODOS' ||
        (estado === 'CRITICAS' && ['ROJO', 'AMARILLO'].includes(a.estadoAlerta)) ||
        a.estadoAlerta === estado;
      const coincideRango =
        !rango ||
        (rango === '30' && a.diasParaVencer >= 1 && a.diasParaVencer <= 30) ||
        (rango === '60' && a.diasParaVencer >= 31 && a.diasParaVencer <= 60) ||
        (rango === '90' && a.diasParaVencer >= 61 && a.diasParaVencer <= 90);
      return (
        coincideEstado &&
        (!tipo || a.tipoDocumento === tipo) &&
        coincideRango &&
        (!texto || `${a.nombreCiudadano} ${a.dpi}`.toLowerCase().includes(texto))
      );
    };
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator ?? null;
    this.dataSource.sort = this.sort ?? null;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.obtenerResumen().subscribe({
      next: (r) => this.resumen.set(r),
      error: () => {
        this.error.set('No se pudo cargar el resumen.');
        this.cargando.set(false);
      },
    });
    this.api.obtenerAlertas().subscribe({
      next: (a) => {
        this.dataSource.data = a;
        this.tiposDocumentos.set([...new Set(a.map((x) => x.tipoDocumento))]);
        this.aplicarFiltros();
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las alertas.');
        this.cargando.set(false);
      },
    });
  }

  protected filtrarEstado(estado: string): void {
    this.estadoFiltro.set(estado);
    this.aplicarFiltros();
  }

  protected aplicarFiltros(): void {
    this.dataSource.filter = `${this.estadoFiltro()}|${this.tipoFiltro()}|${this.rangoFiltro()}|${this.textoFiltro().trim().toLowerCase()}`;
  }

  protected cambiarTexto(event: Event): void {
    this.textoFiltro.set((event.target as HTMLInputElement).value);
    this.aplicarFiltros();
  }

  protected barras(r: ResumenAlertas): { etiqueta: string; valor: number; clase: string }[] {
    return [
      { etiqueta: 'Vencidos', valor: r.vencidos, clase: 'bar__fill--rojo' },
      { etiqueta: '30 días', valor: r.porVencer30, clase: 'bar__fill--amarillo' },
      { etiqueta: '60 días', valor: r.porVencer60, clase: 'bar__fill--amarillo' },
      { etiqueta: '90 días', valor: r.porVencer90, clase: 'bar__fill--amarillo' },
      { etiqueta: 'Vigentes', valor: r.vigentes, clase: 'bar__fill--verde' },
    ];
  }

  protected altura(valor: number, total: number): number {
    return total > 0 ? Math.max(3, (valor / total) * 100) : 3;
  }
}