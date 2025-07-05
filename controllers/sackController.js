const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Sack = require("../model/sack");
const AddToSack = require("../model/addtosack");
const User = require("../model/user");
const Pickup = require("../model/pickup");
const { default: mongoose } = require('mongoose');
const Notification = require("../model/notification");
const sendPushNotification = require('../utils/sendNotification');

const sackController = {
    createSack: async (req, res) => {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "avatars",
                width: 200,
                crop: "scale",
            });

            const { description, kilo, dbSpoil, seller, stallNumber, sackStatus } = req.body;

            const createdDate = new Date();
            const spoilDate = new Date(createdDate);
            spoilDate.setDate(spoilDate.getDate() + (sackStatus === 'spoiled' ? 1 : parseInt(dbSpoil || 0, 10)));

            const sack = await Sack.create({
                seller,
                stallNumber,
                kilo,
                dbSpoil: spoilDate,
                description,
                location: 'New Public Market, Taytay, Rizal',
                status: sackStatus,
                images: {
                    public_id: result.public_id,
                    url: result.secure_url,
                },
            });

            const sellerData = await User.findById(seller);
            const { stallDescription, stallAddress, stallImage, status, openHours, closeHours } = sellerData.stall;

            const recipients = await User.find({
                role: { $nin: ['vendor', 'admin'] },
                _id: { $ne: seller },
            });


            const notifications = recipients.map(user => ({
                user: user._id,
                message: `New sack posted by ${sellerData.name} at Stall #${stallNumber}.`,
                type: sackStatus === 'spoiled' ? 'spoiled' : 'new_sack',
                stall: {
                    stallImage: {
                        public_id: stallImage?.public_id || '',
                        url: stallImage?.url || '',
                    },
                    status,
                    stallDescription,
                    stallNumber,
                    stallAddress,
                    openHours,
                    closeHours,
                    user: sellerData._id,
                },
                sackImage: {
                    public_id: result.public_id,
                    url: result.url,
                },
            }));

            await Notification.insertMany(notifications);

            // ✅ Send push notifications only to farmers and composters — excluding the seller
            for (const user of recipients) {
                const isSeller = user._id.toString() === seller.toString();
                const isTargetRole = ['farmer', 'composter'].includes(user.role);

                if (!isSeller && isTargetRole && user.expoPushToken) {
                    let title = 'New Sack';
                    if (sackStatus === 'spoiled' && user.role === 'composter') {
                        title = 'Spoiled Sack Alert';
                    } else if (user.role === 'farmer') {
                        title = 'New Sack Available';
                    }

                    const body = `New sack posted by ${sellerData.name} at Stall #${stallNumber}.`;
                    const targetRole = user.role
                    console.log(`🔔 Notifying: ${user.name} (Role: ${user.role}) | ID: ${user._id} | Token: ${user.expoPushToken}`);
                    await sendPushNotification(user.expoPushToken, title, body, targetRole);
                }
            }


            res.status(200).send({
                success: true,
                message: "Post Sack Successfully",
                sack,
            });
        } catch (error) {
            console.error("Create Sack Error:", error.message, error.stack);
            res.status(500).send({
                success: false,
                message: "Error In Post API",
                error: error.message || error.toString(),
            });
        }
    },
    deleteSack: async (req, res) => {
        try {
            const sackId = req.params.id;
            const deletedSack = await Sack.findByIdAndDelete(sackId)
            res.status(200).json({ message: 'Deleted Sack Approved.', deletedSack })
        } catch (error) {
            res.status(400).json({ mesage: 'Deleted Sack Error.' })
        }
    },
    addToSack: async (req, res) => {
        try {
            const { id } = req.params;
            const item = req.body;

            let existingAddToSack = await AddToSack.findOne({ user: id });

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
                        status: item.status,
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
            const sellerData = await User.findById(id);
            const { stallDescription, stallAddress, stallNumber, stallImage, status, openHours, closeHours } = sellerData.stall;

            const nowUTC8 = new Date(Date.now() + 8 * 60 * 60 * 1000);

            const notifications = [];
            const updatedSacks = sacks.map(sack => {
                const spoilageDate = new Date(sack.dbSpoil);
                const daysPast = (nowUTC8 - spoilageDate) / (1000 * 60 * 60 * 24);

                if (daysPast >= 3 && sack.status === "spoiled") {
                    sack.status = "trashed";

                    notifications.push({
                        user: sack.seller,
                        message: ` Your sack has been trashed: ${sack.description}`,
                        type: "trashed",
                        stall: {
                            stallImage: {
                                public_id: stallImage?.public_id || '',
                                url: stallImage?.url || '',
                            },
                            status,
                            stallDescription,
                            stallNumber,
                            stallAddress,
                            openHours,
                            closeHours,
                            user: sellerData._id,
                        },
                    });
                } else if (spoilageDate.getTime() <= nowUTC8.getTime() && sack.status === "posted") {
                    sack.status = "spoiled";

                    notifications.push({
                        user: sack.seller,
                        message: `The waste ${sack.description} was spoiled ${sack.stallNumber}`,
                        type: "spoiled",
                        stall: {
                            stallImage: {
                                public_id: stallImage?.public_id || '',
                                url: stallImage?.url || '',
                            },
                            status,
                            stallDescription,
                            stallNumber,
                            stallAddress,
                            openHours,
                            closeHours,
                            user: sellerData._id,
                        },
                    });
                }

                return sack;
            }).filter(sack => sack.isModified("status"));

            await Promise.all(updatedSacks.map(sack => sack.save()));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            res.status(200).json({ message: "Sacks fetched successfully", sacks });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    getAllSacks: async (req, res) => {
        try {
            const sacks = await Sack.find();
            const nowUTC8 = new Date(Date.now() + 8 * 60 * 60 * 1000);
            const notifications = [];

            const updatedSacks = await Promise.all(sacks.map(async (sack) => {
                const sellerData = await User.findById(sack.seller);
                if (!sellerData) return sack;

                const {
                    stallDescription,
                    stallAddress,
                    stallImage,
                    stallNumber,
                    status,
                    openHours,
                    closeHours
                } = sellerData.stall;

                const spoilageDate = new Date(sack.dbSpoil);
                const daysPast = (nowUTC8 - spoilageDate) / (1000 * 60 * 60 * 24);

                if (daysPast >= 3 && sack.status === "spoiled") {
                    sack.status = "trashed";

                    notifications.push({
                        user: sack.seller,
                        message: `Your sack has been trashed: ${sack.description}`,
                        type: "trashed",
                        stall: {
                            stallImage: {
                                public_id: stallImage?.public_id || '',
                                url: stallImage?.url || '',
                            },
                            status,
                            stallDescription,
                            stallNumber,
                            stallAddress,
                            openHours,
                            closeHours,
                            user: sellerData._id,
                        },
                    });
                } else if (spoilageDate.getTime() <= nowUTC8.getTime() && sack.status === "posted") {
                    sack.status = "spoiled";

                    notifications.push({
                        user: sack.seller,
                        message: `The waste ${sack.description} was spoiled`,
                        type: "spoiled",
                        stall: {
                            stallImage: {
                                public_id: stallImage?.public_id || '',
                                url: stallImage?.url || '',
                            },
                            status,
                            stallDescription,
                            stallNumber,
                            stallAddress,
                            openHours,
                            closeHours,
                            user: sellerData._id,
                        },
                    });
                }

                return sack;
            }));

            // Filter only sacks where status changed (you might want to do this before saving)
            const sacksToSave = updatedSacks.filter(sack => sack.isModified("status"));
            await Promise.all(sacksToSave.map(sack => sack.save()));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            res.status(200).json({ message: "Sacks fetched successfully", sacks });
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
    deleteMySackItem: async (req, res) => {
        try {
            const { addToSackId, sackId } = req.params;

            const updatedDoc = await AddToSack.findByIdAndUpdate(
                addToSackId,
                { $pull: { sacks: { sackId: new mongoose.Types.ObjectId(sackId) } } },
                { new: true }
            );

            if (!updatedDoc) {
                return res.status(404).json({ message: "Sack not found" });
            }

            res.status(200).json({ message: "Sack deleted successfully", updatedDoc });
        } catch (error) {
            console.error("Error deleting sack:", error.message);
            res.status(500).json({ message: "Server error while deleting sack" });
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
            console.log(pickUpSacks)
            res.status(201).json({ message: "Sacks fetched successfully", pickUpSacks });
        } catch (error) {
            console.error("Fetch All Sacks Error Backend:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    getAllPickupSackStatus: async (req, res) => {
        try {
            const pickups = await Pickup.find().sort({ createdAt: -1 });
            // console.log(users)
            return res.status(200).json({
                success: true,
                pickups,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
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

            // 🛎️ Notify each seller
            const notifications = mySack.flatMap(entry =>
                entry.sacks.map(async (sack) => {
                    // Create DB Notification
                    await Notification.create({
                        user: sack.seller,
                        type: 'pickup',
                        message: `Your sack at Stall #${sack.stallNumber} has been requested for pickup.`,
                    });

                    // 🔔 Send Push Notification if seller has expoPushToken
                    const seller = await User.findById(sack.seller);
                    if (seller?.expoPushToken) {
                        await sendPushNotification(
                            seller.expoPushToken,
                            'Pickup Request',
                            `Your sack at Stall #${sack.stallNumber} has been requested for pickup.`,
                            seller.role // optional: useful if you want to track by role
                        );
                        console.log(`🔔 Push sent to ${seller.name} (Role: ${seller.role})`);
                    }
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
            console.error("Pickup Sacks Error:", error.message);
            res.status(500).json({ message: "Fetch Sacks Error Backend" });
        }
    },
    deleteAddedSack: async (req, res) => {
        try {
            const { id } = req.params;
            const { sackIds, status } = req.body;

            if (!sackIds || sackIds.length === 0) {
                return res.status(400).json({ message: "No sack IDs provided" });
            }

            const newStatus = status || "posted"; // default to posted if not provided

            console.log("Sack IDs:", sackIds);
            console.log("Status to set:", newStatus);

            await Sack.updateMany(
                { _id: { $in: sackIds } },
                { $set: { status: newStatus } }
            );

            const result = await Pickup.findByIdAndDelete(id);
            console.log(result, 'result');

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

            // Fetch pickup and populate 'user'
            const pickup = await Pickup.findById(id).populate('user');

            if (!pickup) {
                return res.status(404).json({ message: "Pickup not found" });
            }

            // ✅ Manually populate each sack's seller (since sacks is embedded, not a ref)
            await Promise.all(
                pickup.sacks.map(async (sack, index) => {
                    const populatedSeller = await User.findById(sack.seller);
                    pickup.sacks[index].seller = populatedSeller;
                })
            );

            // Update pickup status
            pickup.status = 'pickup';
            await pickup.save();

            const userName = pickup.user.name;

            // Send notifications
            const notifications = pickup.sacks.map(async (sack) => {
                const seller = sack.seller;

                // 🛎 Create in-app notification
                await Notification.create({
                    user: seller._id,
                    type: 'pickup',
                    pickupId: id,
                    message: `${userName} is on the way to pick up the sack from your Stall #${sack.stallNumber}.`,
                });

                // 🔔 Push notification
                if (seller?.expoPushToken) {
                    await sendPushNotification(
                        seller.expoPushToken,
                        'Pickup In Progress',
                        `${userName} is on the way to pick up the sack from your Stall #${sack.stallNumber}.`,
                        seller.role // ✅ Now this should be available
                    );
                    console.log(`🔔 Notified ${seller.name} (Role: ${seller.role})`);
                }
            });

            await Promise.all(notifications);

            return res.status(200).json({
                message: "Pickup started, sellers notified!",
                pickup,
            });

        } catch (error) {
            console.error("Error updating pickups:", error);
            return res.status(500).json({ message: "Server error" });
        }
    },
    sackStatusClaimed: async (req, res) => {
        try {
            const { sackIds } = req.body;

            if (!sackIds || sackIds.length === 0) {
                return res.status(400).json({ message: "No sack IDs provided" });
            }

            // Update sack status to claimed
            await Sack.updateMany(
                { _id: { $in: sackIds } },
                { $set: { status: "claimed" } }
            );

            const sacks = await Sack.find({ _id: { $in: sackIds } }).populate({
                path: 'seller',
                select: 'name role expoPushToken',
            });

            // Notify each seller
            const notifications = sacks.map(async (sack) => {
                // In-app notification
                await Notification.create({
                    user: sack.seller._id,
                    type: 'claimed',
                    message: `Your sack at Stall #${sack.stallNumber} has been marked as claimed.`,
                });

                // Push notification
                const seller = sack.seller;
                if (seller?.expoPushToken) {
                    await sendPushNotification(
                        seller.expoPushToken,
                        'Sack Claimed',
                        `Your sack at Stall #${sack.stallNumber} has been marked as claimed.`,
                        seller.role
                    );
                    console.log(`🔔 Notified ${seller.name} (Role: ${seller.role})`);
                }
            });

            await Promise.all(notifications);

            res.status(200).json({ message: "Sack was claimed successfully!", sacks });
        } catch (error) {
            console.error("Error updating sack:", error);
            res.status(500).json({ message: "Server error" });
        }
    },
    completePickUp: async (req, res) => {
        try {
            const { id } = req.params;

            const pickup = await Pickup.findById(id).populate('sacks.seller');
            if (!pickup) {
                return res.status(404).json({ message: "Pickup not found!" });
            }

            const updatedSacks = [];
            let totalKilo = 0;
            for (const item of pickup.sacks) {
                const sack = await Sack.findById(item.sackId);
                if (!sack) continue;

                if (sack.status === "claimed") {
                    updatedSacks.push(item.sackId);
                    totalKilo += Number(sack.kilo) || 0;
                } else {
                    item.status = "cancelled";
                    await Sack.findByIdAndUpdate(item.sackId, { status: "posted" });
                }
            }

            pickup.markModified('sacks');
            pickup.status = "completed";
            pickup.totalKilo = totalKilo;
            pickup.pickupTimestamp = new Date();
            pickup.pickedUpDate = new Date(Date.now() + 8 * 60 * 60 * 1000);
            await pickup.save();

            await Sack.updateMany(
                { _id: { $in: updatedSacks } },
                { $set: { status: "claimed" } }
            );

            const claimedSacks = await Sack.find({ _id: { $in: updatedSacks } }).populate('seller');
            const notifySellers = claimedSacks.map(async sack => {
                const seller = sack.seller;

                await Notification.create({
                    user: seller._id,
                    type: 'pickup_completed',
                    pickupId: id,
                    message: `Your sack at Stall #${sack.stallNumber} has been successfully picked up.`,
                });

                if (seller?.expoPushToken) {
                    await sendPushNotification(
                        seller.expoPushToken,
                        'Pickup Complete',
                        `Your sack at Stall #${sack.stallNumber} has been successfully picked up.`,
                        seller.role
                    );
                    console.log(`🔔 Notified ${seller.name} about pickup completion.`);
                }
            });

            await Promise.all(notifySellers);

            return res.status(200).json({
                message: "Pickup completed. Unclaimed sacks marked as cancelled.",
                pickup,
            });

        } catch (error) {
            console.error("Error in completing pickup:", error);
            return res.status(500).json({ message: "Error in completing pickup!" });
        }
    },
    rateTransaction: async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, review } = req.body;

            const sack = await Sack.findById(id).populate('seller');
            if (!sack || !sack.seller) {
                return res.status(404).json({ message: "Sack or seller not found" });
            }

            // ✅ Prevent duplicate reviews
            if (sack.reviewed) {
                return res.status(400).json({ message: "Sack has already been reviewed." });
            }

            const seller = await User.findById(sack.seller._id);
            if (!seller) {
                return res.status(404).json({ message: "Seller not found" });
            }

            if (!Array.isArray(seller.stall.rating)) {
                seller.stall.rating = [];
            }
            if (!Array.isArray(seller.stall.review)) {
                seller.stall.review = [];
            }
            seller.stall.rating.push({ value: rating, date: new Date() });
            seller.stall.review.push({ text: review, date: new Date() });

            await seller.save();
            sack.reviewed = true;
            await sack.save();

            return res.status(200).json({ message: "Seller rated successfully", seller });
        } catch (error) {
            console.error("Error rating seller from sack:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};
module.exports = sackController;