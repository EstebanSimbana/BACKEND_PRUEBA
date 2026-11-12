const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ProductoModel,getProductoModel} = require('../modelo/producto.model');
const {producto,MemoryRepository} = require('./helpers');
test('Modelo protege reglas aun fuera de Express', async () => {
  const repository = new MemoryRepository(0); const model = new ProductoModel(repository);
  assert.throws(() => model.crear({...producto,stock:-1}));
  assert.throws(() => model.actualizarParcial('1',{}));
  assert.throws(() => model.reemplazar('1',{stock:1}));
  const p = await model.crear({...producto,pvp:'0'});
  assert.equal(p.pvp,'0.00');
  const result = await model.listar({page:1,limit:20,offset:0});
  assert.equal(result.meta.total,1);
});
test('Singleton de modelo se reutiliza sin guardar estado de peticion', () => {
  const repo = new MemoryRepository(); const model = getProductoModel(repo);
  assert.equal(getProductoModel(),model); assert.equal(model.repository,repo);
});

