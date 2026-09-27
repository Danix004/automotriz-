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

/* ------------------------------- caja/ventas ------------------------------ */

const sellablePage = await call('GET /products con stock', 'GET', ['products'], {
  pageSize: '0',
  availability: 'in',
  active: 'true',
});
const sellable = (sellablePage?.items ?? []).filter((product) => product.stock >= 2);
assert(sellable.length >= 2, 'no hay productos con stock para probar la caja');
const [itemA, itemB] = sellable;

const upperBound =
  (Math.max(itemA.price, itemA.promotionalPrice ?? 0) + Math.max(itemB.price, itemB.promotionalPrice ?? 0) * 2) * 2 + 500;

const salesList = await call('GET /sales', 'GET', ['sales'], { pageSize: '3' });
assert(salesList?.items?.length > 0, 'sales vacío');
assert(String(salesList.items[0].number).startsWith('V-'), 'folio de venta inválido');
assert(typeof salesList.items[0].total === 'number', 'total de venta inválido');
assert(typeof salesList.items[0].itemsCount === 'number', 'itemsCount de venta inválido');

const salesFiltered = await call('GET /sales?paymentMethod=', 'GET', ['sales'], {
  paymentMethod: 'Efectivo',
  pageSize: '0',
});
assert(salesFiltered?.total > 0, 'sin ventas en efectivo');
assert(
  salesFiltered.items.every((sale) => sale.paymentMethod === 'Efectivo'),
  'el filtro de método de pago no se aplicó',
);

const salesSearch = await call('GET /sales?search=', 'GET', ['sales'], {
  search: salesList.items[0].number,
  pageSize: '0',
});
assert(salesSearch?.total >= 1, 'búsqueda de venta sin resultados');

const reportBefore = await call('GET /sales/report', 'GET', ['sales', 'report']);
assert(reportBefore?.totals?.sales > 0, 'reporte sin ventas');
assert(reportBefore.totals.avgTicket > 0, 'reporte sin ticket promedio');
assert(Array.isArray(reportBefore.byDay) && reportBefore.byDay.length > 0, 'reporte sin serie diaria');
assert(Array.isArray(reportBefore.byMethod) && reportBefore.byMethod.length > 0, 'reporte sin métodos de pago');
assert(Array.isArray(reportBefore.topProducts), 'reporte sin productos más vendidos');
assert(typeof reportBefore.totals.today.sales === 'number', 'reporte sin ventas de hoy');

await call(
  'POST /sales sin items (debe fallar)',
  'POST',
  ['sales'],
  {},
  { items: [], paymentMethod: 'Efectivo' },
  true,
);
await call(
  'POST /sales efectivo insuficiente (debe fallar)',
  'POST',
  ['sales'],
  {},
  { items: [{ productId: itemA.id, quantity: 1 }], paymentMethod: 'Efectivo', amountPaid: 0.01 },
  true,
);
await call(
  'POST /sales con stock insuficiente (debe fallar)',
  'POST',
  ['sales'],
  {},
  { items: [{ productId: itemA.id, quantity: itemA.stock + 50 }], paymentMethod: 'Tarjeta' },
  true,
);

const stockBefore = itemA.stock;
const createdSale = await call('POST /sales', 'POST', ['sales'], {}, {
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

const saleDetail = await call('GET /sales/:id', 'GET', ['sales', createdSale.id]);
assert(saleDetail?.number === createdSale.number, 'detalle de venta inconsistente');
assert(saleDetail.items.length === 2, 'las líneas del detalle no coinciden');

const productAfter = await call('GET /products/:id (stock)', 'GET', ['products', itemA.id]);
assert(productAfter.stock === stockBefore - 1, 'el stock no se descontó tras la venta');

const reportAfter = await call('GET /sales/report (tras venta)', 'GET', ['sales', 'report']);
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
console.log('✓ API serverless lista para desplegar.');
process.exit(0);
