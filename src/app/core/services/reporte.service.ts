import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, from, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  constructor(private readonly http: HttpClient) {}

  private descargar(path: string, params: HttpParams): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${path}`, {
      params,
      responseType: 'blob',
      observe: 'response',
    }).pipe(
      switchMap((respuesta) => {
        const contenido = respuesta.body;
        const tipo = (respuesta.headers.get('Content-Type') || contenido?.type || '').toLowerCase();

        // Algunos fallbacks pueden devolver HTTP 200 con JSON. Nunca descargarlo como Excel.
        if (contenido && (tipo.includes('application/json') || tipo.includes('problem+json'))) {
          return from(contenido.text()).pipe(
            switchMap((texto) => {
              let cuerpo: unknown;
              try {
                cuerpo = JSON.parse(texto);
              } catch {
                cuerpo = { message: 'El servicio de reportes no devolvió un archivo Excel.' };
              }
              return throwError(() => new HttpErrorResponse({
                status: 503,
                statusText: 'Respuesta no válida del servicio de reportes',
                url: respuesta.url ?? undefined,
                headers: respuesta.headers,
                error: cuerpo,
              }));
            })
          );
        }

        if (!contenido || contenido.size === 0) {
          return throwError(() => new HttpErrorResponse({
            status: 503,
            statusText: 'Reporte vacío',
            url: respuesta.url ?? undefined,
            headers: respuesta.headers,
            error: { message: 'El servicio no devolvió contenido para el reporte.' },
          }));
        }

        return of(respuesta);
      })
    );
  }

  movimientosDiarios(fecha: string): Observable<HttpResponse<Blob>> {
    return this.descargar('movimientos-diarios', new HttpParams().set('fecha', fecha));
  }

  bancos(fecha: string): Observable<HttpResponse<Blob>> {
    return this.descargar('bancos', new HttpParams().set('fecha', fecha));
  }

  totales(mes: string): Observable<HttpResponse<Blob>> {
    return this.descargar('totales', new HttpParams().set('mes', mes));
  }

  mensual(mes: string): Observable<HttpResponse<Blob>> {
    return this.descargar('mensual', new HttpParams().set('mes', mes));
  }

  socios(mes: string): Observable<HttpResponse<Blob>> {
    return this.descargar('socios', new HttpParams().set('mes', mes));
  }

  noSocios(mes: string): Observable<HttpResponse<Blob>> {
    return this.descargar('no-socios', new HttpParams().set('mes', mes));
  }

  egresos(mes: string): Observable<HttpResponse<Blob>> {
    return this.descargar('egresos', new HttpParams().set('mes', mes));
  }
}
