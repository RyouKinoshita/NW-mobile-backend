const User = require("../model/user");
const Pickup = require("../model/pickup");
const crypto = require("crypto");
const sendToken = require("../utils/jwtToken");
const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const bcrypt = require("bcryptjs");
const { isErrored } = require("stream");
const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.registerUser = async (req, res, next) => {
  const result = await cloudinary.uploader.upload(
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
      url: result.secure_url,
    },
    role,
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
  const result = await cloudinary.uploader.upload(
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
      url: result.secure_url,
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
      return res.status(403).json({ message: "Account has been deleted" });
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
    const user = await User.findById(userId);
    console.log(user)

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
    console.log(req.body)
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
    user.avatar = { public_id: result.public_id, url: result.secure_url };

    // console.log(user.avatar)

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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isDeleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User soft-deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Delete User Server Error",
    });
  }
};

exports.restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || !user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found or not deleted" });
    }

    user.isDeleted = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User restored successfully",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Restore User Server Error",
    });
  }
};


exports.setStripeKeys = async (req, res, next) => {
  try {
    const { _id, stripeSecretKey, stripePublishableKey } = req.body
    let user = await User.findById({ "_id": _id });

    user.stripeSecretKey = stripeSecretKey;
    user.stripePublishableKey = stripePublishableKey;

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
exports.getPublishableKey = async (req, res, next) => {
  const { id } = req.params;
  // console.log(id)
  try {
    if (!id) {
      return res.status(400).json({ message: "Seller ID is required." });
    }
    const seller = await User.findById(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found." });
    }
    if (!seller.stripePublishableKey) {
      return res.status(404).json({ message: "Stripe publishable key not found for this seller." });
    }
    res.status(200).json({ publishableKey: seller.stripePublishableKey });
  } catch (error) {
    console.error("Error fetching publishable key:", error);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

exports.getVendorStall = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("stall");

    if (!user || !user.stall) {
      return res.status(404).json({
        success: false,
        message: "Stall not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      stall: user.stall,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addVendorStall = async (req, res, next) => {
  try {
    const { stallDescription, stallAddress, stallNumber, openHours, closeHours } = req.body;
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ success: false, message: "Vendor ID is required." });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let stallImage = {};

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "stalls",
        width: 400,
        crop: "scale",
      });

      stallImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: { "stall": { stallDescription, stallAddress, stallNumber, stallImage, openHours, closeHours, user: _id } } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    // console.log(updatedUser, 'Updated user')

    res.status(200).json({
      success: true,
      message: "Stall added successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error adding stall:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.getAllStalls = async (req, res, next) => {
  try {
    const stalls = await User.find({
      role: "vendor",
      "stall.stallDescription": { $exists: true, $ne: null },
    }).select("stall name _id");

    console.log(stalls)
    return res.status(200).json({
      success: true,
      stalls, // Return only stall data
    });
  } catch (error) {
    console.error("Error fetching stalls:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.stallStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { "stall.status": status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ success: true, stallStatus: user.stall.status });
  } catch (error) {
    console.error("Error Updating Stall Status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.chatUsers = async (req, res, next) => {
  try {
    const ids = req.query.ids.split(",");
    const users = await User.find({ _id: { $in: ids } }).select("name avatar.url role");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.getRatingsReview = async (req, res, next) => {
  try {
    const usersWithRatings = await User.find({
      "stall.rating": { $exists: true, $ne: null },
      "stall.review": { $exists: true, $ne: null }
    })
      .select("name email stall.rating stall.review createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: usersWithRatings,
    });
  } catch (error) {
    console.error("Error fetching stall reviews and ratings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not retrieve reviews and ratings.",
    });
  }
};

exports.pickupFarmer = async (req, res, next) => {
  try {
    const farmerData = await Pickup.aggregate([
      { $unwind: "$sacks" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      { $match: { "userInfo.role": "farmer" } },

      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          totalKilo: {
            $sum: { $toDouble: "$sacks.kilo" }
          }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    res.status(200).json({ data: farmerData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching farmer kilos per day", error });
  }
};

exports.pickupComposter = async (req, res, next) => {
  try {
    const composterData = await Pickup.aggregate([
      { $unwind: "$sacks" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      { $match: { "userInfo.role": "composter" } },

      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          totalKilo: {
            $sum: { $toDouble: "$sacks.kilo" }
          }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    res.status(200).json({ data: composterData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching composter kilos per day", error });
  }
};

exports.userEditVendor = async (req, res) => {
  try {
    const userId = req.params.id;

    const {
      name,
      email,
      phone,
      lotNum,
      street,
      baranggay,
      city,
      stallDescription,
      stallAddress,
      stallNumber,
      openHours,
      closeHours,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Vendor not found" });

    if (req.files?.avatar) {
      if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }

      const avatarResult = await cloudinary.uploader.upload(
        req.files.avatar[0].path,
        {
          folder: "avatars",
          width: 300,
          crop: "scale",
        }
      );

      user.avatar = {
        public_id: avatarResult.public_id,
        url: avatarResult.secure_url,
      };
    }

    if (req.files?.stallImage) {
      if (user.stall?.stallImage?.public_id) {
        await cloudinary.uploader.destroy(user.stall.stallImage.public_id);
      }

      const stallResult = await cloudinary.uploader.upload(
        req.files.stallImage[0].path,
        {
          folder: "stall_images",
          width: 500,
          crop: "scale",
        }
      );

      user.stall.stallImage = {
        public_id: stallResult.public_id,
        url: stallResult.secure_url,
      };
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    user.address = { lotNum, street, baranggay, city };

    if (!user.stall) {
      user.stall = {};
    }

    if (stallDescription !== undefined) user.stall.stallDescription = stallDescription;
    if (stallAddress !== undefined) user.stall.stallAddress = stallAddress;
    if (stallNumber !== undefined) user.stall.stallNumber = stallNumber;
    if (openHours !== undefined) user.stall.openHours = openHours;
    if (closeHours !== undefined) user.stall.closeHours = closeHours;

    await user.save();

    res.status(200).json({ message: "Vendor updated successfully", user });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ message: "Error editing vendor", error });
  }
};