import { Routes } from '@angular/router';
import { roleGuardFactory } from '../../core/guards/role.guard';

const soloAdministrador = roleGuardFactory('ADMINISTRADOR');

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [soloAdministrador],
    loadComponent: () =>
      import('./usuario-list.component').then((m) => m.UsuarioListComponent),
  },
  {
    path: 'nuevo',
    canActivate: [soloAdministrador],
    loadComponent: () =>
      import('./usuario-form.component').then((m) => m.UsuarioFormComponent),
  },
  {
    path: ':id',
    canActivate: [soloAdministrador],
    loadComponent: () =>
      import('./usuario-form.component').then((m) => m.UsuarioFormComponent),
  },
];
