const {test} = require('node:test');
const assert = require('node:assert/strict');
const Repository = require('../modelo/producto.repository');
const {producto} = require('./helpers');
function recordingPool() {const calls = []; return {calls,async query(sql,values){calls.push({sql,values}); return {rows:sql.includes('COUNT(*)') ? [{total:'12'}] : [{...producto,ID:'1'}]};}};}
test('Todas las escrituras y lecturas parametrizan valores y respetan nombres de BD', async () => {
  const pool = recordingPool(); const repo = new Repository(pool);
  const malicious = "x'); DROP TABLE dbo.\"Producto\"; --";
  await repo.create({...producto,nombre:malicious});
  await repo.findById('9223372036854775807');
  await repo.replace('1',producto); await repo.updatePartial('1',{URLimagen:producto.URLimagen,stock:0}); await repo.delete('1');
  for (const {sql,values} of pool.calls) { assert.ok(sql.includes('dbo."Producto"')); assert.ok(sql.includes('$1')); assert.ok(Array.isArray(values)); assert.ok(!sql.includes(malicious)); }
  assert.equal(pool.calls[0].values[0],malicious);
  assert.ok(pool.calls[3].sql.includes('"URLimagen"=$1'));
  await assert.rejects(repo.updatePartial('1',{'stock=0;DROP TABLE a':1}));
  await assert.rejects(repo.updatePartial('1',{}));
});
test('Busqueda literal, COUNT con mismo filtro y paginacion SQL', async () => {
  const pool = recordingPool(); const repo = new Repository(pool);
  await repo.findAll({nombre:'50%_\\',limit:10,offset:20});
  assert.equal(await repo.count({nombre:'50%_\\'}),12);
  assert.deepEqual(pool.calls[0].values,['%50\\%\\_\\\\%',10,20]);
  assert.deepEqual(pool.calls[1].values,[pool.calls[0].values[0]]);
  assert.ok(pool.calls[0].sql.includes('ORDER BY "ID" ASC LIMIT $2 OFFSET $3'));
  await assert.rejects(repo.findAll({limit:10,offset:0,orden:'nombre; DROP TABLE a'}));
});

