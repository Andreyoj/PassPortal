import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import type { FichaCiudadano } from '../../models/domain.model';

@Component({
  selector: 'app-ficha',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatTabsModule],
  template: `
    @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando ficha" /> }
    @if (error()) { <mat-card class="message"><mat-icon>error</mat-icon>{{ error() }}<button mat-button (click)="cargar()">Reintentar</button></mat-card> }
    @if (ficha(); as c) {
      @if (c.restriccionActiva) { <div class="banner"><mat-icon>gpp_maybe</mat-icon><strong>Restricción activa:</strong> esta persona tiene un arraigo o bloqueo vigente.</div> }
      <header class="profile"><div class="photo-wrap"><img [src]="fotoPreview() || foto(c.fotoUrl)" [alt]="'Fotografía de ' + c.nombres + ' ' + c.apellidos" /><label class="upload"><mat-icon>photo_camera</mat-icon>Cargar foto desde el equipo<input type="file" accept="image/jpeg,image/png,image/webp" (change)="seleccionarFoto($event)" /></label></div><div><p class="eyebrow">Ficha ciudadana</p><h1>{{ c.nombres }} {{ c.apellidos }}</h1><p>DPI {{ c.dpi }} · {{ c.nacionalidad }}</p></div></header>
      <mat-tab-group>
        <mat-tab label="Documentos"><div class="tab-content">@for (d of c.documentos; track d.id) { <mat-card class="row"><div><strong>{{ d.tipoDocumentoId }} · {{ d.numero }}</strong><span>{{ d.paisEmisor }} · vence {{ d.fechaVencimiento | date:'dd/MM/yyyy' }}</span></div><span class="status" [class.status--rojo]="d.estadoAlerta === 'ROJO'" [class.status--amarillo]="d.estadoAlerta === 'AMARILLO'"><mat-icon>{{ d.estadoAlerta === 'ROJO' ? 'error' : d.estadoAlerta === 'AMARILLO' ? 'warning' : 'check_circle' }}</mat-icon>{{ d.estado }}</span></mat-card> } @if (!c.documentos.length) { <p>No hay documentos registrados.</p> }</div></mat-tab>
        <mat-tab label="Multas"><div class="tab-content"><p class="total">Pendiente: <strong>Q {{ c.totalMultasPendientes | number:'1.2-2' }}</strong></p>@for (m of c.multas; track m.id) { <mat-card class="row"><div><strong>{{ m.concepto }}</strong><span>{{ m.fechaRegistro | date:'dd/MM/yyyy' }}</span></div><span>Q {{ m.monto | number:'1.2-2' }} · {{ m.estado }}</span></mat-card> }</div></mat-tab>
        <mat-tab label="Arraigos"><div class="tab-content">@for (r of c.restricciones; track r.id) { <mat-card class="row"><div><strong>{{ r.tipo }}</strong><span>{{ r.motivo }} · {{ r.autoridad }}</span></div><span>{{ r.activo ? 'ACTIVO' : 'LEVANTADO' }}</span></mat-card> } @if (!c.restricciones.length) { <p>No hay arraigos ni bloqueos registrados.</p> }</div></mat-tab>
      </mat-tab-group>
    }
  `,
  styles: [`.banner{display:flex;align-items:center;gap:8px;padding:14px 16px;background:var(--pp-rojo-fondo);color:var(--pp-rojo);border-radius:10px;margin-bottom:20px}.profile{display:flex;align-items:center;gap:24px;margin-bottom:20px}.profile h1{margin:4px 0;font-size:32px}.profile p:last-child{color:var(--mat-sys-on-surface-variant)}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.08em;margin:0}.photo-wrap{position:relative}.photo-wrap img{display:block;width:120px;height:120px;border-radius:50%;object-fit:cover;background:var(--mat-sys-surface-container-high)}.upload{display:flex;align-items:center;gap:4px;margin-top:8px;color:var(--mat-sys-primary);font-size:12px;cursor:pointer}.upload input{display:none}.tab-content{padding:20px 0;display:grid;gap:10px}.row{padding:14px 16px;display:flex;justify-content:space-between;gap:12px}.row strong,.row span{display:block}.row div span{color:var(--mat-sys-on-surface-variant);font-size:13px;margin-top:4px}.status{display:flex;align-items:center;gap:4px;font-weight:600}.status--rojo{color:var(--pp-rojo)}.status--amarillo{color:var(--pp-amarillo)}.total{font-size:18px}.message{padding:18px;display:flex;align-items:center;gap:10px}@media(max-width:600px){.profile{align-items:flex-start;flex-direction:column}.profile h1{font-size:26px}.row{align-items:flex-start;flex-direction:column}}`],
})
export class FichaComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly ficha = signal<FichaCiudadano | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly fotoPreview = signal('');

  constructor() { this.cargar(); }
  protected cargar(): void {
    this.cargando.set(true); this.error.set('');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.obtenerFicha(id).subscribe({ next: (data) => { this.ficha.set(data); this.cargando.set(false); }, error: () => { this.error.set('No se pudo cargar la ficha.'); this.cargando.set(false); } });
  }
  protected seleccionarFoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { this.error.set('Selecciona una imagen JPG, PNG o WebP de máximo 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => this.fotoPreview.set(String(reader.result));
    reader.readAsDataURL(file);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.subirFoto(id, file).subscribe({ next: (result) => { const actual = this.ficha(); if (actual) this.ficha.set({ ...actual, fotoUrl: result.fotoUrl }); }, error: () => this.error.set('No se pudo guardar la fotografía.') });
  }
  protected foto(url: string | null): string { return url ? `${environment.apiUrl}${url}` : '/images/avatar-default.svg'; }
}
