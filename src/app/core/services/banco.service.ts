import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BancoDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class BancoService {
  private readonly baseUrl = `${environment.apiUrl}/bancos`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<BancoDTO[]> {
    return this.http.get<BancoDTO[]>(this.baseUrl);
  }

  obtener(id: number): Observable<BancoDTO> {
    return this.http.get<BancoDTO>(`${this.baseUrl}/${id}`);
  }

  crear(banco: BancoDTO): Observable<BancoDTO> {
    return this.http.post<BancoDTO>(this.baseUrl, banco);
  }

  actualizar(id: number, banco: BancoDTO): Observable<BancoDTO> {
    return this.http.put<BancoDTO>(`${this.baseUrl}/${id}`, banco);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
