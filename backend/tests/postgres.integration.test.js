const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {Pool} = require('pg');
const {loadConfig} = require('../config');
const Repository = require('../modelo/producto.repository');
const {producto} = require('./helpers');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
test('PostgreSQL real: CRUD, numericos exactos, filtros y rollback', {skip:process.env.TEST_DATABASE !== 'true'}, async () => {
  const config = loadConfig(); const pool = new Pool(config.db); let client;
  try {
    client = await pool.connect(); await client.query('BEGIN');
    const repository = new Repository(client);
    const nombre = 'PruebaAPI-' + require('node:crypto').randomUUID();
    const created = await repository.create({...producto,nombre,pvp:'99999999.99'});
    assert.equal(typeof created.ID,'string'); assert.equal(created.pvp,'99999999.99');
    assert.equal((await repository.findById(created.ID)).nombre,nombre);
    assert.equal(await repository.count({nombre}),1);
    assert.equal((await repository.findAll({nombre,limit:20,offset:0})).length,1);
    assert.equal((await repository.replace(created.ID,{...producto,nombre,pvp:'0.01'})).pvp,'0.01');
    const changed = await repository.updatePartial(created.ID,{stock:5});
    assert.equal(changed.stock,5); assert.equal(changed.nombre,nombre);
    assert.ok(await repository.delete(created.ID)); assert.equal(await repository.findById(created.ID),null);
  } finally {
    try {if (client) await client.query('ROLLBACK');} finally {if (client) client.release(); await pool.end();}
  }
});

