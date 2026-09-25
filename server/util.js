/**
 * Utilidades compartidas por la API serverless:
 * errores HTTP, normalización de texto, paginación y mapeo de filas → DTO.
 */

/* ----------------------------- errores ----------------------------- */

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new ApiError(message, 400);
export const notFound = (entity) => new ApiError(`${entity} no encontrado`, 404);

/* --------------------------- normalización -------------------------- */

/** Quita acentos y pasa a minúsculas (paridad con el mock local). */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Expresión SQL que replica `normalize()` sobre una columna/expr. */
export function accentless(expr) {
  const pairs = [
    ['á', 'a'],
    ['é', 'e'],
    ['í', 'i'],
    ['ó', 'o'],
    ['ú', 'u'],
    ['ü', 'u'],
    ['ñ', 'n'],
  ];
  let out = `LOWER(${expr})`;
  for (const [from, to] of pairs) {
    out = `REPLACE(${out},'${from}','${to}')`;
  }
  return out;
}

export const likeTerm = (term) => `%${normalize(term)}%`;

/* ---------------------------- paginación ---------------------------- */

export function readPaging(query) {
  const requestedPage = Math.max(1, Number(query.page ?? 1) || 1);
  const requestedSize = query.pageSize === undefined ? 10 : Number(query.pageSize);
  return { requestedPage, requestedSize, all: requestedSize === 0 };
}

export function paginated(items, total, { requestedPage, requestedSize, all }) {
  const size = all ? Math.max(total, 1) : Math.max(1, requestedSize);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requestedPage, totalPages);
  return { items, total, page, pageSize: size, totalPages };
}

/**
 * Ejecuta el conteo y la página de filas en una sola pasada.
 * `limitClause` se inyecta solo cuando corresponde paginar.
 */
export async function paged(query, { countSql, dataSql, params = [], paging }) {
  const countRows = await query(countSql, params);
  const total = Number(countRows[0]?.total ?? 0);
  const size = paging.all ? Math.max(total, 1) : Math.max(1, paging.requestedSize);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(paging.requestedPage, totalPages);
  const offset = (page - 1) * size;
  const rows = await query(`${dataSql} LIMIT ${size} OFFSET ${offset}`, params);
  return { items: rows, total, page, pageSize: size, totalPages };
}

/* ------------------------------ fechas ------------------------------ */

export function iso(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export const flag = (value) => value === true || value === 1 || value === '1';

/* ------------------------------- mappers ---------------------------- */

const brandFields = (r, p = '') => ({
  id: r[`${p}id`],
  name: r[`${p}name`],
  country: r[`${p}country`] ?? '',
  logo: r[`${p}logo`] ?? '',
  active: flag(r[`${p}active`]),
  createdAt: iso(r[`${p}created_at`]),
});

const modelFields = (r, p = '') => ({
  id: r[`${p}id`],
  brandId: r[`${p}brand_id`] ?? '',
  name: r[`${p}name`],
  bodyType: r[`${p}body_type`] ?? '',
  active: flag(r[`${p}active`]),
  createdAt: iso(r[`${p}created_at`]),
});

const generationFields = (r, p = '') => ({
  id: r[`${p}id`],
  modelId: r[`${p}model_id`] ?? '',
  name: r[`${p}name`],
  startYear: Number(r[`${p}start_year`] ?? 0),
  endYear: r[`${p}end_year`] === null || r[`${p}end_year`] === undefined ? null : Number(r[`${p}end_year`]),
});

const categoryFields = (r, p = '') => ({
  id: r[`${p}id`] ?? '',
  name: r[`${p}name`] ?? 'Sin categoría',
  description: r[`${p}description`] ?? '',
  active: flag(r[`${p}active`]),
  createdAt: iso(r[`${p}created_at`]),
});

const vehicleFields = (r, p = '') => ({
  id: r[`${p}id`],
  generationId: r[`${p}generation_id`],
  year: Number(r[`${p}year`] ?? 0),
  version: r[`${p}version`] ?? '',
  engine: r[`${p}engine`] ?? '',
  fuel: r[`${p}fuel`] ?? '',
  transmission: r[`${p}transmission`] ?? '',
  drivetrain: r[`${p}drivetrain`] ?? '',
  bodyType: r[`${p}body_type`] ?? '',
  power: Number(r[`${p}power`] ?? 0),
  displacement: Number(r[`${p}displacement`] ?? 0),
  image: r[`${p}image`] ?? '',
  active: flag(r[`${p}active`]),
  createdAt: iso(r[`${p}created_at`]),
});

/** Vehicle + generación/modelo/marca (JOIN con prefijos g_/m_/b_). */
export function vehicleWithRefs(r, p = '') {
  return {
    ...vehicleFields(r, p),
    generation: r[`${p}g_id`] ? generationFields(r, `${p}g_`) : {},
    model: r[`${p}m_id`] ? modelFields(r, `${p}m_`) : {},
    brand: r[`${p}b_id`] ? brandFields(r, `${p}b_`) : {},
  };
}

const productFields = (r, p = '') => ({
  id: r[`${p}id`],
  sku: r[`${p}sku`] ?? '',
  name: r[`${p}name`] ?? '',
  description: r[`${p}description`] ?? '',
  categoryId: r[`${p}category_id`] ?? '',
  brand: r[`${p}brand`] ?? '',
  price: Number(r[`${p}price`] ?? 0),
  promotionalPrice:
    r[`${p}promotional_price`] === null || r[`${p}promotional_price`] === undefined
      ? null
      : Number(r[`${p}promotional_price`]),
  stock: Number(r[`${p}stock`] ?? 0),
  image: r[`${p}image`] ?? '',
  gallery: r[`${p}gallery`] ?? [],
  specs: r[`${p}specs`] ?? [],
  installation: r[`${p}installation`] ?? '',
  tags: r[`${p}tags`] ?? [],
  active: flag(r[`${p}active`]),
  createdAt: iso(r[`${p}created_at`]),
  updatedAt: iso(r[`${p}updated_at`]),
});

/** Product + categoría + número de compatibilidades. */
export function productWithCategory(r, p = '') {
  return {
    ...productFields(r, p),
    category: r.c_id
      ? categoryFields(r, 'c_')
      : { id: '', name: 'Sin categoría', description: '', active: true, createdAt: '' },
    compatibilityCount: Number(r.compat_count ?? 0),
  };
}

export function settingsDto(r) {
  return {
    appName: r.app_name ?? 'AutoEquip Pro',
    currency: r.currency ?? 'USD',
    timezone: r.timezone ?? 'UTC',
    lowStockThreshold: Number(r.low_stock_threshold ?? 5),
    enablePromotions: flag(r.enable_promotions),
    defaultPageSize: Number(r.default_page_size ?? 10),
  };
}

export function userDto(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    active: flag(r.active),
    createdAt: iso(r.created_at),
  };
}

export { brandFields, modelFields, generationFields, categoryFields, vehicleFields, productFields };
