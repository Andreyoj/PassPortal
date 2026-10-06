import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ApiSuccessResponse } from '../models/api.model';
import type { DocumentoAlerta, ResumenAlertas } from '../models/alert.model';
import type { Ciudadano, FichaCiudadano } from '../models/domain.model';

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
}
