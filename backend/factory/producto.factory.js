const ProductoRepository = require('../modelo/producto.repository');
const {getProductoModel} = require('../modelo/producto.model');
const crearController = require('../controller/producto.controller');
function crearDependenciasProducto(pool, config) {
  const repository = new ProductoRepository(pool);
  const model = getProductoModel(repository);
  return {repository, model, controller:crearController(model, config.basePath)};
}
module.exports = {crearDependenciasProducto};

