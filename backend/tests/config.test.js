const {test} = require('node:test');
const assert = require('node:assert/strict');
const {config} = require('./helpers');
test('Configuracion rechaza secretos ausentes y tipos incorrectos sin exponer valores', () => {
  for (const overrides of [{PORT:'abc'},{DB_PASSWORD:''},{DB_SSL:'yes'},{TRUST_PROXY:'true'},{API_VERSION:'v2'},{CORS_ORIGINS:'*'},{PAGINATION_DEFAULT_LIMIT:'100',PAGINATION_MAX_LIMIT:'20'}]) assert.throws(() => config(overrides), /Configuracion invalida/);
  assert.equal(config({DB_SSL:'true'}).db.ssl.rejectUnauthorized,true);
  assert.equal(config({TRUST_PROXY:'1'}).trustProxy,1);
});

