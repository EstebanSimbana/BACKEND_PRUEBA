const { z } = require('zod');
const fs = require('node:fs');
const integer = (max = 2147483647) => z.coerce.number().int().min(1).max(max);
const boolean = z.enum(['true', 'false']).transform(v => v === 'true');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  HOST: z.string().min(1), PORT: integer(65535),
  API_PREFIX: z.string().regex(/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/),
  API_VERSION: z.literal('v1'),
  DB_HOST: z.string().min(1), DB_PORT: integer(65535), DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1), DB_PASSWORD: z.string().min(1).refine(v => v !== 'CAMBIAR_POR_CONTRASENA_LOCAL'),
  DB_SSL: boolean, DB_SSL_CA_FILE: z.string().optional(),
  DB_POOL_MAX: integer(100), DB_IDLE_TIMEOUT_MS: integer(), DB_CONNECTION_TIMEOUT_MS: integer(),
  CORS_ORIGINS: z.string().transform(v => v.split(',').map(s => s.trim()).filter(Boolean)).refine(values => values.every(value => {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && url.origin === value; } catch { return false; }
  })),
  JSON_LIMIT: z.string().regex(/^[1-9]\d*(?:b|kb|mb)$/i),
  RATE_LIMIT_WINDOW_MS: integer(), RATE_LIMIT_MAX: integer(),
  // Un salto conocido o una lista de IP/subredes; nunca confiar en todos los proxies.
  TRUST_PROXY: z.string().refine(v => v === 'false' || /^[1-9]\d?$/.test(v)),
  REQUEST_TIMEOUT_MS: integer(), PAGINATION_DEFAULT_LIMIT: integer(100), PAGINATION_MAX_LIMIT: integer(100),
  LOG_LEVEL: z.enum(['silent', 'error', 'info'])
}).refine(c => c.PAGINATION_DEFAULT_LIMIT <= c.PAGINATION_MAX_LIMIT, {path:['PAGINATION_DEFAULT_LIMIT']});
function loadConfig(env = process.env) {
  let normalizedEnv = env;
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    normalizedEnv = {
      ...env,
      DB_HOST: url.hostname,
      DB_PORT: url.port || '5432',
      DB_NAME: decodeURIComponent(url.pathname.replace(/^\//, '')),
      DB_USER: decodeURIComponent(url.username),
      DB_PASSWORD: decodeURIComponent(url.password),
      DB_SSL: env.DB_SSL || 'true'
    };
  }
  const result = schema.safeParse(normalizedEnv);
  if (!result.success) throw new Error('Configuracion invalida. Revise: ' + [...new Set(result.error.issues.map(i => i.path.join('.')))].join(', '));
  const c = result.data;
  return {...c, basePath:c.API_PREFIX + '/' + c.API_VERSION,
    trustProxy: c.TRUST_PROXY === 'false' ? false : Number(c.TRUST_PROXY),
    db: {host:c.DB_HOST, port:c.DB_PORT, database:c.DB_NAME, user:c.DB_USER, password:c.DB_PASSWORD,
      max:c.DB_POOL_MAX, idleTimeoutMillis:c.DB_IDLE_TIMEOUT_MS, connectionTimeoutMillis:c.DB_CONNECTION_TIMEOUT_MS,
      statement_timeout:c.REQUEST_TIMEOUT_MS, query_timeout:c.REQUEST_TIMEOUT_MS,
      ssl:c.DB_SSL ? {rejectUnauthorized:true, ...(c.DB_SSL_CA_FILE ? {ca:fs.readFileSync(c.DB_SSL_CA_FILE, 'utf8')} : {})} : false}
  };
}
module.exports = {loadConfig};

