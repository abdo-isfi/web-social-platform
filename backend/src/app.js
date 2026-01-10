/**
 * app.js - The Brain of the Express Application
 * 
 * Think of this file as the "Receptionist & Security Guard."
 * It defines how every request coming into the server is handled, 
 * what security checks it goes through, and which "department" (route) it should go to.
 */

const express = require("express");
const helmet = require('helmet'); // Security middleware (sets various HTTP headers)
const cors = require('cors'); // Cross-Origin Resource Sharing (allows frontend to talk to backend)
const morgan = require('morgan'); // Logger (prints every request to the console)
const rateLimit = require('express-rate-limit'); // Prevention of Brute-Force/DOS attacks
const cookieParser = require("cookie-parser"); // Parses cookies from requests
const envVar = require("./config/EnvVariable");

// Import Routes (The different departments of our app)
const authRoute = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const threadRoute = require("./routes/thread.route");
const likeRouter = require("./routes/like.route");
const followerRoute = require("./routes/follow.route");
const notificationRoute = require("./routes/notification.route");

const app = express();

/**
 * MIDDLEWARE CONFIGURATION
 * Middleware are functions that run 'in the middle' of receiving a request and sending a response.
 */

// 1. Rate Limiting: Limits how many requests one person can make to prevent abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per 'window'
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 2. Helmet: Adds security headers to protect against common web vulnerabilities.
app.use(helmet());

// 3. CORS: Allows your frontend to communicate with this backend.
app.use(cors({
  origin: envVar.VITE_CLIENT_URL, 
  credentials: true, // Crucial for sending/receiving cookies (JWT)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Morgan: Prints a log line like "GET /api/thread 200" for every request. Useful for debugging.
app.use(morgan('dev'));

// 5. JSON Parser: Allows the app to understand JSON data sent in the request body.
app.use(express.json());

// 6. Cookie Parser: Allows the app to read cookies (where we store our login tokens).
app.use(cookieParser());

/**
 * ROUTES DEFINITION
 * Map URLs to their respective logic.
 */
app.use("/api/auth", authRoute);         // Login, Register, Logout
app.use("/api/user", userRoute);         // Profiles, Search, User settings
app.use("/api/thread", threadRoute);     // Posts (called 'threads' here)
app.use("/api/like", likeRouter);        // Like/Unlike logic
app.use("/api/follower", followerRoute); // Follow/Unfollow/Requests
app.use("/api/notification", notificationRoute); // User notifications
app.use("/api/search", require("./routes/search.route")); // Search functionality
//testing
app.use("/",(req,res)=>{
  res.send("Welcome to the Social Media API")
})
// Export the app to be used in server.js
module.exports = app;