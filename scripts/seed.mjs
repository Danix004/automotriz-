/**
 * Carga los datos de demostración en TiDB.
 *
 *   npm run db:seed          → esquema + datos
 *   npm run db:seed -- --keep → no borra las tablas antes de insertar
 *
 * El generador es el mismo que usa el frontend en modo mock
 * (`src/data/seed.ts`), así que el catálogo local y el remoto coinciden.
 */

import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const tmp = path.join(root, 'node_modules', '.seed');

const keep = process.argv.includes('--keep');
const raw = process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.TIDB_URL ?? '';

if (!raw) {
  console.error('✗ Define DATABASE_URL antes de poblar la base (ver .env.example).');
  process.exit(1);
}

const url = new URL(raw);
const useSsl = url.searchParams.get('ssl') !== 'false';
const database = url.pathname.replace(/^\//, '').split('?')[0] || 'autoequip';

const sslOptions = useSsl
  ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false', minVersion: 'TLSv1.2' } }
  : {};

/* 0. Crea la base de datos si no existe (el usuario de TiDB es root). */
if (!process.argv.includes('--no-create-db')) {
  try {
    const server = await mysql.createConnection({
      host: url.hostname,
      port: url.port ? Number(url.port) : 4000,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ...sslOptions,
    });
    await server.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARSET utf8mb4`);
    await server.end();
    console.log(`→ Base de datos \`${database}\` lista.`);
  } catch (error) {
    console.warn(`⚠ No se pudo crear la base (se continuará): ${error.message}`);
  }
}

const db = mysql.createPool({
  host: url.hostname,
  port: url.port ? Number(url.port) : 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database,
  waitForConnections: true,
  connectionLimit: 4,
  timezone: 'Z',
  decimalNumbers: true,
  ...sslOptions,
});

/* 1. Compila el generador TypeScript de seed (alias @ → src). */
console.log('→ Compilando el generador de datos…');
await esbuild.build({
  entryPoints: [path.join(root, 'src', 'data', 'seed.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: path.join(tmp, 'seed.mjs'),
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning',
});

const { buildSeedDatabase } = await import(pathToFileURL(path.join(tmp, 'seed.mjs')).href);
const data = buildSeedDatabase();
console.log(
  `→ Datos generados: ${data.brands.length} marcas · ${data.models.length} modelos · ` +
    `${data.generations.length} generaciones · ${data.vehicles.length} vehículos · ` +
    `${data.products.length} productos · ${data.compatibility.length} compatibilidades · ` +
    `${data.sales.length} ventas`,
);

/* 2. Esquema. */
const TABLES = ['sale_items', 'sales', 'compatibility', 'product_images', 'products', 'categories', 'vehicles', 'generations', 'models', 'brands', 'users', 'settings'];

if (!keep) {
  console.log('→ Eliminando tablas existentes…');
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of TABLES) await db.query(`DROP TABLE IF EXISTS ${table}`);
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
}

console.log('→ Aplicando database/schema.sql…');
const schema = readFileSync(path.join(root, 'database', 'schema.sql'), 'utf8');
for (const statement of schema.split(/;\s*(?:\r?\n|$)/).filter((part) => part.trim())) {
  await db.query(statement);
}

/* 3. Limpieza opcional (modo --keep). */
if (keep) {
  console.log('→ Vaciando tablas…');
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of TABLES.filter((name) => name !== 'settings')) {
    await db.query(`DELETE FROM ${table}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
}

/* 4. Inserción por lotes. */
const iso = (value) => (value ? new Date(value) : null);
const json = (value) => JSON.stringify(value ?? []);

async function insertMany(table, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES ?`, [
      chunk.map((row) => columns.map((column) => row[column])),
    ]);
  }
}

const brandRows = data.brands.map((row) => ({
  id: row.id,
  name: row.name,
  country: row.country,
  logo: row.logo ?? '',
  active: row.active ? 1 : 0,
  created_at: iso(row.createdAt),
}));

const modelRows = data.models.map((row) => ({
  id: row.id,
  brand_id: row.brandId,
  name: row.name,
  body_type: row.bodyType,
  active: row.active ? 1 : 0,
  created_at: iso(row.createdAt),
}));

const generationRows = data.generations.map((row) => ({
  id: row.id,
  model_id: row.modelId,
  name: row.name,
  start_year: row.startYear,
  end_year: row.endYear ?? null,
}));

const vehicleRows = data.vehicles.map((row) => ({
  id: row.id,
  generation_id: row.generationId,
  year: row.year,
  version: row.version,
  engine: row.engine,
  fuel: row.fuel,
  transmission: row.transmission,
  drivetrain: row.drivetrain,
  body_type: row.bodyType,
  power: row.power,
  displacement: row.displacement,
  image: row.image ?? '',
  active: row.active ? 1 : 0,
  created_at: iso(row.createdAt),
}));

const categoryRows = data.categories.map((row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  active: row.active ? 1 : 0,
  created_at: iso(row.createdAt),
}));

const productRows = data.products.map((row) => ({
  id: row.id,
  sku: row.sku,
  barcode: row.barcode || null,
  name: row.name,
  description: row.description,
  category_id: row.categoryId,
  brand: row.brand ?? '',
  price: row.price,
  promotional_price: row.promotionalPrice ?? null,
  stock: row.stock,
  image: row.image ?? '',
  gallery: json(row.gallery),
  specs: json(row.specs),
  installation: row.installation ?? '',
  tags: json(row.tags),
  active: row.active ? 1 : 0,
  created_at: iso(row.createdAt),
  updated_at: iso(row.updatedAt),
}));

const imageRows = data.productImages.map((row) => ({
  id: row.id,
  product_id: row.productId,
  url: row.url,
  sort_order: row.sortOrder ?? 0,
}));

const compatibilityRows = data.compatibility.map((row) => ({
  id: row.id,
  product_id: row.productId,
  vehicle_id: row.vehicleId,
  notes: row.notes ?? '',
  created_at: iso(row.createdAt),
}));

const userRows = data.users.map((row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  active: row.active ? 1 : 0,
  created_at: iso(row.createdAt),
}));

const saleRows = data.sales.map((row) => ({
  id: row.id,
  number: row.number,
  created_at: iso(row.createdAt),
  subtotal: row.subtotal,
  discount: row.discount,
  total: row.total,
  payment_method: row.paymentMethod,
  amount_paid: row.amountPaid,
  change_due: row.change,
  status: row.status ?? 'Completada',
  notes: row.notes ?? '',
  items_count: row.itemsCount,
}));

const saleItemRows = data.saleItems.map((row) => ({
  id: row.id,
  sale_id: row.saleId,
  product_id: row.productId,
  sku: row.sku,
  name: row.name,
  price: row.price,
  quantity: row.quantity,
  subtotal: row.subtotal,
}));

const steps = [
  ['brands', brandRows],
  ['models', modelRows],
  ['generations', generationRows],
  ['vehicles', vehicleRows],
  ['categories', categoryRows],
  ['products', productRows],
  ['product_images', imageRows],
  ['compatibility', compatibilityRows],
  ['users', userRows],
  ['sales', saleRows],
  ['sale_items', saleItemRows],
];

for (const [table, rows] of steps) {
  process.stdout.write(`→ ${table.padEnd(14)} ${String(rows.length).padStart(5)} filas…\n`);
  await insertMany(table, rows);
}

await db.end();
rmSync(tmp, { recursive: true, force: true });
console.log('✓ Base de datos poblada correctamente.');
