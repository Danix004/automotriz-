/**
 * Generador de datos de demostración.
 *
 * Construye una base normalizada (Brand → Model → Generation → Vehicle)
 * con marcas/modelos/generaciones reales y un catálogo de productos con
 * compatibilidades calculadas. Los datos se persisten en localStorage,
 * por lo que el usuario puede editarlos sin perderlos.
 */

import { PRODUCT_CATEGORIES } from '@/types/constants';
import type {
  AppSettings,
  AppUser,
  Brand,
  Category,
  Compatibility,
  Generation,
  PaymentMethod,
  Product,
  ProductImage,
  Sale,
  SaleItem,
  Vehicle,
  VehicleModel,
} from '@/types';
import { SEED_BRANDS } from '@/data/catalog';
import { PRODUCT_TEMPLATES } from '@/data/products';
import type { Database } from '@/services/database';
import { slugify } from '@/utils/format';

const MAX_VEHICLES = 3000;
const MAX_COMPAT_PER_PRODUCT = 120;

const MODEL_FEATURED_SKUS = [
  'AE-1000',
  'AE-1001',
  'AE-1005',
  'AE-1006',
  'AE-1008',
  'AE-1011',
  'AE-1016',
  'AE-1022',
  'AE-1025',
  'AE-1032',
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9 + (days % 8), (days * 7) % 60, 0, 0);
  return date.toISOString();
}

function spread<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i += 1) {
    out.push(items[Math.floor(i * step)]);
  }
  return out;
}

/** PRNG determinista (mulberry32) para que el seed sea reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeedDatabase(): Database {
  const brands: Brand[] = [];
  const models: VehicleModel[] = [];
  const generations: Generation[] = [];
  const vehicles: Vehicle[] = [];

  let vehicleSeq = 0;
  let overflow = false;

  SEED_BRANDS.forEach((brandSpec, brandIndex) => {
    const brandId = `br_${slugify(brandSpec.name)}`;
    brands.push({
      id: brandId,
      name: brandSpec.name,
      logo: '',
      country: brandSpec.country,
      active: true,
      createdAt: daysAgo(400 - brandIndex * 6),
    });

    brandSpec.models.forEach((modelSpec, modelIndex) => {
      const modelId = `md_${slugify(brandSpec.name)}-${slugify(modelSpec.name)}`;
      models.push({
        id: modelId,
        brandId,
        name: modelSpec.name,
        bodyType: modelSpec.bodyType,
        active: true,
        createdAt: daysAgo(360 - modelIndex * 4 - brandIndex * 3),
      });

      modelSpec.generations.forEach((generationSpec, generationIndex) => {
        const generationId = `gn_${modelId}-${slugify(generationSpec.name)}`;
        generations.push({
          id: generationId,
          modelId,
          name: generationSpec.name,
          startYear: generationSpec.start,
          endYear: generationSpec.end,
        });

        for (let year = generationSpec.start; year <= generationSpec.end; year += 1) {
          if (vehicles.length >= MAX_VEHICLES) {
            overflow = true;
            break;
          }
          const versionsThisYear = Math.min(2, modelSpec.versions.length);
          for (let v = 0; v < versionsThisYear; v += 1) {
            const seedIndex = year - generationSpec.start + v + generationIndex;
            const version = modelSpec.versions[seedIndex % modelSpec.versions.length];
            const spec = modelSpec.engines[seedIndex % modelSpec.engines.length];
            vehicleSeq += 1;
            vehicles.push({
              id: `vh_${vehicleSeq.toString().padStart(5, '0')}`,
              generationId,
              year,
              version,
              engine: spec.name,
              fuel: spec.fuel,
              transmission: spec.transmission,
              drivetrain: spec.drivetrain,
              bodyType: modelSpec.bodyType,
              power: spec.power,
              displacement: spec.displacement,
              image: '',
              active: true,
              createdAt: daysAgo(Math.max(1, 300 - vehicleSeq % 300)),
            });
          }
        }
        if (overflow) return;
      });
      if (overflow) return;
    });
  });

  const categories: Category[] = PRODUCT_CATEGORIES.map((name, index) => ({
    id: `ct_${slugify(name)}`,
    name,
    description: `${name} para automóviles: instalación, compatibilidad y soporte técnico.`,
    active: true,
    createdAt: daysAgo(350 - index * 3),
  }));

  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  const brandNameSet = new Set(brands.map((b) => b.name));
  const modelById = new Map(models.map((m) => [m.id, m]));
  const generationById = new Map(generations.map((g) => [g.id, g]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  const brandIndexByName = new Map(brands.map((b, i) => [b.name, i]));
  const modelIndexById = new Map(models.map((m, i) => [m.id, i]));

  const vehicleBrand = new Map<string, string>();
  const vehicleModel = new Map<string, string>();
  const vehicleYear = new Map<string, number>();
  vehicles.forEach((vehicle) => {
    const generation = generationById.get(vehicle.generationId);
    const model = generation ? modelById.get(generation.modelId) : undefined;
    const brand = model ? brandById.get(model.brandId) : undefined;
    vehicleBrand.set(vehicle.id, brand?.name ?? '');
    vehicleModel.set(vehicle.id, model?.name ?? '');
    vehicleYear.set(vehicle.id, vehicle.year);
  });

  const products: Product[] = [];
  const productImages: ProductImage[] = [];

  PRODUCT_TEMPLATES.forEach((template, index) => {
    const id = `pr_${(index + 1).toString().padStart(4, '0')}`;
    const sku = `AE-${(1000 + index).toString()}`;
    const categoryId = categoryByName.get(template.category) ?? categories[categories.length - 1].id;
    const createdAt = daysAgo(180 - (index % 60));
    const updatedAt = daysAgo((index * 3) % 45);

    products.push({
      id,
      sku,
      name: template.name,
      description: template.description,
      categoryId,
      brand: template.brand,
      price: template.price,
      promotionalPrice: template.promotionalPrice ?? null,
      stock: template.stock,
      image: '',
      gallery: [],
      specs: template.specs,
      installation: template.installation,
      tags: template.tags,
      active: template.stock > 0 || index % 7 !== 0,
      createdAt,
      updatedAt,
    });

    productImages.push({
      id: `pi_${id}_1`,
      productId: id,
      url: '',
      sortOrder: 1,
    });
  });

  /* ------------------------- compatibilidades ------------------------- */

  const compatibility: Compatibility[] = [];
  const seenPairs = new Set<string>();
  let compatSeq = 0;

  const addCompat = (productId: string, vehicleId: string, notes = '') => {
    const key = `${productId}::${vehicleId}`;
    if (seenPairs.has(key)) return;
    seenPairs.add(key);
    compatSeq += 1;
    compatibility.push({
      id: `cp_${compatSeq.toString().padStart(6, '0')}`,
      productId,
      vehicleId,
      notes,
      createdAt: daysAgo(compatSeq % 120),
    });
  };

  // Orden estable y disperso por marca → modelo → año para muestrear bien.
  const orderedVehicles = [...vehicles].sort((a, b) => {
    const brandDiff =
      (brandIndexByName.get(vehicleBrand.get(a.id) ?? '') ?? 0) -
      (brandIndexByName.get(vehicleBrand.get(b.id) ?? '') ?? 0);
    if (brandDiff !== 0) return brandDiff;
    const modelDiff =
      (modelIndexById.get(modelById.get(generationById.get(a.generationId)?.modelId ?? '')?.id ?? '') ?? 0) -
      (modelIndexById.get(modelById.get(generationById.get(b.generationId)?.modelId ?? '')?.id ?? '') ?? 0);
    if (modelDiff !== 0) return modelDiff;
    return a.year - b.year;
  });

  products.forEach((product, productIndex) => {
    const template = PRODUCT_TEMPLATES[productIndex];
    const fit = template?.fit;
    const allowedBrands = fit?.brands?.filter((name) => brandNameSet.has(name));

    let pool = orderedVehicles;

    if (fit && allowedBrands && allowedBrands.length > 0) {
      const brandIds = new Set(brands.filter((b) => allowedBrands.includes(b.name)).map((b) => b.id));
      pool = pool.filter((vehicle) => {
        const generation = generationById.get(vehicle.generationId);
        const model = generation ? modelById.get(generation.modelId) : undefined;
        if (!model || !brandIds.has(model.brandId)) return false;
        if (fit.models && !fit.models.includes(model.name)) return false;
        if (fit.from && vehicle.year < fit.from) return false;
        if (fit.to && vehicle.year > fit.to) return false;
        return true;
      });
    } else {
      // Producto genérico: se distribuye sobre la marca que le toca.
      const fallbackBrand = brands[productIndex % brands.length];
      pool = pool.filter((vehicle) => vehicleBrand.get(vehicle.id) === fallbackBrand.name);
    }

    if (pool.length === 0) pool = orderedVehicles;

    spread(pool, MAX_COMPAT_PER_PRODUCT).forEach((vehicle) => {
      addCompat(product.id, vehicle.id, fit ? 'Verificado en taller' : '');
    });
  });

  // Enriquece el vehículo más reciente de cada modelo con los productos estrella.
  const newestByModel = new Map<string, Vehicle>();
  vehicles.forEach((vehicle) => {
    const generation = generationById.get(vehicle.generationId);
    if (!generation) return;
    const current = newestByModel.get(generation.modelId);
    if (!current || vehicle.year >= current.year) newestByModel.set(generation.modelId, vehicle);
  });

  const featuredProducts = products.filter((product) => MODEL_FEATURED_SKUS.includes(product.sku));
  newestByModel.forEach((vehicle) => {
    featuredProducts.forEach((product) => addCompat(product.id, vehicle.id, 'Recomendado'));
  });

  const users: AppUser[] = [
    {
      id: 'us_0001',
      name: 'Carlos Mendoza',
      email: 'carlos@autoequip.com',
      role: 'Administrador',
      active: true,
      createdAt: daysAgo(420),
    },
    {
      id: 'us_0002',
      name: 'Lucía Fernández',
      email: 'lucia@autoequip.com',
      role: 'Editor',
      active: true,
      createdAt: daysAgo(260),
    },
    {
      id: 'us_0003',
      name: 'Diego Ramírez',
      email: 'diego@autoequip.com',
      role: 'Editor',
      active: false,
      createdAt: daysAgo(140),
    },
    {
      id: 'us_0004',
      name: 'María Torres',
      email: 'maria@autoequip.com',
      role: 'Visualizador',
      active: true,
      createdAt: daysAgo(60),
    },
  ];

  const settings: AppSettings = {
    appName: 'AutoEquip Pro',
    currency: 'USD',
    timezone: 'America/La_Paz',
    lowStockThreshold: 5,
    enablePromotions: true,
    defaultPageSize: 10,
  };

  /* ----------------------------- ventas (caja) ---------------------------- */

  const sales: Sale[] = [];
  const saleItems: SaleItem[] = [];
  const sellable = products.filter((product) => product.active && product.stock > 0);

  const PAYMENT_WEIGHTS: Array<{ method: PaymentMethod; weight: number }> = [
    { method: 'Efectivo', weight: 45 },
    { method: 'Tarjeta', weight: 30 },
    { method: 'Transferencia', weight: 15 },
    { method: 'QR', weight: 10 },
  ];

  const random = mulberry32(20260926);
  const round2 = (value: number) => Math.round(value * 100) / 100;
  const pickMethod = (): PaymentMethod => {
    const roll = random() * 100;
    let acc = 0;
    for (const entry of PAYMENT_WEIGHTS) {
      acc += entry.weight;
      if (roll <= acc) return entry.method;
    }
    return 'Efectivo';
  };

  const SALES_TOTAL = 96;
  const HISTORY_DAYS = 60;
  let saleSeq = 0;

  for (let index = 0; index < SALES_TOTAL; index += 1) {
    // Histórico decreciente: más movimiento en los últimos días.
    const age = Math.floor(random() ** 1.7 * HISTORY_DAYS);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - age);
    createdAt.setHours(9 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0);

    // Las ventas de hoy se anclan al día UTC en curso (y a la hora actual):
    // así el KPI "ventas de hoy" del reporte nunca aparece vacío en la demo.
    if (age === 0) {
      const now = new Date();
      const utcStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const recent = now.getTime() - Math.floor(random() * 4 * 3_600_000);
      createdAt.setTime(Math.min(now.getTime(), Math.max(utcStart + 60_000, recent)));
    }

    const itemLines = 1 + Math.floor(random() ** 1.4 * 4); // 1..4 líneas
    const chosen = new Set<string>();
    const lines: Array<{ product: Product; quantity: number }> = [];

    for (let line = 0; line < itemLines; line += 1) {
      const product = sellable[Math.floor(random() * sellable.length)];
      if (!product || chosen.has(product.id)) continue;
      chosen.add(product.id);
      const quantity = random() > 0.78 ? 2 : 1;
      lines.push({ product, quantity });
    }
    if (lines.length === 0) continue;

    const subtotal = round2(
      lines.reduce((sum, line) => {
        const unit = line.product.promotionalPrice ?? line.product.price;
        return sum + unit * line.quantity;
      }, 0),
    );

    const discountRate = random() > 0.85 ? (random() > 0.5 ? 0.05 : 0.1) : 0;
    const discount = round2(subtotal * discountRate);
    const total = round2(subtotal - discount);
    const paymentMethod = pickMethod();
    const amountPaid =
      paymentMethod === 'Efectivo' ? Math.ceil(total / 5) * 5 : total;

    saleSeq += 1;
    const saleId = `sl_${saleSeq.toString().padStart(4, '0')}`;

    sales.push({
      id: saleId,
      number: `V-${saleSeq.toString().padStart(4, '0')}`,
      createdAt: createdAt.toISOString(),
      subtotal,
      discount,
      total,
      paymentMethod,
      amountPaid: round2(amountPaid),
      change: round2(Math.max(0, amountPaid - total)),
      status: 'Completada',
      notes: discountRate > 0 ? 'Descuento de caja aplicado' : '',
      itemsCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    });

    lines.forEach((line, lineIndex) => {
      const unit = line.product.promotionalPrice ?? line.product.price;
      saleItems.push({
        id: `si_${saleId}_${lineIndex + 1}`,
        saleId,
        productId: line.product.id,
        sku: line.product.sku,
        name: line.product.name,
        price: unit,
        quantity: line.quantity,
        subtotal: round2(unit * line.quantity),
      });
    });
  }

  return {
    brands,
    models,
    generations,
    vehicles,
    categories,
    products,
    productImages,
    compatibility,
    users,
    sales,
    saleItems,
    settings,
  };
}
