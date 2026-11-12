const {test} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const {fixture,producto} = require('./helpers');
const base = '/api/v1/productos';
test('Listado predeterminado, paginacion y filtros', async () => {
  const {app} = fixture();
  const first = await request(app).get(base).expect(200);
  assert.equal(first.body.data.length,20);
  assert.deepEqual(first.body.meta,{page:1,limit:20,total:25,totalPages:2});
  const second = await request(app).get(base + '?page=2&limit=10').expect(200);
  assert.equal(second.body.data[0].ID,'11'); assert.equal(second.body.data.length,10);
  const empty = await request(app).get(base).query({nombre:'No existe'}).expect(200);
  assert.equal(empty.body.meta.total,0);
});
test('Ciclo CRUD, PUT completo, PATCH parcial, Location y DELETE sin cuerpo', async () => {
  const {app} = fixture();
  const created = await request(app).post(base).send({...producto,nombre:'  Cafe\u0301  '}).expect(201);
  const id = created.body.data.ID;
  assert.equal(created.headers.location,base + '/' + id);
  assert.equal(created.body.data.nombre,'Caf\u00e9'); assert.equal(typeof created.body.data.pvp,'string');
  await request(app).get(base + '/' + id).expect(200);
  const replaced = await request(app).put(base + '/' + id).send({...producto,nombre:'Reemplazado',pvp:'1.5'}).expect(200);
  assert.equal(replaced.body.data.pvp,'1.50');
  const patched = await request(app).patch(base + '/' + id).send({stock:5}).expect(200);
  assert.equal(patched.body.data.nombre,'Reemplazado'); assert.equal(patched.body.data.stock,5);
  const removed = await request(app).delete(base + '/' + id).expect(204); assert.equal(removed.text,'');
  for (const method of ['get','delete','put','patch']) {
    let req = request(app)[method](base + '/' + id);
    if (method === 'put') req = req.send(producto);
    if (method === 'patch') req = req.send({stock:1});
    await req.expect(404);
  }
});
test('Identificadores BIGINT se conservan como texto', async () => {
  const {app,repository} = fixture();
  const id = '9223372036854775807'; repository.data.set(id,{...producto,ID:id});
  const result = await request(app).get(base + '/' + id).expect(200);
  assert.equal(result.body.data.ID,id);
  const canonical = await request(app).get(base + '/0001').expect(200); assert.equal(canonical.body.data.ID,'1');
});
test('Rechazo de payloads invalidos y asignacion masiva', async () => {
  const {app} = fixture();
  for (const payload of [{...producto,nombre:undefined},{...producto,pvp:'-1'},{...producto,pvp:18.9},{...producto,pvp:'100000000.00'},{...producto,pvp:'1.001'}, {...producto,stock:1.5},{...producto,stock:2147483648},{...producto,URLimagen:'http://example.com/a'}, {...producto,ID:'4'}, {...producto,isAdmin:true},{...producto,nombre:'a\u0000b'}, [], null, 'texto']) {
    await request(app).post(base).set('Content-Type','application/json').send(JSON.stringify(payload)).expect(422);
  }
  await request(app).put(base + '/1').send({stock:5}).expect(422);
  await request(app).patch(base + '/1').send({}).expect(422);
  await request(app).patch(base + '/1').set('Content-Type','application/json').send('{"__proto__":{"admin":true}}').expect(422);
});
test('Limites del contrato de entrada: JSON, media type, paginacion e IDs', async () => {
  const {app} = fixture();
  await request(app).post(base).set('Content-Type','application/json').send('{').expect(400);
  await request(app).post(base).set('Content-Type','text/plain').send('texto').expect(415);
  await request(app).post(base).send({...producto,descripcion:'a'.repeat(110000)}).expect(413);
  for (const query of ['page=0','limit=100000','page=1.5','page=99999999999999999','page=1000001&limit=100','orden=pvp;DROP TABLE','limit=1&limit=2','otro=1']) await request(app).get(base + '?' + query).expect(400);
  for (const id of ['0','-1','1.5','abc','9223372036854775808']) await request(app).get(base + '/' + id).expect(400);
});
test('Seguridad HTTP, CORS, versionamiento, salud y errores sin filtraciones', async () => {
  const {app} = fixture();
  const good = await request(app).get('/health').expect(200);
  assert.ok(good.headers['x-request-id']); assert.ok(good.headers['x-content-type-options']); assert.equal(good.headers['x-powered-by'],undefined);
  await request(app).get('/ready').expect(200);
  await request(app).get('/api/v2/productos').expect(404);
  await request(app).get('/desconocido').expect(404);
  await request(app).get(base).set('Origin','https://evil.example').expect(403);
  const preflight = await request(app).options(base).set('Origin','http://localhost:5173').set('Access-Control-Request-Method','POST').expect(204);
  assert.equal(preflight.headers['access-control-allow-origin'],'http://localhost:5173');
  const failed = fixture({pool:{async query(){throw Object.assign(new Error('password=secreto SQL SELECT'),{code:'ECONNREFUSED'});}}});
  const result = await request(failed.app).get('/ready').expect(503);
  assert.deepEqual(result.body,{error:{codigo:503,mensaje:'Base de datos no disponible'}});
  const broken = fixture({repository:{async findById(){throw new Error('SQL secreto');}}});
  const error = await request(broken.app).get(base + '/1').expect(500);
  assert.equal(error.body.error.mensaje,'Error interno del servidor');
});
test('Rate limit y prefijo configurable en rutas y Location', async () => {
  const limited = fixture({overrides:{RATE_LIMIT_MAX:'1'}});
  await request(limited.app).get('/health').expect(200);
  await request(limited.app).get('/health').expect(429);
  const {app} = fixture({overrides:{API_PREFIX:'/inventario/api'}});
  const result = await request(app).post('/inventario/api/v1/productos').send(producto).expect(201);
  assert.equal(result.headers.location,'/inventario/api/v1/productos/' + result.body.data.ID);
});

