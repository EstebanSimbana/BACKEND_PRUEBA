const {validarDatosProducto} = require('./producto.schema');
class ProductoModel {
  constructor(repository) { this.repository = repository; }
  async listar({page, limit, offset, nombre, orden}) {
    const [data, total] = await Promise.all([this.repository.findAll({limit,offset,nombre,orden}), this.repository.count({nombre})]);
    return {data, meta:{page, limit, total, totalPages:Math.ceil(total/limit)}};
  }
  obtenerPorId(id) { return this.repository.findById(id); }
  crear(datos) { return this.repository.create(validarDatosProducto(datos)); }
  reemplazar(id, datos) { return this.repository.replace(id, validarDatosProducto(datos)); }
  actualizarParcial(id, datos) { return this.repository.updatePartial(id, validarDatosProducto(datos, true)); }
  eliminar(id) { return this.repository.delete(id); }
}
let instance;
function getProductoModel(repository) {
  if (!instance) { if (!repository) throw new Error('Repository requerido'); instance = new ProductoModel(repository); }
  return instance;
}
module.exports = {ProductoModel, getProductoModel};

