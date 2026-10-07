export function credencialesCompletas(body: unknown): body is { usuario: string; password: string } {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) return false;
	const datos = body as Record<string, unknown>;
	return typeof datos.usuario === 'string' && datos.usuario.trim().length > 0
		&& typeof datos.password === 'string' && datos.password.length > 0;
}
