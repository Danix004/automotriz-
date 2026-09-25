/**
 * Verifica la API desplegada en Vercel (HTTPS) con las mismas comprobaciones
 * que `test-api.mjs` hace contra la base local.
 *
 *   node scripts/test-remote.mjs https://automotriz-six.vercel.app
 */

const BASE = (process.argv[2] ?? 'https://automotriz-six.vercel.app').replace(/\/+$/, '');
const calls = [];

async function call(label, method, search, body, expectError = false) {
  try {
    const res = await fetch(`${BASE}${search}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    const failed = !res.ok;
    calls.push({ label, ok: failed ? expectError : !expectError, status: res.status, error: failed ? new Error(`HTTP ${res.status}`) : expectError ? new Error('debió fallar') : undefined });
    console.log(`${failed === expectError ? '✓' : '✗'} ${label.padEnd(44)} ${res.status}`);
    if (failed && !expectError) console.log(`    ${text.slice(0, 200)}`);
    if (failed) return null;
    return data;
  } catch (error) {
    calls.push({ label, ok: false, error });
    console.log(`✗ ${label.padEnd(44)} ${error.message}`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log(`API remota: ${BASE}\n`);
let fatal = null;

try {
  const brands = await call('GET /brands?detail=true', 'GET', '/api/brands?pageSize=3&detail=true');
  assert(brands?.items?.length === 3, 'brands.items vacío');
  assert(typeof brands.items[0].modelCount === 'number', 'falta modelCount');

  const models = await call('GET /models?brandId=', 'GET', `/api/models?brandId=${brands.items[0].id}&pageSize=5`);
  assert(models?.items?.length > 0, 'models vacío');
  assert(models.items[0].brand?.name, 'falta brand en modelo');

  const generations = await call('GET /generations?modelId=', 'GET', `/api/generations?modelId=${models.items[0].id}`);
  assert(generations?.items?.length > 0, 'generations vacío');
  assert(typeof generations.items[0].vehicleCount === 'number', 'falta vehicleCount');

  const vehicles = await call('GET /vehicles', 'GET', '/api/vehicles?pageSize=3&sortField=year&sortDirection=asc');
  assert(vehicles?.items?.length === 3, 'vehicles vacío');
  assert(vehicles.items[0].brand?.name, 'falta brand en vehículo');

  const filtered = await call('GET /vehicles?brandId', 'GET', `/api/vehicles?brandId=${vehicles.items[0].brand.id}&pageSize=0`);
  assert(filtered?.total > 0, 'filtro por marca sin resultados');

  const vehicleDetail = await call('GET /vehicles/:id', 'GET', `/api/vehicles/${vehicles.items[0].id}`);
  assert(Array.isArray(vehicleDetail?.compatibility), 'falta compatibility[]');
  assert(Array.isArray(vehicleDetail?.siblingVersions), 'falta siblingVersions[]');
  assert(Array.isArray(vehicleDetail?.recommended), 'falta recommended[]');

  const vehicleProducts = await call('GET /vehicles/:id/products', 'GET', `/api/vehicles/${vehicleDetail.id}/products?pageSize=0`);
  assert(vehicleProducts?.total >= 0, 'products del vehículo inválidos');

  const brandModels = await call('GET /brands/:id/models', 'GET', `/api/brands/${brands.items[0].id}/models`);
  assert(Array.isArray(brandModels?.items ?? brandModels), 'falta brand/:id/models');

  const products = await call('GET /products', 'GET', '/api/products?pageSize=3');
  assert(products?.items?.length === 3, 'products vacío');
  assert(products.items[0].category?.name, 'falta category en producto');
  assert(typeof products.items[0].compatibilityCount === 'number', 'falta compatibilityCount');

  const productDetail = await call('GET /products/:id', 'GET', `/api/products/${products.items[0].id}`);
  assert(Array.isArray(productDetail?.vehicles), 'falta vehicles[] en detalle');
  assert(Array.isArray(productDetail?.images), 'falta images[]');
  assert(Array.isArray(productDetail?.related), 'falta related[]');

  const compat = await call('GET /compatibility', 'GET', '/api/compatibility?pageSize=2');
  assert(compat?.items?.length === 2, 'compatibility vacío');
  assert(compat.items[0].vehicle?.brand?.name, 'falta vehicle en compatibilidad');
  assert(compat.items[0].product?.sku, 'falta product en compatibilidad');

  const compatSearch = await call('GET /compatibility?search', 'GET', `/api/compatibility?search=${encodeURIComponent(compat.items[0].product.name.slice(0, 8))}&pageSize=2`);
  assert(compatSearch?.total > 0, 'búsqueda de compatibilidad sin resultados');

  const stats = await call('GET /dashboard/stats', 'GET', '/api/dashboard/stats');
  assert(stats?.totals?.vehicles > 0, 'stats.totals.vehicles = 0');
  assert(stats.monthly.length === 6, 'stats.monthly debe tener 6 meses');
  assert(stats.categoryDistribution.length > 0, 'sin distribución de categorías');

  const search = await call('GET /search?q=pantalla', 'GET', '/api/search?q=pantalla');
  assert(search?.query === 'pantalla', 'search.query incorrecto');
  assert(Array.isArray(search.vehicles) && Array.isArray(search.products), 'search sin arrays');

  await call('GET /search con filtros de vehículo', 'GET', `/api/search?q=c%C3%A1mara&brandId=${vehicles.items[0].brand.id}`);

  const categories = await call('GET /categories', 'GET', '/api/categories?pageSize=0');
  assert(categories?.total > 0, 'categories vacío');

  const users = await call('GET /users', 'GET', '/api/users?pageSize=0');
  assert(users?.total > 0, 'users vacío');

  const settings = await call('GET /settings', 'GET', '/api/settings');
  assert(settings?.appName, 'settings sin appName');

  const updated = await call('PUT /settings', 'PUT', '/api/settings', { lowStockThreshold: 7 });
  assert(updated.lowStockThreshold === 7, 'settings no se actualizó');
  await call('PUT /settings (restaurar)', 'PUT', '/api/settings', { lowStockThreshold: 5 });

  const createdBrand = await call('POST /brands', 'POST', '/api/brands', { name: 'Marca Temporal Remota', country: 'Test' });
  assert(createdBrand?.id, 'no se creó la marca');

  const updatedBrand = await call('PUT /brands/:id', 'PUT', `/api/brands/${createdBrand.id}`, { country: 'Test 2' });
  assert(updatedBrand?.country === 'Test 2', 'no se actualizó la marca');

  await call('POST /brands duplicado (debe fallar)', 'POST', '/api/brands', { name: 'marca temporal remota' }, true);

  const deleted = await call('DELETE /brands/:id', 'DELETE', `/api/brands/${createdBrand.id}`);
  assert(deleted?.ok, 'no se eliminó la marca');

  await call('GET /marca inexistente (404)', 'GET', '/api/brands/no-existe-xyz', undefined, true);
} catch (error) {
  fatal = error;
  console.log(`\n✗ Abortado: ${error.message}`);
}

const failed = calls.filter((item) => !item.ok);
console.log(`\n${calls.length - failed.length}/${calls.length} comprobaciones OK`);
if (failed.length) {
  console.log('Fallos:');
  failed.forEach((item) => console.log(` - ${item.label}: ${item.error?.message}`));
}
if (fatal || failed.length) process.exit(1);
console.log('✓ API desplegada funcionando correctamente.');
