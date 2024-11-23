// cloudinaryConfig.js
const cloudinary = require('cloudinary');
const crypto = require('crypto');

// Function to generate a secret key
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dlvhuve7b',
  api_key: '955458541267245',
  api_secret: 'rkWcakTyKVuyFY-rd3R6t49Ho6Y',
});

const secretKey = generateSecretKey();

module.exports = { cloudinary, secretKey };

