const express = require('express');
const { HttpError } = require('./errores.middleware');
function crearJson(config) {
  return [(req, res, next) => {
    if (['POST','PUT','PATCH'].includes(req.method) && !req.is('application/json')) throw new HttpError(415, 'Se requiere Content-Type application/json');
    next();
  }, express.json({limit:config.JSON_LIMIT, strict:false}), (req, res, next) => {
    if (['POST','PUT','PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) throw new HttpError(422, 'El cuerpo debe ser un objeto JSON');
    next();
  }];
}
module.exports = {crearJson};

