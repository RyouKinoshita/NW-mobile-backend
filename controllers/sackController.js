const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Sack = require("../model/sack");
const AddToSack = require("../model/addtosack");
const User = require("../model/user");
const Pickup = require("../model/pickup");
const { default: mongoose } = require('mongoose');
const Notification = require("../model/notification");

const sackController = {
    createSack: async (req, res) => {
        try {
            const result = await cloudinary.v2.uploader.upload(
                req.file.path,
                {
                    folder: "avatars",
                    width: 200,
                    crop: "scale",
                }
            );

            const { description, kilo, dbSpoil, seller, stallNumber } = req.body;

            const createdDate = new Date();
            const spoilDate = new Date(createdDate);
            spoilDate.setDate(spoilDate.getDate() + parseInt(dbSpoil, 10));

            const sack = await Sack.create({
                seller,
                stallNumber,
                kilo,
                dbSpoil: spoilDate,
                description,
                location: 'New Public Market, Taytay, Rizal',
                status: 'posted',
                images: {
                    public_id: result.public_id,
                    url: result.url,
                },
            });

            // Find all farmers
            const farmers = await User.find({ role: "farmer" });
            const sellerData = await User.findById(seller);

            // Create notifications for farmers
            const notifications = farmers.map(farmer => ({
                user: farmer._id,
                message:`New sack posted by ${sellerData.name} at Stall #${stallNumber}.`,
                type: "new_sack"
            }));

            await Notification.insertMany(notifications); // Save notifications

            res.status(200).send({
                success: true,
                message: "Post Sack Successfully",
                sack
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                success: false,
                message: "Error In Post API",
                error,
            });
        }
    },
    addToSack: async (req, res) => {
        try {
            const { id } = req.params;
            const item = req.body;

            let existingAddToSack = await AddToSack.findOne({ user: id });
            // const sack = await Sack.findById(item._id)

            // sack.status = 'pickup'

            // await sack.save()

            if (existingAddToSack) {
                if (existingAddToSack.status !== "pending") {
                    return res.status(400).json({ message: "Cannot add to sack. Status is already in confirmation." });
                }

                const isSackExists = existingAddToSack.sacks.some(sack => sack.sackId.toString() === item._id);

                if (!isSackExists) {
                    existingAddToSack.sacks.push({
                        sackId: item._id,
                        seller: item.seller,
                        stallNumber: item.stallNumber,
                        kilo: item.kilo,
                        dbSpoil: item.dbSpoil,
                        description: item.description,
                        location: item.location,
                        status: item.location,
                        images: item.images,
                    });

                    await existingAddToSack.save();
                    return res.status(200).json({ message: "Sack added successfully!", data: existingAddToSack });
                } else {
                    return res.status(400).json({ message: "Sack is already in the list!" });
                }
            } else {
                const newAddToSack = new AddToSack({
                    user: id,
                    sacks: [{
                        sackId: item._id,
                        seller: item.seller,
                        stallNumber: item.stallNumber,
                        kilo: item.kilo,
                        dbSpoil: item.dbSpoil,
                        description: item.description,
                        location: item.location,
                        images: item.images,
                    }],
                    status: "pending",
                });

                await newAddToSack.save();
                return res.status(201).json({ message: "Sack added successfully!", data: newAddToSack });
            }
        } catch (error) {
            console.error("Error adding to sack:", error);
            res.status(500).json({ message: "Internal Server Error", error });
        }
    },
    getStoreSacks: async (req, res) => {
        try {
            const { id } = req.params;

            let sacks = await Sack.find({ seller: id });

            const nowUTC8 = new Date(Date.now() + 8 * 60 * 60 * 1000);

            // Update status for spoiled sacks
            sacks = sacks.map(sack => {
                const spoilageDate = new Date(sack.dbSpoil);
                if (spoilageDate.getTime() <= nowUTC8.getTime() && sack.status !== "spoiled") {
                    sack.status = "spoiled";
                }
                return sack;
            });
            await Promise.all(sacks.map(sack => sack.save()));

            res.status(200).json({ message: "Sacks fetched successfully", sacks });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    getAllSacks: async (req, res) => {
        try {
            const sacks = await Sack.find()
            console.log(sacks)
            return res.status(200).json({ message: "Sacks fetched successfully!", sacks });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    getMySacks: async (req, res) => {
        try {
            const { id } = req.params;
            // console.log(id)

            const mySack = await AddToSack.find({ user: id });
            // console.log(mySack)
            res.status(201).json({ message: "Sacks fetched successfully", mySack });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    getSacks: async (req, res) => {
        try {
            const { sackIds } = req.query;

            if (!sackIds) {
                return res.status(400).json({ message: "No sack IDs provided" });
            }

            const sacks = await Sack.find({ _id: { $in: sackIds } });
            // console.log("Fetched Sacks:", sacks);

            if (!sacks.length) {
                return res.status(404).json({ message: "Sacks not found" });
            }

            res.status(200).json({ message: "Sacks fetched successfully", sacks });
        } catch (error) {
            console.error("Error fetching sacks:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    getPickUpSacks: async (req, res) => {
        try {
            const { id } = req.params;
            // console.log(id)

            const pickUpSacks = await Pickup.find({ user: id }).sort({ createdAt: -1 });
            // console.log(pickUpSacks)
            res.status(201).json({ message: "Sacks fetched successfully", pickUpSacks });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    pickupSacks: async (req, res) => {
        try {
            const { id } = req.params;
            const { mySack, totalKilos } = req.body;

            if (!mySack || mySack.length === 0) {
                return res.status(400).json({ message: "No sacks provided for pickup." });
            }

            const userId = mySack[0]?.user;
            const now = new Date();
            const utcPlus8 = new Date(now.getTime() + (8 * 60 * 60 * 1000));
            utcPlus8.setHours(utcPlus8.getHours() + 24);

            const sackIds = mySack.flatMap(entry => entry.sacks.map(sack => sack.sackId));

            await Sack.updateMany(
                { _id: { $in: sackIds } },
                { $set: { status: "pickup" } }
            );

            const newPickup = new Pickup({
                user: userId,
                sacks: mySack.flatMap(entry =>
                    entry.sacks.map(sack => ({
                        sackId: sack.sackId,
                        seller: sack.seller,
                        stallNumber: sack.stallNumber,
                        kilo: sack.kilo,
                        dbSpoil: sack.dbSpoil,
                        description: sack.description,
                        location: sack.location,
                        images: sack.images,
                    }))
                ),
                status: "pending",
                totalKilo: totalKilos,
                pickupTimestamp: utcPlus8,
            });

            // Notify each seller
            const notifications = mySack.flatMap(entry =>
                entry.sacks.map(async (sack) => {
                    await Notification.create({
                        user: sack.seller,
                        type: 'pickup',
                        message: `Your sack at Stall # ${sack.stallNumber} has been requested for pickup.`,
                    });
                })
            );
            await Promise.all(notifications);

            const deleteMySack = await AddToSack.findById(id);
            if (!deleteMySack) {
                return res.status(404).json({ message: "pickupSack not found" });
            }

            await deleteMySack.deleteOne();
            await newPickup.save();

            return res.status(201).json({ message: "Pickup created successfully!", data: newPickup });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    deleteAddedSack: async (req, res) => {
        try {
            const { id } = req.params;
            const { sackIds } = req.body;

            if (!sackIds || sackIds.length === 0) {
                return res.status(400).json({ message: "No sack IDs provided" });
            }

            // console.log("Sack IDs:", sackIds);

            await Sack.updateMany(
                { _id: { $in: sackIds } },
                { $set: { status: "posted" } }
            );

            // console.log(sack, 'Sack update post')

            const result = await Pickup.findByIdAndDelete(id);
            res.status(200).json({ message: "pickupSack deleted successfully!" });
        } catch (error) {
            console.error("Error deleting pickupSack:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getPickupsBySeller: async (req, res) => {
        try {
            const sellerId = req.params.sellerId;
            const pickups = await Pickup.find({ "sacks.seller": sellerId }).sort({ createdAt: -1 });

            if (!pickups.length) {
                return res.status(404).json({ message: "No pickups found for this seller." });
            }
            res.status(200).json(pickups);
        } catch (error) {
            console.error("Error fetching pickups:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    pickupSacksNow: async (req, res) => {
        try {
            const { id } = req.params;
            const pickup = await Pickup.findById(id).populate('user').populate('sacks.seller');
            if (!pickup) {
                return res.status(404).json({ message: "Pickup not found" });
            }

            pickup.status = 'pickup';
            await pickup.save();

            const userName = pickup.user.name;

            const notifications = pickup.sacks.map(async (sack) => {
                return Notification.create({
                    user: sack.seller._id,
                    type: 'pickup',
                    message: `${userName} is now picking up your sack from Stall #${sack.stallNumber}.`,
                });
            });

            await Promise.all(notifications);

            res.status(200).json({ message: "Pickup started, sellers notified!", pickup });
        } catch (error) {
            console.error("Error updating pickups:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    sackStatusClaimed: async (req, res) => {
        try {
            const { sackIds } = req.body;
            // console.log(sackIds)
            if (!sackIds || sackIds.length === 0) {
                return res.status(400).json({ message: "No sack IDs provided" });
            }

            await Sack.updateMany(
                { _id: { $in: sackIds } },
                { $set: { status: "claimed" } }
            );
            const sacks = await Sack.find({ _id: { $in: sackIds } });

            res.status(200).json({ message: "Sack was claimed successfully!", sacks });
        } catch (error) {
            console.error("Error updating sack:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    completePickUp: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await Pickup.findByIdAndUpdate(
                id,
                { status: "completed" },
                { new: true }
            );

            if (!result) {
                return res.status(404).json({ message: "Pickup not found!" });
            }

            res.status(200).json({ message: "Pickup was completed successfully!", pickup: result });
        } catch (error) {
            console.error("Error in completing pickup:", error);
            return res.status(500).json({ message: "Error in completing pickup!" });
        }
    },
};
module.exports = sackController;