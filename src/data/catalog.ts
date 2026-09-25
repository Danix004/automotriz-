/**
 * Catálogo semilla de marcas, modelos, generaciones y versiones.
 * Solo datos de demostración: en producción estas entidades llegan
 * desde la API (`GET /api/brands`, `GET /api/brands/:id/models`, ...).
 */

import type { BodyType, DrivetrainType, FuelType, TransmissionType } from '@/types';

export interface SeedEngine {
  name: string;
  fuel: FuelType;
  displacement: number;
  power: number;
  transmission: TransmissionType;
  drivetrain: DrivetrainType;
}

export interface SeedGeneration {
  name: string;
  start: number;
  end: number;
}

export interface SeedModel {
  name: string;
  bodyType: BodyType;
  versions: string[];
  engines: SeedEngine[];
  generations: SeedGeneration[];
}

export interface SeedBrand {
  name: string;
  country: string;
  models: SeedModel[];
}

const engine = (
  name: string,
  fuel: FuelType,
  displacement: number,
  power: number,
  transmission: TransmissionType = 'Automática',
  drivetrain: DrivetrainType = 'FWD',
): SeedEngine => ({ name, fuel, displacement, power, transmission, drivetrain });

export const SEED_BRANDS: SeedBrand[] = [
  {
    name: 'Toyota',
    country: 'Japón',
    models: [
      {
        name: 'Hilux',
        bodyType: 'Pickup',
        versions: ['SRX', 'DLX', 'SR', 'XLR'],
        engines: [
          engine('2.8 Turbo Diésel', 'Diésel', 2755, 204, 'Automática', '4x4'),
          engine('2.4 Diésel', 'Diésel', 2393, 150, 'Manual', '4x4'),
          engine('4.0 V6 Gasolina', 'Gasolina', 3956, 231, 'Automática', '4x4'),
        ],
        generations: [
          { name: '8ª generación', start: 2016, end: 2024 },
          { name: '7ª generación', start: 2004, end: 2015 },
        ],
      },
      {
        name: 'Corolla',
        bodyType: 'Sedán',
        versions: ['XEi', 'GLE', 'SE', 'Altis'],
        engines: [
          engine('1.8L VVT-i', 'Gasolina', 1798, 139, 'CVT'),
          engine('2.0L Dynamic Force', 'Gasolina', 1987, 169, 'CVT'),
          engine('1.8L Híbrido', 'Híbrido', 1798, 122, 'CVT'),
        ],
        generations: [
          { name: '12ª generación (E210)', start: 2019, end: 2024 },
          { name: '11ª generación (E170)', start: 2014, end: 2018 },
        ],
      },
      {
        name: 'Yaris',
        bodyType: 'Hatchback',
        versions: ['L', 'LE', 'XLE', 'SE'],
        engines: [
          engine('1.5L Dual VVT-i', 'Gasolina', 1496, 107, 'CVT'),
          engine('1.3L VVT-i', 'Gasolina', 1329, 99, 'Manual'),
        ],
        generations: [
          { name: '4ª generación (XP210)', start: 2020, end: 2024 },
          { name: '3ª generación (XP130)', start: 2011, end: 2019 },
        ],
      },
      {
        name: 'Camry',
        bodyType: 'Sedán',
        versions: ['LE', 'SE', 'XLE', 'XSE'],
        engines: [
          engine('2.5L Dynamic Force', 'Gasolina', 2487, 203, 'Automática'),
          engine('3.5L V6', 'Gasolina', 3456, 301, 'Automática'),
          engine('2.5L Híbrido', 'Híbrido', 2487, 208, 'CVT'),
        ],
        generations: [
          { name: '8ª generación (XV70)', start: 2018, end: 2024 },
          { name: '7ª generación (XV50)', start: 2012, end: 2017 },
        ],
      },
      {
        name: 'RAV4',
        bodyType: 'SUV',
        versions: ['XLE', 'Limited', 'Adventure', 'TRD Off-Road'],
        engines: [
          engine('2.5L Dynamic Force', 'Gasolina', 2487, 203, 'Automática', 'AWD'),
          engine('2.5L Híbrido AWD-e', 'Híbrido', 2487, 219, 'CVT', 'AWD'),
        ],
        generations: [
          { name: '5ª generación (XA50)', start: 2019, end: 2024 },
          { name: '4ª generación (XA40)', start: 2013, end: 2018 },
        ],
      },
      {
        name: 'Land Cruiser',
        bodyType: 'SUV',
        versions: ['Standard', 'Adventure', 'ZX', 'VX'],
        engines: [
          engine('4.5L V8 Diésel', 'Diésel', 4461, 272, 'Automática', '4x4'),
          engine('5.7L V8', 'Gasolina', 5663, 381, 'Automática', '4x4'),
        ],
        generations: [
          { name: '300 Series', start: 2021, end: 2024 },
          { name: '200 Series', start: 2008, end: 2021 },
        ],
      },
      {
        name: 'Fortuner',
        bodyType: 'SUV',
        versions: ['SRV', 'DX', 'GX', 'Conquest'],
        engines: [
          engine('2.8 Turbo Diésel', 'Diésel', 2755, 204, 'Automática', '4x4'),
          engine('2.4 Diésel', 'Diésel', 2393, 150, 'Manual', '4x4'),
        ],
        generations: [
          { name: '2ª generación (AN130)', start: 2016, end: 2024 },
          { name: '1ª generación (AN60)', start: 2005, end: 2015 },
        ],
      },
      {
        name: 'Prius',
        bodyType: 'Hatchback',
        versions: ['L Eco', 'LE', 'XLE', 'Limited'],
        engines: [engine('1.8L Híbrido', 'Híbrido', 1798, 121, 'CVT')],
        generations: [
          { name: '4ª generación (XW50)', start: 2016, end: 2024 },
          { name: '3ª generación (XW30)', start: 2010, end: 2015 },
        ],
      },
    ],
  },
  {
    name: 'Ford',
    country: 'Estados Unidos',
    models: [
      {
        name: 'Ranger',
        bodyType: 'Pickup',
        versions: ['XL', 'XLT', 'Limited', 'Raptor'],
        engines: [
          engine('3.2 Diésel', 'Diésel', 3198, 200, 'Manual', '4x4'),
          engine('2.0 EcoBlue', 'Diésel', 1996, 170, 'Automática', '4x4'),
        ],
        generations: [
          { name: '3ª generación (PX3)', start: 2019, end: 2024 },
          { name: '2ª generación (T6)', start: 2011, end: 2018 },
        ],
      },
      {
        name: 'F-150',
        bodyType: 'Pickup',
        versions: ['XL', 'XLT', 'Lariat', 'Platinum'],
        engines: [
          engine('3.5 EcoBoost V6', 'Gasolina', 3496, 400, 'Automática', '4x4'),
          engine('5.0 V8', 'Gasolina', 5038, 400, 'Automática', '4x4'),
        ],
        generations: [
          { name: '14ª generación (P702)', start: 2021, end: 2024 },
          { name: '13ª generación (P552)', start: 2015, end: 2020 },
        ],
      },
      {
        name: 'Mustang',
        bodyType: 'Coupé',
        versions: ['EcoBoost', 'GT', 'Mach 1', 'Dark Horse'],
        engines: [
          engine('2.3 EcoBoost', 'Gasolina', 2294, 310, 'Manual', 'RWD'),
          engine('5.0 Ti-VCT V8', 'Gasolina', 4951, 480, 'Manual', 'RWD'),
        ],
        generations: [
          { name: '6ª generación (S550)', start: 2015, end: 2023 },
          { name: '7ª generación (S650)', start: 2024, end: 2024 },
        ],
      },
      {
        name: 'Explorer',
        bodyType: 'SUV',
        versions: ['Base', 'XLT', 'Limited', 'ST'],
        engines: [
          engine('2.3 EcoBoost', 'Gasolina', 2294, 300, 'Automática', 'AWD'),
          engine('3.0 EcoBoost V6', 'Gasolina', 2956, 400, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '6ª generación (U502)', start: 2020, end: 2024 },
          { name: '5ª generación (U502)', start: 2011, end: 2019 },
        ],
      },
      {
        name: 'Escape',
        bodyType: 'Crossover',
        versions: ['S', 'SE', 'SEL', 'Titanium'],
        engines: [
          engine('1.5 EcoBoost', 'Gasolina', 1498, 181, 'Automática', 'FWD'),
          engine('2.5 Híbrido', 'Híbrido', 2494, 192, 'Automática', 'FWD'),
        ],
        generations: [
          { name: '4ª generación (U540)', start: 2020, end: 2024 },
          { name: '3ª generación (C520)', start: 2013, end: 2019 },
        ],
      },
      {
        name: 'Bronco',
        bodyType: 'SUV',
        versions: ['Base', 'Big Bend', 'Outer Banks', 'Badlands'],
        engines: [
          engine('2.3 EcoBoost', 'Gasolina', 2294, 300, 'Manual', '4x4'),
          engine('2.7 EcoBoost V6', 'Gasolina', 2694, 330, 'Automática', '4x4'),
        ],
        generations: [{ name: '6ª generación (U725)', start: 2021, end: 2024 }],
      },
      {
        name: 'Maverick',
        bodyType: 'Pickup',
        versions: ['XL', 'XLT', 'Lariat'],
        engines: [
          engine('2.5 Híbrido', 'Híbrido', 2494, 191, 'CVT', 'FWD'),
          engine('2.0 EcoBoost', 'Gasolina', 1998, 250, 'Automática', 'AWD'),
        ],
        generations: [{ name: '1ª generación (P758)', start: 2022, end: 2024 }],
      },
    ],
  },
  {
    name: 'Chevrolet',
    country: 'Estados Unidos',
    models: [
      {
        name: 'Onix',
        bodyType: 'Sedán',
        versions: ['LS', 'LT', 'Premier', 'Joy'],
        engines: [
          engine('1.0 Turbo', 'Gasolina', 999, 116, 'Automática'),
          engine('1.2', 'Gasolina', 1199, 88, 'Manual'),
        ],
        generations: [
          { name: '2ª generación (P300)', start: 2020, end: 2024 },
          { name: '1ª generación (P700)', start: 2013, end: 2019 },
        ],
      },
      {
        name: 'Tracker',
        bodyType: 'Crossover',
        versions: ['LS', 'LT', 'Premier', 'Redline'],
        engines: [
          engine('1.2 Turbo', 'Gasolina', 1199, 133, 'Automática', 'FWD'),
          engine('1.0 Turbo', 'Gasolina', 999, 116, 'Manual', 'FWD'),
        ],
        generations: [
          { name: '2ª generación (QU)', start: 2021, end: 2024 },
          { name: '1ª generación (T300)', start: 2013, end: 2020 },
        ],
      },
      {
        name: 'S10',
        bodyType: 'Pickup',
        versions: ['WT', 'LS', 'LTZ', 'High Country'],
        engines: [
          engine('2.8 Duramax Diésel', 'Diésel', 2776, 200, 'Automática', '4x4'),
          engine('1.4 Turbo', 'Gasolina', 1399, 153, 'Manual', '4x4'),
        ],
        generations: [
          { name: '2ª generación (RG)', start: 2017, end: 2024 },
          { name: '1ª generación (RT)', start: 2011, end: 2016 },
        ],
      },
      {
        name: 'Silverado',
        bodyType: 'Pickup',
        versions: ['Work Truck', 'Custom', 'LT', 'High Country'],
        engines: [
          engine('5.3 EcoTec3 V8', 'Gasolina', 5328, 355, 'Automática', '4x4'),
          engine('6.2 EcoTec3 V8', 'Gasolina', 6162, 420, 'Automática', '4x4'),
        ],
        generations: [
          { name: '3ª generación (T1)', start: 2019, end: 2024 },
          { name: '2ª generación (K2)', start: 2014, end: 2018 },
        ],
      },
      {
        name: 'Camaro',
        bodyType: 'Coupé',
        versions: ['1LS', '1LT', '2SS', 'ZL1'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1998, 275, 'Manual', 'RWD'),
          engine('6.2 V8', 'Gasolina', 6162, 455, 'Manual', 'RWD'),
        ],
        generations: [
          { name: '6ª generación (Alpha)', start: 2016, end: 2024 },
          { name: '5ª generación (Alpha)', start: 2010, end: 2015 },
        ],
      },
      {
        name: 'Equinox',
        bodyType: 'SUV',
        versions: ['L', 'LS', 'LT', 'Premier'],
        engines: [
          engine('1.5 Turbo', 'Gasolina', 1490, 170, 'Automática', 'FWD'),
          engine('1.6 Turbo Diésel', 'Diésel', 1598, 137, 'Automática', 'FWD'),
        ],
        generations: [
          { name: '3ª generación (2XX)', start: 2018, end: 2024 },
          { name: '2ª generación (GMT31)', start: 2010, end: 2017 },
        ],
      },
      {
        name: 'Trailblazer',
        bodyType: 'Crossover',
        versions: ['LS', 'LT', 'ACTIV', 'RS'],
        engines: [engine('1.2 Turbo', 'Gasolina', 1199, 139, 'CVT', 'FWD')],
        generations: [{ name: '2ª generación (310T)', start: 2021, end: 2024 }],
      },
    ],
  },
  {
    name: 'Volkswagen',
    country: 'Alemania',
    models: [
      {
        name: 'Gol',
        bodyType: 'Hatchback',
        versions: ['Track', 'Comfortline', 'Highline', 'GTI'],
        engines: [
          engine('1.6 MSI', 'Gasolina', 1598, 110, 'Manual'),
          engine('1.4 TSI', 'Gasolina', 1395, 150, 'Automática'),
        ],
        generations: [
          { name: '5ª generación (PO)', start: 2017, end: 2022 },
          { name: '4ª generación (5R)', start: 2009, end: 2016 },
        ],
      },
      {
        name: 'Tiguan',
        bodyType: 'SUV',
        versions: ['Trendline', 'Comfortline', 'Highline', 'R-Line'],
        engines: [
          engine('2.0 TSI', 'Gasolina', 1984, 180, 'Automática', 'AWD'),
          engine('1.4 TSI', 'Gasolina', 1395, 150, 'DSG'),
        ],
        generations: [
          { name: '2ª generación (AD1)', start: 2016, end: 2024 },
          { name: '1ª generación (5N)', start: 2007, end: 2015 },
        ],
      },
      {
        name: 'Polo',
        bodyType: 'Hatchback',
        versions: ['Trend', 'Comfortline', 'Highline', 'GTI'],
        engines: [
          engine('1.6 MPI', 'Gasolina', 1598, 110, 'Manual'),
          engine('1.0 TSI', 'Gasolina', 999, 115, 'Automática'),
        ],
        generations: [
          { name: '6ª generación (AW)', start: 2017, end: 2024 },
          { name: '5ª generación (6R)', start: 2009, end: 2017 },
        ],
      },
      {
        name: 'Amarok',
        bodyType: 'Pickup',
        versions: ['Core', 'Style', 'Aventura', 'PanAmericana'],
        engines: [
          engine('2.0 TDI', 'Diésel', 1968, 140, 'Manual', '4x4'),
          engine('3.0 V6 TDI', 'Diésel', 2967, 258, 'Automática', '4x4'),
        ],
        generations: [
          { name: '2ª generación (GB)', start: 2023, end: 2024 },
          { name: '1ª generación (HA)', start: 2010, end: 2022 },
        ],
      },
      {
        name: 'Taos',
        bodyType: 'Crossover',
        versions: ['Comfortline', 'Highline', 'R-Line'],
        engines: [engine('1.4 TSI', 'Gasolina', 1395, 150, 'Automática', 'FWD')],
        generations: [{ name: '1ª generación (BH)', start: 2021, end: 2024 }],
      },
    ],
  },
  {
    name: 'BMW',
    country: 'Alemania',
    models: [
      {
        name: 'Serie 3',
        bodyType: 'Sedán',
        versions: ['320i', '320d', '330i', 'M340i'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1998, 184, 'Automática', 'RWD'),
          engine('2.0 Diesel', 'Diésel', 1995, 190, 'Automática', 'RWD'),
        ],
        generations: [
          { name: '7ª generación (G20)', start: 2019, end: 2024 },
          { name: '6ª generación (F30)', start: 2012, end: 2018 },
        ],
      },
      {
        name: 'Serie 5',
        bodyType: 'Sedán',
        versions: ['520i', '530i', '530d', 'M550i'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1998, 252, 'Automática', 'RWD'),
          engine('3.0 Diesel', 'Diésel', 2993, 286, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '8ª generación (G60)', start: 2024, end: 2024 },
          { name: '7ª generación (G30)', start: 2017, end: 2023 },
        ],
      },
      {
        name: 'X3',
        bodyType: 'SUV',
        versions: ['sDrive20i', 'xDrive30i', 'M40i', 'xDrive20d'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1998, 248, 'Automática', 'AWD'),
          engine('2.0 Diesel', 'Diésel', 1995, 190, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '3ª generación (G01)', start: 2017, end: 2024 },
          { name: '2ª generación (F25)', start: 2010, end: 2016 },
        ],
      },
      {
        name: 'X5',
        bodyType: 'SUV',
        versions: ['xDrive40i', 'xDrive50i', 'M50i', 'xDrive30d'],
        engines: [
          engine('3.0 Turbo', 'Gasolina', 2998, 340, 'Automática', 'AWD'),
          engine('3.0 Diesel', 'Diésel', 2993, 265, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '4ª generación (G05)', start: 2019, end: 2024 },
          { name: '3ª generación (F15)', start: 2013, end: 2018 },
        ],
      },
      {
        name: 'Serie 4',
        bodyType: 'Coupé',
        versions: ['420i', '430i', 'M440i', '420d'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1998, 184, 'Automática', 'RWD'),
          engine('3.0 Turbo', 'Gasolina', 2998, 374, 'Automática', 'RWD'),
        ],
        generations: [
          { name: '2ª generación (G22)', start: 2021, end: 2024 },
          { name: '1ª generación (F32)', start: 2014, end: 2020 },
        ],
      },
    ],
  },
  {
    name: 'Mercedes-Benz',
    country: 'Alemania',
    models: [
      {
        name: 'Clase C',
        bodyType: 'Sedán',
        versions: ['C 180', 'C 200', 'C 220d', 'C 300'],
        engines: [
          engine('1.5 Turbo', 'Gasolina', 1497, 170, 'Automática', 'RWD'),
          engine('2.0 Diesel', 'Diésel', 1993, 194, 'Automática', 'RWD'),
        ],
        generations: [
          { name: '5ª generación (W206)', start: 2021, end: 2024 },
          { name: '4ª generación (W205)', start: 2014, end: 2021 },
        ],
      },
      {
        name: 'Clase E',
        bodyType: 'Sedán',
        versions: ['E 200', 'E 220d', 'E 300', 'E 350'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1991, 258, 'Automática', 'RWD'),
          engine('2.0 Diesel', 'Diésel', 1993, 194, 'Automática', 'RWD'),
        ],
        generations: [
          { name: '6ª generación (W214)', start: 2023, end: 2024 },
          { name: '5ª generación (W213)', start: 2016, end: 2022 },
        ],
      },
      {
        name: 'Clase A',
        bodyType: 'Hatchback',
        versions: ['A 180', 'A 200', 'A 220', 'A 250'],
        engines: [
          engine('1.3 Turbo', 'Gasolina', 1332, 136, 'Automática', 'FWD'),
          engine('2.0 Turbo', 'Gasolina', 1991, 224, 'Automática', 'FWD'),
        ],
        generations: [
          { name: '3ª generación (W177)', start: 2018, end: 2024 },
          { name: '2ª generación (W176)', start: 2012, end: 2018 },
        ],
      },
      {
        name: 'GLC',
        bodyType: 'SUV',
        versions: ['GLC 200', 'GLC 300', 'GLC 220d', 'AMG 43'],
        engines: [
          engine('2.0 Turbo', 'Gasolina', 1991, 258, 'Automática', 'AWD'),
          engine('2.0 Diesel', 'Diésel', 1993, 194, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '2ª generación (X254)', start: 2022, end: 2024 },
          { name: '1ª generación (X253)', start: 2015, end: 2021 },
        ],
      },
    ],
  },
  {
    name: 'Audi',
    country: 'Alemania',
    models: [
      {
        name: 'A3',
        bodyType: 'Hatchback',
        versions: ['Attraction', 'Ambiente', 'Design', 'S line'],
        engines: [
          engine('1.4 TFSI', 'Gasolina', 1395, 150, 'S tronic', 'FWD'),
          engine('2.0 TDI', 'Diésel', 1968, 150, 'S tronic', 'FWD'),
        ],
        generations: [
          { name: '4ª generación (8Y)', start: 2020, end: 2024 },
          { name: '3ª generación (8V)', start: 2013, end: 2019 },
        ],
      },
      {
        name: 'A4',
        bodyType: 'Sedán',
        versions: ['Advanced', 'S line', 'Black Edition', '100 Jahre'],
        engines: [
          engine('2.0 TFSI', 'Gasolina', 1984, 249, 'S tronic', 'FWD'),
          engine('2.0 TDI', 'Diésel', 1968, 190, 'S tronic', 'AWD'),
        ],
        generations: [
          { name: '5ª generación (B9)', start: 2016, end: 2024 },
          { name: '4ª generación (B8)', start: 2008, end: 2015 },
        ],
      },
      {
        name: 'Q5',
        bodyType: 'SUV',
        versions: ['Advanced', 'S line', 'Black Edition', 'S Q5'],
        engines: [
          engine('2.0 TFSI', 'Gasolina', 1984, 265, 'S tronic', 'AWD'),
          engine('2.0 TDI', 'Diésel', 1968, 204, 'S tronic', 'AWD'),
        ],
        generations: [
          { name: '2ª generación (FY)', start: 2017, end: 2024 },
          { name: '1ª generación (8R)', start: 2012, end: 2017 },
        ],
      },
      {
        name: 'Q7',
        bodyType: 'SUV',
        versions: ['Advanced', 'S line', 'Black Edition', 'S Q7'],
        engines: [
          engine('3.0 TFSI V6', 'Gasolina', 2995, 340, 'Tiptronic', 'AWD'),
          engine('3.0 TDI V6', 'Diésel', 2967, 286, 'Tiptronic', 'AWD'),
        ],
        generations: [
          { name: '2ª generación (4M)', start: 2015, end: 2024 },
          { name: '1ª generación (4L)', start: 2006, end: 2015 },
        ],
      },
    ],
  },
  {
    name: 'Nissan',
    country: 'Japón',
    models: [
      {
        name: 'Navara',
        bodyType: 'Pickup',
        versions: ['X', 'Exclusive', 'Warrior', 'Platinum'],
        engines: [
          engine('2.5 Diésel', 'Diésel', 2488, 190, 'Manual', '4x4'),
          engine('2.3 Diésel', 'Diésel', 2298, 163, 'Automática', '4x4'),
        ],
        generations: [
          { name: '3ª generación (D23)', start: 2015, end: 2024 },
          { name: '2ª generación (D40)', start: 2004, end: 2014 },
        ],
      },
      {
        name: 'X-Trail',
        bodyType: 'SUV',
        versions: ['Sense', 'Exclusive', 'Tekna', 'e-POWER'],
        engines: [
          engine('2.5 Diésel', 'Diésel', 2488, 173, 'CVT', 'AWD'),
          engine('1.5 e-POWER', 'Híbrido', 1497, 204, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '4ª generación (T33)', start: 2021, end: 2024 },
          { name: '3ª generación (T32)', start: 2014, end: 2020 },
        ],
      },
      {
        name: 'Versa',
        bodyType: 'Sedán',
        versions: ['Sense', 'Advanced', 'Exclusive'],
        engines: [
          engine('1.6 DiG-T', 'Gasolina', 1598, 118, 'CVT'),
          engine('1.6', 'Gasolina', 1598, 106, 'Manual'),
        ],
        generations: [
          { name: '3ª generación (N18)', start: 2020, end: 2024 },
          { name: '2ª generación (N17)', start: 2013, end: 2019 },
        ],
      },
      {
        name: 'Kicks',
        bodyType: 'Crossover',
        versions: ['Sense', 'Advanced', 'Exclusive'],
        engines: [engine('1.6', 'Gasolina', 1598, 118, 'CVT', 'FWD')],
        generations: [{ name: '2ª generación (P16)', start: 2021, end: 2024 }],
      },
      {
        name: 'Frontier',
        bodyType: 'Pickup',
        versions: ['Sense', 'Advanced', 'Platinum'],
        engines: [
          engine('2.3 Diésel', 'Diésel', 2298, 231, 'Automática', '4x4'),
          engine('4.0 V6', 'Gasolina', 3954, 261, 'Automática', '4x4'),
        ],
        generations: [{ name: '2ª generación (D23)', start: 2015, end: 2024 }],
      },
    ],
  },
  {
    name: 'Hyundai',
    country: 'Corea del Sur',
    models: [
      {
        name: 'Tucson',
        bodyType: 'SUV',
        versions: ['Comfort', 'Style', 'N Line', 'Calligraphy'],
        engines: [
          engine('2.0 Diésel', 'Diésel', 1997, 186, 'Automática', 'AWD'),
          engine('1.6 T-GDi', 'Gasolina', 1598, 180, 'Automática', 'FWD'),
        ],
        generations: [
          { name: '4ª generación (NX4)', start: 2021, end: 2024 },
          { name: '3ª generación (TL)', start: 2015, end: 2020 },
        ],
      },
      {
        name: 'Elantra',
        bodyType: 'Sedán',
        versions: ['SE', 'SEL', 'Limited', 'N Line'],
        engines: [
          engine('1.6 MPI', 'Gasolina', 1591, 128, 'CVT'),
          engine('1.6 T-GDi', 'Gasolina', 1591, 201, 'DCT'),
        ],
        generations: [
          { name: '7ª generación (CN7)', start: 2021, end: 2024 },
          { name: '6ª generación (AD)', start: 2016, end: 2020 },
        ],
      },
      {
        name: 'Santa Fe',
        bodyType: 'SUV',
        versions: ['SE', 'SEL', 'Limited', 'Calligraphy'],
        engines: [
          engine('2.5 Turbo', 'Gasolina', 2497, 281, 'Automática', 'AWD'),
          engine('2.2 Diésel', 'Diésel', 2151, 202, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '5ª generación (MX5)', start: 2023, end: 2024 },
          { name: '4ª generación (TM)', start: 2018, end: 2022 },
        ],
      },
      {
        name: 'Creta',
        bodyType: 'Crossover',
        versions: ['Feel', 'N Line', 'Executive'],
        engines: [engine('1.5', 'Gasolina', 1497, 115, 'CVT', 'FWD')],
        generations: [{ name: '2ª generación (SU2)', start: 2021, end: 2024 }],
      },
    ],
  },
  {
    name: 'Kia',
    country: 'Corea del Sur',
    models: [
      {
        name: 'Sportage',
        bodyType: 'SUV',
        versions: ['LX', 'EX', 'SX', 'X-Line'],
        engines: [
          engine('2.0 Diésel', 'Diésel', 1997, 186, 'Automática', 'AWD'),
          engine('1.6 T-GDi', 'Gasolina', 1598, 177, 'DCT', 'FWD'),
        ],
        generations: [
          { name: '5ª generación (NQ5)', start: 2021, end: 2024 },
          { name: '4ª generación (QL)', start: 2016, end: 2020 },
        ],
      },
      {
        name: 'Rio',
        bodyType: 'Hatchback',
        versions: ['L', 'EX', 'SX', 'GT-Line'],
        engines: [
          engine('1.4', 'Gasolina', 1396, 100, 'Manual'),
          engine('1.6 GDi', 'Gasolina', 1591, 123, 'Automática'),
        ],
        generations: [
          { name: '4ª generación (YB)', start: 2017, end: 2024 },
          { name: '3ª generación (UB)', start: 2011, end: 2016 },
        ],
      },
      {
        name: 'Seltos',
        bodyType: 'Crossover',
        versions: ['LX', 'EX', 'SX', 'Turbo'],
        engines: [
          engine('1.6', 'Gasolina', 1598, 130, 'CVT', 'FWD'),
          engine('1.6 T-GDi', 'Gasolina', 1598, 175, 'DCT', 'AWD'),
        ],
        generations: [{ name: '1ª generación (SP2)', start: 2020, end: 2024 }],
      },
      {
        name: 'Sorento',
        bodyType: 'SUV',
        versions: ['LX', 'EX', 'SX', 'Diesel'],
        engines: [
          engine('2.2 Diésel', 'Diésel', 2151, 202, 'Automática', 'AWD'),
          engine('2.5 Turbo', 'Gasolina', 2497, 281, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '4ª generación (MQ4)', start: 2020, end: 2024 },
          { name: '3ª generación (UM)', start: 2015, end: 2019 },
        ],
      },
    ],
  },
  {
    name: 'Honda',
    country: 'Japón',
    models: [
      {
        name: 'Civic',
        bodyType: 'Sedán',
        versions: ['LX', 'Sport', 'EX', 'Touring'],
        engines: [
          engine('1.5 Turbo', 'Gasolina', 1498, 182, 'CVT'),
          engine('2.0', 'Gasolina', 1996, 158, 'CVT'),
        ],
        generations: [
          { name: '11ª generación (FE)', start: 2022, end: 2024 },
          { name: '10ª generación (FC)', start: 2016, end: 2021 },
        ],
      },
      {
        name: 'CR-V',
        bodyType: 'SUV',
        versions: ['LX', 'Sport', 'EX-L', 'Touring'],
        engines: [
          engine('1.5 Turbo', 'Gasolina', 1498, 190, 'CVT', 'AWD'),
          engine('2.0 Híbrido', 'Híbrido', 1997, 184, 'e-CVT', 'AWD'),
        ],
        generations: [
          { name: '6ª generación (RS)', start: 2023, end: 2024 },
          { name: '5ª generación (RW)', start: 2017, end: 2022 },
        ],
      },
      {
        name: 'HR-V',
        bodyType: 'Crossover',
        versions: ['LX', 'Sport', 'EX', 'Touring'],
        engines: [engine('1.5', 'Gasolina', 1497, 120, 'CVT', 'FWD')],
        generations: [
          { name: '2ª generación (RU)', start: 2022, end: 2024 },
          { name: '1ª generación (RU)', start: 2015, end: 2021 },
        ],
      },
      {
        name: 'Accord',
        bodyType: 'Sedán',
        versions: ['LX', 'Sport', 'EX-L', 'Touring'],
        engines: [
          engine('1.5 Turbo', 'Gasolina', 1498, 192, 'CVT'),
          engine('2.0 Híbrido', 'Híbrido', 1997, 204, 'e-CVT'),
        ],
        generations: [
          { name: '11ª generación (AU)', start: 2023, end: 2024 },
          { name: '10ª generación (CV2)', start: 2018, end: 2022 },
        ],
      },
    ],
  },
  {
    name: 'Mazda',
    country: 'Japón',
    models: [
      {
        name: 'Mazda 3',
        bodyType: 'Hatchback',
        versions: ['Sport', 'Grand Touring', 'Carbon Edition', 'Turbo'],
        engines: [
          engine('2.0 Skyactiv-G', 'Gasolina', 1998, 155, 'Automática', 'FWD'),
          engine('2.5 Skyactiv-G', 'Gasolina', 2488, 191, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '4ª generación (BP)', start: 2019, end: 2024 },
          { name: '3ª generación (BM)', start: 2014, end: 2018 },
        ],
      },
      {
        name: 'CX-5',
        bodyType: 'SUV',
        versions: ['Sport', 'Touring', 'Grand Touring', 'Signature'],
        engines: [
          engine('2.5 Skyactiv-G', 'Gasolina', 2488, 187, 'Automática', 'AWD'),
          engine('2.2 Skyactiv-D', 'Diésel', 2191, 184, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '2ª generación (KF)', start: 2017, end: 2024 },
          { name: '1ª generación (KE)', start: 2012, end: 2016 },
        ],
      },
      {
        name: 'CX-30',
        bodyType: 'Crossover',
        versions: ['Sport', 'Touring', 'Grand Touring', 'Turbo'],
        engines: [engine('2.5 Skyactiv-G', 'Gasolina', 2488, 187, 'Automática', 'AWD')],
        generations: [{ name: '1ª generación (DL)', start: 2020, end: 2024 }],
      },
      {
        name: 'Mazda CX-9',
        bodyType: 'Minivan',
        versions: ['Sport', 'Touring', 'Grand Touring', 'Signature'],
        engines: [engine('2.5 Turbo', 'Gasolina', 2488, 250, 'Automática', 'AWD')],
        generations: [{ name: '2ª generación (JL)', start: 2016, end: 2023 }],
      },
    ],
  },
  {
    name: 'Subaru',
    country: 'Japón',
    models: [
      {
        name: 'Forester',
        bodyType: 'SUV',
        versions: ['Base', 'Premium', 'Limited', 'Touring'],
        engines: [
          engine('2.0 Boxer', 'Gasolina', 1995, 156, 'CVT', 'AWD'),
          engine('2.5 Boxer', 'Gasolina', 2498, 182, 'CVT', 'AWD'),
        ],
        generations: [
          { name: '5ª generación (SK)', start: 2019, end: 2024 },
          { name: '4ª generación (SJ)', start: 2013, end: 2018 },
        ],
      },
      {
        name: 'Outback',
        bodyType: 'Wagon',
        versions: ['Base', 'Premium', 'Limited', 'Touring'],
        engines: [
          engine('2.5 Boxer', 'Gasolina', 2498, 182, 'CVT', 'AWD'),
          engine('2.4 Turbo Boxer', 'Gasolina', 2387, 260, 'CVT', 'AWD'),
        ],
        generations: [
          { name: '6ª generación (BT)', start: 2020, end: 2024 },
          { name: '5ª generación (BS)', start: 2015, end: 2019 },
        ],
      },
      {
        name: 'Impreza',
        bodyType: 'Hatchback',
        versions: ['Base', 'Premium', 'Limited', 'RS'],
        engines: [engine('2.0 Boxer', 'Gasolina', 1995, 152, 'CVT', 'AWD')],
        generations: [
          { name: '7ª generación (GU)', start: 2023, end: 2024 },
          { name: '6ª generación (GK)', start: 2017, end: 2022 },
        ],
      },
    ],
  },
  {
    name: 'Mitsubishi',
    country: 'Japón',
    models: [
      {
        name: 'L200',
        bodyType: 'Pickup',
        versions: ['GL', 'GLX', 'Rockford', 'Diésel'],
        engines: [
          engine('2.4 Diésel', 'Diésel', 2477, 181, 'Manual', '4x4'),
          engine('2.4 Diésel Auto', 'Diésel', 2477, 181, 'Automática', '4x4'),
        ],
        generations: [
          { name: '5ª generación (QK)', start: 2015, end: 2024 },
          { name: '4ª generación (MN)', start: 2006, end: 2014 },
        ],
      },
      {
        name: 'Outlander',
        bodyType: 'SUV',
        versions: ['ES', 'LS', 'Exceed', 'Ultimate'],
        engines: [
          engine('2.4 MIVEC', 'Gasolina', 2360, 167, 'CVT', 'FWD'),
          engine('2.2 Di-D', 'Diésel', 2268, 150, 'Automática', '4x4'),
        ],
        generations: [
          { name: '4ª generación (GY)', start: 2021, end: 2024 },
          { name: '3ª generación (GF)', start: 2013, end: 2020 },
        ],
      },
      {
        name: 'ASX',
        bodyType: 'Crossover',
        versions: ['Intense', 'Instyle', 'Ultimate'],
        engines: [engine('1.6 MIVEC', 'Gasolina', 1590, 117, 'CVT', 'FWD')],
        generations: [{ name: '1ª generación (GA)', start: 2010, end: 2022 }],
      },
    ],
  },
  {
    name: 'Peugeot',
    country: 'Francia',
    models: [
      {
        name: '208',
        bodyType: 'Hatchback',
        versions: ['Active', 'Allure', 'GT Line', 'GT'],
        engines: [
          engine('1.2 PureTech', 'Gasolina', 1199, 130, 'Automática'),
          engine('1.5 BlueHDi', 'Diésel', 1499, 100, 'Manual'),
        ],
        generations: [
          { name: '2ª generación (P21)', start: 2019, end: 2024 },
          { name: '1ª generación (P21)', start: 2012, end: 2018 },
        ],
      },
      {
        name: '2008',
        bodyType: 'Crossover',
        versions: ['Active', 'Allure', 'GT Line', 'GT'],
        engines: [
          engine('1.2 PureTech', 'Gasolina', 1199, 130, 'Automática', 'FWD'),
          engine('1.5 BlueHDi', 'Diésel', 1499, 110, 'Manual', 'FWD'),
        ],
        generations: [
          { name: '2ª generación (P24)', start: 2020, end: 2024 },
          { name: '1ª generación (P24)', start: 2013, end: 2019 },
        ],
      },
      {
        name: '3008',
        bodyType: 'SUV',
        versions: ['Active', 'Allure', 'GT Line', 'GT'],
        engines: [
          engine('1.6 THP', 'Gasolina', 1598, 180, 'Automática', 'FWD'),
          engine('1.5 BlueHDi', 'Diésel', 1499, 130, 'Automática', 'FWD'),
        ],
        generations: [
          { name: '2ª generación (P24)', start: 2017, end: 2024 },
          { name: '1ª generación (P07)', start: 2009, end: 2016 },
        ],
      },
    ],
  },
  {
    name: 'Renault',
    country: 'Francia',
    models: [
      {
        name: 'Duster',
        bodyType: 'Crossover',
        versions: ['Authentique', 'Expression', 'Intens', 'Joule'],
        engines: [
          engine('1.6 SCe', 'Gasolina', 1598, 114, 'Manual', 'FWD'),
          engine('1.5 Blue dCi', 'Diésel', 1461, 115, 'Manual', '4x4'),
        ],
        generations: [
          { name: '2ª generación (HD)', start: 2018, end: 2024 },
          { name: '1ª generación (HS)', start: 2010, end: 2017 },
        ],
      },
      {
        name: 'Logan',
        bodyType: 'Sedán',
        versions: ['Essence', 'Intens', 'Edition'],
        engines: [
          engine('1.6 SCe', 'Gasolina', 1598, 114, 'Manual'),
          engine('0.9 TCe', 'Gasolina', 898, 90, 'Manual'),
        ],
        generations: [
          { name: '2ª generación (JB)', start: 2013, end: 2021 },
          { name: '1ª generación (X76)', start: 2004, end: 2012 },
        ],
      },
      {
        name: 'Captur',
        bodyType: 'Crossover',
        versions: ['Life', 'Intens', 'S Edition', 'RS Line'],
        engines: [
          engine('1.3 TCe', 'Gasolina', 1332, 140, 'Manual', 'FWD'),
          engine('1.5 Blue dCi', 'Diésel', 1461, 115, 'Manual', 'FWD'),
        ],
        generations: [
          { name: '2ª generación (JA)', start: 2020, end: 2024 },
          { name: '1ª generación (FJ)', start: 2013, end: 2019 },
        ],
      },
    ],
  },
  {
    name: 'Fiat',
    country: 'Italia',
    models: [
      {
        name: 'Toro',
        bodyType: 'Pickup',
        versions: ['Freedom', 'Sport', 'Limited', 'Volcano'],
        engines: [
          engine('1.3 T270 Flex', 'Flex', 1299, 109, 'Automática', 'FWD'),
          engine('1.3 T270 Turbo', 'Gasolina', 1299, 139, 'Automática', 'FWD'),
        ],
        generations: [
          { name: '1ª generación (332)', start: 2016, end: 2024 },
        ],
      },
      {
        name: 'Argo',
        bodyType: 'Hatchback',
        versions: ['Drive', 'Drive Way', 'Hobby', 'Precision'],
        engines: [engine('1.3 Fire', 'Flex', 1299, 99, 'Manual', 'FWD')],
        generations: [{ name: '1ª generación (332)', start: 2017, end: 2024 }],
      },
      {
        name: 'Pulse',
        bodyType: 'Crossover',
        versions: ['Impres', 'Drive', 'Abarth'],
        engines: [engine('1.3 T270 Flex', 'Flex', 1299, 109, 'CVT', 'FWD')],
        generations: [{ name: '1ª generación (334)', start: 2021, end: 2024 }],
      },
    ],
  },
  {
    name: 'Jeep',
    country: 'Estados Unidos',
    models: [
      {
        name: 'Renegade',
        bodyType: 'Crossover',
        versions: ['Sport', 'Longitude', 'Limited', 'Trailhawk'],
        engines: [
          engine('1.3 T4 Turbo', 'Gasolina', 1332, 180, 'Automática', 'AWD'),
          engine('1.6 MultiJet', 'Diésel', 1598, 120, 'Manual', 'FWD'),
        ],
        generations: [{ name: '1ª generación (BU)', start: 2015, end: 2024 }],
      },
      {
        name: 'Compass',
        bodyType: 'Crossover',
        versions: ['Sport', 'Longitude', 'Limited', 'Trailhawk'],
        engines: [
          engine('1.3 T4 Turbo', 'Gasolina', 1332, 150, 'Automática', 'AWD'),
          engine('1.3 PHEV', 'Híbrido', 1332, 190, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '2ª generación (MP)', start: 2017, end: 2024 },
          { name: '1ª generación (MK)', start: 2006, end: 2016 },
        ],
      },
      {
        name: 'Wrangler',
        bodyType: 'SUV',
        versions: ['Sport', 'Sahara', 'Rubicon', '392'],
        engines: [
          engine('3.6 V6 Pentastar', 'Gasolina', 3604, 284, 'Manual', '4x4'),
          engine('2.0 Turbo', 'Gasolina', 1998, 270, 'Automática', '4x4'),
        ],
        generations: [
          { name: '4ª generación (JL)', start: 2018, end: 2024 },
          { name: '3ª generación (JK)', start: 2007, end: 2017 },
        ],
      },
    ],
  },
  {
    name: 'Volvo',
    country: 'Suecia',
    models: [
      {
        name: 'XC60',
        bodyType: 'SUV',
        versions: ['Momentum', 'Inscription', 'R-Design', 'Polestar'],
        engines: [
          engine('2.0 T5', 'Gasolina', 1968, 250, 'Automática', 'AWD'),
          engine('2.0 D4', 'Diésel', 1969, 190, 'Automática', 'AWD'),
        ],
        generations: [
          { name: '2ª generación (Y220)', start: 2017, end: 2024 },
          { name: '1ª generación (Y250)', start: 2009, end: 2017 },
        ],
      },
      {
        name: 'XC90',
        bodyType: 'SUV',
        versions: ['Momentum', 'Inscription', 'R-Design', 'T8'],
        engines: [
          engine('2.0 T6', 'Gasolina', 1968, 320, 'Automática', 'AWD'),
          engine('2.0 T8 PHEV', 'Híbrido', 1968, 407, 'Automática', 'AWD'),
        ],
        generations: [{ name: '2ª generación (SPA)', start: 2015, end: 2024 }],
      },
      {
        name: 'XC40',
        bodyType: 'Crossover',
        versions: ['Momentum', 'R-Design', 'Inscription', 'Recharge'],
        engines: [
          engine('2.0 T3', 'Gasolina', 1968, 163, 'Automática', 'FWD'),
          engine('Recharge P8', 'Eléctrico', 0, 408, 'Automática', 'AWD'),
        ],
        generations: [{ name: '1ª generación (V415)', start: 2018, end: 2024 }],
      },
    ],
  },
  {
    name: 'Tesla',
    country: 'Estados Unidos',
    models: [
      {
        name: 'Model 3',
        bodyType: 'Sedán',
        versions: ['Standard Range', 'Long Range', 'Performance'],
        engines: [engine('Eléctrico RWD', 'Eléctrico', 0, 283, 'Automática', 'RWD')],
        generations: [
          { name: '2ª generación (Highland)', start: 2024, end: 2024 },
          { name: '1ª generación', start: 2017, end: 2023 },
        ],
      },
      {
        name: 'Model Y',
        bodyType: 'Crossover',
        versions: ['Standard Range', 'Long Range', 'Performance'],
        engines: [
          engine('Eléctrico AWD', 'Eléctrico', 0, 351, 'Automática', 'AWD'),
          engine('Eléctrico RWD', 'Eléctrico', 0, 299, 'Automática', 'RWD'),
        ],
        generations: [{ name: '1ª generación', start: 2020, end: 2024 }],
      },
      {
        name: 'Model S',
        bodyType: 'Sedán',
        versions: ['Long Range', 'Plaid'],
        engines: [engine('Eléctrico AWD', 'Eléctrico', 0, 447, 'Automática', 'AWD')],
        generations: [
          { name: 'Refresh (Palladium)', start: 2021, end: 2024 },
          { name: '1ª generación', start: 2012, end: 2020 },
        ],
      },
    ],
  },
];
