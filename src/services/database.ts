/**
 * Capa de persistencia del mock local.
 * La base se guarda normalizada en localStorage y se expone como "API"
 * para que los servicios no cambien cuando se conecte un backend real.
 */

import type {
  AppSettings,
  AppUser,
  Brand,
  Category,
  Compatibility,
  Generation,
  Product,
  ProductImage,
  Vehicle,
  VehicleModel,
} from '@/types';
import { buildSeedDatabase } from '@/data/seed';

export interface Database {
  brands: Brand[];
  models: VehicleModel[];
  generations: Generation[];
  vehicles: Vehicle[];
  categories: Category[];
  products: Product[];
  productImages: ProductImage[];
  compatibility: Compatibility[];
  users: AppUser[];
  settings: AppSettings;
}

const STORAGE_KEY = 'autoequip.db.v1';
const DB_VERSION = 1;

let database: Database | null = null;
const listeners = new Set<() => void>();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DB_VERSION, data: database }));
  } catch {
    /* cuota superada: se trabaja solo en memoria */
  }
}

function load(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { version?: number; data?: Database };
      if (parsed.version === DB_VERSION && parsed.data) return parsed.data;
    }
  } catch {
    /* datos corruptos: se regenera el seed */
  }
  const seed = buildSeedDatabase();
  database = seed;
  persist();
  return seed;
}

/** Devuelve la base normalizada (seed + mutaciones persistidas). */
export function getDatabase(): Database {
  if (!database) database = load();
  return database;
}

/** Reemplaza la base completa (útil para importar/exportar o resetear). */
export function setDatabase(next: Database): void {
  database = next;
  persist();
  notify();
}

/** Vuelve a generar los datos de demostración. */
export function resetDatabase(): Database {
  database = buildSeedDatabase();
  persist();
  notify();
  return database;
}

/** Borra la persistencia sin tocar el estado en memoria. */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Notifica cambios hechos fuera de `mutate` (p. ej. importaciones). */
export function commit(): void {
  persist();
  notify();
}

/** Ejecuta una mutación atómica sobre la base y persiste el resultado. */
export function mutate<T>(fn: (db: Database) => T): T {
  const db = getDatabase();
  const result = fn(db);
  persist();
  notify();
  return result;
}
