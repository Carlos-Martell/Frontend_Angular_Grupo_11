import { Routes } from '@angular/router';

export const RECIBOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./recibos.component').then((m) => m.RecibosComponent),
  },
];
