export interface ApiSuccessResponse<T> {
	ok: true;
	data: T;
}

export interface ApiErrorBody {
	codigo: string;
	mensaje: string;
	detalles?: unknown;
}

export interface ApiErrorResponse {
	ok: false;
	error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
