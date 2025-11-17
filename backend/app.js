const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const ApiError = require('./utils/apiError');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary');
const connectDB = require('./config/database');
const app = express();
app.use(cors());

const userRoute = require('./routes/user');
const productRoute = require('./routes/product');
const orderRoute = require('./routes/order');  
const categoryRoute = require('./routes/category');

admin.initializeApp({
  credential: admin.credential.cert(require('./config/sneakpeak-ecommerce-firebase-adminsdk-fbsvc-7bdd58af77.json')),
});

connectDB();

try {
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
console.log(`Cloudinary: Connected to ${process.env.CLOUDINARY_NAME}`)
} catch {
    console.log(`Cloudinary failed to connect. ${err});
    }`)
}

app.use((err, req, res, next) => {
  // If it's an instance of your custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(process.env.NODE_ENV === 'development' && { status: err.status }),
    });
  }

  // Otherwise, default to 500 Internal Server Error
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.use('api/v1/users', userRoute);
app.use('api/v1/products', productRoute);
app.use('api/v1/orders', orderRoute);
app.use('api/v1/category', categoryRoute);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

module.exports = app;