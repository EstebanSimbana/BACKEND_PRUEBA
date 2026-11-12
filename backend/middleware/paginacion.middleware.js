const { HttpError } = require('./errores.middleware');
function crearPaginacion(config) {
  return (req, res, next) => {
    const {page:rawPage = '1', limit:rawLimit = String(config.PAGINATION_DEFAULT_LIMIT)} = req.filtros;
    const page = Number(rawPage), limit = Number(rawLimit);
    if (!/^[1-9]\d*$/.test(rawPage) || !/^[1-9]\d*$/.test(rawLimit) || !Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || limit > config.PAGINATION_MAX_LIMIT || (page - 1) * limit > 1000000) throw new HttpError(400, 'Paginacion invalida (offset maximo: 1000000)');
    req.pagination = {page, limit, offset:(page - 1) * limit}; next();
  };
}
module.exports = {crearPaginacion};

