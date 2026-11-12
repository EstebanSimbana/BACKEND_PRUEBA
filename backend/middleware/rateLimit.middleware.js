const { rateLimit } = require('express-rate-limit');
module.exports = config => rateLimit({windowMs:config.RATE_LIMIT_WINDOW_MS, limit:config.RATE_LIMIT_MAX,
  standardHeaders:'draft-8', legacyHeaders:false,
  handler(req,res) { res.status(429).json({error:{codigo:429,mensaje:'Demasiadas solicitudes'}}); }
});

