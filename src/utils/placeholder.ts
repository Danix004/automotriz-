/**
 * Genera imágenes SVG embebidas (data URI) para que la UI se vea
 * completa también sin conexión. Sustituibles por URLs reales.
 */

const PALETTES: Array<[string, string]> = [
  ['#2563EB', '#0EA5E9'],
  ['#7C3AED', '#DB2777'],
  ['#059669', '#22C55E'],
  ['#D97706', '#F59E0B'],
  ['#DC2626', '#F43F5E'],
  ['#0F172A', '#334155'],
  ['#0891B2', '#2563EB'],
  ['#4F46E5', '#9333EA'],
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) % 100000;
  return h;
}

function svg(content: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(content)}`;
}

/** Imagen genérica con inicial y degradado. */
export function placeholderImage(label: string, subtitle = ''): string {
  const [from, to] = PALETTES[hash(label) % PALETTES.length];
  const initial = label.trim().charAt(0).toUpperCase() || 'A';
  const safeLabel = label.length > 22 ? `${label.slice(0, 20)}…` : label;
  const safeSub = subtitle.length > 26 ? `${subtitle.slice(0, 24)}…` : subtitle;
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <circle cx="540" cy="60" r="120" fill="rgba(255,255,255,0.08)"/>
  <circle cx="80" cy="350" r="90" fill="rgba(0,0,0,0.12)"/>
  <text x="50%" y="47%" font-family="Inter,Arial" font-size="120" font-weight="800" fill="rgba(255,255,255,0.92)" text-anchor="middle">${initial}</text>
  <text x="50%" y="66%" font-family="Inter,Arial" font-size="30" font-weight="600" fill="rgba(255,255,255,0.95)" text-anchor="middle">${escapeXml(safeLabel)}</text>
  <text x="50%" y="78%" font-family="Inter,Arial" font-size="20" font-weight="400" fill="rgba(255,255,255,0.75)" text-anchor="middle">${escapeXml(safeSub)}</text>
</svg>`);
}

/** Imagen tipo vehículo (silueta de auto sobre degradado). */
export function vehiclePlaceholder(label: string, subtitle = ''): string {
  const [from, to] = PALETTES[hash(label) % PALETTES.length];
  const safeLabel = escapeXml(label);
  const safeSub = escapeXml(subtitle);
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#v)"/>
  <g opacity="0.22" fill="#ffffff">
    <path d="M150 330c0-14 8-26 22-31l52-19 46-52c10-11 25-18 41-18h130c17 0 33 7 44 20l38 44 74 15c20 4 34 21 34 41v20c0 11-9 20-20 20H170c-11 0-20-9-20-20z"/>
    <circle cx="270" cy="372" r="34"/><circle cx="600" cy="372" r="34"/>
    <circle cx="270" cy="372" r="14" fill="${to}"/><circle cx="600" cy="372" r="14" fill="${to}"/>
  </g>
  <text x="50%" y="18%" font-family="Inter,Arial" font-size="44" font-weight="800" fill="rgba(255,255,255,0.95)" text-anchor="middle">${safeLabel}</text>
  <text x="50%" y="27%" font-family="Inter,Arial" font-size="26" font-weight="500" fill="rgba(255,255,255,0.78)" text-anchor="middle">${safeSub}</text>
</svg>`);
}

/** Logo circular con la inicial de la marca. */
export function logoPlaceholder(label: string): string {
  const [from, to] = PALETTES[hash(label) % PALETTES.length];
  const initial = label.trim().charAt(0).toUpperCase();
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="160" height="160" rx="36" fill="url(#l)"/>
  <text x="50%" y="50%" dy="0.35em" font-family="Inter,Arial" font-size="76" font-weight="800" fill="#fff" text-anchor="middle">${initial}</text>
</svg>`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
