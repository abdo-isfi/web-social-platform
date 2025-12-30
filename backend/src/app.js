const express=require("express");
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require("cookie-parser");
const authRoute=require("./routes/auth.route");
const userRoute=require("./routes/user.route");
const threadRoute=require("./routes/thread.route");
const likeRouter=require("./routes/like.route");
const followerRoute=require("./routes/follow.route");
const notificationRoute=require("./routes/notification.route");
const app=express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRoute);
app.use("/api/user",userRoute);
app.use("/api/thread",threadRoute);
app.use("/api/like",likeRouter);
app.use("/api/follower",followerRoute);
app.use("/api/notification",notificationRoute);
app.use("/api/search", require("./routes/search.route"));
module.exports=app;