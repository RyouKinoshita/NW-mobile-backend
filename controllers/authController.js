const User = require("../model/user");
const crypto = require("crypto");
const sendToken = require("../utils/jwtToken");
const {cloudinary, secretKey} = require('../config/cloudinaryConfig')
const bcrypt = require("bcryptjs");

exports.registerUser = async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  const result = await cloudinary.v2.uploader.upload(
    req.file.path,
    {
      folder: "avatars",
      width: 200,
      crop: "scale",
    },
    (err, res) => {
      console.log(err, res);
    }
  );

  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.url,
    },
    isDeleted: false,
  });

  if (!user) {
    return res.status(500).json({
      success: false,
      message: "Failed to create an account",
    });
  }

  sendToken(user, 200, res);
};

exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter email & password" });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid Email or Password" });
    }
    if (user.isDeleted) {
      return res.status(401).json({
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      console.log("Password does not match");
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    console.log("Login successful");
    sendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.logout = async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
};

