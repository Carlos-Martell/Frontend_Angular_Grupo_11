import { Routes } from '@angular/router';

export const EGRESOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./egresos.component').then((m) => m.EgresosComponent),
  },
];
