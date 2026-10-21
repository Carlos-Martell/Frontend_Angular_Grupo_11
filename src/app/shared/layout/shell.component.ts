import { Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavIconComponent, NavIconName } from './nav-icon.component';

interface NavItem {
  path: string;
  label: string;
  icon: NavIconName;
  
  exact?: boolean;
  
  soloAdministrador?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Inicio', icon: 'home', exact: true },
  { path: '/socios', label: 'Socios', icon: 'users' },
  { path: '/giros', label: 'Giros', icon: 'briefcase' },
  { path: '/bancos', label: 'Bancos', icon: 'bank' },
  { path: '/puestos', label: 'Puestos', icon: 'grid' },
  { path: '/servicios', label: 'Servicios', icon: 'sliders' },
  { path: '/cuentas-por-cobrar', label: 'Cuentas por cobrar', icon: 'credit-card' },
  { path: '/recibos', label: 'Recibos', icon: 'receipt' },
  { path: '/egresos', label: 'Egresos', icon: 'trending-down' },
  { path: '/reportes', label: 'Reportes', icon: 'bar-chart' },
  { path: '/usuarios', label: 'Usuarios', icon: 'user-check', soloAdministrador: true },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet, NavIconComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sesion = this.authService.sesion;
  readonly esAdministrador = this.authService.esAdministrador;

  readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.soloAdministrador || this.esAdministrador())
  );

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  iniciales(nombres: string, apellidos: string): string {
    const inicial = (texto: string) => texto.trim().charAt(0).toUpperCase();
    return `${inicial(nombres)}${inicial(apellidos)}`;
  }
}
