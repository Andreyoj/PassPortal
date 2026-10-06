export class HttpError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly codigo: string,
		mensaje: string,
		public readonly detalles?: unknown,
	) {
		super(mensaje);
		this.name = 'HttpError';
	}
}
