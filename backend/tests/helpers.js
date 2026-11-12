const path = require('node:path');
const dotenv = require('dotenv');
const {loadConfig} = require('../config');
const {ProductoModel} = require('../modelo/producto.model');
const crearController = require('../controller/producto.controller');
const {createApp} = require('../app');
const producto = {nombre:'Producto de prueba', descripcion:'Descripcion de prueba', URLimagen:'https://example.com/producto.png', pvp:'18.90', stock:10};
function config(overrides = {}) {
  const defaults = dotenv.parse(require('node:fs').readFileSync(path.join(__dirname,'../.env.example')));
  return loadConfig({...defaults, DB_PASSWORD:'solo-pruebas', NODE_ENV:'test', RATE_LIMIT_MAX:'10000', LOG_LEVEL:'silent', ...overrides});
}
const logger = {info(){}, error(){}};
class MemoryRepository {
  constructor(size = 25) { this.data = new Map(Array.from({length:size},(_,i) => [String(i+1), {...producto, ID:String(i+1)}])); this.next = BigInt(size + 1); }
  filtered({nombre}) {return [...this.data.values()].filter(p => !nombre || p.nombre.toLowerCase().includes(nombre.toLowerCase()));}
  async findAll(args) {return this.filtered(args).slice(args.offset,args.offset + args.limit);}
  async count(args) {return this.filtered(args).length;}
  async findById(id) {return this.data.get(id) || null;}
  async create(datos) {const p = {...datos, ID:String(this.next++)}; this.data.set(p.ID,p); return p;}
  async replace(id,datos) {if (!this.data.has(id)) return null; const p = {...datos,ID:id}; this.data.set(id,p); return p;}
  async updatePartial(id,datos) {if (!this.data.has(id)) return null; const p = {...this.data.get(id),...datos}; this.data.set(id,p); return p;}
  async delete(id) {const p = this.data.get(id); this.data.delete(id); return p || null;}
}
function fixture({repository = new MemoryRepository(), overrides = {}, pool = {async query(){return {rows:[{ok:1}]};}}} = {}) {
  const c = config(overrides);
  const controller = crearController(new ProductoModel(repository),c.basePath);
  return {app:createApp({config:c,controller,pool,logger}),repository,config:c};
}
module.exports = {producto,config,logger,MemoryRepository,fixture};

