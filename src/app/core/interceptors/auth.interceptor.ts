import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ErrorResponse } from '../models/error-response.model';
import { environment } from '../../../environments/environment';

const MENSAJE_403 = 'No tiene permisos para realizar esta acción.';
const MENSAJE_503 = 'El servicio solicitado no está disponible temporalmente. Inténtelo nuevamente más tarde.';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esFallbackExplicito(respuesta: HttpResponse<unknown>): boolean {
  // No interpretar resultados vacíos ni mensajes genéricos como fallbacks.
  // Estos indicadores son opcionales y deben ser enviados expresamente por el backend.
  const encabezado = respuesta.headers.get('X-Circuit-Breaker-Fallback');
  const cuerpo = respuesta.body;
  return encabezado?.toLowerCase() === 'true' ||
    (esObjeto(cuerpo) && cuerpo['fallback'] === true);
}

function obtenerMensaje(error: HttpErrorResponse): string | null {
  const datos = esObjeto(error.error) ? error.error : null;
  const mensajeBackend = typeof datos?.['message'] === 'string'
    ? datos['message'].trim() : '';

  switch (error.status) {
    case 0:
      return 'No fue posible conectar con el API Gateway. Compruebe la red y la configuración CORS.';
    case 403:
      return mensajeBackend || MENSAJE_403;
    case 502:
      return 'El API Gateway no pudo comunicarse con el microservicio solicitado.';
    case 503:
      return MENSAJE_503;
    case 504:
      return 'El microservicio tardó demasiado en responder. Inténtelo nuevamente.';
    default:
      return null;
  }
}

function normalizarError(error: HttpErrorResponse, mensaje: string): HttpErrorResponse {
  const original = esObjeto(error.error) ? error.error : {};
  const cuerpo: ErrorResponse = {
    timestamp: typeof original['timestamp'] === 'string'
      ? original['timestamp'] : new Date().toISOString(),
    status: error.status,
    error: typeof original['error'] === 'string'
      ? original['error'] : error.statusText || 'Error HTTP',
    message: mensaje,
    detalles: Array.isArray(original['detalles'])
      ? original['detalles'].filter((valor): valor is string => typeof valor === 'string')
      : null,
  };

  return new HttpErrorResponse({
    error: cuerpo,
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url ?? undefined,
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const apiUrl = environment.apiUrl.replace(/\/$/, '');
  const esApiGateway = req.url === apiUrl || req.url.startsWith(`${apiUrl}/`);
  const esLogin = esApiGateway && req.url.split('?')[0] === `${apiUrl}/auth/login`;
  const token = authService.token?.replace(/^Bearer\s+/i, '').trim();

  const request = esApiGateway && !esLogin && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    map((evento: HttpEvent<unknown>) => {
      if (esApiGateway && evento instanceof HttpResponse && esFallbackExplicito(evento)) {
        // Un fallback HTTP 200 marcado explícitamente no debe presentarse como dato real.
        throw new HttpErrorResponse({
          status: 503,
          statusText: 'Circuit Breaker Fallback',
          url: evento.url ?? undefined,
          headers: evento.headers,
          error: { message: MENSAJE_503 },
        });
      }
      return evento;
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !esApiGateway) {
        return throwError(() => error);
      }

      // Una contraseña incorrecta en el login NO invalida otra sesión automáticamente.
      if (error.status === 401 && !esLogin) {
        authService.logout();
        void router.navigate(['/login'], { queryParams: { sesionExpirada: true } });
        return throwError(() => error);
      }

      const mensaje = obtenerMensaje(error);
      return throwError(() => mensaje ? normalizarError(error, mensaje) : error);
    })
  );
};
