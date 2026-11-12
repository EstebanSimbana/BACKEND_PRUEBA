const { Pool } = require('pg');
let pool;
function getPool(config, logger = console) {
  if (!pool) {
    pool = new Pool(config);
    pool.on('error', err => logger.error({evento:'postgres_pool_error', tipo:err.name}));
  }
  return pool;
}
async function closePool() { if (pool) { const current = pool; pool = undefined; await current.end(); } }
module.exports = {getPool, closePool};

