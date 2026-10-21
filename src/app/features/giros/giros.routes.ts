import { Routes } from '@angular/router';

export const GIROS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./giro-list.component').then((m) => m.GiroListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./giro-form.component').then((m) => m.GiroFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./giro-form.component').then((m) => m.GiroFormComponent),
  },
];
