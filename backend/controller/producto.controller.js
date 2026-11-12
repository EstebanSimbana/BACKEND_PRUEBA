const {HttpError} = require('../middleware/errores.middleware');
function serializar(p) { return {...p, ID:String(p.ID), pvp:String(p.pvp)}; }
function requerido(p) { if (!p) throw new HttpError(404, 'Producto no encontrado'); return p; }
module.exports = (model, basePath) => ({
  async listar(req,res) { const result = await model.listar({...req.filtros,...req.pagination}); res.json({...result, data:result.data.map(serializar)}); },
  async obtenerPorId(req,res) { res.json({data:serializar(requerido(await model.obtenerPorId(req.params.id)))}); },
  async crear(req,res) { const p = serializar(await model.crear(req.body)); res.status(201).location(basePath + '/productos/' + p.ID).json({data:p}); },
  async reemplazar(req,res) { res.json({data:serializar(requerido(await model.reemplazar(req.params.id,req.body)))}); },
  async actualizarParcial(req,res) { res.json({data:serializar(requerido(await model.actualizarParcial(req.params.id,req.body)))}); },
  async eliminar(req,res) { requerido(await model.eliminar(req.params.id)); res.status(204).send(); }
});

