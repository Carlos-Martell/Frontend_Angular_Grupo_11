import { Routes } from '@angular/router';

export const SERVICIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./servicio-list.component').then((m) => m.ServicioListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./servicio-form.component').then((m) => m.ServicioFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./servicio-form.component').then((m) => m.ServicioFormComponent),
  },
];
