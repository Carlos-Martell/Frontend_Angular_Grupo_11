import { Routes } from '@angular/router';

export const CUENTAS_POR_COBRAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cuentas-por-cobrar.component').then((m) => m.CuentasPorCobrarComponent),
  },
];
