import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RolUsuario, SesionUsuario } from '../models/auth.model';

const SESSION_STORAGE_KEY = 'grupo5_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly sesionSignal = signal<SesionUsuario | null>(this.leerSesionGuardada());

  readonly sesion = this.sesionSignal.asReadonly();

  readonly autenticado = computed(() => this.sesionSignal() !== null); // Se valida la expiración al consultar la sesión

  readonly rol = computed<RolUsuario | null>(() => this.sesionSignal()?.rol ?? null);

  readonly esAdministrador = computed(() => this.rol() === 'ADMINISTRADOR');

  readonly usuarioId = computed<number | null>(() => this.sesionSignal()?.id ?? null);

  constructor(private readonly http: HttpClient) {
    this.rehidratarIdSiFalta();
  }

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  logout(): void {
    this.sesionSignal.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  get token(): string | null {
    const sesion = this.sesionSignal();
    if (!sesion) return null;
    if (!this.tokenVigente(sesion.token)) {
      this.logout();
      return null;
    }
    return sesion.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  private guardarSesion(respuesta: LoginResponse): void {

    if (!respuesta.token || !this.tokenVigente(respuesta.token)) {
      this.logout();
      throw new Error('El servidor devolvió un JWT inválido o vencido.');
    }

    const sesion: SesionUsuario = {
      id: respuesta.id,
      token: respuesta.token,
      username: respuesta.username,
      nombres: respuesta.nombres,
      apellidos: respuesta.apellidos,
      rol: respuesta.rol,
    };
    this.sesionSignal.set(sesion);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion));
    }
  }

  private rehidratarIdSiFalta(): void {
    const actual = this.sesionSignal();
    if (!actual || actual.id !== undefined || !this.isAuthenticated()) {
      return;
    }
    this.http.get<LoginResponse>(`${this.apiUrl}/me`).subscribe({
      next: (perfil) => {
        const actualizada: SesionUsuario = { ...actual, id: perfil.id };
        // No restaurar una sesión caducada durante la petición.
        if (this.sesionSignal()?.token !== actual.token || !this.isAuthenticated()) return;
        this.sesionSignal.set(actualizada);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(actualizada));
        }
      },

      error: () => {},
    });
  }

  private leerSesionGuardada(): SesionUsuario | null {
    if (typeof sessionStorage === 'undefined') return null;
    const crudo = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!crudo) return null;
    try {
      const sesion = JSON.parse(crudo) as SesionUsuario;
      if (!sesion || !this.tokenVigente(sesion.token)) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private tokenVigente(token: unknown): token is string {
    if (typeof token !== 'string' || typeof atob === 'undefined') return false;
    const partes = token.replace(/^Bearer\s+/i, '').split('.');
    if (partes.length !== 3) return false;
    try {
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { exp?: unknown };
      return typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
