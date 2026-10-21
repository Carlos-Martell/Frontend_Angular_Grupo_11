import { Routes } from '@angular/router';

export const PUESTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./puesto-list.component').then((m) => m.PuestoListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./puesto-form.component').then((m) => m.PuestoFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./puesto-form.component').then((m) => m.PuestoFormComponent),
  },
];
