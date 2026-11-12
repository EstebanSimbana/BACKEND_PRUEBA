const {Router} = require('express');
const {validarId,validarCuerpo,validarFiltros} = require('../middleware/validacion.middleware');
const {sanitizarProducto} = require('../middleware/sanitizacion.middleware');
const {crearPaginacion} = require('../middleware/paginacion.middleware');
module.exports = (controller, config) => {
  const router = Router();
  router.get('/', validarFiltros, crearPaginacion(config), controller.listar);
  router.get('/:id', validarId, controller.obtenerPorId);
  router.post('/', sanitizarProducto, validarCuerpo(), controller.crear);
  router.put('/:id', validarId, sanitizarProducto, validarCuerpo(), controller.reemplazar);
  router.patch('/:id', validarId, sanitizarProducto, validarCuerpo(true), controller.actualizarParcial);
  router.delete('/:id', validarId, controller.eliminar);
  return router;
};

