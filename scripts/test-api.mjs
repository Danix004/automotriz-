/**
 * Prueba rápida de la API serverless contra la base real (sin desplegar).
 *
 *   node --env-file=.env scripts/test-api.mjs
 *
 * Valida el contrato que consume el frontend: paginación, joins, detalle,
 * búsqueda global y operaciones CRUD básicas.
 */

import { route } from '../server/router.js';

const calls = [];

async function call(label, method, segments, query = {}, body, expectError = false) {
  const started = Date.now();
  try {
    const data = await route({ method, segments, query, body });
    const ms = Date.now() - started;
    calls.push({ label, ok: !expectError, ms, error: expectError ? new Error('debió fallar') : undefined });
    console.log(`${expectError ? '✗' : '✓'} ${label.padEnd(42)} ${String(ms).padStart(5)} ms`);
    return data;
  } catch (error) {
    const ms = Date.now() - started;
    calls.push({ label, ok: expectError, ms, error: expectError ? undefined : error });
    console.log(`${expectError ? '✓' : '✗'} ${label.padEnd(42)} → ${error.message}`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const brands = await call('GET /brands?detail=true', 'GET', ['brands'], { pageSize: '3', detail: 'true' });
assert(brands?.items?.length === 3, 'brands.items vacío');
assert(typeof brands.items[0].modelCount === 'number', 'falta modelCount');
assert(Array.isArray(brands.items[0].models), 'falta models[]');

const models = await call('GET /models?brandId=', 'GET', ['models'], { brandId: brands.items[0].id, pageSize: '5' });
assert(models?.items?.length > 0, 'models vacío');
assert(models.items[0].brand?.name, 'falta brand en modelo');

const generations = await call('GET /generations?modelId=', 'GET', ['generations'], { modelId: models.items[0].id });
assert(generations?.items?.length > 0, 'generations vacío');
assert(typeof generations.items[0].vehicleCount === 'number', 'falta vehicleCount');

const vehicles = await call('GET /vehicles', 'GET', ['vehicles'], { pageSize: '3', sortField: 'year' });
assert(vehicles?.items?.length === 3, 'vehicles vacío');
assert(vehicles.items[0].brand?.name, 'falta brand en vehículo');
assert(vehicles.items[0].generation?.name, 'falta generation en vehículo');

const filtered = await call('GET /vehicles?brandId+fueros', 'GET', ['vehicles'], {
  brandId: vehicles.items[0].brand.id,
  pageSize: '0',
});
assert(filtered?.total > 0, 'filtro por marca sin resultados');

const vehicleDetail = await call('GET /vehicles/:id', 'GET', [vehicles.items[0].id].length ? ['vehicles', vehicles.items[0].id] : []);
assert(Array.isArray(vehicleDetail?.compatibility), 'falta compatibility[] en detalle');
assert(Array.isArray(vehicleDetail?.siblingVersions), 'falta siblingVersions[]');
assert(Array.isArray(vehicleDetail?.recommended), 'falta recommended[]');
console.log(`   · vehículos con ${vehicleDetail.compatibility.length} compatibilidades`);

const products = await call('GET /products', 'GET', ['products'], { pageSize: '3' });
assert(products?.items?.length === 3, 'products vacío');
assert(products.items[0].category?.name, 'falta category en producto');
assert(typeof products.items[0].compatibilityCount === 'number', 'falta compatibilityCount');

const productDetail = await call('GET /products/:id', 'GET', ['products', products.items[0].id]);
assert(Array.isArray(productDetail?.vehicles), 'falta vehicles[] en detalle de producto');
assert(Array.isArray(productDetail?.images), 'falta images[]');
assert(Array.isArray(productDetail?.related), 'falta related[]');

const compat = await call('GET /compatibility', 'GET', ['compatibility'], { pageSize: '2' });
assert(compat?.items?.length === 2, 'compatibility vacío');
assert(compat.items[0].vehicle?.brand?.name, 'falta vehicle en compatibilidad');
assert(compat.items[0].product?.sku, 'falta product en compatibilidad');

const compatSearch = await call('GET /compatibility?search=', 'GET', ['compatibility'], {
  search: compat.items[0].product.name.slice(0, 8),
  pageSize: '2',
});
assert(compatSearch?.total > 0, 'búsqueda de compatibilidad sin resultados');

const stats = await call('GET /dashboard/stats', 'GET', ['dashboard', 'stats']);
assert(stats?.totals?.vehicles > 0, 'stats.totals.vehicles = 0');
assert(stats.monthly.length === 6, 'stats.monthly debe tener 6 meses');
assert(stats.categoryDistribution.length > 0, 'sin distribución de categorías');

const search = await call('GET /search?q=pantalla', 'GET', ['search'], { q: 'pantalla' });
assert(search?.query === 'pantalla', 'search.query incorrecto');
assert(Array.isArray(search.vehicles) && Array.isArray(search.products), 'search sin arrays');

const searchVehicle = await call('GET /search con filtros de vehículo', 'GET', ['search'], {
  q: 'cámara',
  brandId: vehicles.items[0].brand.id,
});

const categories = await call('GET /categories', 'GET', ['categories'], { pageSize: '0' });
assert(categories?.total > 0, 'categories vacío');

const users = await call('GET /users', 'GET', ['users'], { pageSize: '0' });
assert(users?.total > 0, 'users vacío');

const settings = await call('GET /settings', 'GET', ['settings']);
assert(settings?.appName, 'settings sin appName');

const updatedSettings = await call('PUT /settings', 'PUT', ['settings'], {}, { lowStockThreshold: 7 });
assert(updatedSettings.lowStockThreshold === 7, 'settings no se actualizó');
await call('PUT /settings (restaurar)', 'PUT', ['settings'], {}, { lowStockThreshold: 5 });

const createdBrand = await call('POST /brands', 'POST', ['brands'], {}, { name: 'Marca Temporal QA', country: 'Test' });
assert(createdBrand?.id, 'no se creó la marca');
const duplicateBrand = await call('POST /brands duplicado (debe fallar)', 'POST', ['brands'], {}, { name: 'marca temporal qa' }, true);
assert(duplicateBrand === null, 'debió rechazar marca duplicada');
const deletedBrand = await call('DELETE /brands/:id', 'DELETE', ['brands', createdBrand.id]);
assert(deletedBrand?.ok, 'no se eliminó la marca');

const vehicleProducts = await call('GET /vehicles/:id/products', 'GET', ['vehicles', vehicleDetail.id, 'products'], { pageSize: '0' });
assert(vehicleProducts?.total >= 0, 'products del vehículo inválidos');

const failed = calls.filter((item) => !item.ok);
console.log(`\n${calls.length - failed.length}/${calls.length} comprobaciones OK`);
if (failed.length) {
  console.log('Fallos:');
  failed.forEach((item) => console.log(` - ${item.label}: ${item.error?.message}`));
  process.exit(1);
}
console.log('✓ API serverless lista para desplegar.');
process.exit(0);
