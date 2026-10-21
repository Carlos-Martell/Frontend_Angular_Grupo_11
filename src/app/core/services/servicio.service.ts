import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServicioDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  private readonly baseUrl = `${environment.apiUrl}/servicios`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ServicioDTO[]> {
    return this.http.get<ServicioDTO[]>(this.baseUrl);
  }

  obtener(id: number): Observable<ServicioDTO> {
    return this.http.get<ServicioDTO>(`${this.baseUrl}/${id}`);
  }

  crear(servicio: ServicioDTO): Observable<ServicioDTO> {
    return this.http.post<ServicioDTO>(this.baseUrl, servicio);
  }

  actualizar(id: number, servicio: ServicioDTO): Observable<ServicioDTO> {
    return this.http.put<ServicioDTO>(`${this.baseUrl}/${id}`, servicio);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
