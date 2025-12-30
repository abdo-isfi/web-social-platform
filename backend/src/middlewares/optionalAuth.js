// middlewares/optionalAuth.js
const jwt = require("jsonwebtoken");
const envVar = require("../config/EnvVariable");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
      return next();
  }

  const token = authHeader.split(" ")[1]; 
  if (!token) return next();

  try {
    const payload = jwt.verify(token, envVar.ACCESS_TOKEN_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    // If token invalid, just proceed as guest
    next();
  }
};

module.exports = optionalAuth;
