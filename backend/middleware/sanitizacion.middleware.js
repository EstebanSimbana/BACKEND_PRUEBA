function normalizarTexto(value) { return value.normalize('NFC').trim(); }
function sanitizarProducto(req, res, next) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const key of ['nombre', 'descripcion', 'URLimagen']) {
      if (typeof req.body[key] === 'string') req.body[key] = normalizarTexto(req.body[key]);
    }
  }
  next();
}
module.exports = {normalizarTexto, sanitizarProducto};

