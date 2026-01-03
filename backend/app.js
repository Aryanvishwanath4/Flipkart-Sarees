const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const errorMiddleware = require("./middlewares/error");
const cloudinary = require("cloudinary");

const app = express();

// config
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware for handling file uploads and JSON
app.use(fileUpload());
app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

const user = require("./routes/userRoute");
const product = require("./routes/productRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const otp = require("./routes/otpRoute");
const razorpay = require("./routes/razorpayRoute");

app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/v1", otp);
app.use("/api/v1", razorpay);

// error middleware
app.use(errorMiddleware);

module.exports = app;
