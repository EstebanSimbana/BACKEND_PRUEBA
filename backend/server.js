const path = require('node:path');
require('dotenv').config({path:path.join(__dirname,'.env'), quiet:true});
const {loadConfig} = require('./config');
const {getPool,closePool} = require('./modelo/db.singleton');
const {crearDependenciasProducto} = require('./factory/producto.factory');
const {createApp} = require('./app');
async function start() {
  const config = loadConfig();
  const logger = {
    info: data => {if (config.LOG_LEVEL === 'info') console.log(JSON.stringify(data));},
    error: data => {if (config.LOG_LEVEL !== 'silent') console.error(JSON.stringify(data));}
  };
  const pool = getPool(config.db,logger);
  let server;
  try {
    await pool.query('SELECT 1');
    const {controller} = crearDependenciasProducto(pool,config);
    const app = createApp({config,controller,pool,logger});
    server = require('node:http').createServer(app);
    server.requestTimeout = config.REQUEST_TIMEOUT_MS;
    server.headersTimeout = Math.min(60000,config.REQUEST_TIMEOUT_MS);
    server.setTimeout(config.REQUEST_TIMEOUT_MS, socket => socket.destroy());
    await new Promise((resolve,reject) => {server.once('error',reject); server.listen(config.PORT,config.HOST,resolve);});
    logger.info({evento:'inicio', url:'http://' + config.HOST + ':' + config.PORT + config.basePath});
  } catch (error) { await closePool(); throw error; }
  let stopping = false;
  async function stop() {
    if (stopping) return; stopping = true;
    const timer = setTimeout(() => {server.closeAllConnections(); process.exit(1);},config.REQUEST_TIMEOUT_MS); timer.unref();
    try {await new Promise((resolve,reject) => server.close(err => err ? reject(err) : resolve())); await closePool(); clearTimeout(timer);}
    catch {process.exitCode = 1;}
  }
  process.once('SIGINT',stop); process.once('SIGTERM',stop);
  return {server,stop};
}
if (require.main === module) start().catch(error => {
  console.error(error.message.startsWith('Configuracion invalida') ? error.message : 'No se pudo iniciar. Verifique PostgreSQL, credenciales y puerto HTTP.');
  process.exitCode = 1;
});
module.exports = {start};

