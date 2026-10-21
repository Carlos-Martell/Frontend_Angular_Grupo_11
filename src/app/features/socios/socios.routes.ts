import { Routes } from '@angular/router';

export const SOCIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./socio-list.component').then((m) => m.SocioListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./socio-form.component').then((m) => m.SocioFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./socio-form.component').then((m) => m.SocioFormComponent),
  },
];
