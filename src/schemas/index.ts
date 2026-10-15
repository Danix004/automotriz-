/** Esquemas de validación con Zod compartidos entre formularios y servicios. */

import { z } from 'zod';
import { BODY_TYPES, DRIVETRAIN_TYPES, FUEL_TYPES, TRANSMISSION_TYPES } from '@/types/constants';
import { PAYMENT_METHODS } from '@/types';

const required = (label: string, min = 1) =>
  z.string().trim().min(min, `${label} es obligatorio`);

/** Convierte una lista de constantes en un enum de Zod conservando el tipo literal. */
const enumOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);

export const brandSchema = z.object({
  name: required('El nombre', 2),
  country: required('El país'),
  logo: z.string().trim().optional().default(''),
  active: z.boolean().default(true),
});
export type BrandFormValues = z.infer<typeof brandSchema>;

export const modelSchema = z.object({
  brandId: required('La marca'),
  name: required('El modelo', 2),
  bodyType: enumOf(BODY_TYPES),
  active: z.boolean().default(true),
});
export type ModelFormValues = z.infer<typeof modelSchema>;

export const generationSchema = z
  .object({
    modelId: required('El modelo'),
    name: required('La generación', 1),
    startYear: z.coerce.number().int('Año inválido').min(1950).max(2100),
    endYear: z.coerce.number().int('Año inválido').min(1950).max(2100).nullable().optional(),
  })
  .refine((data) => !data.endYear || data.endYear >= data.startYear, {
    message: 'El año final debe ser mayor o igual al inicial',
    path: ['endYear'],
  });
export type GenerationFormValues = z.infer<typeof generationSchema>;

export const vehicleSchema = z.object({
  generationId: required('La generación'),
  year: z.coerce.number().int('Año inválido').min(1950).max(2100),
  version: required('La versión', 1),
  engine: required('El motor', 1),
  fuel: enumOf(FUEL_TYPES),
  transmission: enumOf(TRANSMISSION_TYPES),
  drivetrain: enumOf(DRIVETRAIN_TYPES),
  bodyType: enumOf(BODY_TYPES),
  power: z.coerce.number().min(1, 'Potencia inválida').max(3000),
  displacement: z.coerce.number().min(0).max(10000),
  image: z.string().trim().optional().default(''),
  active: z.boolean().default(true),
});
export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const categorySchema = z.object({
  name: required('El nombre', 2),
  description: z.string().trim().default(''),
  active: z.boolean().default(true),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const productSpecSchema = z.object({
  label: required('El nombre del campo'),
  value: required('El valor'),
});

export const productSchema = z.object({
  sku: required('El SKU', 2),
  barcode: z
    .string()
    .trim()
    .max(60, 'Máximo 60 caracteres')
    .regex(/^[A-Za-z0-9\-.\/ ]*$/, 'Usa solo letras, números, guiones o puntos')
    .default(''),
  name: required('El nombre', 3),
  description: z.string().trim().min(10, 'Describe el producto (mín. 10 caracteres)'),
  categoryId: required('La categoría'),
  brand: z.string().trim().default(''),
  price: z.coerce.number().min(0, 'Precio inválido'),
  promotionalPrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int('Stock inválido').min(0),
  image: z.string().trim().optional().default(''),
  gallery: z.array(z.string()).default([]),
  specs: z.array(productSpecSchema).default([]),
  installation: z.string().trim().default(''),
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const compatibilitySchema = z.object({
  productId: required('El producto'),
  vehicleIds: z.array(z.string()).min(1, 'Selecciona al menos un vehículo'),
  notes: z.string().trim().default(''),
});
export type CompatibilityFormValues = z.infer<typeof compatibilitySchema>;

export const userSchema = z.object({
  name: required('El nombre', 2),
  email: z.string().email('Correo inválido'),
  role: z.enum(['Administrador', 'Editor', 'Visualizador']),
  active: z.boolean().default(true),
});
export type UserFormValues = z.infer<typeof userSchema>;

export const settingsSchema = z.object({
  appName: required('El nombre del sistema', 2),
  currency: required('La moneda'),
  timezone: z.string().min(1),
  lowStockThreshold: z.coerce.number().int().min(0).max(100),
  enablePromotions: z.boolean(),
  defaultPageSize: z.coerce.number().int().min(5).max(200),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const saleSchema = z.object({
  paymentMethod: enumOf(PAYMENT_METHODS),
  amountPaid: z
    .number({ invalid_type_error: 'Importe no válido' })
    .min(0, 'No puede ser negativo')
    .optional(),
  discount: z
    .number({ invalid_type_error: 'Descuento no válido' })
    .min(0, 'No puede ser negativo')
    .optional(),
  notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

export type SaleFormValues = z.infer<typeof saleSchema>;

export const searchSchema = z.object({
  term: z.string().trim().default(''),
});
