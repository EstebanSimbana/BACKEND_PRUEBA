const cors = require('cors');
const { HttpError } = require('./errores.middleware');
module.exports = config => cors({
  origin(origin, callback) { callback(origin && !config.CORS_ORIGINS.includes(origin) ? new HttpError(403, 'Origen no permitido') : null, true); },
  methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization'],
  exposedHeaders:['Location','X-Request-Id'], credentials:false
});

