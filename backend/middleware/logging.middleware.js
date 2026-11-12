const { randomUUID } = require('node:crypto');
module.exports = logger => (req, res, next) => {
  req.requestId = randomUUID(); res.setHeader('X-Request-Id', req.requestId);
  const start = process.hrtime.bigint();
  res.on('finish', () => logger.info({evento:'http', requestId:req.requestId, metodo:req.method,
    ruta:req.route?.path || 'sin-ruta', status:res.statusCode, duracionMs:Number(process.hrtime.bigint() - start) / 1e6}));
  next();
};

