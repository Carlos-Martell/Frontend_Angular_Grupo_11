import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResumenCuentasDTO, SocioDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class SocioService {
  private readonly baseUrl = `${environment.apiUrl}/socios`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<SocioDTO[]> {
    return this.http.get<SocioDTO[]>(this.baseUrl);
  }

  listarPorEtapas(etapas: number[]): Observable<SocioDTO[]> {
    return this.http.get<SocioDTO[]>(`${this.baseUrl}/etapas`, {
      params: { etapas: etapas.join(',') },
    });
  }

  obtener(id: number): Observable<SocioDTO> {
    return this.http.get<SocioDTO>(`${this.baseUrl}/${id}`);
  }

  obtenerResumen(id: number): Observable<ResumenCuentasDTO> {
    return this.http.get<ResumenCuentasDTO>(`${this.baseUrl}/${id}/resumen`);
  }

  crear(socio: SocioDTO): Observable<SocioDTO> {
    return this.http.post<SocioDTO>(this.baseUrl, socio);
  }

  actualizar(id: number, socio: SocioDTO): Observable<SocioDTO> {
    return this.http.put<SocioDTO>(`${this.baseUrl}/${id}`, socio);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
