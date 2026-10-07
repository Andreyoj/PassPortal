import type { Routes } from '@angular/router';
import { ShellComponent } from './components/shell/shell.component';
import { adminGuard, authGuard, roleGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión · Pass Portal', loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent) },
  { path: 'register', title: 'Crear cuenta · Pass Portal', loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'perfil', title: 'Mi perfil · Pass Portal', loadComponent: () => import('./components/profile/profile.component').then((m) => m.ProfileComponent) },
      { path: 'admin/usuarios', canActivate: [adminGuard], title: 'Gestión de usuarios · Pass Portal', loadComponent: () => import('./components/admin-users/admin-users.component').then((m) => m.AdminUsersComponent) },
      {
        path: 'dashboard',
        canActivate: [roleGuard('OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR')],
        title: 'Panel de alertas · Pass Portal',
        loadComponent: () => import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'ciudadanos',
        canActivate: [roleGuard('OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR')],
        title: 'Ciudadanos · Pass Portal',
        loadComponent: () => import('./components/ciudadanos/ciudadanos.component').then((m) => m.CiudadanosComponent),
      },
      {
        path: 'ciudadanos/:id',
        canActivate: [roleGuard('OPERADOR', 'SUPERVISOR', 'ADMINISTRADOR')],
        title: 'Ficha del ciudadano · Pass Portal',
        loadComponent: () => import('./components/ficha/ficha.component').then((m) => m.FichaComponent),
      },
      {
        path: '**',
        title: 'No encontrada · Pass Portal',
        loadComponent: () => import('./components/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
