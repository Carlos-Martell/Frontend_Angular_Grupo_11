import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'socios',
        loadChildren: () =>
          import('./features/socios/socios.routes').then((m) => m.SOCIOS_ROUTES),
      },
      {
        path: 'giros',
        loadChildren: () =>
          import('./features/giros/giros.routes').then((m) => m.GIROS_ROUTES),
      },
      {
        path: 'bancos',
        loadChildren: () =>
          import('./features/bancos/bancos.routes').then((m) => m.BANCOS_ROUTES),
      },
      {
        path: 'puestos',
        loadChildren: () =>
          import('./features/puestos/puestos.routes').then((m) => m.PUESTOS_ROUTES),
      },
      {
        path: 'servicios',
        loadChildren: () =>
          import('./features/servicios/servicios.routes').then((m) => m.SERVICIOS_ROUTES),
      },
      {
        path: 'cuentas-por-cobrar',
        loadChildren: () =>
          import('./features/cuentas-por-cobrar/cuentas-por-cobrar.routes').then(
            (m) => m.CUENTAS_POR_COBRAR_ROUTES
          ),
      },
      {
        path: 'recibos',
        loadChildren: () =>
          import('./features/recibos/recibos.routes').then((m) => m.RECIBOS_ROUTES),
      },
      {
        path: 'egresos',
        loadChildren: () =>
          import('./features/egresos/egresos.routes').then((m) => m.EGRESOS_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
