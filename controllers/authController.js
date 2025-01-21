const User = require("../model/user");
const crypto = require("crypto");
const sendToken = require("../utils/jwtToken");
const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const bcrypt = require("bcryptjs");
const { isErrored } = require("stream");
const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.registerUser = async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
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

  const stripeCustomer = await stripe.customers.create({
    name: name,
    email: email,
  });

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.url,
    },
    stripeCustomerId: stripeCustomer.id,
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

exports.createUser = async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
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

  const stripeCustomer = await stripe.customers.create({
    name: name,
    email: email,
  });

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.url,
    },
    stripeCustomerId: stripeCustomer.id,
    isDeleted: false,
    role: role,
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

    // console.log("Login successful");
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

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addUserAddress = async (req, res, next) => {
  try {
    const { _id, lotNum, street, baranggay, city } = req.body;

    if (!_id || !lotNum || !street || !baranggay || !city) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: { lotNum, street, baranggay, city },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Address added successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    // console.log(users)
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { _id, name, email, role } = req.body
    let user = await User.findById({ "_id": _id });

    const imageUrl = req.file.path;

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'avatars',
      width: 150,
      crop: "scale"
    });

    user.name = name;
    user.email = email;
    user.role = role;
    user.image = { public_id: result.public_id, url: result.secure_url };

    // console.log(user)

    user = await User.findByIdAndUpdate(_id, user, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: 'Update User Server Error'
    });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'User successfully deleted',
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: 'Delete User Server Error',
    });
  }
};