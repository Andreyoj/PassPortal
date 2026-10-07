import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type { EmpleadoAutenticado, JwtPayload } from '../models/auth.model';
import type { NombreRol } from '../models/domain.model';

interface EmployeeRow extends RowDataPacket {
	id: number; usuario: string; nombre_completo: string; correo: string; password_hash: string; rol: NombreRol; activo: number;
}

function mapEmployee(row: EmployeeRow): EmpleadoAutenticado {
	return { id: row.id, usuario: row.usuario, nombreCompleto: row.nombre_completo, correo: row.correo, rol: row.rol };
}

function secret(): string {
	const value = process.env.JWT_SECRET;
	if (!value || value.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
	return value;
}

export async function autenticar(usuario: string, password: string): Promise<{ empleado: EmpleadoAutenticado; token: string } | null> {
	const [rows] = await pool.query<EmployeeRow[]>(
		`SELECT e.*, r.nombre AS rol FROM empleados e JOIN roles r ON r.id = e.rol_id WHERE e.usuario = :usuario AND e.activo = 1 LIMIT 1`,
		{ usuario },
	);
	const row = rows[0];
	if (!row || !(await bcrypt.compare(password, row.password_hash))) return null;
	const empleado = mapEmployee(row);
	const payload: JwtPayload = { sub: String(empleado.id), usuario: empleado.usuario, rol: empleado.rol };
	const token = jwt.sign(payload, secret(), { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as jwt.SignOptions['expiresIn'] });
	return { empleado, token };
}

export async function obtenerEmpleado(id: number): Promise<EmpleadoAutenticado | null> {
	const [rows] = await pool.query<EmployeeRow[]>(
		`SELECT e.*, r.nombre AS rol FROM empleados e JOIN roles r ON r.id = e.rol_id WHERE e.id = :id AND e.activo = 1`,
		{ id },
	);
	return rows[0] ? mapEmployee(rows[0]) : null;
}
