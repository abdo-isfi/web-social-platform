const jwt = require("jsonwebtoken");
const envVariable=require("../config/EnvVariable");
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, username: user.username },
    envVariable.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    envVariable.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};
module.exports=generateTokens;