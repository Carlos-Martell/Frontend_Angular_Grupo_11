import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EgresoCargaMasivaResultado, EgresoDTO } from '../models';

export type NuevoEgreso = Omit<EgresoDTO, 'id' | 'estado' | 'usuarioId' | 'comprobanteUrl'>;

@Injectable({ providedIn: 'root' })
export class EgresoService {
  private readonly baseUrl = `${environment.apiUrl}/egresos`;

  constructor(private readonly http: HttpClient) {}

  registrar(egreso: NuevoEgreso, usuarioId: number): Observable<EgresoDTO> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<EgresoDTO>(this.baseUrl, egreso, { params });
  }

  cargarMasivo(archivo: File, usuarioId: number): Observable<EgresoCargaMasivaResultado> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<EgresoCargaMasivaResultado>(`${this.baseUrl}/masivo`, formData, { params });
  }

  listarPorMes(fecha: string): Observable<EgresoDTO[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<EgresoDTO[]>(`${this.baseUrl}/mes`, { params });
  }

  obtener(id: number): Observable<EgresoDTO> {
    return this.http.get<EgresoDTO>(`${this.baseUrl}/${id}`);
  }

  anular(id: number): Observable<EgresoDTO> {
    return this.http.patch<EgresoDTO>(`${this.baseUrl}/${id}/anular`, {});
  }

  procesar(id: number): Observable<EgresoDTO> {
    return this.http.patch<EgresoDTO>(`${this.baseUrl}/${id}/procesar`, {});
  }
}
