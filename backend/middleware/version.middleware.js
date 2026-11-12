const { HttpError } = require('./errores.middleware');
module.exports = config => (req, res, next) => {
  const prefix = config.API_PREFIX + '/';
  if (req.path.startsWith(prefix) && req.path.slice(prefix.length).split('/')[0] !== config.API_VERSION) throw new HttpError(404, 'Version de API no disponible');
  next();
};

