export interface ApiSuccessResponse<T> { ok: true; data: T; }
export interface ApiErrorBody { codigo: string; mensaje: string; detalles?: unknown; }
export interface ApiErrorResponse { ok: false; error: ApiErrorBody; }
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function esApiErrorResponse(valor: unknown): valor is ApiErrorResponse {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as Partial<ApiErrorResponse>;
  return candidato.ok === false && typeof candidato.error === 'object' && candidato.error !== null
    && typeof candidato.error.mensaje === 'string';
}
