import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PuestoDTO, ResumenCuentasDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class PuestoService {
  private readonly baseUrl = `${environment.apiUrl}/puestos`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<PuestoDTO[]> {
    return this.http.get<PuestoDTO[]>(this.baseUrl);
  }

  listarPorSocio(socioId: number): Observable<PuestoDTO[]> {
    return this.http.get<PuestoDTO[]>(`${this.baseUrl}/socio/${socioId}`);
  }

  obtener(id: number): Observable<PuestoDTO> {
    return this.http.get<PuestoDTO>(`${this.baseUrl}/${id}`);
  }

  obtenerResumen(id: number): Observable<ResumenCuentasDTO> {
    return this.http.get<ResumenCuentasDTO>(`${this.baseUrl}/${id}/resumen`);
  }

  crear(puesto: PuestoDTO): Observable<PuestoDTO> {
    return this.http.post<PuestoDTO>(this.baseUrl, puesto);
  }

  actualizar(id: number, puesto: PuestoDTO): Observable<PuestoDTO> {
    return this.http.put<PuestoDTO>(`${this.baseUrl}/${id}`, puesto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
