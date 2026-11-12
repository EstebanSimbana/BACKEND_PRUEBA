const COLUMNAS = '"ID", nombre, descripcion, "URLimagen", pvp, stock';
const TABLA = 'dbo."Producto"';
const CAMPOS = Object.freeze({nombre:'nombre', descripcion:'descripcion', URLimagen:'"URLimagen"', pvp:'pvp', stock:'stock'});
const ORDENES = Object.freeze({id_asc:'"ID" ASC', id_desc:'"ID" DESC', nombre_asc:'nombre ASC, "ID" ASC', nombre_desc:'nombre DESC, "ID" ASC', pvp_asc:'pvp ASC, "ID" ASC', pvp_desc:'pvp DESC, "ID" ASC'});
function filtro(nombre) {
  // ILIKE de subcadena literal: %, _ y barra inversa no actuan como comodines.
  return nombre === undefined ? {sql:'', values:[]} : {sql:' WHERE nombre ILIKE $1', values:['%' + nombre.replace(/[\\%_]/g, '\\$&') + '%']};
}
class ProductoRepository {
  constructor(pool) { this.pool = pool; }
  async findAll({limit, offset, nombre, orden = 'id_asc'}) {
    if (!Object.hasOwn(ORDENES, orden)) throw new TypeError('Orden no permitido');
    const {sql, values} = filtro(nombre);
    const n = values.length;
    return (await this.pool.query('SELECT ' + COLUMNAS + ' FROM ' + TABLA + sql + ' ORDER BY ' + ORDENES[orden] + ' LIMIT $' + (n+1) + ' OFFSET $' + (n+2), [...values, limit, offset])).rows;
  }
  async count({nombre} = {}) {
    const {sql, values} = filtro(nombre);
    const total = Number((await this.pool.query('SELECT COUNT(*) AS total FROM ' + TABLA + sql, values)).rows[0].total);
    if (!Number.isSafeInteger(total)) throw new RangeError('Total fuera de rango seguro');
    return total;
  }
  async findById(id) { return (await this.pool.query('SELECT ' + COLUMNAS + ' FROM ' + TABLA + ' WHERE "ID" = $1', [id])).rows[0] || null; }
  async create(datos) {
    return (await this.pool.query('INSERT INTO ' + TABLA + ' (nombre, descripcion, "URLimagen", pvp, stock) VALUES ($1,$2,$3,$4,$5) RETURNING ' + COLUMNAS, Object.keys(CAMPOS).map(key => datos[key]))).rows[0];
  }
  async replace(id, datos) {
    return (await this.pool.query('UPDATE ' + TABLA + ' SET nombre=$1, descripcion=$2, "URLimagen"=$3, pvp=$4, stock=$5 WHERE "ID"=$6 RETURNING ' + COLUMNAS, [...Object.keys(CAMPOS).map(key => datos[key]), id])).rows[0] || null;
  }
  async updatePartial(id, cambios) {
    const keys = Object.keys(cambios);
    if (!keys.length || keys.some(key => !Object.hasOwn(CAMPOS, key))) throw new TypeError('Columnas no permitidas');
    const asignaciones = keys.map((key, i) => CAMPOS[key] + '=$' + (i+1)).join(', ');
    return (await this.pool.query('UPDATE ' + TABLA + ' SET ' + asignaciones + ' WHERE "ID"=$' + (keys.length+1) + ' RETURNING ' + COLUMNAS, [...keys.map(key => cambios[key]), id])).rows[0] || null;
  }
  async delete(id) { return (await this.pool.query('DELETE FROM ' + TABLA + ' WHERE "ID"=$1 RETURNING "ID"', [id])).rows[0] || null; }
}
module.exports = ProductoRepository;

