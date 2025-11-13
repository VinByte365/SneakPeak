const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const cloudinary = require('cloudinary');
const connectDB = require('./config/database');
const app = express();
app.use(cors());

const userRoute = require('./routes/user');
const productRoute = require('./routes/product');
const orderRoute = require('./routes/order');

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

app.use('api/v1/users', userRoute);
app.use('api/v1/products', productRoute);
app.use('api/v1/orders', orderRoute);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

module.exports = app;