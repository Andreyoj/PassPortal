import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import type { Ciudadano } from '../../models/domain.model';
import { colorAvatar, iniciales } from '../../utils/presentation';

@Component({
  selector: 'app-ciudadanos',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <header class="page-header">
      <div>
        <p class="eyebrow">Registro migratorio</p>
        <h1>Ciudadanos</h1>
        <p class="subtitle">Busca por nombre, apellidos o DPI.</p>
      </div>
    </header>

    <mat-form-field appearance="outline" class="search">
      <mat-label>Buscar ciudadano</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input matInput (input)="buscar($event)" placeholder="Nombre o DPI" />
    </mat-form-field>

    @if (cargando()) { 
      <mat-progress-bar mode="indeterminate" aria-label="Cargando ciudadanos" /> 
    }

    @if (error()) { 
      <mat-card class="card message">
        <mat-icon class="error-icon">error</mat-icon>
        <span>{{ error() }}</span>
        <button mat-button color="primary" (click)="cargar()">Reintentar</button>
      </mat-card> 
    }

    @if (!cargando() && !error() && ciudadanos().length === 0) { 
      <mat-card class="card message empty-state">
        <svg viewBox="0 0 120 80" aria-hidden="true" class="empty-icon">
          <circle cx="48" cy="36" r="22" fill="none" stroke="currentColor" stroke-width="4"/>
          <path d="m64 52 20 18M38 36h20M48 26v20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <span>No se encontraron ciudadanos.</span>
      </mat-card> 
    }

    <section class="grid" aria-label="Resultados de ciudadanos">
      @for (ciudadano of ciudadanosVisibles(); track ciudadano.id) {
        <a class="citizen card" [routerLink]="['/ciudadanos', ciudadano.id]">
          <span class="avatar" [style.background]="colorAvatar(ciudadano.nombres + ' ' + ciudadano.apellidos)">
            {{ iniciales(ciudadano.nombres + ' ' + ciudadano.apellidos) }}
          </span>
          <span class="citizen-info">
            <strong>{{ ciudadano.nombres }} {{ ciudadano.apellidos }}</strong>
            <small>DPI {{ ciudadano.dpi }}</small>
            <small>{{ ciudadano.nacionalidad }}</small>
          </span>
          <mat-icon class="arrow-icon" matTooltip="Abrir ficha">chevron_right</mat-icon>
        </a>
      }
    </section>

    @if (!cargando() && ciudadanos().length > 0) { 
      <mat-paginator 
        [length]="ciudadanos().length" 
        [pageSize]="pageSize()" 
        [pageSizeOptions]="[5,10,25]" 
        (page)="cambiarPagina($event)" 
        aria-label="Paginación de ciudadanos" 
      /> 
    }
  `,
  styles: [`
    .page-header {
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

    .page-header h1 {
      margin: 0 0 8px 0;
      color: var(--text-primary);
      font-size: 1.85rem;
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
    }

    .search {
      width: min(100%, 520px);
      margin-bottom: 16px;
    }

    mat-progress-bar {
      margin-bottom: 16px;
      border-radius: var(--border-radius-sm);
    }

    .grid {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .citizen {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      text-decoration: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06) !important;

        .arrow-icon {
          color: var(--primary);
          transform: translateX(3px);
        }
      }
    }

    .citizen-info {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--text-primary);
        font-size: 1.05rem;
      }

      small {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin-top: 2px;
      }
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 1.05rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .arrow-icon {
      color: var(--text-muted);
      transition: transform 0.15s ease, color 0.15s ease;
    }

    .message {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-secondary);
      margin-top: 16px;
    }

    .error-icon {
      color: var(--pp-rojo);
    }

    .empty-state {
      flex-direction: column;
      padding: 40px 24px;

      .empty-icon {
        width: 80px;
        height: 60px;
        color: var(--text-muted);
        margin-bottom: 8px;
      }
    }

    mat-paginator {
      margin-top: 24px;
      background: transparent !important;
      color: var(--text-secondary) !important;
    }
  `],
})
export class CiudadanosComponent {
  private readonly api = inject(ApiService);
  private readonly cambios = new Subject<string>();
  protected readonly ciudadanos = signal<Ciudadano[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  constructor() {
    this.cambios.pipe(debounceTime(300), distinctUntilChanged(), switchMap((q) => this.api.buscarCiudadanos(q))).subscribe({
      next: (data) => { this.ciudadanos.set(data); this.pageIndex.set(0); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo cargar la búsqueda.'); this.cargando.set(false); },
    });
    this.cargar();
  }
  protected cargar(): void { this.cargando.set(true); this.error.set(''); this.cambios.next(''); }
  protected buscar(event: Event): void { this.cargando.set(true); this.error.set(''); this.cambios.next((event.target as HTMLInputElement).value); }
  protected cambiarPagina(event: PageEvent): void { this.pageIndex.set(event.pageIndex); this.pageSize.set(event.pageSize); }
  protected ciudadanosVisibles(): Ciudadano[] {
    const inicio = this.pageIndex() * this.pageSize();
    return this.ciudadanos().slice(inicio, inicio + this.pageSize());
  }
  protected readonly colorAvatar = colorAvatar;
  protected readonly iniciales = iniciales;
}