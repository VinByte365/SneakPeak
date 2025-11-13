const mongoose = require('mongoose');

const connectDB = () => {
    mongoose.mongoose.connect(process.env.ATLAS_URI).then(con => {
        console.log(`MongoDB connected: ${con.connection.host}`);
    })
}

module.exports = connectDB;