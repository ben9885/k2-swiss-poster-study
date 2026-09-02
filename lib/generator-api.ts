import 'server-only';

const GENERATOR_API_URL = process.env.GENERATOR_API_URL?.replace(/\/$/, '');
const GENERATOR_API_KEY = process.env.GENERATOR_API_KEY;

export function generatorConfigured() {
  return Boolean(GENERATOR_API_URL && GENERATOR_API_KEY);
}

export async function generatorFetch(path: string, init: RequestInit = {}) {
  if (!GENERATOR_API_URL || !GENERATOR_API_KEY) {
    throw new Error('GENERATOR_NOT_CONFIGURED');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${GENERATOR_API_KEY}`);

  return fetch(`${GENERATOR_API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers,
  });
}
