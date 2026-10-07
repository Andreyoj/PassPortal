import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ApiSuccessResponse } from '../models/api.model';
import type { DocumentoAlerta, ResumenAlertas } from '../models/alert.model';
import type { Ciudadano, FichaCiudadano, Multa, Restriccion, TipoRestriccion } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  obtenerResumen(): Observable<ResumenAlertas> {
    return this.http.get<ApiSuccessResponse<ResumenAlertas>>(`${this.baseUrl}/alertas/resumen`).pipe(map((response) => response.data));
  }

  obtenerAlertas(estado?: 'VERDE' | 'AMARILLO' | 'ROJO'): Observable<DocumentoAlerta[]> {
    const suffix = estado ? `?estado=${estado}` : '';
    return this.http.get<ApiSuccessResponse<DocumentoAlerta[]>>(`${this.baseUrl}/alertas${suffix}`).pipe(map((response) => response.data));
  }

  buscarCiudadanos(query = ''): Observable<Ciudadano[]> {
    const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    return this.http.get<ApiSuccessResponse<Ciudadano[]>>(`${this.baseUrl}/ciudadanos${suffix}`).pipe(map((response) => response.data));
  }

  obtenerFicha(id: number): Observable<FichaCiudadano> {
    return this.http.get<ApiSuccessResponse<FichaCiudadano>>(`${this.baseUrl}/ciudadanos/${id}`).pipe(map((response) => response.data));
  }

  subirFoto(id: number, foto: File): Observable<{ fotoUrl: string }> {
    const body = new FormData();
    body.append('foto', foto);
    return this.http.post<ApiSuccessResponse<{ fotoUrl: string }>>(`${this.baseUrl}/ciudadanos/${id}/foto`, body)
      .pipe(map((response) => response.data));
  }

  crearMulta(id: number, multa: { concepto: string; monto: number; moneda: string }): Observable<Multa> {
    return this.http.post<ApiSuccessResponse<Multa>>(`${this.baseUrl}/ciudadanos/${id}/multas`, multa)
      .pipe(map((response) => response.data));
  }

  pagarMulta(id: number): Observable<Multa> {
    return this.http.patch<ApiSuccessResponse<Multa>>(`${this.baseUrl}/multas/${id}/pagar`, {})
      .pipe(map((response) => response.data));
  }

  anularMulta(id: number): Observable<Multa> {
    return this.http.patch<ApiSuccessResponse<Multa>>(`${this.baseUrl}/multas/${id}/anular`, {})
      .pipe(map((response) => response.data));
  }

  crearArraigo(id: number, arraigo: {
    tipo: TipoRestriccion;
    motivo: string;
    autoridad: string;
    numeroExpediente?: string;
    fechaInicio: string;
    fechaFin?: string;
  }): Observable<Restriccion> {
    return this.http.post<ApiSuccessResponse<Restriccion>>(`${this.baseUrl}/ciudadanos/${id}/arraigos`, arraigo)
      .pipe(map((response) => response.data));
  }

  levantarArraigo(id: number): Observable<Restriccion> {
    return this.http.patch<ApiSuccessResponse<Restriccion>>(`${this.baseUrl}/arraigos/${id}/levantar`, {})
      .pipe(map((response) => response.data));
  }
}
