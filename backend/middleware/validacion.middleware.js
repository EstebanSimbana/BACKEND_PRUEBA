const { z } = require('zod');
const { HttpError } = require('./errores.middleware');
const { normalizarTexto } = require('./sanitizacion.middleware');
const {validarDatosProducto} = require('../modelo/producto.schema');
const texto = (min,max) => z.string().transform(normalizarTexto).pipe(z.string().min(min).max(max).refine(v => !/[\u0000-\u001F\u007F-\u009F]/u.test(v)));
function validarCuerpo(partial = false) { return (req, res, next) => { req.body = validarDatosProducto(req.body, partial); next(); }; }
function validarId(req, res, next) {
  const id = req.params.id;
  if (!/^\d{1,19}$/.test(id) || BigInt(id) < 1n || BigInt(id) > 9223372036854775807n) throw new HttpError(400, 'ID invalido');
  req.params.id = BigInt(id).toString(); next();
}
const filtros = z.strictObject({page:z.string().optional(), limit:z.string().optional(), nombre:texto(1,250).optional(), orden:z.enum(['id_asc', 'id_desc', 'nombre_asc', 'nombre_desc', 'pvp_asc', 'pvp_desc']).default('id_asc')});
function validarFiltros(req, res, next) {
  const result = filtros.safeParse(req.query);
  if (!result.success) throw new HttpError(400, 'Parametros de busqueda invalidos');
  req.filtros = result.data; next();
}
module.exports = {validarDatosProducto, validarCuerpo, validarId, validarFiltros};

