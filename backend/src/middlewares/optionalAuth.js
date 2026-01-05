/**
 * optionalAuth.js - The Polite Guest Handler
 * 
 * Some pages (like looking at a public profile) can be seen by anyone.
 * But IF the user is logged in, we want to know so we can show 
 * "Follow" vs "Following" buttons correctly.
 * 
 * Unlike 'auth.js', this middleware NEVER blocks the request.
 */

const jwt = require("jsonwebtoken");
const envVar = require("../config/EnvVariable");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  // If no token, just move on as a Guest (req.user remains undefined)
  if (!authHeader) return next();

  const token = authHeader.split(" ")[1]; 
  if (!token) return next();

  try {
    const payload = jwt.verify(token, envVar.ACCESS_TOKEN_SECRET);
    req.user = payload; // Identifying the user to personalize the view
    next();
  } catch (err) {
      // Even if token is invalid/expired, we don't throw an error. 
      // We just treat them as a Guest.
    next();
  }
};

module.exports = optionalAuth;
