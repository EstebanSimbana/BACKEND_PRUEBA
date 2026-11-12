const {z} = require('zod');
function normalizarTexto(v) {return v.normalize('NFC').trim();}
class ProductoValidationError extends Error {}
const texto = (min, max) => z.string().transform(normalizarTexto).pipe(z.string().min(min).max(max).refine(v => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(v)));
const campos = {
  nombre:texto(2,250), descripcion:texto(1,4000),
  URLimagen:texto(1,2048).refine(v => { try {const u = new URL(v); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password;} catch { return false; } }),
  pvp:z.string().regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/).transform(v => {const [entero, decimales = ''] = v.split('.'); return entero + '.' + decimales.padEnd(2,'0');}),
  stock:z.number().int().min(0).max(2147483647)
};
const completo = z.strictObject(campos);
const parcial = completo.partial().refine(v => Object.keys(v).length > 0);
function validarDatosProducto(datos, partial = false) {
  const result = (partial ? parcial : completo).safeParse(datos);
  if (!result.success) throw new ProductoValidationError('Producto invalido: ' + result.error.issues.map(i => i.path.join('.') || 'cuerpo').join(', '));
  return result.data;
}

module.exports = {validarDatosProducto, ProductoValidationError};
