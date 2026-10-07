import type { Ciudadano, EstadoAlerta, EstadoDocumento } from '../models/domain.model';

const AVATAR_COLORES = ['#0f766e', '#0369a1', '#4338ca', '#7c3aed', '#be185d', '#b45309'];

export function etiquetaEstado(estado: EstadoDocumento | EstadoAlerta): string {
  if (estado === 'VIGENTE' || estado === 'VERDE') return 'Vigente';
  if (estado === 'POR_VENCER' || estado === 'AMARILLO') return 'Por vencer';
  return 'Vencido';
}

export function textoDias(dias: number): string {
  return dias < 0 ? `Vencido hace ${Math.abs(dias)} días` : `Vence en ${dias} días`;
}

export function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
}

export function colorAvatar(nombre: string): string {
  let hash = 0;
  for (const caracter of nombre) hash = (hash * 31 + caracter.charCodeAt(0)) | 0;
  return AVATAR_COLORES[Math.abs(hash) % AVATAR_COLORES.length];
}

export function nombreCiudadano(c: Pick<Ciudadano, 'nombres' | 'apellidos'>): string {
  return `${c.nombres} ${c.apellidos}`;
}
