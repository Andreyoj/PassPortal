import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import type { Ciudadano } from '../../models/domain.model';

@Component({
  selector: 'app-ciudadanos',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule],
  template: `
    <header class="page-header"><div><p class="eyebrow">Registro migratorio</p><h1>Ciudadanos</h1><p>Busca por nombre, apellidos o DPI.</p></div></header>
    <mat-form-field appearance="outline" class="search"><mat-label>Buscar ciudadano</mat-label><mat-icon matPrefix>search</mat-icon><input matInput (input)="buscar($event)" placeholder="Nombre o DPI" /></mat-form-field>
    @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando ciudadanos" /> }
    @if (error()) { <mat-card class="message"><mat-icon>error</mat-icon>{{ error() }}<button mat-button (click)="cargar()">Reintentar</button></mat-card> }
    @if (!cargando() && !error() && ciudadanos().length === 0) { <mat-card class="message">No se encontraron ciudadanos.</mat-card> }
    <section class="grid" aria-label="Resultados de ciudadanos">
      @for (ciudadano of ciudadanos(); track ciudadano.id) {
        <a class="citizen" [routerLink]="['/ciudadanos', ciudadano.id]">
          <span class="avatar">{{ iniciales(ciudadano) }}</span><span><strong>{{ ciudadano.nombres }} {{ ciudadano.apellidos }}</strong><small>DPI {{ ciudadano.dpi }}</small><small>{{ ciudadano.nacionalidad }}</small></span><mat-icon>chevron_right</mat-icon>
        </a>
      }
    </section>
  `,
  styles: [`.page-header{margin-bottom:20px}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.08em;margin:0}.page-header h1{margin:4px 0;font-size:32px}.page-header p:last-child{color:var(--mat-sys-on-surface-variant)}.search{width:min(100%,520px)}.grid{display:grid;gap:10px;margin-top:20px}.citizen{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--mat-sys-outline-variant);border-radius:12px;color:inherit;text-decoration:none;background:var(--mat-sys-surface)}.citizen:hover{background:var(--mat-sys-surface-container)}.citizen strong,.citizen small{display:block}.citizen small{color:var(--mat-sys-on-surface-variant);font-size:13px;margin-top:3px}.avatar{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--mat-sys-primary-container);color:var(--mat-sys-on-primary-container);font-weight:700}.message{padding:18px;display:flex;align-items:center;gap:10px}`],
})
export class CiudadanosComponent {
  private readonly api = inject(ApiService);
  private readonly cambios = new Subject<string>();
  protected readonly ciudadanos = signal<Ciudadano[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.cambios.pipe(debounceTime(250), distinctUntilChanged(), switchMap((q) => this.api.buscarCiudadanos(q))).subscribe({
      next: (data) => { this.ciudadanos.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo cargar la búsqueda.'); this.cargando.set(false); },
    });
    this.cargar();
  }
  protected cargar(): void { this.cargando.set(true); this.error.set(''); this.cambios.next(''); }
  protected buscar(event: Event): void { this.cargando.set(true); this.error.set(''); this.cambios.next((event.target as HTMLInputElement).value); }
  protected iniciales(c: Ciudadano): string { return `${c.nombres[0] ?? ''}${c.apellidos[0] ?? ''}`.toUpperCase(); }
}
