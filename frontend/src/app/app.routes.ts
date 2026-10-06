import type { Routes } from '@angular/router';
import { ShellComponent } from './components/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel de alertas · Pass Portal',
        loadComponent: () => import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'ciudadanos',
        title: 'Ciudadanos · Pass Portal',
        loadComponent: () => import('./components/ciudadanos/ciudadanos.component').then((m) => m.CiudadanosComponent),
      },
      {
        path: 'ciudadanos/:id',
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
