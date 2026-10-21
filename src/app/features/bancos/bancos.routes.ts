import { Routes } from '@angular/router';

export const BANCOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./banco-list.component').then((m) => m.BancoListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./banco-form.component').then((m) => m.BancoFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./banco-form.component').then((m) => m.BancoFormComponent),
  },
];
