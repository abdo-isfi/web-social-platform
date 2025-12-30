// middlewares/auth.js
const jwt = require("jsonwebtoken");
const responseHandler = require("../utils/responseHandler");
const envVar = require("../config/EnvVariable");

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header:", authHeader ? "Present" : "Missing"); // Debug

  if (!authHeader) return responseHandler.unauthorized(res, "No token provided");

  const token = authHeader.split(" ")[1]; 
  if (!token) return responseHandler.unauthorized(res, "Invalid token format");

  try {
    const payload = jwt.verify(token, envVar.ACCESS_TOKEN_SECRET);
    console.log("Token Payload:", payload); // Debug
    req.user = payload;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message); // Debug
    return responseHandler.unauthorized(res, "Access token expired or invalid");
  }
};

module.exports = authenticate;
