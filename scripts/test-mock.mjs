/**
 * Prueba del mock local (frontend sin backend).
 *
 *   node scripts/test-mock.mjs
 *
 * Reproduce las mismas comprobaciones que `test-api.mjs` para garantizar que
 * el contrato REST del mock (`mockApi.ts`) y el del servidor (`server/router.js`)
 * sean idénticos: mismos payloads, mismos errores, misma paginación.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/* localStorage en memoria (jsdom no hace falta). */
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  key: (index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
};

const esbuild = await import(pathToFileURL(path.join(root, 'node_modules', 'esbuild', 'lib', 'main.js')).href);
const outfile = path.join(root, 'node_modules', '.seed', 'mock-api.mjs');

await esbuild.build({
  entryPoints: [path.join(root, 'src', 'services', 'mockApi.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  alias: { '@': path.join(root, 'src') },
  define: { 'import.meta.env.VITE_API_URL': '""', 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});

const { mockRequest } = await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
const calls = [];

async function call(label, method, search, body, expectError = false) {
  try {
    const data = await mockRequest(method, `/api${search}`, body);
    calls.push({ label, ok: !expectError, error: expectError ? new Error('debió fallar') : undefined });
    console.log(`${expectError ? '✗' : '✓'} ${label}`);
    return data;
  } catch (error) {
    calls.push({ label, ok: expectError, error: expectError ? undefined : error });
    console.log(`${expectError ? '✓' : '✗'} ${label} → ${error.message}`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let brands = await call('GET /brands?detail=true', 'GET', '/brands?pageSize=3&detail=true');
assert(brands?.items?.length === 3, 'brands.items vacío');
assert(typeof brands.items[0].modelCount === 'number', 'falta modelCount');
assert(Array.isArray(brands.items[0].models), 'falta models[]');

const models = await call('GET /models?brandId=', 'GET', `/models?brandId=${brands.items[0].id}&pageSize=5`);
assert(models?.items?.length > 0, 'models vacío');
assert(models.items[0].brand?.name, 'falta brand en modelo');

const generations = await call('GET /generations?modelId=', 'GET', `/generations?modelId=${models.items[0].id}`);
assert(generations?.items?.length > 0, 'generations vacío');
assert(typeof generations.items[0].vehicleCount === 'number', 'falta vehicleCount');

const vehicles = await call('GET /vehicles', 'GET', '/vehicles?pageSize=3&sortField=year&sortDirection=asc');
assert(vehicles?.items?.length === 3, 'vehicles vacío');
assert(vehicles.items[0].brand?.name, 'falta brand en vehículo');
assert(vehicles.items[0].generation?.name, 'falta generation en vehículo');

const filtered = await call('GET /vehicles?brandId', 'GET', `/vehicles?brandId=${vehicles.items[0].brand.id}&pageSize=0`);
assert(filtered?.total > 0, 'filtro por marca sin resultados');

const vehicleDetail = await call('GET /vehicles/:id', 'GET', `/vehicles/${vehicles.items[0].id}`);
assert(Array.isArray(vehicleDetail?.compatibility), 'falta compatibility[] en detalle');
assert(Array.isArray(vehicleDetail?.siblingVersions), 'falta siblingVersions[]');
assert(Array.isArray(vehicleDetail?.recommended), 'falta recommended[]');

const products = await call('GET /products', 'GET', '/products?pageSize=3');
assert(products?.items?.length === 3, 'products vacío');
assert(products.items[0].category?.name, 'falta category en producto');
assert(typeof products.items[0].compatibilityCount === 'number', 'falta compatibilityCount');

const productDetail = await call('GET /products/:id', 'GET', `/products/${products.items[0].id}`);
assert(Array.isArray(productDetail?.vehicles), 'falta vehicles[] en detalle de producto');
assert(Array.isArray(productDetail?.images), 'falta images[]');
assert(Array.isArray(productDetail?.related), 'falta related[]');

const compat = await call('GET /compatibility', 'GET', '/compatibility?pageSize=2');
assert(compat?.items?.length === 2, 'compatibility vacío');
assert(compat.items[0].vehicle?.brand?.name, 'falta vehicle en compatibilidad');
assert(compat.items[0].product?.sku, 'falta product en compatibilidad');

const compatSearch = await call('GET /compatibility?search', 'GET', `/compatibility?search=${encodeURIComponent(compat.items[0].product.name.slice(0, 8))}&pageSize=2`);
assert(compatSearch?.total > 0, 'búsqueda de compatibilidad sin resultados');

const stats = await call('GET /dashboard/stats', 'GET', '/dashboard/stats');
assert(stats?.totals?.vehicles > 0, 'stats.totals.vehicles = 0');
assert(stats.monthly.length === 6, 'stats.monthly debe tener 6 meses');
assert(stats.categoryDistribution.length > 0, 'sin distribución de categorías');

const search = await call('GET /search?q=pantalla', 'GET', '/search?q=pantalla');
assert(search?.query === 'pantalla', 'search.query incorrecto');
assert(Array.isArray(search.vehicles) && Array.isArray(search.products), 'search sin arrays');

await call('GET /search con filtros de vehículo', 'GET', `/search?q=c%C3%A1mara&brandId=${vehicles.items[0].brand.id}`);

const categories = await call('GET /categories', 'GET', '/categories?pageSize=0');
assert(categories?.total > 0, 'categories vacío');

const users = await call('GET /users', 'GET', '/users?pageSize=0');
assert(users?.total > 0, 'users vacío');

const settings = await call('GET /settings', 'GET', '/settings');
assert(settings?.appName, 'settings sin appName');

const updatedSettings = await call('PUT /settings', 'PUT', '/settings', { lowStockThreshold: 7 });
assert(updatedSettings.lowStockThreshold === 7, 'settings no se actualizó');
await call('PUT /settings (restaurar)', 'PUT', '/settings', { lowStockThreshold: 5 });

const createdBrand = await call('POST /brands', 'POST', '/brands', { name: 'Marca Temporal Mock', country: 'Test' });
assert(createdBrand?.id, 'no se creó la marca');
await call('POST /brands duplicado (debe fallar)', 'POST', '/brands', { name: 'marca temporal mock' }, true);
const deletedBrand = await call('DELETE /brands/:id', 'DELETE', `/brands/${createdBrand.id}`);
assert(deletedBrand?.ok, 'no se eliminó la marca');

const vehicleProducts = await call('GET /vehicles/:id/products', 'GET', `/vehicles/${vehicleDetail.id}/products?pageSize=0`);
assert(vehicleProducts?.total >= 0, 'products del vehículo inválidos');

/* ------------------------------- caja/ventas ------------------------------ */

const sellablePage = await call('GET /products con stock', 'GET', '/products?pageSize=0&availability=in&active=true');
const sellable = (sellablePage?.items ?? []).filter((product) => product.stock >= 2);
assert(sellable.length >= 2, 'no hay productos con stock para probar la caja');
const [itemA, itemB] = sellable;

const upperBound =
  (Math.max(itemA.price, itemA.promotionalPrice ?? 0) + Math.max(itemB.price, itemB.promotionalPrice ?? 0) * 2) * 2 + 500;

const salesList = await call('GET /sales', 'GET', '/sales?pageSize=3');
assert(salesList?.items?.length > 0, 'sales vacío');
assert(String(salesList.items[0].number).startsWith('V-'), 'folio de venta inválido');
assert(typeof salesList.items[0].total === 'number', 'total de venta inválido');
assert(typeof salesList.items[0].itemsCount === 'number', 'itemsCount de venta inválido');

const salesFiltered = await call('GET /sales?paymentMethod=', 'GET', '/sales?paymentMethod=Efectivo&pageSize=0');
assert(salesFiltered?.total > 0, 'sin ventas en efectivo');
assert(
  salesFiltered.items.every((sale) => sale.paymentMethod === 'Efectivo'),
  'el filtro de método de pago no se aplicó',
);

const salesSearch = await call('GET /sales?search=', 'GET', `/sales?search=${salesList.items[0].number}&pageSize=0`);
assert(salesSearch?.total >= 1, 'búsqueda de venta sin resultados');

const reportBefore = await call('GET /sales/report', 'GET', '/sales/report');
assert(reportBefore?.totals?.sales > 0, 'reporte sin ventas');
assert(reportBefore.totals.avgTicket > 0, 'reporte sin ticket promedio');
assert(Array.isArray(reportBefore.byDay) && reportBefore.byDay.length > 0, 'reporte sin serie diaria');
assert(Array.isArray(reportBefore.byMethod) && reportBefore.byMethod.length > 0, 'reporte sin métodos de pago');
assert(Array.isArray(reportBefore.topProducts), 'reporte sin productos más vendidos');
assert(typeof reportBefore.totals.today.sales === 'number', 'reporte sin ventas de hoy');

await call('POST /sales sin items (debe fallar)', 'POST', '/sales', { items: [], paymentMethod: 'Efectivo' }, true);
await call(
  'POST /sales efectivo insuficiente (debe fallar)',
  'POST',
  '/sales',
  { items: [{ productId: itemA.id, quantity: 1 }], paymentMethod: 'Efectivo', amountPaid: 0.01 },
  true,
);
await call(
  'POST /sales con stock insuficiente (debe fallar)',
  'POST',
  '/sales',
  { items: [{ productId: itemA.id, quantity: itemA.stock + 50 }], paymentMethod: 'Tarjeta' },
  true,
);

const stockBefore = itemA.stock;
const createdSale = await call('POST /sales', 'POST', '/sales', {
  items: [
    { productId: itemA.id, quantity: 1 },
    { productId: itemB.id, quantity: 2 },
  ],
  paymentMethod: 'Efectivo',
  amountPaid: upperBound,
  discount: 1,
  notes: 'Prueba de contrato',
});
assert(String(createdSale?.number).startsWith('V-'), 'la venta creada no tiene folio');
assert(createdSale.items.length === 2, 'la venta creada no tiene 2 líneas');
assert(createdSale.itemsCount === 3, 'itemsCount incorrecto (esperaba 3)');
assert(createdSale.discount === 1, 'descuento incorrecto');
assert(Math.abs(createdSale.total - (createdSale.subtotal - createdSale.discount)) < 0.005, 'total inconsistente');
assert(createdSale.change > 0, 'el vuelto debería ser mayor que 0');

const saleDetail = await call('GET /sales/:id', 'GET', `/sales/${createdSale.id}`);
assert(saleDetail?.number === createdSale.number, 'detalle de venta inconsistente');
assert(saleDetail.items.length === 2, 'las líneas del detalle no coinciden');

const productAfter = await call('GET /products/:id (stock)', 'GET', `/products/${itemA.id}`);
assert(productAfter.stock === stockBefore - 1, 'el stock no se descontó tras la venta');

const reportAfter = await call('GET /sales/report (tras venta)', 'GET', '/sales/report');
assert(
  reportAfter.totals.sales === reportBefore.totals.sales + 1,
  'el reporte no refleja la venta recién creada',
);
assert(reportAfter.totals.revenue > reportBefore.totals.revenue, 'los ingresos del reporte no crecieron');

const failed = calls.filter((item) => !item.ok);
console.log(`\n${calls.length - failed.length}/${calls.length} comprobaciones OK`);
if (failed.length) {
  console.log('Fallos:');
  failed.forEach((item) => console.log(` - ${item.label}: ${item.error?.message}`));
  process.exit(1);
}
console.log('✓ Contrato del mock coherente con la API serverless.');
process.exit(0);
