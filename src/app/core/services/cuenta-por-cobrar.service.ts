import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CuentaPorCobrarDTO,
  GenerarCuentaConsumoRequest,
  GenerarCuentasPuestoRequest,
  GenerarCuentasSocioRequest,
  TotalCuentasRequest,
  TotalResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CuentaPorCobrarService {
  private readonly baseUrl = `${environment.apiUrl}/cuentas-por-cobrar`;

  constructor(private readonly http: HttpClient) {}

  generarPorPuestos(request: GenerarCuentasPuestoRequest): Observable<CuentaPorCobrarDTO[]> {
    return this.http.post<CuentaPorCobrarDTO[]>(`${this.baseUrl}/generar/puestos`, request);
  }

  generarPorConsumo(request: GenerarCuentaConsumoRequest): Observable<CuentaPorCobrarDTO> {
    return this.http.post<CuentaPorCobrarDTO>(`${this.baseUrl}/generar/consumo`, request);
  }

  generarPorSocios(request: GenerarCuentasSocioRequest): Observable<CuentaPorCobrarDTO[]> {
    return this.http.post<CuentaPorCobrarDTO[]>(`${this.baseUrl}/generar/socios`, request);
  }

  listarPorSocio(socioId: number): Observable<CuentaPorCobrarDTO[]> {
    return this.http.get<CuentaPorCobrarDTO[]>(`${this.baseUrl}/socio/${socioId}`);
  }

  listarPorPuesto(puestoId: number): Observable<CuentaPorCobrarDTO[]> {
    return this.http.get<CuentaPorCobrarDTO[]>(`${this.baseUrl}/puesto/${puestoId}`);
  }

  abonar(id: number): Observable<CuentaPorCobrarDTO> {
    return this.http.patch<CuentaPorCobrarDTO>(`${this.baseUrl}/${id}/abonar`, {});
  }

  exonerar(id: number): Observable<CuentaPorCobrarDTO> {
    return this.http.patch<CuentaPorCobrarDTO>(`${this.baseUrl}/${id}/exonerar`, {});
  }

  calcularTotal(request: TotalCuentasRequest): Observable<TotalResponse> {
    return this.http.post<TotalResponse>(`${this.baseUrl}/total`, request);
  }
}
