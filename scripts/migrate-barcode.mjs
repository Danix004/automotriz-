/**
 * Migración: agrega `products.barcode` (código de barras) a una BD existente.
 *
 *   npm run db:migrate
 *
 * Es idempotente: puede ejecutarse cuantas veces se quiera.
 * Si la BD ya tiene la columna/índice (esquema.sql nuevo), no hace nada.
 */

import mysql from 'mysql2/promise';

const raw = process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.TIDB_URL ?? '';

if (!raw) {
  console.error('✗ Define DATABASE_URL antes de migrar (ver .env.example).');
  process.exit(1);
}

const url = new URL(raw);
const database = url.pathname.replace(/^\//, '').split('?')[0] || 'autoequip';
const useSsl = url.searchParams.get('ssl') !== 'false';

const connection = await mysql.createConnection({
  host: url.hostname,
  port: url.port ? Number(url.port) : 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database,
  ...(useSsl
    ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          minVersion: 'TLSv1.2',
        },
      }
    : {}),
});

/* 1. Columna products.barcode */
const [columns] = await connection.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'`,
  [database],
);
const hasColumn = columns.some((row) => row.COLUMN_NAME === 'barcode');

if (hasColumn) {
  console.log('→ products.barcode ya existe.');
} else {
  await connection.query(`ALTER TABLE products ADD COLUMN barcode VARCHAR(60) NULL AFTER sku`);
  console.log('✓ Columna products.barcode añadida.');
}

/* 2. Índice único (dos productos no pueden compartir código de barras) */
const [indexes] = await connection.query(
  `SELECT DISTINCT INDEX_NAME FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND INDEX_NAME = 'uq_products_barcode'`,
  [database],
);

if (indexes.length) {
  console.log('→ El índice único uq_products_barcode ya existe.');
} else {
  try {
    await connection.query(`ALTER TABLE products ADD UNIQUE KEY uq_products_barcode (barcode)`);
    console.log('✓ Índice único uq_products_barcode añadido.');
  } catch (error) {
    console.warn(`⚠ No se pudo añadir el índice único: ${error.message}`);
    console.warn('  (¿Hay códigos de barras repetidos? Dejalos en NULL y repítelo.)');
  }
}

/* 3. Resumen */
const [rows] = await connection.query(
  `SELECT COUNT(*) AS total, SUM(barcode IS NOT NULL) AS con_codigo FROM products`,
);
console.log(
  `✓ Listo: ${rows[0].total} productos, ${rows[0].con_codigo ?? 0} con código de barras asignado.`,
);

await connection.end();
