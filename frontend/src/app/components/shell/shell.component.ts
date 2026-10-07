import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { colorAvatar, iniciales } from '../../utils/presentation';

interface EnlaceMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
  roles?: readonly string[];
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #menu
        class="shell__menu"
        [mode]="esMovil() ? 'over' : 'side'"
        [opened]="!esMovil()"
      >
        <div class="shell__marca">
          <img src="/images/pass-portal-mark.svg" alt="Pass Portal" class="shell__logo" />
          <div>
            <strong>Pass Portal</strong>
            <span>Gestión migratoria</span>
          </div>
        </div>

        <mat-nav-list class="shell__nav">
          @for (enlace of enlaces; track enlace.ruta) {
            @if (!enlace.roles || enlace.roles.includes(auth.empleado()?.rol ?? '')) {
              <a
                mat-list-item
                [routerLink]="enlace.ruta"
                routerLinkActive="shell__enlace--activo"
                (click)="cerrarEnMovil()"
              >
                <mat-icon matListItemIcon aria-hidden="true">{{ enlace.icono }}</mat-icon>
                <span matListItemTitle>{{ enlace.etiqueta }}</span>
              </a>
            }
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="shell__contenido">
        <mat-toolbar class="shell__barra">
          @if (esMovil()) {
            <button
              mat-icon-button
              type="button"
              aria-label="Abrir menú"
              matTooltip="Abrir menú"
              (click)="menu.toggle()"
            >
              <mat-icon>menu</mat-icon>
            </button>
          }

          <span class="shell__titulo">Panel de control migratorio</span>
          <span class="shell__spacer"></span>

          <div class="shell__user-profile">
            <span
              class="shell__avatar"
              [style.background]="colorAvatar(auth.empleado()?.nombreCompleto ?? '')"
              aria-hidden="true"
            >
              {{ iniciales() }}
            </span>
            <div class="shell__usuario">
              <strong>{{ auth.empleado()?.nombreCompleto }}</strong>
              <small>{{ auth.empleado()?.rol }}</small>
            </div>
          </div>

          <button
            mat-flat-button
            color="warn"
            class="logout"
            type="button"
            (click)="auth.logout()"
            matTooltip="Cerrar sesión"
          >
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-toolbar>

        <main class="shell__pagina">
          <router-outlet />
          <footer>Entorno de demostración con datos ficticios</footer>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell {
      min-height: 100dvh;
    }

    .shell__menu {
      width: 260px;
      border-right: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
    }

    .shell__marca {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);

      .shell__logo {
        width: 32px;
        height: 32px;
      }

      div {
        display: flex;
        flex-direction: column;
        line-height: 1.2;

        strong {
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }

    .shell__nav {
      padding-top: 12px;
    }

    .shell__enlace--activo {
      background: var(--mat-sys-secondary-container) !important;
      color: var(--mat-sys-on-secondary-container) !important;
      font-weight: 600;

      mat-icon {
        color: var(--primary) !important;
      }
    }

    .shell__barra {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      background: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .shell__titulo {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .shell__spacer {
      flex: 1;
    }

    .shell__user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-right: 8px;
    }

    .shell__avatar {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    .shell__usuario {
      display: flex;
      flex-direction: column;
      line-height: 1.2;

      strong {
        font-size: 0.88rem;
        color: var(--text-primary);
      }

      small {
        color: var(--text-secondary);
        font-size: 0.75rem;
        font-weight: 500;
      }
    }

    .logout {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 38px;
      padding: 0 16px;
    }

    .shell__pagina {
      padding: 28px;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100dvh - 64px);
      display: flex;
      flex-direction: column;

      footer {
        margin-top: auto;
        padding-top: 32px;
        text-align: center;
        color: var(--text-muted, #888);
        font-size: 0.75rem;
      }
    }

    @media (max-width: 768px) {
      .shell__pagina {
        padding: 16px;
      }

      .shell__usuario {
        display: none;
      }

      .shell__titulo {
        font-size: 0.95rem;
      }

      .logout span {
        display: none;
      }

      .logout {
        padding: 0 10px;
        min-width: 40px;
      }
    }
  `],
})
export class ShellComponent {
  private readonly breakpoint = inject(BreakpointObserver);
  protected readonly auth = inject(AuthService);
  private readonly menu = viewChild.required<MatSidenav>('menu');

  protected readonly esMovil = toSignal(
    this.breakpoint.observe('(max-width: 960px)').pipe(map((estado) => estado.matches)),
    { initialValue: false }
  );

  protected readonly enlaces: readonly EnlaceMenu[] = [
    { ruta: '/dashboard', etiqueta: 'Panel de alertas', icono: 'notifications_active', roles: ['PERSONAL', 'ADMINISTRADOR'] },
    { ruta: '/ciudadanos', etiqueta: 'Ciudadanos', icono: 'badge', roles: ['PERSONAL', 'ADMINISTRADOR'] },
    { ruta: '/perfil', etiqueta: 'Mi perfil', icono: 'account_circle' },
    { ruta: '/mi-informacion', etiqueta: 'Mi información migratoria', icono: 'folder_shared', roles: ['USUARIO'] },
    { ruta: '/admin/usuarios', etiqueta: 'Usuarios', icono: 'manage_accounts', roles: ['ADMINISTRADOR'] },
  ];

  protected cerrarEnMovil(): void {
    if (this.esMovil()) void this.menu().close();
  }

  protected iniciales(): string {
    return iniciales(this.auth.empleado()?.nombreCompleto ?? '');
  }

  protected readonly colorAvatar = colorAvatar;
}