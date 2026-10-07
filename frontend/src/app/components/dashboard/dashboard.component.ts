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
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import type { DocumentoAlerta, ResumenAlertas } from '../../models/alert.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatSortModule, MatTableModule],
  template: `
    <header class="dashboard__header"><div><p class="eyebrow">Resumen operativo · {{ fechaActual | date:'EEEE, d MMMM yyyy' }}</p><h1>Buenos días, {{ nombreEmpleado() }}</h1><p>Anticipa vencimientos y toma decisiones con información clara.</p></div><button mat-stroked-button type="button" (click)="cargar()"><mat-icon>refresh</mat-icon>Actualizar</button></header>
    @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando panel" /> }
    @if (error()) { <mat-card class="dashboard__error"><mat-icon>error</mat-icon><span>{{ error() }}</span><button mat-button type="button" (click)="cargar()">Reintentar</button></mat-card> }
    @if (resumen(); as datos) {
      <section class="dashboard__cards" aria-label="Métricas principales">
        <mat-card class="metric metric--rojo"><mat-icon>error</mat-icon><span>Vencidos</span><strong>{{ datos.vencidos }}</strong><small>Requieren atención</small></mat-card>
        <mat-card class="metric metric--amarillo"><mat-icon>warning</mat-icon><span>Por vencer 30 días</span><strong>{{ datos.porVencer30 }}</strong><small>Próxima gestión</small></mat-card>
        <mat-card class="metric metric--amarillo"><mat-icon>warning</mat-icon><span>Por vencer 60 días</span><strong>{{ datos.porVencer60 }}</strong><small>Planifica renovación</small></mat-card>
        <mat-card class="metric metric--amarillo"><mat-icon>warning</mat-icon><span>Por vencer 90 días</span><strong>{{ datos.porVencer90 }}</strong><small>Seguimiento preventivo</small></mat-card>
        <mat-card class="metric metric--verde"><mat-icon>check_circle</mat-icon><span>Vigentes</span><strong>{{ datos.vigentes }}</strong><small>Sin alertas activas</small></mat-card>
        <mat-card class="metric"><mat-icon>payments</mat-icon><span>Multas pendientes</span><strong>{{ datos.multasPendientes }}</strong><small>Gestión administrativa</small></mat-card>
        <mat-card class="metric"><mat-icon>gavel</mat-icon><span>Arraigos activos</span><strong>{{ datos.arraigosActivos }}</strong><small>Revisión prioritaria</small></mat-card>
      </section>
      <section class="chart" aria-labelledby="chart-title"><h2 id="chart-title">Distribución documental</h2><div class="bars">
        @for (barra of barras(datos); track barra.etiqueta) { <div class="bar"><div class="bar__value">{{ barra.valor }}</div><div class="bar__track"><span [style.height.%]="altura(barra.valor, datos.total)" [class]="'bar__fill ' + barra.clase"></span></div><span>{{ barra.etiqueta }}</span></div> }
      </div><p class="sr-only">Vencidos {{ datos.vencidos }}, por vencer 30 días {{ datos.porVencer30 }}, por vencer 60 días {{ datos.porVencer60 }}, por vencer 90 días {{ datos.porVencer90 }}, vigentes {{ datos.vigentes }}.</p></section>
    }
    <section class="dashboard__critical"><div class="section-heading"><div><h2>Alertas documentales</h2><span>{{ dataSource.filteredData.length }} resultados</span></div></div>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Estado</mat-label><mat-select [value]="estadoFiltro()" (selectionChange)="filtrarEstado($event.value)"><mat-option value="CRITICAS">Críticas</mat-option><mat-option value="ROJO">Vencidos</mat-option><mat-option value="AMARILLO">Por vencer</mat-option><mat-option value="TODOS">Todos</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tipo de documento</mat-label><mat-select [value]="tipoFiltro()" (selectionChange)="tipoFiltro.set($event.value); aplicarFiltros()"><mat-option value="">Todos</mat-option>@for (tipo of tiposDocumentos(); track tipo) { <mat-option [value]="tipo">{{ tipo }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Rango</mat-label><mat-select [value]="rangoFiltro()" (selectionChange)="rangoFiltro.set($event.value); aplicarFiltros()"><mat-option value="">Todos</mat-option><mat-option value="30">Hasta 30 días</mat-option><mat-option value="60">31 a 60 días</mat-option><mat-option value="90">61 a 90 días</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Buscar nombre o DPI</mat-label><input matInput (input)="cambiarTexto($event)" /></mat-form-field>
      </div>
      @if (!cargando() && !error() && dataSource.filteredData.length === 0) { <mat-card class="empty">No hay alertas para los filtros seleccionados.</mat-card> }
      @if (dataSource.filteredData.length > 0) { <div class="table-wrap"><table mat-table [dataSource]="dataSource" matSort aria-label="Alertas documentales">
        <ng-container matColumnDef="ciudadano"><th mat-header-cell *matHeaderCellDef mat-sort-header>Ciudadano</th><td mat-cell *matCellDef="let a"><a class="citizen-link" [routerLink]="['/ciudadanos', a.ciudadanoId]"><span class="avatar">{{ iniciales(a.nombreCiudadano) }}</span><span><strong>{{ a.nombreCiudadano }}</strong><small>{{ a.dpi }}</small></span></a></td></ng-container>
        <ng-container matColumnDef="documento"><th mat-header-cell *matHeaderCellDef mat-sort-header>Documento</th><td mat-cell *matCellDef="let a">{{ a.tipoDocumento }} · {{ a.numero }}</td></ng-container>
        <ng-container matColumnDef="vencimiento"><th mat-header-cell *matHeaderCellDef mat-sort-header>Vencimiento</th><td mat-cell *matCellDef="let a">{{ a.fechaVencimiento | date:'dd/MM/yyyy' }}</td></ng-container>
        <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let a"><span class="status" [class.status--rojo]="a.estadoAlerta === 'ROJO'" [class.status--amarillo]="a.estadoAlerta === 'AMARILLO'"><mat-icon>{{ a.estadoAlerta === 'ROJO' ? 'error' : 'warning' }}</mat-icon>{{ a.estadoDocumento }}<small> ({{ a.diasParaVencer < 0 ? -a.diasParaVencer + ' días vencido' : 'vence en ' + a.diasParaVencer + ' días' }})</small></span></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr><tr mat-row *matRowDef="let row; columns: columnas;"></tr>
      </table><mat-paginator [pageSize]="10" [pageSizeOptions]="[5,10,25]" aria-label="Paginación de alertas" /></div> }
    </section>
  `,
  styles: [`.dashboard__header{display:flex;justify-content:space-between;align-items:start;margin-bottom:24px}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.08em;margin:0}.dashboard__header h1{margin:4px 0;font-size:32px}.dashboard__header p:last-child{margin:0;color:var(--mat-sys-on-surface-variant)}.dashboard__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}.metric{padding:16px;display:grid;grid-template-columns:auto 1fr;gap:3px 10px}.metric mat-icon{grid-row:span 3}.metric span{font-size:13px;color:var(--mat-sys-on-surface-variant)}.metric strong{font-size:28px}.metric small{grid-column:2;color:var(--mat-sys-on-surface-variant);font-size:11px}.metric--rojo{border-left:4px solid var(--pp-rojo)}.metric--amarillo{border-left:4px solid var(--pp-amarillo)}.metric--verde{border-left:4px solid var(--pp-verde)}.chart{padding:20px 0 28px}.chart h2{font-size:20px}.bars{display:flex;gap:24px;align-items:end;height:170px;border-bottom:1px solid var(--mat-sys-outline-variant);padding:0 16px}.bar{height:100%;min-width:64px;display:flex;flex-direction:column;align-items:center;justify-content:end;gap:4px}.bar__track{height:120px;width:34px;display:flex;align-items:end;background:var(--mat-sys-surface-container-high);border-radius:8px 8px 0 0}.bar__fill{display:block;width:100%;border-radius:8px 8px 0 0;min-height:3px}.bar__value{font-weight:700}.bar__fill--rojo{background:var(--pp-rojo)}.bar__fill--amarillo{background:var(--pp-amarillo)}.bar__fill--verde{background:var(--pp-verde)}.citizen-link{display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none}.avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--pp-marino);color:#fff;font-size:11px;font-weight:700}.section-heading{display:flex;justify-content:space-between;align-items:center}.section-heading h2{margin:0 0 4px}.section-heading span{color:var(--mat-sys-on-surface-variant)}.filters{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.filters mat-form-field{min-width:180px}.table-wrap{overflow:auto;border:1px solid var(--mat-sys-outline-variant);border-radius:12px}.table-wrap table{min-width:850px;width:100%}td small{display:block;color:var(--mat-sys-on-surface-variant)}.status{display:inline-flex;align-items:center;gap:4px;font-weight:600}.status mat-icon{font-size:18px;width:18px;height:18px}.status--rojo{color:var(--pp-rojo)}.status--amarillo{color:var(--pp-amarillo)}.dashboard__error{padding:16px;display:flex;align-items:center;gap:10px;margin-bottom:16px}.empty{padding:24px;color:var(--mat-sys-on-surface-variant)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.dashboard__header{align-items:stretch;gap:12px;flex-direction:column}.dashboard__header h1{font-size:26px}.bars{gap:8px;padding:0 4px}.bar{min-width:48px}}`],
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
  protected nombreEmpleado(): string { return this.auth.empleado()?.nombreCompleto?.split(' ')[0] ?? 'equipo'; }
  protected iniciales(nombre: string): string { return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase(); }

  constructor() {
    this.dataSource.filterPredicate = (a, filter) => {
      const [estado, tipo, rango, texto] = filter.split('|');
      const coincideEstado = estado === 'TODOS' || (estado === 'CRITICAS' && ['ROJO', 'AMARILLO'].includes(a.estadoAlerta)) || a.estadoAlerta === estado;
      const coincideRango = !rango || (rango === '30' && a.diasParaVencer >= 1 && a.diasParaVencer <= 30) || (rango === '60' && a.diasParaVencer >= 31 && a.diasParaVencer <= 60) || (rango === '90' && a.diasParaVencer >= 61 && a.diasParaVencer <= 90);
      return coincideEstado && (!tipo || a.tipoDocumento === tipo) && coincideRango && (!texto || `${a.nombreCiudadano} ${a.dpi}`.toLowerCase().includes(texto));
    };
    this.cargar();
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator ?? null; this.dataSource.sort = this.sort ?? null; }
  protected cargar(): void {
    this.cargando.set(true); this.error.set('');
    this.api.obtenerResumen().subscribe({ next: (r) => this.resumen.set(r), error: () => { this.error.set('No se pudo cargar el resumen.'); this.cargando.set(false); } });
    this.api.obtenerAlertas().subscribe({ next: (a) => { this.dataSource.data = a; this.tiposDocumentos.set([...new Set(a.map((x) => x.tipoDocumento))]); this.aplicarFiltros(); this.cargando.set(false); }, error: () => { this.error.set('No se pudieron cargar las alertas.'); this.cargando.set(false); } });
  }
  protected filtrarEstado(estado: string): void { this.estadoFiltro.set(estado); this.aplicarFiltros(); }
  protected aplicarFiltros(): void { this.dataSource.filter = `${this.estadoFiltro()}|${this.tipoFiltro()}|${this.rangoFiltro()}|${this.textoFiltro().trim().toLowerCase()}`; }
  protected cambiarTexto(event: Event): void { this.textoFiltro.set((event.target as HTMLInputElement).value); this.aplicarFiltros(); }
  protected barras(r: ResumenAlertas): { etiqueta: string; valor: number; clase: string }[] { return [{ etiqueta: 'Vencidos', valor: r.vencidos, clase: 'bar__fill--rojo' }, { etiqueta: '30 días', valor: r.porVencer30, clase: 'bar__fill--amarillo' }, { etiqueta: '60 días', valor: r.porVencer60, clase: 'bar__fill--amarillo' }, { etiqueta: '90 días', valor: r.porVencer90, clase: 'bar__fill--amarillo' }, { etiqueta: 'Vigentes', valor: r.vigentes, clase: 'bar__fill--verde' }]; }
  protected altura(valor: number, total: number): number { return total > 0 ? Math.max(3, (valor / total) * 100) : 3; }
}
