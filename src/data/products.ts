/** Plantillas de productos de demostración (catálogo real de accesorios). */

export interface ProductTemplate {
  name: string;
  category: string;
  brand: string;
  price: number;
  promotionalPrice?: number;
  stock: number;
  description: string;
  specs: Array<{ label: string; value: string }>;
  tags: string[];
  installation: string;
  /** Filtros de compatibilidad: marcas + modelos + rango de años. */
  fit?: { brands?: string[]; models?: string[]; from?: number; to?: number };
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    name: 'Pantalla multimedia 10.1" Android 13',
    category: 'Pantallas',
    brand: 'Pioneer',
    price: 349,
    promotionalPrice: 299,
    stock: 24,
    description:
      'Pantalla táctil IPS de 10.1 pulgadas con Android 13, GPS integrado, Bluetooth, salida RCA y soporte para cámara de reversa. Incluye marco de instalación para la mayoría de vehículos.',
    specs: [
      { label: 'Pantalla', value: '10.1" IPS 1280x720' },
      { label: 'Sistema', value: 'Android 13' },
      { label: 'Memoria', value: '4GB RAM / 64GB ROM' },
      { label: 'Conectividad', value: 'Wi-Fi, Bluetooth 5.0, USB' },
    ],
    tags: ['multimedia', 'pantalla', 'android'],
    installation: 'Instalación profesional recomendada (60-90 min). Requiere marco adaptador específico del vehículo.',
    fit: { brands: ['Toyota', 'Ford', 'Chevrolet', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia'], from: 2015, to: 2024 },
  },
  {
    name: 'Pantalla multimedia 9" con CarPlay y Android Auto',
    category: 'Multimedia',
    brand: 'Sony',
    price: 429,
    stock: 12,
    description:
      'Receptor multimedia de 9 pulgadas con Apple CarPlay y Android Auto inalámricos, pantalla táctil capacitiva y ecualizador de 10 bandas.',
    specs: [
      { label: 'Pantalla', value: '9" táctil capacitiva' },
      { label: 'CarPlay', value: 'Inalámbrico' },
      { label: 'Android Auto', value: 'Inalámbrico' },
      { label: 'Salida', value: '4 x 55W' },
    ],
    tags: ['carplay', 'android auto', 'multimedia'],
    installation: 'Instalación estándar de 1 DIN / 2 DIN con arnés específico.',
    fit: { brands: ['Toyota', 'Honda', 'Mazda', 'Ford', 'Chevrolet'], from: 2016, to: 2024 },
  },
  {
    name: 'Kit multimedia OEM 8" con navegación',
    category: 'Multimedia',
    brand: 'Denso',
    price: 690,
    stock: 4,
    description:
      'Unidad multimedia originalista con navegación por satélite, radio FM/AM, Bluetooth y controles al volante.',
    specs: [
      { label: 'Pantalla', value: '8" táctil' },
      { label: 'Navegación', value: 'GPS con mapas de Latinoamérica' },
      { label: 'Controles', value: 'Compatible con volante multifunción' },
    ],
    tags: ['navegacion', 'oem'],
    installation: 'Compatible con arnés OEM. Requiere codificación en algunos modelos.',
    fit: { brands: ['Toyota', 'Nissan', 'Volkswagen'], from: 2018, to: 2024 },
  },
  {
    name: 'Radio digital 1 DIN Bluetooth USB',
    category: 'Radios',
    brand: 'Kenwood',
    price: 119,
    stock: 42,
    description:
      'Radio digital con Bluetooth, entrada USB, AUX y pantalla LED. Compatible con controles al volante mediante interfaz.',
    specs: [
      { label: 'Formato', value: '1 DIN' },
      { label: 'Bluetooth', value: 'Llamadas y streaming' },
      { label: 'USB', value: 'Carga y reproducción' },
    ],
    tags: ['radio', 'bluetooth'],
    installation: 'Instalación directa con arnés ISO.',
  },
  {
    name: 'Receptor Apple CarPlay inalámbrico',
    category: 'Apple CarPlay',
    brand: 'Carlinkit',
    price: 149,
    promotionalPrice: 129,
    stock: 33,
    description:
      'Adaptador que habilita Apple CarPlay inalámbrico en vehículos con CarPlay por cable. Plug & Play, sin pérdida de funciones.',
    specs: [
      { label: 'Conexión', value: 'USB / Wi-Fi 5GHz' },
      { label: 'Latencia', value: '< 1s' },
      { label: 'Compatibilidad', value: 'iOS 10 en adelante' },
    ],
    tags: ['carplay', 'apple'],
    installation: 'Conexión directa al puerto USB del vehículo. Sin instalación eléctrica.',
    fit: { from: 2017, to: 2024 },
  },
  {
    name: 'Módulo Android Auto inalámbrico',
    category: 'Android Auto',
    brand: 'Motorola',
    price: 139,
    stock: 27,
    description:
      'Módulo que convierte Android Auto por cable en inalámbrico con conexión automática al encender el vehículo.',
    specs: [
      { label: 'Conexión', value: 'USB + Wi-Fi dual band' },
      { label: 'Compatibilidad', value: 'Android 8.0+' },
    ],
    tags: ['android auto', 'conectividad'],
    installation: 'Plug & Play sobre el puerto USB original.',
    fit: { from: 2017, to: 2024 },
  },
  {
    name: 'Cámara de retroceso Full HD 1080p',
    category: 'Cámaras',
    brand: 'Auto-Vox',
    price: 79,
    promotionalPrice: 65,
    stock: 58,
    description:
      'Cámara de reversa con sensor de imagen CMOS 1080p, visión nocturna y guías de estacionamiento. Resistente al agua IP68.',
    specs: [
      { label: 'Resolución', value: '1920x1080' },
      { label: 'Ángulo', value: '150°' },
      { label: 'Protección', value: 'IP68' },
    ],
    tags: ['camara', 'seguridad'],
    installation: 'Requiere cableado hasta la pantalla y conexión a luz de reversa.',
    fit: { from: 2012, to: 2024 },
  },
  {
    name: 'Cámara 360° con visión de pájaro',
    category: 'Cámaras',
    brand: 'DOD',
    price: 549,
    stock: 6,
    description:
      'Sistema de 4 cámaras con procesamiento 360° y vista cenital, monitor de 7" incluido y detección de peatones.',
    specs: [
      { label: 'Cámaras', value: '4 x 1080p' },
      { label: 'Monitor', value: '7" AHD' },
      { label: 'Funciones', value: 'Vista 360°, líneas dinámicas' },
    ],
    tags: ['camara', '360', 'seguridad'],
    installation: 'Instalación profesional: 3-4 horas. Requiere perforación de 4 soportes.',
    fit: { brands: ['Toyota', 'Ford', 'Chevrolet', 'BMW'], from: 2015, to: 2024 },
  },
  {
    name: 'Sensores de estacionamiento traseros x4',
    category: 'Sensores de estacionamiento',
    brand: 'Bosch',
    price: 99,
    stock: 45,
    description:
      'Kit de 4 sensores de estacionamiento con alerta sonora progresiva y display LED. Sensor ultrasonico Bosch original.',
    specs: [
      { label: 'Sensores', value: '4 ultrasonicos' },
      { label: 'Alcance', value: '0.3 - 2.5 m' },
      { label: 'Display', value: 'LED con zonas' },
    ],
    tags: ['sensores', 'estacionamiento'],
    installation: 'Requiere perforación del paragolpes y pintado de sensores.',
    fit: { from: 2010, to: 2024 },
  },
  {
    name: 'Sensor de estacionamiento delantero y trasero',
    category: 'Sensores',
    brand: 'Valeo',
    price: 159,
    stock: 18,
    description:
      'Sistema completo de asistencia con 8 sensores, alarma sonora dual y modo automático de activación.',
    specs: [
      { label: 'Sensores', value: '8 (4 del. + 4 tras.)' },
      { label: 'Alcance', value: '0.2 - 3.0 m' },
      { label: 'Fuente', value: '12V' },
    ],
    tags: ['sensores', 'asistencia'],
    installation: 'Instalación profesional con cableado al paragolpes.',
    fit: { from: 2012, to: 2024 },
  },
  {
    name: 'GPS automotriz 7" con mapas de por vida',
    category: 'GPS',
    brand: 'Garmin',
    price: 189,
    stock: 21,
    description:
      'Navegador GPS con pantalla de 7", mapas actualizados de por vida, alertas de radares y tráfico en tiempo real.',
    specs: [
      { label: 'Pantalla', value: '7" antirreflejo' },
      { label: 'Mapas', value: 'América Latina de por vida' },
      { label: 'Alertas', value: 'Radares y tráfico' },
    ],
    tags: ['gps', 'navegacion'],
    installation: 'Soporte de parabrisas incluido. Alimentación por encendedor.',
  },
  {
    name: 'Alarma antiderrape con inmovilizador',
    category: 'Alarmas',
    brand: 'Clifford',
    price: 249,
    stock: 14,
    description:
      'Sistema de seguridad con sensor de impacto, inclinación y movimiento, mando bidireccional con pantalla LCD y corte de arranque.',
    specs: [
      { label: 'Sensores', value: 'Impacto + inclinación + movimiento' },
      { label: 'Mando', value: 'Bidireccional LCD' },
      { label: 'Corte', value: 'Relay de inmovilización' },
    ],
    tags: ['alarma', 'seguridad'],
    installation: 'Instalación profesional con cableado al tablero (2-3 horas).',
    fit: { from: 2010, to: 2024 },
  },
  {
    name: 'Alarma con arranque remoto y app móvil',
    category: 'Alarmas',
    brand: 'Compustar',
    price: 479,
    promotionalPrice: 429,
    stock: 5,
    description:
      'Alarma premium con arranque remoto, seguimiento por GPS y control desde aplicación móvil iOS/Android.',
    specs: [
      { label: 'Alcance', value: 'Ilimitado vía app' },
      { label: 'Arranque', value: 'Remoto programable' },
      { label: 'GPS', value: 'Seguimiento en tiempo real' },
    ],
    tags: ['alarma', 'gps', 'app'],
    installation: 'Instalación profesional obligatoria. Incluye módulo de relés.',
    fit: { from: 2014, to: 2024 },
  },
  {
    name: 'Bloqueador de volante blindado',
    category: 'Seguridad',
    brand: 'Stoplock',
    price: 69,
    stock: 37,
    description:
      'Traba de volante de acero templado con llave, visible desde el exterior como elemento disuasorio.',
    specs: [
      { label: 'Material', value: 'Acero templado' },
      { label: 'Llave', value: 'Cilindro de seguridad' },
    ],
    tags: ['seguridad', 'antirobo'],
    installation: 'Colocación manual en segundos.',
  },
  {
    name: 'Kit de luces LED interiores 8 piezas RGB',
    category: 'Iluminación',
    brand: 'Govee',
    price: 59,
    promotionalPrice: 49,
    stock: 62,
    description:
      'Tira LED RGB con 8 zonas, control por app, música sincronizada y 16 millones de colores.',
    specs: [
      { label: 'Color', value: 'RGB 16M' },
      { label: 'Control', value: 'App + mando' },
      { label: 'Zonas', value: '8' },
    ],
    tags: ['led', 'interior', 'rgb'],
    installation: 'Adhesivo 3M y conexión al encendedor 12V.',
  },
  {
    name: 'Luces LED faros H4 6000K',
    category: 'Luces LED',
    brand: 'Philips',
    price: 89,
    stock: 48,
    description:
      'Par de bombillas LED H4 de última generación con disipador de aluminio, 120% más luminosidad y sin deslumbramiento.',
    specs: [
      { label: 'Tipo', value: 'H4' },
      { label: 'Temperatura', value: '6000K blanco puro' },
      { label: 'Luminosidad', value: '+120%' },
    ],
    tags: ['led', 'focos'],
    installation: 'Cambio directo, sin codificación.',
    fit: { from: 2008, to: 2024 },
  },
  {
    name: 'Faros delanteros LED DRL OEM',
    category: 'Faros',
    brand: 'Depo',
    price: 389,
    stock: 9,
    description:
      'Conjunto de faros LED con daytime running lights, homologación y conexión directa al arnés original.',
    specs: [
      { label: 'Tecnología', value: 'LED + DRL' },
      { label: 'Homologación', value: 'DOT / SAE' },
      { label: 'Incluye', value: 'Par (izq. + der.)' },
    ],
    tags: ['faros', 'led', 'drl'],
    installation: 'Reemplazo directo del conjunto original.',
    fit: { brands: ['Toyota', 'Ford', 'Chevrolet'], from: 2016, to: 2023 },
  },
  {
    name: 'Alfombrillas de caucho premium 5 piezas',
    category: 'Accesorios interiores',
    brand: 'WeatherTech',
    price: 159,
    stock: 26,
    description:
      'Alfombrillas moldeadas a medida en caucho termoplástico, contienen agua, barro y arena. Fácil limpieza.',
    specs: [
      { label: 'Material', value: 'TPE de alta resistencia' },
      { label: 'Piezas', value: '5 (4 + maletero)' },
      { label: 'Ajuste', value: 'Moldeado a medida' },
    ],
    tags: ['interior', 'alfombrillas'],
    installation: 'Colocación directa sin anclajes.',
    fit: { from: 2015, to: 2024 },
  },
  {
    name: 'Fundas de asiento en cuero sintético',
    category: 'Accesorios interiores',
    brand: 'Katzkin',
    price: 329,
    stock: 11,
    description:
      'Set de fundas de cuero sintético perforado con costuras reforzadas, incluye cojines de cabeza y herrajes.',
    specs: [
      { label: 'Material', value: 'Cuero sintético perforado' },
      { label: 'Piezas', value: 'Set completo 5 asientos' },
      { label: 'Color', value: 'Negro con costura roja' },
    ],
    tags: ['interior', 'asientos'],
    installation: 'Instalación profesional (2-3 horas).',
    fit: { from: 2014, to: 2024 },
  },
  {
    name: 'Soporte de teléfono magnético de ventilación',
    category: 'Accesorios interiores',
    brand: 'Spigen',
    price: 24,
    stock: 120,
    description:
      'Soporte magnético con anillo MagSafe, rotación 360° y fijación estable en la rejilla del aire acondicionado.',
    specs: [
      { label: 'Imán', value: 'N52 con MagSafe' },
      { label: 'Rotación', value: '360°' },
    ],
    tags: ['interior', 'soporte'],
    installation: 'Sin instalación: se coloca en la rejilla.',
  },
  {
    name: 'Defensas laterales de acero inoxidable',
    category: 'Accesorios exteriores',
    brand: 'Go Rhino',
    price: 459,
    stock: 7,
    description:
      'Defensas laterales en acero inoxidable con acabado espejo, resistente a la corrosión y a la intemperie.',
    specs: [
      { label: 'Material', value: 'Acero inoxidable 304' },
      { label: 'Acabado', value: 'Espejo pulido' },
      { label: 'Incluye', value: 'Par + herrajes' },
    ],
    tags: ['exterior', 'defensas'],
    installation: 'Montaje sobre puntos originales de la carrocería.',
    fit: { brands: ['Toyota', 'Ford', 'Chevrolet', 'Nissan'], models: ['Hilux', 'Ranger', 'S10', 'Navara'], from: 2016, to: 2024 },
  },
  {
    name: 'Escalera de techo rack aluminio',
    category: 'Accesorios exteriores',
    brand: 'Thule',
    price: 549,
    stock: 8,
    description:
      'Base de techo en aluminio con canales de carga, compatible con baca, bicicletas y cajones de carga.',
    specs: [
      { label: 'Material', value: 'Aluminio anodizado' },
      { label: 'Carga útil', value: '75 kg' },
      { label: 'Medidas', value: '135 x 118 cm' },
    ],
    tags: ['exterior', 'techo'],
    installation: 'Fijación a puntos de techo originales.',
    fit: { from: 2015, to: 2024 },
  },
  {
    name: 'Kit de parlantes 6.5" componentes 2 vías',
    category: 'Parlantes',
    brand: 'JBL',
    price: 189,
    stock: 31,
    description:
      'Kit de parlantes componentes con tweeters separados, cono de polipropileno y imanes de neodimio. 400W RMS.',
    specs: [
      { label: 'Tamaño', value: '6.5" (165 mm)' },
      { label: 'Potencia', value: '400W max / 100W RMS' },
      { label: 'Componentes', value: 'Midbass + tweeter' },
    ],
    tags: ['audio', 'parlantes'],
    installation: 'Reemplazo directo con adaptadores de anillo.',
    fit: { from: 2010, to: 2024 },
  },
  {
    name: 'Parlantes traseros coaxiales 6x9"',
    category: 'Audio',
    brand: 'Pioneer',
    price: 149,
    stock: 22,
    description:
      'Parlantes coaxiales de 4 vías con tweeter de seda y woofer de fibra de vidrio. Ideal para amplificación.',
    specs: [
      { label: 'Tamaño', value: '6x9" (15x23 cm)' },
      { label: 'Potencia', value: '350W max / 80W RMS' },
      { label: 'Vías', value: '4' },
    ],
    tags: ['audio', 'parlantes', 'coaxial'],
    installation: 'Compatible con huecos originales de las puertas traseras.',
    fit: { from: 2010, to: 2024 },
  },
  {
    name: 'Subwoofer activo 10" bajo asiento',
    category: 'Subwoofers',
    brand: 'Rockford Fosgate',
    price: 279,
    stock: 10,
    description:
      'Subwoofer activo compacto de 10" con amplificador integrado de 250W, ajuste de ganancia y filtro infrasonic.',
    specs: [
      { label: 'Tamaño', value: '10" activo' },
      { label: 'Potencia', value: '250W RMS' },
      { label: 'Montaje', value: 'Bajo asiento' },
    ],
    tags: ['subwoofer', 'audio'],
    installation: 'Conexión a línea de salida RCA y alimentación 12V.',
    fit: { from: 2012, to: 2024 },
  },
  {
    name: 'Subwoofer cajón banda 12" 600W',
    category: 'Subwoofers',
    brand: 'Kicker',
    price: 219,
    promotionalPrice: 189,
    stock: 13,
    description:
      'Cajón de banda sellado con subwoofer de 12 pulgadas, diseño slim que conserva el maletero.',
    specs: [
      { label: 'Tamaño', value: '12"' },
      { label: 'Potencia', value: '600W max' },
      { label: 'Diseño', value: 'Slim sealed' },
    ],
    tags: ['subwoofer', 'cajon'],
    installation: 'Fijación al piso del maletero + cableado de alimentación.',
  },
  {
    name: 'Amplificador 4 canales 1200W',
    category: 'Amplificadores',
    brand: 'Alpine',
    price: 389,
    stock: 6,
    description:
      'Amplificador Class D de 4 canales con crossovers ajustables, entrada de nivel alto y protección térmica.',
    specs: [
      { label: 'Canales', value: '4' },
      { label: 'Potencia', value: '1200W RMS' },
      { label: 'Clase', value: 'Class D' },
    ],
    tags: ['amplificador', 'audio'],
    installation: 'Montaje bajo asiento o maletero. Requiere cableado de 4 gauge.',
  },
  {
    name: 'Amplificador mono 1500W para subwoofer',
    category: 'Amplificadores',
    brand: 'Kicker',
    price: 329,
    stock: 9,
    description:
      'Amplificador mono clase D de 1500W con control de subsonic, boost de 45Hz y limitador de señal.',
    specs: [
      { label: 'Canales', value: 'Mono' },
      { label: 'Potencia', value: '1500W RMS @ 2Ω' },
      { label: 'Clase', value: 'Class D' },
    ],
    tags: ['amplificador', 'subwoofer'],
    installation: 'Montaje en maletero con cableado de alta capacidad.',
  },
  {
    name: 'Módulo Bluetooth para audio OEM',
    category: 'Conectividad',
    brand: 'Grom Audio',
    price: 169,
    stock: 19,
    description:
      'Interfaz que añade Bluetooth, USB y AUX al sistema de audio original manteniendo controles al volante.',
    specs: [
      { label: 'Audio', value: 'AptX HD / SBC' },
      { label: 'Puertos', value: 'USB + AUX' },
      { label: 'Control', value: 'Volante y panel original' },
    ],
    tags: ['bluetooth', 'conectividad', 'oem'],
    installation: 'Conexión al conector CD changer original. Plug & Play.',
    fit: { from: 2012, to: 2022 },
  },
  {
    name: 'Cargador inalámbrico MagSafe 15W',
    category: 'Conectividad',
    brand: 'Belkin',
    price: 79,
    stock: 40,
    description:
      'Base de carga inalámbrica Qi2/MagSafe de 15W con soporte de ventilación y disipación térmica.',
    specs: [
      { label: 'Potencia', value: '15W Qi2' },
      { label: 'Compatibilidad', value: 'iPhone 12+, Android Qi' },
    ],
    tags: ['carga', 'inalambrico'],
    installation: 'Fijación en rejilla o soporte adhesivo.',
  },
  {
    name: 'Harnés universal ISO 16 pines',
    category: 'Accesorios eléctricos',
    brand: 'Metra',
    price: 19,
    stock: 150,
    description:
      'Adaptador de arnés universal ISO para radios aftermarket con fusible integrado y codificación de permanentes.',
    specs: [
      { label: 'Conectores', value: 'ISO 16 + 16' },
      { label: 'Fusible', value: '10A integrado' },
    ],
    tags: ['arnes', 'electrico'],
    installation: 'Conexión directa sin corte de cables originales.',
  },
  {
    name: 'Relay universal de arranque 12V 30A',
    category: 'Accesorios eléctricos',
    brand: 'Bosch',
    price: 14,
    stock: 88,
    description:
      'Relay automotriz universal de 5 pines 12V 30A para luces, alarmas y sistemas de arranque remoto.',
    specs: [
      { label: 'Pines', value: '5' },
      { label: 'Voltaje', value: '12V DC' },
      { label: 'Corriente', value: '30A' },
    ],
    tags: ['relay', 'electrico'],
    installation: 'Montaje sobre soporte de relay existente.',
  },
  {
    name: 'Cable de extensión de cámara RCA 6m',
    category: 'Cámaras',
    brand: 'Pyle',
    price: 29,
    stock: 64,
    description:
      'Cable de video RCA con detección automática de línea de reversa y conectores blindados antiinterferencias.',
    specs: [
      { label: 'Longitud', value: '6 metros' },
      { label: 'Conectores', value: 'RCA + DC 2.1' },
      { label: 'Blindaje', value: 'Doble malla' },
    ],
    tags: ['camara', 'cable'],
    installation: 'Paso de cable por gomas del chasis.',
  },
  {
    name: 'Antena tibón con base magnética',
    category: 'Otros',
    brand: 'SiriusXM',
    price: 45,
    stock: 35,
    description:
      'Antena compacta con base magnética para radio satelital o FM mejorada, cable de 3 metros.',
    specs: [
      { label: 'Tipo', value: 'Magnet base' },
      { label: 'Cable', value: '3 m' },
    ],
    tags: ['antena', 'radio'],
    installation: 'Colocación sobre techo o guarnecido.',
  },
  {
    name: 'Pedalera de aluminio deportiva 3 piezas',
    category: 'Accesorios interiores',
    brand: 'BMW M',
    price: 99,
    stock: 16,
    description:
      'Set de pedaleras de aluminio con topes antideslizantes, incluye reposapiés y ornamento de paso.',
    specs: [
      { label: 'Material', value: 'Aluminio + caucho' },
      { label: 'Piezas', value: '3' },
    ],
    tags: ['deportivo', 'interior'],
    installation: 'Sustituye las pedaleras originales con sus anclajes.',
    fit: { brands: ['BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen'], from: 2014, to: 2024 },
  },
  {
    name: 'Cortinas solares laterales magnéticas',
    category: 'Accesorios interiores',
    brand: 'Kraken Autoware',
    price: 55,
    stock: 47,
    description:
      'Cortinas solares con imanes incorporados, bloquean el 99% de rayos UV y se despliegan en segundos.',
    specs: [
      { label: 'Protección', value: 'UPF 50+' },
      { label: 'Fijación', value: 'Imanes integrados' },
      { label: 'Piezas', value: '4' },
    ],
    tags: ['solar', 'interior'],
    installation: 'Colocación manual sobre los marcos de las ventanas.',
  },
  {
    name: 'Kit de limpiaparabrisas de silicona (par)',
    category: 'Otros',
    brand: 'Bosch',
    price: 34,
    stock: 95,
    description:
      'Escobillas de limpiaparabrisas en silicona de doble banda, silenciosas y resistentes al desgaste.',
    specs: [
      { label: 'Material', value: 'Silicona natural' },
      { label: 'Medidas', value: '26" + 16"' },
    ],
    tags: ['limpiaparabrisas', 'mantenimiento'],
    installation: 'Cambio directo sin herramientas.',
    fit: { from: 2012, to: 2024 },
  },
  {
    name: 'Compresor de aire portátil 12V con manómetro',
    category: 'Otros',
    brand: 'Viair',
    price: 89,
    stock: 28,
    description:
      'Compresor portátil de 12V con manómetro digital, manguera de 3 m y corte automático por presión.',
    specs: [
      { label: 'Presión', value: '120 PSI' },
      { label: 'Alimentación', value: '12V encendedor' },
      { label: 'Corte', value: 'Automático por presión' },
    ],
    tags: ['compresor', 'emergencia'],
    installation: 'Uso directo: se conecta al encendedor.',
  },
  {
    name: 'Pantalla TFT 10.25" para tablero digital',
    category: 'Pantallas',
    brand: 'Lortex',
    price: 399,
    stock: 3,
    description:
      'Pantalla TFT de 10.25 pulgadas con reloj digital, voltaje, temperatura y monitor de consumo en tiempo real.',
    specs: [
      { label: 'Pantalla', value: '10.25" TFT' },
      { label: 'Datos', value: 'Voltaje, temp, consumo' },
      { label: 'Montaje', value: 'Tablero o parabrisas' },
    ],
    tags: ['pantalla', 'digital'],
    installation: 'Fijación con adhesivo y conexión al encendedor.',
  },
  {
    name: 'Visor solar HUD con proyección en parabrisas',
    category: 'Multimedia',
    brand: 'VLine',
    price: 129,
    promotionalPrice: 109,
    stock: 17,
    description:
      'Head-up display con proyección flotante en el parabrisas: velocidad, RPM y alertas de velocidad.',
    specs: [
      { label: 'Proyección', value: 'OBD-II / GPS' },
      { label: 'Datos', value: 'Velocidad, RPM, alertas' },
      { label: 'Pantalla', value: 'Cristal antirreflejo' },
    ],
    tags: ['hud', 'digital'],
    installation: 'Conexión OBD-II o encendedor. Colocación en tablero.',
  },
  {
    name: 'Arnés de arranque remoto T-harness',
    category: 'Accesorios eléctricos',
    brand: 'Fortin',
    price: 119,
    stock: 12,
    description:
      'Arnés T de conexión sin corte de cables para sistemas de arranque remoto, compatible con más de 3000 modelos.',
    specs: [
      { label: 'Tipo', value: 'T-Harness plug & play' },
      { label: 'Cables', value: 'Sin cortes' },
      { label: 'Compatibilidad', value: '3000+ vehículos' },
    ],
    tags: ['arnes', 'arranque remoto'],
    installation: 'Requiere programación del módulo con llave de programador.',
    fit: { from: 2015, to: 2024 },
  },
  {
    name: 'Kit de limpieza e instalación de acabados vinílicos',
    category: 'Otros',
    brand: '3M',
    price: 42,
    stock: 53,
    description:
      'Kit de herramientas para aplicación de vinilos: espátulas, rasqueta, cuchillo de precisión y líquido de aplicación.',
    specs: [
      { label: 'Piezas', value: '7 herramientas' },
      { label: 'Uso', value: 'Vinilo y películas' },
    ],
    tags: ['vinilo', 'herramientas'],
    installation: 'Uso manual.',
  },
  {
    name: 'Alarma de reversa con detector de peatones',
    category: 'Seguridad',
    brand: 'Pyle',
    price: 74,
    stock: 30,
    description:
      'Sistema de aviso de reversa con alerta sonora externa y detector de peatones con aviso interior.',
    specs: [
      { label: 'Sensor', value: 'Detector de peatones' },
      { label: 'Alerta', value: 'Bocina externa + interno' },
      { label: 'Alcance', value: '2.5 m' },
    ],
    tags: ['seguridad', 'reversa'],
    installation: 'Montaje sobre paragolpes y cableado a luz de reversa.',
    fit: { from: 2013, to: 2024 },
  },
  {
    name: 'Faros de niebla LED ambar 4 piezas',
    category: 'Iluminación',
    brand: 'Rigid Industries',
    price: 179,
    stock: 20,
    description:
      'Kit de faros auxiliares ambar de LED con patrón flood, carcasa de aluminio y montaje regulable.',
    specs: [
      { label: 'Color', value: 'Ámbar 3000K' },
      { label: 'Patrón', value: 'Flood 60°' },
      { label: 'Carcasa', value: 'Aluminio IP67' },
    ],
    tags: ['niebla', 'led', 'offroad'],
    installation: 'Montaje sobre paragolpes o barra con cableado dedicado.',
    fit: { brands: ['Jeep', 'Toyota', 'Ford', 'Chevrolet', 'Nissan'], from: 2015, to: 2024 },
  },
  {
    name: 'Interfaz de volante multifunción universal',
    category: 'Accesorios eléctricos',
    brand: 'Axxess',
    price: 69,
    stock: 25,
    description:
      'Módulo que conserva los controles al volante al instalar una radio aftermarket, con learn automático.',
    specs: [
      { label: 'Señal', value: 'Resistiva / CAN' },
      { label: 'Aprendizaje', value: 'Automático' },
      { label: 'Salidas', value: '3 wires + RGB' },
    ],
    tags: ['volante', 'interfaz'],
    installation: 'Conexión al arnés del volante. Requiere calibración por llave.',
    fit: { from: 2013, to: 2023 },
  },
  {
    name: 'Kit de sonido exterior fiesta/desfile 6 bocinas',
    category: 'Audio',
    brand: 'Vixen',
    price: 249,
    stock: 5,
    description:
      'Sistema de 6 bocinas exteriores con compresor, válvula y controlador. Sonido de hasta 118 dB.',
    specs: [
      { label: 'Bocinas', value: '6 x 6"' },
      { label: 'Presión', value: '118 dB' },
      { label: 'Fuente', value: 'Compresor 200 PSI' },
    ],
    tags: ['audio', 'exterior', 'bocinas'],
    installation: 'Instalación profesional en chasis y cabina.',
    fit: { brands: ['Chevrolet', 'Ford', 'Toyota', 'Nissan'], models: ['S10', 'Silverado', 'Ranger', 'Hilux', 'Frontier'], from: 2016, to: 2024 },
  },
];
