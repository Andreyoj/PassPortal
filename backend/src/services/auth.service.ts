import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import type { EmpleadoAutenticado, EmpleadoListado, JwtPayload } from '../models/auth.model';
import type { NombreRol } from '../models/domain.model';
import { HttpError } from '../utils/http-error';
import { obtenerFichaCiudadano } from './citizen.service';

interface EmployeeRow extends RowDataPacket {
	id: number; usuario: string; nombre_completo: string; correo: string; password_hash: string; rol: NombreRol; ciudadano_id: number | null; activo: number; creado_en: string;
}

function mapEmployee(row: EmployeeRow): EmpleadoAutenticado {
	return { id: row.id, usuario: row.usuario, nombreCompleto: row.nombre_completo, correo: row.correo, rol: row.rol, ciudadanoId: row.ciudadano_id };
}

function mapListedEmployee(row: EmployeeRow): EmpleadoListado {
	return { ...mapEmployee(row), activo: Boolean(row.activo), creadoEn: String(row.creado_en) };
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

export async function registrarUsuario(datos: { usuario: string; nombreCompleto: string; correo: string; password: string }): Promise<EmpleadoAutenticado> {
	const hash = await bcrypt.hash(datos.password, 12);
	try {
		const [result] = await pool.execute(
			`INSERT INTO empleados (rol_id, nombre_completo, usuario, correo, password_hash)
			 SELECT id, :nombreCompleto, :usuario, :correo, :hash FROM roles WHERE nombre = 'USUARIO'`,
			{ ...datos, hash },
		);
		const id = Number((result as { insertId: number }).insertId);
		const empleado = await obtenerEmpleado(id);
		if (!empleado) throw new Error('No se pudo recuperar el usuario creado.');
		return empleado;
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ER_DUP_ENTRY') {
			throw new HttpError(409, 'USUARIO_DUPLICADO', 'El usuario o correo ya está registrado.');
		}
		throw error;
	}
}

export async function listarEmpleados(): Promise<EmpleadoListado[]> {
	const [rows] = await pool.query<EmployeeRow[]>(`SELECT e.*, r.nombre AS rol FROM empleados e JOIN roles r ON r.id = e.rol_id ORDER BY e.nombre_completo`);
	return rows.map(mapListedEmployee);
}

export async function obtenerFichaPropia(id: number) {
	const empleado = await obtenerEmpleado(id);
	return empleado?.ciudadanoId ? obtenerFichaCiudadano(empleado.ciudadanoId) : null;
}

export async function administrarEmpleado(id: number, datos: { usuario?: string; nombreCompleto: string; correo: string; rol?: NombreRol; activo?: boolean; password?: string; ciudadanoId?: number | null }): Promise<EmpleadoListado | null> {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();
		const updates: string[] = ['nombre_completo = ?', 'correo = ?'];
		const params: Array<string | number | null> = [datos.nombreCompleto, datos.correo];
		if (datos.usuario) { updates.push('usuario = ?'); params.push(datos.usuario); }
		if (datos.rol) { updates.push('rol_id = (SELECT id FROM roles WHERE nombre = ?)'); params.push(datos.rol); }
		if (datos.activo !== undefined) { updates.push('activo = ?'); params.push(datos.activo ? 1 : 0); }
		if (datos.password) { updates.push('password_hash = ?'); params.push(await bcrypt.hash(datos.password, 12)); }
		if (datos.ciudadanoId !== undefined) { updates.push('ciudadano_id = ?'); params.push(datos.ciudadanoId); }
		params.push(id);
		await connection.execute(`UPDATE empleados SET ${updates.join(', ')} WHERE id = ?`, params);
		await connection.commit();
		const [rows] = await pool.execute<EmployeeRow[]>(`SELECT e.*, r.nombre AS rol FROM empleados e JOIN roles r ON r.id = e.rol_id WHERE e.id = ?`, [id]);
		return rows[0] ? mapListedEmployee(rows[0]) : null;
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally { connection.release(); }
}
