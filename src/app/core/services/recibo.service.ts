import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CanjeBancoRequest, ProcesarPagoRequest, ReciboDTO, TipoRecibo } from '../models';

export interface FiltroRecibos {
  tipo: TipoRecibo;
  
  desde?: string;
  
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class ReciboService {
  private readonly baseUrl = `${environment.apiUrl}/recibos`;

  constructor(private readonly http: HttpClient) {}

  procesarPago(request: ProcesarPagoRequest): Observable<ReciboDTO[]> {
    return this.http.post<ReciboDTO[]>(`${this.baseUrl}/pagos`, request);
  }

  canjearBanco(request: CanjeBancoRequest): Observable<ReciboDTO> {
    return this.http.post<ReciboDTO>(`${this.baseUrl}/canje`, request);
  }

  registrarIngresoExterno(recibo: ReciboDTO): Observable<ReciboDTO> {
    return this.http.post<ReciboDTO>(`${this.baseUrl}/ingresos-externos`, recibo);
  }

  listar(filtro: FiltroRecibos): Observable<ReciboDTO[]> {
    // El endpoint de pagos-service exige tipo, desde y hasta.
    // Cuando la pantalla no aplica un limite de fechas, usamos un rango amplio.
    const params = new HttpParams()
      .set('tipo', filtro.tipo)
      .set('desde', filtro.desde || '2000-01-01T00:00:00')
      .set('hasta', filtro.hasta || '2100-12-31T23:59:59');

    return this.http.get<ReciboDTO[]>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<ReciboDTO> {
    return this.http.get<ReciboDTO>(`${this.baseUrl}/${id}`);
  }
}
