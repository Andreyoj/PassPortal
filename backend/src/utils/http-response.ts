import type { Response } from 'express';
import type { ApiSuccessResponse } from '../models/api-response.model';

export function sendOk<T>(res: Response, data: T, statusCode = 200): void {
	const body: ApiSuccessResponse<T> = { ok: true, data };
	res.status(statusCode).json(body);
}
