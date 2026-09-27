/**
 * Router REST de la API serverless.
 * Reproduce exactamente el contrato que consume el frontend
 * (el mismo que implementa `src/services/mockApi.ts`) usando SQL sobre TiDB.
 */

import { query as sql, withTransaction } from './db.js';
import {
  ApiError,
  badRequest,
  notFound,
  normalize,
  accentless,
  likeTerm,
  readPaging,
  paged,
  iso,
  flag,
  vehicleWithRefs,
  productWithCategory,
  brandFields,
  modelFields,
  generationFields,
  categoryFields,
  userDto,
  settingsDto,
} from './util.js';

/* ------------------------------------------------------------------ */
/* Selects base (JOINs con prefijos para evitar colisiones de nombre)  */
/* ------------------------------------------------------------------ */

const VEHICLE_JOIN = `
  FROM vehicles v
  LEFT JOIN generations g ON g.id = v.generation_id
  LEFT JOIN models m ON m.id = g.model_id
  LEFT JOIN brands b ON b.id = m.brand_id`;

const VEHICLE_COLS = `
  v.*,
  g.id AS g_id, g.name AS g_name, g.model_id AS g_model_id, g.start_year AS g_start_year, g.end_year AS g_end_year,
  m.id AS m_id, m.name AS m_name, m.brand_id AS m_brand_id, m.body_type AS m_body_type, m.active AS m_active, m.created_at AS m_created_at,
  b.id AS b_id, b.name AS b_name, b.country AS b_country, b.logo AS b_logo, b.active AS b_active, b.created_at AS b_created_at`;

const PRODUCT_COLS = `
  p.*,
  c.id AS c_id, c.name AS c_name, c.description AS c_description, c.active AS c_active, c.created_at AS c_created_at,
  (SELECT COUNT(*) FROM compatibility cp WHERE cp.product_id = p.id) AS compat_count`;

const PRODUCT_JOIN = `FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

/** Columnas del vehículo dentro de filas de compatibilidad (prefijo v_). */
const COMPAT_VEHICLE_COLS = `
  v.id AS v_id, v.generation_id AS v_generation_id, v.year AS v_year, v.version AS v_version, v.engine AS v_engine,
  v.fuel AS v_fuel, v.transmission AS v_transmission, v.drivetrain AS v_drivetrain, v.body_type AS v_body_type,
  v.power AS v_power, v.displacement AS v_displacement, v.image AS v_image, v.active AS v_active, v.created_at AS v_created_at,
  g.id AS v_g_id, g.name AS v_g_name, g.model_id AS v_g_model_id, g.start_year AS v_g_start_year, g.end_year AS v_g_end_year,
  m.id AS v_m_id, m.name AS v_m_name, m.brand_id AS v_m_brand_id, m.body_type AS v_m_body_type, m.active AS v_m_active, m.created_at AS v_m_created_at,
  b.id AS v_b_id, b.name AS v_b_name, b.country AS v_b_country, b.logo AS v_b_logo, b.active AS v_b_active, b.created_at AS v_b_created_at`;

/** Columnas del producto dentro de filas de compatibilidad (prefijo p_). */
const COMPAT_PRODUCT_COLS = `
  p.id AS p_id, p.sku AS p_sku, p.name AS p_name, p.description AS p_description, p.category_id AS p_category_id,
  p.brand AS p_brand, p.price AS p_price, p.promotional_price AS p_promotional_price, p.stock AS p_stock,
  p.image AS p_image, p.gallery AS p_gallery, p.specs AS p_specs, p.installation AS p_installation, p.tags AS p_tags,
  p.active AS p_active, p.created_at AS p_created_at, p.updated_at AS p_updated_at`;

const COMPAT_JOIN = `
  FROM compatibility cp
  LEFT JOIN vehicles v ON v.id = cp.vehicle_id
  LEFT JOIN generations g ON g.id = v.generation_id
  LEFT JOIN models m ON m.id = g.model_id
  LEFT JOIN brands b ON b.id = m.brand_id
  LEFT JOIN products p ON p.id = cp.product_id
  LEFT JOIN categories c ON c.id = p.category_id`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const boolParam = (value) => (value === 'true' || value === '1' || value === 1 ? 1 : 0);

function sortExpr(sortField, sortDirection, allowed, fallback) {
  const field = allowed[sortField] ?? allowed[fallback];
  const dir = sortDirection === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${field} ${dir}`;
}

function push(where, values, clause, ...params) {
  where.push(clause);
  values.push(...params);
}

const now = () => new Date();

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

function inClause(ids) {
  return ids.map(() => '?').join(', ');
}

async function requireRow(table, id, entity) {
  const rows = await sql(`SELECT * FROM ?? WHERE id = ? LIMIT 1`, [table, id]);
  if (!rows.length) throw notFound(entity);
  return rows[0];
}

/* ------------------------------------------------------------------ */
/* Marcas                                                              */
/* ------------------------------------------------------------------ */

async function brandDetailOf(brand) {
  const models = (await sql(`SELECT * FROM models WHERE brand_id = ? ORDER BY name ASC`, [brand.id])).map((row) =>
    modelFields(row),
  );
  const counts = await sql(
    `SELECT
       (SELECT COUNT(*) FROM models WHERE brand_id = ?) AS model_count,
       (SELECT COUNT(*) FROM vehicles v
          JOIN generations g ON g.id = v.generation_id
          JOIN models m ON m.id = g.model_id
        WHERE m.brand_id = ?) AS vehicle_count`,
    [brand.id, brand.id],
  );
  return {
    ...brandFields(brand),
    modelCount: Number(counts[0].model_count),
    vehicleCount: Number(counts[0].vehicle_count),
    models,
  };
}

async function listBrands(query, params) {
  const where = [];
  const values = [];
  if (params.search) {
    push(where, values, `(${accentless('b.name')} LIKE ? OR ${accentless('b.country')} LIKE ?)`, likeTerm(params.search), likeTerm(params.search));
  }
  if (params.active !== undefined && params.active !== '') {
    push(where, values, 'b.active = ?', boolParam(params.active));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'name', params.sortDirection, { name: 'b.name', createdAt: 'b.created_at', active: 'b.active' }, 'name');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM brands b ${whereSql}`,
    dataSql: `SELECT b.* FROM brands b ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  if (!params.detail) return page;

  const rows = page.items;
  if (!rows.length) return page;
  const ids = rows.map((row) => row.id);
  const modelRows = await sql(`SELECT * FROM models WHERE brand_id IN (${inClause(ids)}) ORDER BY name ASC`, ids);

  const perBrandVehicles = await sql(
    `SELECT m.brand_id AS brand_id, COUNT(*) AS c
       FROM vehicles v JOIN generations g ON g.id = v.generation_id JOIN models m ON m.id = g.model_id
      WHERE m.brand_id IN (${inClause(ids)}) GROUP BY m.brand_id`,
    ids,
  );

  const counts = await sql(
    `SELECT brand_id, COUNT(*) AS c FROM models WHERE brand_id IN (${inClause(ids)}) GROUP BY brand_id`,
    ids,
  );
  const modelMap = new Map(counts.map((row) => [row.brand_id, Number(row.c)]));
  const vehicleMap = new Map(perBrandVehicles.map((row) => [row.brand_id, Number(row.c)]));

  return {
    ...page,
    items: rows.map((row) => ({
      ...brandFields(row),
      modelCount: modelMap.get(row.id) ?? 0,
      vehicleCount: vehicleMap.get(row.id) ?? 0,
      models: modelRows.filter((model) => model.brand_id === row.id).map(modelFields),
    })),
  };
}

async function createBrand(body) {
  const input = body ?? {};
  if (!input.name) throw badRequest('El nombre es obligatorio');
  const dup = await sql(`SELECT COUNT(*) AS total FROM brands WHERE ${accentless('name')} = ?`, [normalize(input.name)]);
  if (Number(dup[0].total) > 0) throw badRequest('Ya existe una marca con ese nombre');
  const row = {
    id: uid('br'),
    name: input.name,
    country: input.country ?? '',
    logo: input.logo ?? '',
    active: input.active === false ? 0 : 1,
    created_at: now(),
  };
  await sql(`INSERT INTO brands (id, name, country, logo, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
    row.id,
    row.name,
    row.country,
    row.logo,
    row.active,
    row.created_at,
  ]);
  return brandFields(row);
}

async function updateBrand(id, body) {
  const input = body ?? {};
  const current = await requireRow('brands', id, 'Marca');
  const next = {
    name: input.name ?? current.name,
    country: input.country ?? current.country,
    logo: input.logo ?? current.logo,
    active: input.active === undefined ? current.active : input.active ? 1 : 0,
  };
  await sql(`UPDATE brands SET name = ?, country = ?, logo = ?, active = ? WHERE id = ?`, [
    next.name,
    next.country,
    next.logo,
    next.active,
    id,
  ]);
  return brandFields({ ...current, ...next });
}

async function deleteBrand(id) {
  const models = await sql(`SELECT COUNT(*) AS total FROM models WHERE brand_id = ?`, [id]);
  if (Number(models[0].total) > 0) throw badRequest('No se puede eliminar: la marca tiene modelos asociados.');
  await sql(`DELETE FROM brands WHERE id = ?`, [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Modelos                                                             */
/* ------------------------------------------------------------------ */

async function modelDetailOf(row) {
  const brand = await sql(`SELECT * FROM brands WHERE id = ? LIMIT 1`, [row.brand_id]);
  const generations = (await sql(`SELECT * FROM generations WHERE model_id = ? ORDER BY start_year ASC`, [row.id])).map(
    generationFields,
  );
  const counts = await sql(
    `SELECT COUNT(*) AS total FROM vehicles v JOIN generations g ON g.id = v.generation_id WHERE g.model_id = ?`,
    [row.id],
  );
  return {
    ...modelFields(row),
    brand: brand.length ? brandFields(brand[0]) : {},
    generations,
    vehicleCount: Number(counts[0].total),
  };
}

async function listModels(query, params) {
  const where = [];
  const values = [];
  if (params.search) {
    push(where, values, `(${accentless('m.name')} LIKE ? OR ${accentless('b.name')} LIKE ?)`, likeTerm(params.search), likeTerm(params.search));
  }
  if (params.brandId) push(where, values, 'm.brand_id = ?', params.brandId);
  if (params.active !== undefined && params.active !== '') push(where, values, 'm.active = ?', boolParam(params.active));
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'name', params.sortDirection, { name: 'm.name', createdAt: 'm.created_at', active: 'm.active' }, 'name');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM models m LEFT JOIN brands b ON b.id = m.brand_id ${whereSql}`,
    dataSql: `SELECT m.*, b.id AS b_id, b.name AS b_name, b.country AS b_country, b.logo AS b_logo, b.active AS b_active, b.created_at AS b_created_at
                FROM models m LEFT JOIN brands b ON b.id = m.brand_id ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  const items = await Promise.all(page.items.map((row) => modelDetailOf(row)));
  return { ...page, items };
}

async function createModel(body) {
  const input = body ?? {};
  if (!input.name || !input.brandId) throw badRequest('Marca y modelo son obligatorios');
  const row = {
    id: uid('md'),
    brand_id: input.brandId,
    name: input.name,
    body_type: input.bodyType ?? 'Sedán',
    active: input.active === false ? 0 : 1,
    created_at: now(),
  };
  await sql(`INSERT INTO models (id, brand_id, name, body_type, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
    row.id,
    row.brand_id,
    row.name,
    row.body_type,
    row.active,
    row.created_at,
  ]);
  return modelFields(row);
}

async function updateModel(id, body) {
  const input = body ?? {};
  const current = await requireRow('models', id, 'Modelo');
  const next = {
    brand_id: input.brandId ?? current.brand_id,
    name: input.name ?? current.name,
    body_type: input.bodyType ?? current.body_type,
    active: input.active === undefined ? current.active : input.active ? 1 : 0,
  };
  await sql(`UPDATE models SET brand_id = ?, name = ?, body_type = ?, active = ? WHERE id = ?`, [
    next.brand_id,
    next.name,
    next.body_type,
    next.active,
    id,
  ]);
  return modelFields({ ...current, ...next });
}

async function deleteModel(id) {
  const rows = await sql(`SELECT COUNT(*) AS total FROM generations WHERE model_id = ?`, [id]);
  if (Number(rows[0].total) > 0) throw badRequest('No se puede eliminar: el modelo tiene generaciones asociadas.');
  await sql(`DELETE FROM models WHERE id = ?`, [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Generaciones                                                        */
/* ------------------------------------------------------------------ */

async function generationDetailOf(row) {
  const model = await sql(`SELECT * FROM models WHERE id = ? LIMIT 1`, [row.model_id]);
  const brand = model.length ? await sql(`SELECT * FROM brands WHERE id = ? LIMIT 1`, [model[0].brand_id]) : [];
  const counts = await sql(`SELECT COUNT(*) AS total FROM vehicles WHERE generation_id = ?`, [row.id]);
  return {
    ...generationFields(row),
    model: model.length ? modelFields(model[0]) : {},
    brand: brand.length ? brandFields(brand[0]) : {},
    vehicleCount: Number(counts[0].total),
  };
}

async function listGenerations(query, params) {
  const where = [];
  const values = [];
  if (params.modelId) push(where, values, 'g.model_id = ?', params.modelId);
  if (params.search) push(where, values, accentless('g.name') + ' LIKE ?', likeTerm(params.search));
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'startYear', params.sortDirection, { startYear: 'g.start_year', name: 'g.name' }, 'startYear');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM generations g ${whereSql}`,
    dataSql: `SELECT g.* FROM generations g ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  const items = await Promise.all(page.items.map((row) => generationDetailOf(row)));
  return { ...page, items };
}

async function createGeneration(body) {
  const input = body ?? {};
  if (!input.modelId || !input.name) throw badRequest('Modelo y generación son obligatorios');
  const row = {
    id: uid('gn'),
    model_id: input.modelId,
    name: input.name,
    start_year: Number(input.startYear ?? new Date().getFullYear()),
    end_year: input.endYear ? Number(input.endYear) : null,
  };
  await sql(`INSERT INTO generations (id, model_id, name, start_year, end_year) VALUES (?, ?, ?, ?, ?)`, [
    row.id,
    row.model_id,
    row.name,
    row.start_year,
    row.end_year,
  ]);
  return generationFields(row);
}

async function updateGeneration(id, body) {
  const input = body ?? {};
  const current = await requireRow('generations', id, 'Generación');
  const next = {
    model_id: input.modelId ?? current.model_id,
    name: input.name ?? current.name,
    start_year: input.startYear ? Number(input.startYear) : current.start_year,
    end_year: input.endYear ? Number(input.endYear) : null,
  };
  await sql(`UPDATE generations SET model_id = ?, name = ?, start_year = ?, end_year = ? WHERE id = ?`, [
    next.model_id,
    next.name,
    next.start_year,
    next.end_year,
    id,
  ]);
  return generationFields({ ...current, ...next });
}

async function deleteGeneration(id) {
  const rows = await sql(`SELECT COUNT(*) AS total FROM vehicles WHERE generation_id = ?`, [id]);
  if (Number(rows[0].total) > 0) throw badRequest('No se puede eliminar: la generación tiene vehículos asociados.');
  await sql(`DELETE FROM generations WHERE id = ?`, [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Vehículos                                                           */
/* ------------------------------------------------------------------ */

const VEHICLE_SORT = {
  year: 'v.year',
  power: 'v.power',
  displacement: 'v.displacement',
  version: 'v.version',
  engine: 'v.engine',
  createdAt: 'v.created_at',
  active: 'v.active',
};

async function listVehicles(query, params) {
  const where = [];
  const values = [];

  if (params.search) {
    push(
      where,
      values,
      `${accentless(`CONCAT_WS(' ', b.name, m.name, g.name, v.year, v.version, v.engine, v.body_type, v.fuel)`)} LIKE ?`,
      likeTerm(params.search),
    );
  }
  if (params.brandId) push(where, values, 'm.brand_id = ?', params.brandId);
  if (params.modelId) push(where, values, 'g.model_id = ?', params.modelId);
  if (params.generationId) push(where, values, 'v.generation_id = ?', params.generationId);
  if (params.year) push(where, values, 'v.year = ?', Number(params.year));
  if (params.version) push(where, values, accentless('v.version') + ' LIKE ?', likeTerm(params.version));
  if (params.engine) push(where, values, accentless('v.engine') + ' LIKE ?', likeTerm(params.engine));
  if (params.bodyType) push(where, values, 'v.body_type = ?', params.bodyType);
  if (params.fuel) push(where, values, 'v.fuel = ?', params.fuel);
  if (params.transmission) push(where, values, 'v.transmission = ?', params.transmission);
  if (params.drivetrain) push(where, values, 'v.drivetrain = ?', params.drivetrain);
  if (params.active !== undefined && params.active !== '') push(where, values, 'v.active = ?', boolParam(params.active));

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = params.sortField
    ? sortExpr(params.sortField, params.sortDirection, VEHICLE_SORT, 'year')
    : 'ORDER BY v.year DESC';

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total ${VEHICLE_JOIN} ${whereSql}`,
    dataSql: `SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN} ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  return { ...page, items: page.items.map((row) => vehicleWithRefs(row)) };
}

async function vehicleDetailOf(id) {
  const rows = await sql(`SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN} WHERE v.id = ? LIMIT 1`, [id]);
  if (!rows.length) throw notFound('Vehículo');
  const base = vehicleWithRefs(rows[0]);

  const compatRows = await sql(
    `SELECT cp.id, cp.product_id, cp.vehicle_id, cp.notes, cp.created_at, ${COMPAT_PRODUCT_COLS}
       FROM compatibility cp LEFT JOIN products p ON p.id = cp.product_id LEFT JOIN categories c ON c.id = p.category_id
      WHERE cp.vehicle_id = ? ORDER BY cp.created_at DESC`,
    [id],
  );
  const compatibility = compatRows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    vehicleId: row.vehicle_id,
    notes: row.notes ?? '',
    createdAt: iso(row.created_at),
    vehicle: base,
    product: productWithCategory(row, 'p_'),
  }));

  const siblingRows = await sql(
    `SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN}
      WHERE v.generation_id = ? AND v.year = ? AND v.id <> ? ORDER BY v.version ASC`,
    [base.generationId, base.year, id],
  );

  const recommendedRows = await sql(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN}
      WHERE p.stock > 0 AND p.id NOT IN (SELECT product_id FROM compatibility WHERE vehicle_id = ?)
      ORDER BY p.created_at DESC LIMIT 6`,
    [id],
  );

  return {
    ...base,
    compatibility,
    siblingVersions: siblingRows.map((row) => vehicleWithRefs(row)),
    recommended: recommendedRows.map((row) => productWithCategory(row)),
  };
}

async function createVehicle(body) {
  const input = body ?? {};
  if (!input.generationId) throw badRequest('La generación es obligatoria');
  const row = {
    id: uid('vh'),
    generation_id: input.generationId,
    year: Number(input.year ?? new Date().getFullYear()),
    version: input.version ?? '',
    engine: input.engine ?? '',
    fuel: input.fuel ?? 'Gasolina',
    transmission: input.transmission ?? 'Manual',
    drivetrain: input.drivetrain ?? 'FWD',
    body_type: input.bodyType ?? 'Sedán',
    power: Number(input.power ?? 0),
    displacement: Number(input.displacement ?? 0),
    image: input.image ?? '',
    active: input.active === false ? 0 : 1,
    created_at: now(),
  };
  await sql(
    `INSERT INTO vehicles (id, generation_id, year, version, engine, fuel, transmission, drivetrain, body_type, power, displacement, image, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.generation_id,
      row.year,
      row.version,
      row.engine,
      row.fuel,
      row.transmission,
      row.drivetrain,
      row.body_type,
      row.power,
      row.displacement,
      row.image,
      row.active,
      row.created_at,
    ],
  );
  const created = await sql(`SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN} WHERE v.id = ?`, [row.id]);
  return vehicleWithRefs(created[0]);
}

async function updateVehicle(id, body) {
  const input = body ?? {};
  const current = await requireRow('vehicles', id, 'Vehículo');
  const next = { ...current };
  const map = {
    generationId: 'generation_id',
    year: 'year',
    version: 'version',
    engine: 'engine',
    fuel: 'fuel',
    transmission: 'transmission',
    drivetrain: 'drivetrain',
    bodyType: 'body_type',
    power: 'power',
    displacement: 'displacement',
    image: 'image',
  };
  Object.entries(map).forEach(([key, column]) => {
    if (input[key] !== undefined) next[column] = input[key];
  });
  if (input.active !== undefined) next.active = input.active ? 1 : 0;
  await sql(
    `UPDATE vehicles SET generation_id = ?, year = ?, version = ?, engine = ?, fuel = ?, transmission = ?, drivetrain = ?, body_type = ?, power = ?, displacement = ?, image = ?, active = ? WHERE id = ?`,
    [
      next.generation_id,
      Number(next.year),
      next.version,
      next.engine,
      next.fuel,
      next.transmission,
      next.drivetrain,
      next.body_type,
      Number(next.power),
      Number(next.displacement),
      next.image,
      next.active,
      id,
    ],
  );
  const rows = await sql(`SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN} WHERE v.id = ?`, [id]);
  return vehicleWithRefs(rows[0]);
}

async function deleteVehicle(id) {
  const rows = await sql(`SELECT COUNT(*) AS total FROM compatibility WHERE vehicle_id = ?`, [id]);
  if (Number(rows[0].total) > 0) throw badRequest('No se puede eliminar: el vehículo tiene compatibilidades asociadas.');
  await sql(`DELETE FROM vehicles WHERE id = ?`, [id]);
  return { ok: true };
}

async function vehicleProducts(query, params) {
  const where = ['EXISTS (SELECT 1 FROM compatibility cp WHERE cp.product_id = p.id AND cp.vehicle_id = ?)'];
  const values = [params.vehicleId];
  if (params.categoryId) {
    where.push('p.category_id = ?');
    values.push(params.categoryId);
  }
  if (params.search) {
    where.push(`(${accentless('p.name')} LIKE ? OR ${accentless('p.sku')} LIKE ?)`);
    values.push(likeTerm(params.search), likeTerm(params.search));
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const order = sortExpr(params.sortField ?? 'name', params.sortDirection, { name: 'p.name', price: 'p.price', stock: 'p.stock' }, 'name');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
    dataSql: `SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });
  return { ...page, items: page.items.map((row) => productWithCategory(row)) };
}

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

async function listCategories(query, params) {
  const where = [];
  const values = [];
  if (params.search) {
    push(where, values, `(${accentless('name')} LIKE ? OR ${accentless('description')} LIKE ?)`, likeTerm(params.search), likeTerm(params.search));
  }
  if (params.active !== undefined && params.active !== '') push(where, values, 'active = ?', boolParam(params.active));
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'name', params.sortDirection, { name: 'name', createdAt: 'created_at', active: 'active' }, 'name');

  return paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM categories ${whereSql}`,
    dataSql: `SELECT * FROM categories ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });
}

async function createCategory(body) {
  const input = body ?? {};
  if (!input.name) throw badRequest('El nombre es obligatorio');
  const row = {
    id: uid('ct'),
    name: input.name,
    description: input.description ?? '',
    active: input.active === false ? 0 : 1,
    created_at: now(),
  };
  await sql(`INSERT INTO categories (id, name, description, active, created_at) VALUES (?, ?, ?, ?, ?)`, [
    row.id,
    row.name,
    row.description,
    row.active,
    row.created_at,
  ]);
  return categoryFields(row);
}

async function updateCategory(id, body) {
  const input = body ?? {};
  const current = await requireRow('categories', id, 'Categoría');
  const next = {
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    active: input.active === undefined ? current.active : input.active ? 1 : 0,
  };
  await sql(`UPDATE categories SET name = ?, description = ?, active = ? WHERE id = ?`, [
    next.name,
    next.description,
    next.active,
    id,
  ]);
  return categoryFields({ ...current, ...next });
}

async function deleteCategory(id) {
  const rows = await sql(`SELECT COUNT(*) AS total FROM products WHERE category_id = ?`, [id]);
  if (Number(rows[0].total) > 0) throw badRequest('No se puede eliminar: la categoría tiene productos asociados.');
  await sql(`DELETE FROM categories WHERE id = ?`, [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

const PRODUCT_SORT = {
  name: 'p.name',
  price: 'p.price',
  stock: 'p.stock',
  createdAt: 'p.created_at',
  active: 'p.active',
  sku: 'p.sku',
};

async function listProducts(query, params) {
  const where = [];
  const values = [];

  if (params.search) {
    push(
      where,
      values,
      `(${accentless('p.name')} LIKE ? OR ${accentless('p.sku')} LIKE ? OR ${accentless('p.brand')} LIKE ? OR ${accentless('c.name')} LIKE ?)`,
      likeTerm(params.search),
      likeTerm(params.search),
      likeTerm(params.search),
      likeTerm(params.search),
    );
  }
  if (params.categoryId) push(where, values, 'p.category_id = ?', params.categoryId);
  if (params.active !== undefined && params.active !== '') push(where, values, 'p.active = ?', boolParam(params.active));
  if (params.availability === 'in') push(where, values, 'p.stock > 0');
  if (params.availability === 'out') push(where, values, 'p.stock = 0');
  if (params.availability === 'promo') push(where, values, 'p.promotional_price IS NOT NULL');
  if (params.minPrice) push(where, values, 'p.price >= ?', Number(params.minPrice));
  if (params.maxPrice) push(where, values, 'p.price <= ?', Number(params.maxPrice));
  if (params.vehicleId) {
    push(where, values, 'EXISTS (SELECT 1 FROM compatibility cp WHERE cp.product_id = p.id AND cp.vehicle_id = ?)', params.vehicleId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'name', params.sortDirection, PRODUCT_SORT, 'name');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total ${PRODUCT_JOIN} ${whereSql}`,
    dataSql: `SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  return { ...page, items: page.items.map((row) => productWithCategory(row)) };
}

async function productDetailOf(id) {
  const rows = await sql(`SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} WHERE p.id = ? LIMIT 1`, [id]);
  if (!rows.length) throw notFound('Producto');
  const product = productWithCategory(rows[0]);

  const images = (
    await sql(`SELECT id, product_id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`, [id])
  ).map((row) => ({ id: row.id, productId: row.product_id, url: row.url, sortOrder: Number(row.sort_order) }));

  const vehicleRows = await sql(
    `SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN}
      WHERE v.id IN (SELECT vehicle_id FROM compatibility WHERE product_id = ?)
      ORDER BY b.name ASC, m.name ASC, v.year DESC`,
    [id],
  );

  const relatedRows = await sql(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN}
      WHERE p.id <> ? AND (p.category_id = ? ${product.brand ? 'OR p.brand = ?' : ''})
      ORDER BY p.created_at DESC LIMIT 6`,
    product.brand ? [id, product.categoryId, product.brand] : [id, product.categoryId],
  );

  return {
    ...product,
    images,
    vehicles: vehicleRows.map((row) => vehicleWithRefs(row)),
    related: relatedRows.map((row) => productWithCategory(row)),
  };
}

async function createProduct(body) {
  const input = body ?? {};
  if (!input.name || !input.sku) throw badRequest('Nombre y SKU son obligatorios');
  const dup = await sql(`SELECT COUNT(*) AS total FROM products WHERE ${accentless('sku')} = ?`, [normalize(input.sku)]);
  if (Number(dup[0].total) > 0) throw badRequest('Ya existe un producto con ese SKU');

  const timestamp = now();
  const row = {
    id: uid('pr'),
    sku: input.sku,
    name: input.name,
    description: input.description ?? '',
    category_id: input.categoryId ?? '',
    brand: input.brand ?? '',
    price: Number(input.price ?? 0),
    promotional_price: input.promotionalPrice ?? null,
    stock: Number(input.stock ?? 0),
    image: input.image ?? '',
    gallery: input.gallery ?? [],
    specs: input.specs ?? [],
    installation: input.installation ?? '',
    tags: input.tags ?? [],
    active: input.active === false ? 0 : 1,
    created_at: timestamp,
    updated_at: timestamp,
  };
  await sql(
    `INSERT INTO products (id, sku, name, description, category_id, brand, price, promotional_price, stock, image, gallery, specs, installation, tags, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.sku,
      row.name,
      row.description,
      row.category_id,
      row.brand,
      row.price,
      row.promotional_price,
      row.stock,
      row.image,
      JSON.stringify(row.gallery),
      JSON.stringify(row.specs),
      row.installation,
      JSON.stringify(row.tags),
      row.active,
      row.created_at,
      row.updated_at,
    ],
  );
  const rows = await sql(`SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} WHERE p.id = ?`, [row.id]);
  return productWithCategory(rows[0]);
}

async function updateProduct(id, body) {
  const input = body ?? {};
  const current = await requireRow('products', id, 'Producto');
  const next = {
    sku: input.sku ?? current.sku,
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    category_id: input.categoryId ?? current.category_id,
    brand: input.brand ?? current.brand,
    price: input.price === undefined ? current.price : Number(input.price),
    promotional_price: input.promotionalPrice === undefined ? current.promotional_price : input.promotionalPrice,
    stock: input.stock === undefined ? current.stock : Number(input.stock),
    image: input.image ?? current.image,
    gallery: input.gallery ?? current.gallery,
    specs: input.specs ?? current.specs,
    installation: input.installation ?? current.installation,
    tags: input.tags ?? current.tags,
    active: input.active === undefined ? current.active : input.active ? 1 : 0,
  };
  await sql(
    `UPDATE products SET sku = ?, name = ?, description = ?, category_id = ?, brand = ?, price = ?, promotional_price = ?, stock = ?, image = ?, gallery = ?, specs = ?, installation = ?, tags = ?, active = ?, updated_at = ? WHERE id = ?`,
    [
      next.sku,
      next.name,
      next.description,
      next.category_id,
      next.brand,
      next.price,
      next.promotional_price,
      next.stock,
      next.image,
      JSON.stringify(next.gallery),
      JSON.stringify(next.specs),
      next.installation,
      JSON.stringify(next.tags),
      next.active,
      now(),
      id,
    ],
  );
  const rows = await sql(`SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} WHERE p.id = ?`, [id]);
  return productWithCategory(rows[0]);
}

async function duplicateProduct(id) {
  const rows = await sql(`SELECT * FROM products WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) throw notFound('Producto');
  const source = rows[0];
  const timestamp = now();
  const copy = {
    ...source,
    id: uid('pr'),
    sku: `${source.sku}-C`,
    name: `${source.name} (copia)`,
    active: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };
  await sql(
    `INSERT INTO products (id, sku, name, description, category_id, brand, price, promotional_price, stock, image, gallery, specs, installation, tags, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      copy.id,
      copy.sku,
      copy.name,
      copy.description,
      copy.category_id,
      copy.brand,
      copy.price,
      copy.promotional_price,
      copy.stock,
      copy.image,
      JSON.stringify(copy.gallery ?? []),
      JSON.stringify(copy.specs ?? []),
      copy.installation,
      JSON.stringify(copy.tags ?? []),
      copy.active,
      copy.created_at,
      copy.updated_at,
    ],
  );
  const detail = await sql(`SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} WHERE p.id = ?`, [copy.id]);
  return productWithCategory(detail[0]);
}

async function deleteProduct(id) {
  await sql(`DELETE FROM compatibility WHERE product_id = ?`, [id]);
  await sql(`DELETE FROM product_images WHERE product_id = ?`, [id]);
  await sql(`DELETE FROM products WHERE id = ?`, [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Compatibilidad                                                      */
/* ------------------------------------------------------------------ */

async function listCompatibility(query, params) {
  const where = [];
  const values = [];

  if (params.productId) {
    push(where, values, 'cp.product_id = ?', params.productId);
  }
  if (params.vehicleId) {
    push(where, values, 'cp.vehicle_id = ?', params.vehicleId);
  }
  if (params.search) {
    push(
      where,
      values,
      `${accentless(`CONCAT_WS(' ', b.name, m.name, v.year, v.version, p.name)`)} LIKE ?`,
      likeTerm(params.search),
    );
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'createdAt', params.sortDirection, { createdAt: 'cp.created_at', notes: 'cp.notes' }, 'createdAt');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM compatibility cp
                 LEFT JOIN vehicles v ON v.id = cp.vehicle_id
                 LEFT JOIN generations g ON g.id = v.generation_id
                 LEFT JOIN models m ON m.id = g.model_id
                 LEFT JOIN brands b ON b.id = m.brand_id
                 LEFT JOIN products p ON p.id = cp.product_id ${whereSql}`,
    dataSql: `SELECT cp.id, cp.product_id, cp.vehicle_id, cp.notes, cp.created_at,
                     ${COMPAT_VEHICLE_COLS}, ${COMPAT_PRODUCT_COLS},
                     (SELECT COUNT(*) FROM compatibility cp2 WHERE cp2.product_id = p.id) AS compat_count
                ${COMPAT_JOIN} ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  const items = page.items.map((row) => ({
    id: row.id,
    productId: row.product_id,
    vehicleId: row.vehicle_id,
    notes: row.notes ?? '',
    createdAt: iso(row.created_at),
    vehicle: vehicleWithRefs(row, 'v_'),
    product: productWithCategory(row, 'p_'),
  }));

  return { ...page, items };
}

async function addCompatibility(body) {
  const input = body ?? {};
  if (!input.productId) throw badRequest('El producto es obligatorio');
  const vehicleIds = input.vehicleIds ?? (input.vehicleId ? [input.vehicleId] : []);
  if (!vehicleIds.length) throw badRequest('Selecciona al menos un vehículo');

  const exists = await sql(`SELECT id FROM vehicles WHERE id IN (${inClause(vehicleIds)})`, vehicleIds);
  if (exists.length !== vehicleIds.length) throw badRequest('Algunos vehículos seleccionados no existen');

  const existing = await sql(
    `SELECT vehicle_id FROM compatibility WHERE product_id = ? AND vehicle_id IN (${inClause(vehicleIds)})`,
    [input.productId, ...vehicleIds],
  );
  const already = new Set(existing.map((row) => row.vehicle_id));
  const rows = vehicleIds
    .filter((id) => !already.has(id))
    .map((vehicleId) => [uid('cp'), input.productId, vehicleId, input.notes ?? '', now()]);

  if (rows.length) {
    await sql(`INSERT INTO compatibility (id, product_id, vehicle_id, notes, created_at) VALUES ?`, [rows]);
  }
  return { created: rows.length };
}

async function removeCompatibility(id) {
  await sql(`DELETE FROM compatibility WHERE id = ?`, [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Usuarios y ajustes                                                  */
/* ------------------------------------------------------------------ */

async function listUsers(query, params) {
  const where = [];
  const values = [];
  if (params.search) {
    push(where, values, `(${accentless('name')} LIKE ? OR ${accentless('email')} LIKE ?)`, likeTerm(params.search), likeTerm(params.search));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(params.sortField ?? 'name', params.sortDirection, { name: 'name', createdAt: 'created_at', role: 'role' }, 'name');

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM users ${whereSql}`,
    dataSql: `SELECT * FROM users ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });
  return { ...page, items: page.items.map(userDto) };
}

async function createUser(body) {
  const input = body ?? {};
  if (!input.name || !input.email) throw badRequest('Nombre y correo son obligatorios');
  const row = {
    id: uid('us'),
    name: input.name,
    email: input.email,
    role: input.role ?? 'Editor',
    active: input.active === false ? 0 : 1,
    created_at: now(),
  };
  await sql(`INSERT INTO users (id, name, email, role, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
    row.id,
    row.name,
    row.email,
    row.role,
    row.active,
    row.created_at,
  ]);
  return userDto(row);
}

async function updateUser(id, body) {
  const input = body ?? {};
  const current = await requireRow('users', id, 'Usuario');
  const next = {
    name: input.name ?? current.name,
    email: input.email ?? current.email,
    role: input.role ?? current.role,
    active: input.active === undefined ? current.active : input.active ? 1 : 0,
  };
  await sql(`UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?`, [
    next.name,
    next.email,
    next.role,
    next.active,
    id,
  ]);
  return userDto({ ...current, ...next });
}

async function deleteUser(id) {
  await sql(`DELETE FROM users WHERE id = ?`, [id]);
  return { ok: true };
}

async function getSettings() {
  const rows = await sql(`SELECT * FROM settings LIMIT 1`);
  if (!rows.length) {
    return {
      appName: 'AutoEquip Pro',
      currency: 'USD',
      timezone: 'UTC',
      lowStockThreshold: 5,
      enablePromotions: true,
      defaultPageSize: 10,
    };
  }
  return settingsDto(rows[0]);
}

async function updateSettings(body) {
  const input = body ?? {};
  const current = await getSettings();
  const next = {
    app_name: input.appName ?? current.appName,
    currency: input.currency ?? current.currency,
    timezone: input.timezone ?? current.timezone,
    low_stock_threshold: Number(input.lowStockThreshold ?? current.lowStockThreshold),
    enable_promotions: (input.enablePromotions ?? current.enablePromotions) ? 1 : 0,
    default_page_size: Number(input.defaultPageSize ?? current.defaultPageSize),
  };
  const rows = await sql(`SELECT id FROM settings LIMIT 1`);
  if (rows.length) {
    await sql(
      `UPDATE settings SET app_name = ?, currency = ?, timezone = ?, low_stock_threshold = ?, enable_promotions = ?, default_page_size = ? WHERE id = ?`,
      [next.app_name, next.currency, next.timezone, next.low_stock_threshold, next.enable_promotions, next.default_page_size, rows[0].id],
    );
  } else {
    await sql(
      `INSERT INTO settings (id, app_name, currency, timezone, low_stock_threshold, enable_promotions, default_page_size)
       VALUES ('default', ?, ?, ?, ?, ?, ?)`,
      [next.app_name, next.currency, next.timezone, next.low_stock_threshold, next.enable_promotions, next.default_page_size],
    );
  }
  return { ...current, appName: next.app_name, currency: next.currency, timezone: next.timezone, lowStockThreshold: next.low_stock_threshold, enablePromotions: flag(next.enable_promotions), defaultPageSize: next.default_page_size };
}

/* ------------------------------------------------------------------ */
/* Caja / ventas                                                       */
/* ------------------------------------------------------------------ */

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'QR'];
const round2 = (value) => Math.round(Number(value ?? 0) * 100) / 100;
const isoDayOf = (date) => date.toISOString().slice(0, 10);

function saleDto(row) {
  return {
    id: row.id,
    number: row.number,
    createdAt: iso(row.created_at),
    subtotal: round2(row.subtotal),
    discount: round2(row.discount),
    total: round2(row.total),
    paymentMethod: row.payment_method,
    amountPaid: round2(row.amount_paid),
    change: round2(row.change_due),
    status: row.status ?? 'Completada',
    notes: row.notes ?? '',
    itemsCount: Number(row.items_count ?? 0),
  };
}

function saleItemDto(row) {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    sku: row.sku ?? '',
    name: row.name ?? '',
    price: round2(row.price),
    quantity: Number(row.quantity ?? 0),
    subtotal: round2(row.subtotal),
  };
}

/** Rango del informe: últimos 30 días salvo que se indique `from`/`to`. */
function reportRange(params) {
  const today = isoDayOf(new Date());
  const to = String(params.to ?? '') || today;
  const base = new Date();
  base.setUTCDate(base.getUTCDate() - 29);
  const from = String(params.from ?? '') || isoDayOf(base);
  return { from, to, today };
}

function dateRange(from, to) {
  const out = [];
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return out;
  for (let time = start, guard = 0; time <= end && guard < 366; time += 86_400_000, guard += 1) {
    out.push(new Date(time).toISOString().slice(0, 10));
  }
  return out;
}

async function listSales(query, params) {
  const where = [];
  const values = [];
  const term = params.search ?? params.q;
  if (term) push(where, values, `${accentless(`CONCAT_WS(' ', s.number, s.notes)`)} LIKE ?`, likeTerm(term));
  if (params.paymentMethod) push(where, values, 's.payment_method = ?', params.paymentMethod);
  if (params.from) push(where, values, 'DATE(s.created_at) >= ?', String(params.from));
  if (params.to) push(where, values, 'DATE(s.created_at) <= ?', String(params.to));

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sortExpr(
    params.sortField ?? 'createdAt',
    params.sortDirection ?? 'desc',
    { createdAt: 's.created_at', total: 's.total', number: 's.number' },
    'createdAt',
  );

  const page = await paged(query, {
    countSql: `SELECT COUNT(*) AS total FROM sales s ${whereSql}`,
    dataSql: `SELECT s.* FROM sales s ${whereSql} ${order}`,
    params: values,
    paging: readPaging(params),
  });

  return { ...page, items: page.items.map(saleDto) };
}

async function getSale(id) {
  const rows = await sql(`SELECT * FROM sales WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) throw notFound('Venta');
  const items = await sql(`SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC`, [id]);
  return { ...saleDto(rows[0]), items: items.map(saleItemDto) };
}

async function createSale(body) {
  const input = body ?? {};
  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (!rawItems.length) throw badRequest('La venta debe incluir al menos un producto');
  if (!PAYMENT_METHODS.includes(input.paymentMethod)) throw badRequest('Método de pago no válido');

  const discount = Number(input.discount ?? 0);
  if (!Number.isFinite(discount) || discount < 0) throw badRequest('Descuento no válido');

  // Agrupa líneas repetidas del mismo producto para validar el stock real.
  const requested = new Map();
  for (const item of rawItems) {
    const quantity = Math.floor(Number(item?.quantity));
    if (!item?.productId || !Number.isFinite(quantity) || quantity <= 0) {
      throw badRequest('Cantidad no válida en la venta');
    }
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + quantity);
  }

  const ids = [...requested.keys()];

  return withTransaction(async (run) => {
    const productRows = await run(
      `SELECT id, sku, name, price, promotional_price, stock
         FROM products WHERE id IN (${inClause(ids)}) FOR UPDATE`,
      ids,
    );
    const byId = new Map(productRows.map((row) => [row.id, row]));

    const lines = [...requested.entries()].map(([productId, quantity]) => {
      const product = byId.get(productId);
      if (!product) throw badRequest('Uno de los productos de la venta no existe');
      if (!Number.isFinite(quantity) || quantity <= 0) throw badRequest(`Cantidad no válida para "${product.name}"`);
      if (Number(product.stock) < quantity) {
        throw badRequest(`Stock insuficiente para "${product.name}" (disponible: ${product.stock})`);
      }
      const unit =
        product.promotional_price === null || product.promotional_price === undefined
          ? Number(product.price)
          : Number(product.promotional_price);
      return { product, quantity, unit };
    });

    const subtotal = round2(lines.reduce((sum, line) => sum + line.unit * line.quantity, 0));
    const total = round2(subtotal - discount);
    if (total < 0) throw badRequest('El descuento supera el subtotal');

    const amountPaid =
      input.amountPaid === undefined || input.amountPaid === null || input.amountPaid === ''
        ? total
        : Number(input.amountPaid);
    if (!Number.isFinite(amountPaid) || amountPaid < total) {
      throw badRequest('El importe recibido es menor que el total a pagar');
    }

    const nextRow = await run(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(number, 3) AS UNSIGNED)), 0) + 1 AS nextSeq FROM sales`,
    );
    const nextSeq = Number(nextRow[0]?.nextSeq ?? 1);
    const number = `V-${String(nextSeq).padStart(4, '0')}`;
    const saleId = uid('sl');
    const createdAt = now();
    const itemsCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const notes = String(input.notes ?? '').trim();

    await run(
      `INSERT INTO sales (id, number, created_at, subtotal, discount, total, payment_method,
                          amount_paid, change_due, status, notes, items_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completada', ?, ?)`,
      [
        saleId,
        number,
        createdAt,
        subtotal,
        discount,
        total,
        input.paymentMethod,
        round2(amountPaid),
        round2(Math.max(0, amountPaid - total)),
        notes,
        itemsCount,
      ],
    );

    const itemRows = lines.map((line, index) => ({
      id: `si_${saleId}_${index + 1}`,
      saleId,
      productId: line.product.id,
      sku: line.product.sku,
      name: line.product.name,
      price: line.unit,
      quantity: line.quantity,
      subtotal: round2(line.unit * line.quantity),
    }));

    await run(
      `INSERT INTO sale_items (id, sale_id, product_id, sku, name, price, quantity, subtotal) VALUES ?`,
      [itemRows.map((row) => [row.id, row.saleId, row.productId, row.sku, row.name, row.price, row.quantity, row.subtotal])],
    );

    for (const line of lines) {
      await run(
        `UPDATE products SET stock = GREATEST(stock - ?, 0), updated_at = ? WHERE id = ?`,
        [line.quantity, createdAt, line.product.id],
      );
    }

    return {
      id: saleId,
      number,
      createdAt: iso(createdAt),
      subtotal,
      discount,
      total,
      paymentMethod: input.paymentMethod,
      amountPaid: round2(amountPaid),
      change: round2(Math.max(0, amountPaid - total)),
      status: 'Completada',
      notes,
      itemsCount,
      items: itemRows,
    };
  });
}

async function salesReport(params) {
  const { from, to, today } = reportRange(params);
  const range = [from, to];

  const totals = await sql(
    `SELECT COUNT(*) AS sales, COALESCE(SUM(total), 0) AS revenue
       FROM sales WHERE DATE(created_at) BETWEEN ? AND ?`,
    range,
  );
  const units = await sql(
    `SELECT COALESCE(SUM(si.quantity), 0) AS units
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
      WHERE DATE(s.created_at) BETWEEN ? AND ?`,
    range,
  );
  const dayRows = await sql(
    `SELECT DATE(s.created_at) AS day, COUNT(*) AS sales, COALESCE(SUM(s.total), 0) AS revenue,
            COALESCE(SUM(it.units), 0) AS units
       FROM sales s
       LEFT JOIN (SELECT sale_id, SUM(quantity) AS units FROM sale_items GROUP BY sale_id) it
         ON it.sale_id = s.id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
      GROUP BY DATE(s.created_at)`,
    range,
  );
  const methodRows = await sql(
    `SELECT s.payment_method AS name, COUNT(*) AS sales, COALESCE(SUM(s.total), 0) AS revenue,
            COALESCE(SUM(it.units), 0) AS units
       FROM sales s
       LEFT JOIN (SELECT sale_id, SUM(quantity) AS units FROM sale_items GROUP BY sale_id) it
         ON it.sale_id = s.id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
      GROUP BY s.payment_method`,
    range,
  );
  const topRows = await sql(
    `SELECT si.product_id AS id, MAX(si.name) AS name, MAX(si.sku) AS sku,
            SUM(si.quantity) AS units, COALESCE(SUM(si.subtotal), 0) AS revenue,
            COUNT(DISTINCT si.sale_id) AS sales
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
      GROUP BY si.product_id
      ORDER BY units DESC, revenue DESC
      LIMIT 8`,
    range,
  );
  const todayRow = await sql(
    `SELECT COUNT(*) AS sales, COALESCE(SUM(total), 0) AS revenue FROM sales WHERE DATE(created_at) = ?`,
    [today],
  );

  const totalSales = Number(totals[0]?.sales ?? 0);
  const revenue = round2(totals[0]?.revenue ?? 0);

  const dayMap = new Map(
    dayRows.map((row) => [
      String(row.day).slice(0, 10),
      { sales: Number(row.sales), units: Number(row.units), revenue: round2(row.revenue) },
    ]),
  );

  const byDay = dateRange(from, to).map((date) => ({
    date,
    label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
    ...(dayMap.get(date) ?? { sales: 0, units: 0, revenue: 0 }),
  }));

  const byMethod = PAYMENT_METHODS.map((method) => {
    const row = methodRows.find((entry) => entry.name === method);
    if (!row) return null;
    return {
      name: method,
      sales: Number(row.sales),
      units: Number(row.units ?? 0),
      revenue: round2(row.revenue),
    };
  }).filter(Boolean);

  return {
    totals: {
      sales: totalSales,
      units: Number(units[0]?.units ?? 0),
      revenue,
      avgTicket: totalSales ? round2(revenue / totalSales) : 0,
      today: {
        sales: Number(todayRow[0]?.sales ?? 0),
        revenue: round2(todayRow[0]?.revenue ?? 0),
      },
    },
    byDay,
    byMethod,
    topProducts: topRows.map((row) => ({
      id: row.id,
      name: row.name ?? '',
      sku: row.sku ?? '',
      units: Number(row.units ?? 0),
      revenue: round2(row.revenue),
      sales: Number(row.sales ?? 0),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

async function dashboardStats() {
  const settings = await getSettings();
  const threshold = settings.lowStockThreshold;

  const totals = (
    await sql(`SELECT
      (SELECT COUNT(*) FROM vehicles) AS vehicles,
      (SELECT COUNT(*) FROM brands) AS brands,
      (SELECT COUNT(*) FROM models) AS models,
      (SELECT COUNT(*) FROM generations) AS generations,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM products WHERE active = 1) AS active_products,
      (SELECT COUNT(*) FROM products WHERE stock = 0) AS out_of_stock,
      (SELECT COUNT(*) FROM products WHERE stock > 0 AND stock <= ?) AS low_stock,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM compatibility) AS compatibility,
      (SELECT COUNT(*) FROM users) AS users`, [threshold])
  )[0];

  const monthlyRows = await sql(`SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, COUNT(*) AS c
      FROM vehicles WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 MONTH) GROUP BY y, m`);
  const productMonthly = await sql(`SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, COUNT(*) AS c
      FROM products WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 MONTH) GROUP BY y, m`);
  const monthlyKey = (rows) => new Map(rows.map((row) => [`${row.y}-${row.m}`, Number(row.c)]));
  const vehicleMonthly = monthlyKey(monthlyRows);
  const productMap = monthlyKey(productMonthly);

  const nowDate = new Date();
  const monthly = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - i, 1));
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    monthly.push({
      month: MONTH_LABELS[date.getUTCMonth()],
      vehicles: vehicleMonthly.get(key) ?? 0,
      products: productMap.get(key) ?? 0,
    });
  }

  const categoryDistribution = (
    await sql(`SELECT c.name, COUNT(p.id) AS value FROM categories c
      LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id, c.name ORDER BY value DESC LIMIT 8`)
  ).map((row) => ({ name: row.name, value: Number(row.value) }));

  const brandDistribution = (
    await sql(`SELECT b.name, COUNT(v.id) AS value FROM brands b
      LEFT JOIN models m ON m.brand_id = b.id
      LEFT JOIN generations g ON g.model_id = m.id
      LEFT JOIN vehicles v ON v.generation_id = g.id
      GROUP BY b.id, b.name ORDER BY value DESC LIMIT 8`)
  ).map((row) => ({ name: row.name, value: Number(row.value) }));

  const fuelDistribution = (
    await sql(`SELECT fuel AS name, COUNT(*) AS value FROM vehicles GROUP BY fuel ORDER BY value DESC`)
  ).map((row) => ({ name: row.name, value: Number(row.value) }));

  const stockStatus = [
    { name: 'Disponible', value: Number(totals.products) - Number(totals.out_of_stock) - Number(totals.low_stock) },
    { name: 'Stock bajo', value: Number(totals.low_stock) },
    { name: 'Agotado', value: Number(totals.out_of_stock) },
  ];

  const priceRows = await sql(`SELECT
      SUM(CASE WHEN price < 50 THEN 1 ELSE 0 END) AS r1,
      SUM(CASE WHEN price >= 50 AND price < 150 THEN 1 ELSE 0 END) AS r2,
      SUM(CASE WHEN price >= 150 AND price < 300 THEN 1 ELSE 0 END) AS r3,
      SUM(CASE WHEN price >= 300 AND price < 500 THEN 1 ELSE 0 END) AS r4,
      SUM(CASE WHEN price >= 500 THEN 1 ELSE 0 END) AS r5
    FROM products`);
  const price = priceRows[0];
  const priceRange = [
    { range: '< $50', value: Number(price.r1 ?? 0) },
    { range: '$50 - $150', value: Number(price.r2 ?? 0) },
    { range: '$150 - $300', value: Number(price.r3 ?? 0) },
    { range: '$300 - $500', value: Number(price.r4 ?? 0) },
    { range: '> $500', value: Number(price.r5 ?? 0) },
  ];

  const recentProducts = (await sql(`SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} ORDER BY p.created_at DESC LIMIT 6`)).map(
    (row) => productWithCategory(row),
  );
  const recentVehicles = (await sql(`SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN} ORDER BY v.created_at DESC LIMIT 6`)).map(
    (row) => vehicleWithRefs(row),
  );

  return {
    totals: {
      vehicles: Number(totals.vehicles),
      brands: Number(totals.brands),
      models: Number(totals.models),
      generations: Number(totals.generations),
      products: Number(totals.products),
      activeProducts: Number(totals.active_products),
      outOfStock: Number(totals.out_of_stock),
      lowStock: Number(totals.low_stock),
      categories: Number(totals.categories),
      compatibility: Number(totals.compatibility),
      users: Number(totals.users),
    },
    monthly,
    categoryDistribution,
    brandDistribution,
    fuelDistribution,
    stockStatus,
    priceRange,
    recentProducts,
    recentVehicles,
  };
}

/* ------------------------------------------------------------------ */
/* Búsqueda global                                                     */
/* ------------------------------------------------------------------ */

async function globalSearch(params) {
  const term = String(params.q ?? '');
  const tokens = normalize(term).split(/\s+/).filter(Boolean);
  const yearToken = tokens.find((token) => /^\d{4}$/.test(token));
  const textTokens = tokens.filter((token) => !/^\d{4}$/.test(token));
  const productTerm = textTokens.join(' ');

  const vehicleWhere = [];
  const vehicleValues = [];
  if (term.trim()) {
    push(
      vehicleWhere,
      vehicleValues,
      `${accentless(`CONCAT_WS(' ', b.name, m.name, g.name, v.year, v.version, v.engine, v.body_type, v.fuel)`)} LIKE ?`,
      likeTerm(term),
    );
  }
  if (params.brandId) push(vehicleWhere, vehicleValues, 'm.brand_id = ?', params.brandId);
  if (params.modelId) push(vehicleWhere, vehicleValues, 'g.model_id = ?', params.modelId);
  if (params.year) push(vehicleWhere, vehicleValues, 'v.year = ?', Number(params.year));
  const vehicleWhereSql = vehicleWhere.length ? `WHERE ${vehicleWhere.join(' AND ')}` : '';

  const vehicleCount = await sql(`SELECT COUNT(*) AS total ${VEHICLE_JOIN} ${vehicleWhereSql}`, vehicleValues);
  const vehicleRows = await sql(
    `SELECT ${VEHICLE_COLS} ${VEHICLE_JOIN} ${vehicleWhereSql} ORDER BY v.year DESC LIMIT 40`,
    vehicleValues,
  );

  const productWhere = [];
  const productValues = [];
  if (productTerm.length > 0) {
    push(
      productWhere,
      productValues,
      `(${accentless('p.name')} LIKE ? OR ${accentless('p.sku')} LIKE ? OR ${accentless('p.brand')} LIKE ? OR ${accentless('p.description')} LIKE ? OR ${accentless('c.name')} LIKE ? OR ${accentless('CAST(p.tags AS CHAR)')} LIKE ?)`,
      ...Array(6).fill(likeTerm(productTerm)),
    );
  } else if (yearToken) {
    push(productWhere, productValues, 'EXISTS (SELECT 1 FROM compatibility cp JOIN vehicles vv ON vv.id = cp.vehicle_id WHERE cp.product_id = p.id AND vv.year = ?)', Number(yearToken));
  }

  if (params.brandId || params.modelId || params.year) {
    const vehicleFilters = [];
    const vehicleFilterValues = [];
    if (params.brandId) push(vehicleFilters, vehicleFilterValues, 'm.brand_id = ?', params.brandId);
    if (params.modelId) push(vehicleFilters, vehicleFilterValues, 'g.model_id = ?', params.modelId);
    if (params.year) push(vehicleFilters, vehicleFilterValues, 'v.year = ?', Number(params.year));
    push(
      productWhere,
      productValues,
      `EXISTS (SELECT 1 FROM compatibility cp JOIN vehicles v ON v.id = cp.vehicle_id
         LEFT JOIN generations g ON g.id = v.generation_id
         LEFT JOIN models m ON m.id = g.model_id
        WHERE cp.product_id = p.id AND ${vehicleFilters.join(' AND ')})`,
      ...vehicleFilterValues,
    );
  }

  if (params.categoryId) push(productWhere, productValues, 'p.category_id = ?', params.categoryId);
  if (params.availability === 'in') push(productWhere, productValues, 'p.stock > 0 AND p.active = 1');
  if (params.availability === 'out') push(productWhere, productValues, 'p.stock = 0');
  if (params.availability === 'promo') push(productWhere, productValues, 'p.promotional_price IS NOT NULL');
  if (params.minPrice) push(productWhere, productValues, 'p.price >= ?', Number(params.minPrice));
  if (params.maxPrice) push(productWhere, productValues, 'p.price <= ?', Number(params.maxPrice));

  const productWhereSql = productWhere.length ? `WHERE ${productWhere.join(' AND ')}` : '';
  const productCount = await sql(`SELECT COUNT(*) AS total ${PRODUCT_JOIN} ${productWhereSql}`, productValues);
  const productRows = await sql(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_JOIN} ${productWhereSql} ORDER BY p.name ASC LIMIT 60`,
    productValues,
  );

  const total = Number(vehicleCount[0].total) + Number(productCount[0].total);

  return {
    vehicles: vehicleRows.map((row) => vehicleWithRefs(row)),
    products: productRows.map((row) => productWithCategory(row)),
    total,
    query: term,
  };
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export async function route({ method, segments, query: params = {}, body }) {
  const [base, id, third] = segments;

  if (base === 'dashboard' && id === 'stats') return dashboardStats();
  if (base === 'stats') return dashboardStats();

  if (base === 'search') return globalSearch(params);

  if (base === 'sales') {
    if (!id) {
      if (method === 'POST') return createSale(body);
      return listSales(sql, params);
    }
    if (id === 'report' && method === 'GET') return salesReport(params);
    if (method === 'GET') return getSale(id);
  }

  if (base === 'settings') {
    if (method === 'PUT' || method === 'PATCH') return updateSettings(body);
    return getSettings();
  }

  if (base === 'brands') {
    if (!id) {
      if (method === 'POST') return createBrand(body);
      return listBrands(sql, params);
    }
    if (third === 'models') {
      const brand = await requireRow('brands', id, 'Marca');
      params.brandId = brand.id;
      return listModels(sql, params);
    }
    if (method === 'GET') return brandDetailOf(await requireRow('brands', id, 'Marca'));
    if (method === 'PUT' || method === 'PATCH') return updateBrand(id, body);
    if (method === 'DELETE') return deleteBrand(id);
  }

  if (base === 'models') {
    if (!id) {
      if (method === 'POST') return createModel(body);
      return listModels(sql, params);
    }
    if (method === 'GET') return modelDetailOf(await requireRow('models', id, 'Modelo'));
    if (method === 'PUT' || method === 'PATCH') return updateModel(id, body);
    if (method === 'DELETE') return deleteModel(id);
  }

  if (base === 'generations') {
    if (!id) {
      if (method === 'POST') return createGeneration(body);
      return listGenerations(sql, params);
    }
    if (method === 'GET') return generationDetailOf(await requireRow('generations', id, 'Generación'));
    if (method === 'PUT' || method === 'PATCH') return updateGeneration(id, body);
    if (method === 'DELETE') return deleteGeneration(id);
  }

  if (base === 'vehicles') {
    if (!id) {
      if (method === 'POST') return createVehicle(body);
      return listVehicles(sql, params);
    }
    if (third === 'products') {
      params.vehicleId = id;
      return vehicleProducts(sql, params);
    }
    if (method === 'GET') return vehicleDetailOf(id);
    if (method === 'PUT' || method === 'PATCH') return updateVehicle(id, body);
    if (method === 'DELETE') return deleteVehicle(id);
  }

  if (base === 'categories') {
    if (!id) {
      if (method === 'POST') return createCategory(body);
      return listCategories(sql, params);
    }
    if (method === 'PUT' || method === 'PATCH') return updateCategory(id, body);
    if (method === 'DELETE') return deleteCategory(id);
  }

  if (base === 'products') {
    if (!id) {
      if (method === 'POST') return createProduct(body);
      return listProducts(sql, params);
    }
    if (third === 'duplicate' && method === 'POST') return duplicateProduct(id);
    if (method === 'GET') return productDetailOf(id);
    if (method === 'PUT' || method === 'PATCH') return updateProduct(id, body);
    if (method === 'DELETE') return deleteProduct(id);
  }

  if (base === 'compatibility') {
    if (!id) {
      if (method === 'POST') return addCompatibility(body);
      return listCompatibility(sql, params);
    }
    if (method === 'DELETE') return removeCompatibility(id);
  }

  if (base === 'users') {
    if (!id) {
      if (method === 'POST') return createUser(body);
      return listUsers(sql, params);
    }
    if (method === 'PUT' || method === 'PATCH') return updateUser(id, body);
    if (method === 'DELETE') return deleteUser(id);
  }

  throw new ApiError(`Ruta no soportada: ${method} /api/${segments.join('/')}`, 404);
}
