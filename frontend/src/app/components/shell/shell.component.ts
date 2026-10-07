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

interface EnlaceMenu { ruta: string; etiqueta: string; icono: string; roles?: readonly string[]; }

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #menu class="shell__menu" [mode]="esMovil() ? 'over' : 'side'" [opened]="!esMovil()">
        <div class="shell__marca"><img src="/images/pass-portal-mark.svg" alt="" /><div><strong>Pass Portal</strong><span>Gestión migratoria</span></div></div>
        <mat-nav-list>
          @for (enlace of enlaces; track enlace.ruta) {
            @if (!enlace.roles || enlace.roles.includes(auth.empleado()?.rol ?? '')) { <a mat-list-item [routerLink]="enlace.ruta" routerLinkActive="shell__enlace--activo" (click)="cerrarEnMovil()">
              <mat-icon matListItemIcon aria-hidden="true">{{ enlace.icono }}</mat-icon><span matListItemTitle>{{ enlace.etiqueta }}</span>
            </a> }
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content class="shell__contenido">
        <mat-toolbar class="shell__barra">
          @if (esMovil()) { <button mat-icon-button type="button" aria-label="Abrir menú" matTooltip="Abrir menú" (click)="menu.toggle()"><mat-icon>menu</mat-icon></button> }
          <span class="shell__titulo">Panel de control migratorio</span><span class="shell__spacer"></span><span class="shell__avatar" [style.background]="colorAvatar(auth.empleado()?.nombreCompleto ?? '')" aria-hidden="true">{{ iniciales() }}</span><span class="shell__usuario"><strong>{{ auth.empleado()?.nombreCompleto }}</strong><small>{{ auth.empleado()?.rol }}</small></span><button mat-flat-button class="logout" type="button" (click)="auth.logout()" matTooltip="Cerrar sesión"><mat-icon>logout</mat-icon>Cerrar sesión</button>
        </mat-toolbar>
        <main class="shell__pagina"><router-outlet /><footer>Entorno de demostración con datos ficticios</footer></main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`.shell{min-height:100dvh}.shell__menu{width:260px;border-right:1px solid var(--mat-sys-outline-variant)}.shell__marca{display:flex;align-items:center;gap:12px;padding:20px 16px 12px;color:var(--mat-sys-primary)}.shell__marca mat-icon{font-size:32px;width:32px;height:32px}.shell__marca div{display:flex;flex-direction:column;line-height:1.2}.shell__marca span{font-size:12px;color:var(--mat-sys-on-surface-variant)}.shell__enlace--activo{background:var(--mat-sys-secondary-container)}.shell__barra{position:sticky;top:0;z-index:2;background:var(--mat-sys-surface);border-bottom:1px solid var(--mat-sys-outline-variant)}.shell__titulo{font-weight:500}.shell__spacer{flex:1}.shell__usuario{display:flex;flex-direction:column;line-height:1.2;margin:0 10px;font-size:13px}.shell__usuario small{color:var(--mat-sys-on-surface-variant);font-size:11px}.shell__avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--pp-marino);color:#fff;font-size:12px;font-weight:700}.shell__pagina{padding:24px;max-width:1400px;margin:0 auto}.shell__pagina footer{text-align:center;color:var(--mat-sys-on-surface-variant);font-size:11px;margin-top:32px}@media(max-width:600px){.shell__pagina{padding:16px}.shell__usuario{display:none}}`],
})
export class ShellComponent {
  private readonly breakpoint = inject(BreakpointObserver);
  protected readonly auth = inject(AuthService);
  private readonly menu = viewChild.required<MatSidenav>('menu');
  protected readonly esMovil = toSignal(this.breakpoint.observe('(max-width: 960px)').pipe(map((estado) => estado.matches)), { initialValue: false });
  protected readonly enlaces: readonly EnlaceMenu[] = [
    { ruta: '/dashboard', etiqueta: 'Panel de alertas', icono: 'notifications_active', roles: ['PERSONAL', 'ADMINISTRADOR'] },
    { ruta: '/ciudadanos', etiqueta: 'Ciudadanos', icono: 'badge', roles: ['PERSONAL', 'ADMINISTRADOR'] },
    { ruta: '/perfil', etiqueta: 'Mi perfil', icono: 'account_circle' },
    { ruta: '/mi-informacion', etiqueta: 'Mi información migratoria', icono: 'folder_shared', roles: ['USUARIO'] },
    { ruta: '/admin/usuarios', etiqueta: 'Usuarios', icono: 'manage_accounts', roles: ['ADMINISTRADOR'] },
  ];
  protected cerrarEnMovil(): void { if (this.esMovil()) void this.menu().close(); }
  protected iniciales(): string {
    return iniciales(this.auth.empleado()?.nombreCompleto ?? '');
  }
  protected readonly colorAvatar = colorAvatar;
}
