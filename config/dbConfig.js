const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Specify the correct path to the config.env file
const envPath = path.resolve(__dirname, 'config.env');
dotenv.config({ path: envPath });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log("Error connecting to MongoDB", err);
        process.exit(1); 
    }
};

module.exports = connectDB;