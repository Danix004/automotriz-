/**
 * Entrada única de la API serverless (catch-all de Vercel).
 * Cualquier petición a /api/... se enruta a `server/router.js`.
 */

import { route } from '../server/router.js';
import { ApiError } from '../server/util.js';

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

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const raw = req.query?.slug;
  const segments = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(Boolean);

  const params = {};
  Object.entries(req.query ?? {}).forEach(([key, value]) => {
    if (key === 'slug') return;
    params[key] = Array.isArray(value) ? value[0] : value;
  });

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
