/**
 * Manerga una peticion de la API serverless y la enruta a `server/router.js`.
 *
 * Vercel puede entregar la ruta de tres formas distintas segun como haya
 * resuelto el enrutado (archivo estatico, catch-all o rewrite), por eso el
 * segmento se resuelve con varios criterios, en este orden:
 *
 *   1. `?rest=`  -> captura del rewrite `vercel.json`
 *   2. `slug` / `...slug` -> parametro que inyecta el router de `api/`
 *   3. cabeceras `x-invoke-path` / `x-matched-path`
 *   4. la propia `req.url`
 */

import { route } from './router.js';
import { ApiError } from './util.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function readBody(req) {
  if (req.body === undefined || req.body === null) return undefined;
  if (typeof req.body === 'string') {
    if (!req.body.trim()) return undefined;
    try {
      return JSON.parse(req.body);
    } catch {
      return undefined;
    }
  }
  return req.body;
}

function normalizePath(value) {
  if (typeof value !== 'string') return null;
  const clean = value.split('?')[0].replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const parts = clean.split('/').filter(Boolean);
  return parts.length ? parts : null;
}

function resolveSegments(req, rest) {
  // Un `rest` literal (p. ej. ":rest") significa que el rewrite no capturó
  // nada: se ignora y se recurre a los demás criterios.
  const usable = typeof rest === 'string' && rest.length && !rest.includes(':') && !rest.includes('$');
  const fromRest = usable ? normalizePath(rest) : null;
  if (fromRest) return fromRest;

  const slug = req.query?.slug ?? req.query?.['...slug'];
  const list = (Array.isArray(slug) ? slug : slug ? [slug] : []).filter(Boolean);
  if (list.length) return list;

  const headers = req.headers ?? {};
  const fromHeader =
    normalizePath(headers['x-invoke-path']) ?? normalizePath(headers['x-matched-path']);
  if (fromHeader) return fromHeader;

  return normalizePath(req.url) ?? [];
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const params = {};
  Object.entries(req.query ?? {}).forEach(([key, value]) => {
    if (key === 'slug' || key === '...slug') return;
    params[key] = Array.isArray(value) ? value[0] : value;
  });

  const restRaw = typeof params.rest === 'string' ? params.rest : undefined;
  const rest = restRaw && !restRaw.includes(':') && !restRaw.includes('$') ? restRaw : undefined;
  const segments = resolveSegments(req, rest);

  if (typeof req.query?.debug !== 'undefined') {
    res.status(200).json({
      debug: {
        url: req.url,
        segments,
        rest: rest ?? null,
        slug: req.query?.slug ?? null,
        dotSlug: req.query?.['...slug'] ?? null,
        invokePath: req.headers?.['x-invoke-path'] ?? null,
        matchedPath: req.headers?.['x-matched-path'] ?? null,
        query: req.query ?? {},
      },
    });
    return;
  }

  try {
    const data = await route({
      method: req.method ?? 'GET',
      segments,
      query: params,
      body: readBody(req),
    });
    res.status(200).json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof ApiError ? error.message : 'Error interno del servidor';
    if (status >= 500) console.error('[api]', error);
    res.status(status).json({ message });
  }
}
