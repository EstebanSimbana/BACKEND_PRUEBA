const {ProductoValidationError} = require('../modelo/producto.schema');
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function noEncontrado(req, res, next) { next(new HttpError(404, 'Ruta no encontrada')); }
function crearManejadorErrores(logger = console) {
  return function manejarError(err, req, res, next) {
    if (res.headersSent) return next(err);
    let status = err instanceof HttpError ? err.status : 500;
    let mensaje = err instanceof HttpError ? err.message : 'Error interno del servidor';
    if (err instanceof ProductoValidationError) { status = 422; mensaje = err.message; }
    if (err.type === 'entity.parse.failed') { status = 400; mensaje = 'JSON malformado'; }
    if (err.type === 'entity.too.large') { status = 413; mensaje = 'Cuerpo demasiado grande'; }
    if (['charset.unsupported', 'encoding.unsupported'].includes(err.type)) { status = 415; mensaje = 'Codificacion no permitida'; }
    if (['23505', '23503'].includes(err.code)) { status = 409; mensaje = 'Conflicto con los datos existentes'; }
    if (['23502', '23514', '22003', '22001'].includes(err.code)) { status = 422; mensaje = 'Datos incompatibles con las restricciones de la base de datos'; }
    if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', '57P01', '57P02', '57P03', '53300', '57014'].includes(err.code) || /^08/.test(err.code || '') || /timeout|Connection terminated/i.test(err.message || '')) {
      status = 503; mensaje = 'Base de datos no disponible';
    }
    // Registrar solo campos seguros; no volcar SQL, credenciales, cuerpos ni stacks.
    if (status >= 500) logger.error({evento:'error', requestId:req.requestId, status, tipo:err.name});
    res.status(status).json({error:{codigo:status, mensaje}});
  };
}
module.exports = {HttpError, noEncontrado, crearManejadorErrores};

