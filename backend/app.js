const express = require('express');
const helmet = require('helmet');
const crearRouter = require('./route/producto.route');
const {crearJson} = require('./middleware/json.middleware');
const {noEncontrado,crearManejadorErrores} = require('./middleware/errores.middleware');
function createApp({config, controller, pool, logger = console}) {
  const app = express();
  app.disable('x-powered-by'); app.set('trust proxy', config.trustProxy);
  app.use(require('./middleware/logging.middleware')(logger));
  app.use(helmet());
  app.use(require('./middleware/cors.middleware')(config));
  app.use(require('./middleware/rateLimit.middleware')(config));
  app.use(crearJson(config));
  app.use(require('./middleware/version.middleware')(config));
  app.get('/health', (req,res) => res.json({status:'ok'}));
  app.get('/ready', async (req,res) => { await pool.query('SELECT 1'); res.json({status:'ready'}); });
  app.use(config.basePath + '/productos', crearRouter(controller,config));
  app.use(noEncontrado); app.use(crearManejadorErrores(logger));
  return app;
}
module.exports = {createApp};

