/** Constantes, catálogos y etiquetas del dominio. */

import type {
  BodyType,
  DrivetrainType,
  FuelType,
  TransmissionType,
} from '@/types';

export const FUEL_TYPES: FuelType[] = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP', 'Flex'];

export const TRANSMISSION_TYPES: TransmissionType[] = [
  'Manual',
  'Automática',
  'CVT',
  'Semi-automática',
  'DSG',
  'DCT',
  'S tronic',
  'Tiptronic',
  'e-CVT',
];

export const DRIVETRAIN_TYPES: DrivetrainType[] = ['FWD', 'RWD', 'AWD', '4x4'];

export const BODY_TYPES: BodyType[] = [
  'Sedán',
  'Hatchback',
  'SUV',
  'Pickup',
  'Coupé',
  'Convertible',
  'Minivan',
  'Furgón',
  'Crossover',
  'Wagon',
];

export const PRODUCT_CATEGORIES: string[] = [
  'Multimedia',
  'Pantallas',
  'Radios',
  'Android Auto',
  'Apple CarPlay',
  'Cámaras',
  'Sensores',
  'GPS',
  'Alarmas',
  'Seguridad',
  'Iluminación',
  'Luces LED',
  'Faros',
  'Accesorios interiores',
  'Accesorios exteriores',
  'Audio',
  'Parlantes',
  'Subwoofers',
  'Amplificadores',
  'Conectividad',
  'Sensores de estacionamiento',
  'Accesorios eléctricos',
  'Otros',
];

export const DRIVETRAIN_LABELS: Record<DrivetrainType, string> = {
  FWD: 'Tracción delantera',
  RWD: 'Tracción trasera',
  AWD: 'Integral (AWD)',
  '4x4': 'Cuatro ruedas motrices',
};

export const LOW_STOCK_THRESHOLD = 5;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DEFAULT_PAGE_SIZE = 10;

/** Colores por categoría para chips/avisos. */
export const CATEGORY_COLORS: Record<string, string> = {
  Multimedia: 'bg-indigo-500/15 text-indigo-400',
  Pantallas: 'bg-violet-500/15 text-violet-400',
  Radios: 'bg-sky-500/15 text-sky-400',
  'Android Auto': 'bg-emerald-500/15 text-emerald-400',
  'Apple CarPlay': 'bg-slate-500/15 text-slate-300',
  Cámaras: 'bg-rose-500/15 text-rose-400',
  Sensores: 'bg-amber-500/15 text-amber-400',
  GPS: 'bg-cyan-500/15 text-cyan-400',
  Alarmas: 'bg-red-500/15 text-red-400',
  Seguridad: 'bg-orange-500/15 text-orange-400',
  Iluminación: 'bg-yellow-500/15 text-yellow-400',
  'Luces LED': 'bg-yellow-500/15 text-yellow-300',
  Faros: 'bg-lime-500/15 text-lime-400',
  'Accesorios interiores': 'bg-teal-500/15 text-teal-400',
  'Accesorios exteriores': 'bg-green-500/15 text-green-400',
  Audio: 'bg-fuchsia-500/15 text-fuchsia-400',
  Parlantes: 'bg-pink-500/15 text-pink-400',
  Subwoofers: 'bg-purple-500/15 text-purple-400',
  Amplificadores: 'bg-blue-500/15 text-blue-400',
  Conectividad: 'bg-teal-500/15 text-teal-300',
  'Sensores de estacionamiento': 'bg-amber-500/15 text-amber-300',
  'Accesorios eléctricos': 'bg-lime-500/15 text-lime-300',
  Otros: 'bg-slate-500/15 text-slate-400',
};
