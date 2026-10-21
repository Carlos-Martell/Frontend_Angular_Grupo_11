import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GiroDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class GiroService {
  private readonly baseUrl = `${environment.apiUrl}/giros`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<GiroDTO[]> {
    return this.http.get<GiroDTO[]>(this.baseUrl);
  }

  obtener(id: number): Observable<GiroDTO> {
    return this.http.get<GiroDTO>(`${this.baseUrl}/${id}`);
  }

  crear(giro: GiroDTO): Observable<GiroDTO> {
    return this.http.post<GiroDTO>(this.baseUrl, giro);
  }

  actualizar(id: number, giro: GiroDTO): Observable<GiroDTO> {
    return this.http.put<GiroDTO>(`${this.baseUrl}/${id}`, giro);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
