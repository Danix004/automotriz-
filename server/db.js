/**
 * Conexión a TiDB (MySQL compatible) con mysql2.
 * La pool se crea una sola vez por invocación fría y se reutiliza entre requests.
 */

import mysql from 'mysql2/promise';
import { ApiError } from './util.js';

let pool;

function buildConfig() {
  const raw = process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.TIDB_URL ?? '';
  if (!raw) {
    throw new ApiError('DATABASE_URL no está configurado (Variables de entorno en Vercel)', 500);
  }

  const url = new URL(raw);
  const secure = url.searchParams.get('ssl');
  const useSsl = secure !== 'false' && secure !== '0';

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 4000,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '').split('?')[0] || 'autoequip',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 5),
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: false,
    decimalNumbers: true,
    // TiDB Cloud exige TLS en el endpoint público.
    ...(useSsl ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false', minVersion: 'TLSv1.2' } } : {}),
  };
}

export function getPool() {
  if (!pool) pool = mysql.createPool(buildConfig());
  return pool;
}

/** Ejecuta una consulta y devuelve solo las filas. */
export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Ejecuta un statement con retorno de [rows, fields]. */
export async function execute(sql, params = []) {
  return getPool().execute(sql, params);
}

/** Inserta múltiples filas (arrays de valores alineados con las columnas). */
export async function insertRows(table, columns, rows) {
  if (!rows.length) return;
  await getPool().query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES ?`, [rows]);
}

/**
 * Ejecuta `fn` dentro de una transacción (atomicidad de la venta:
 * cabecera + líneas + descuento de stock en la misma operación).
 * `fn` recibe un ejecutor de consultas ligado a la conexión.
 */
export async function withTransaction(fn) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const run = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };
    const result = await fn(run);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      /* la conexión ya se está liberando */
    }
    throw error;
  } finally {
    connection.release();
  }
}
