const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Sack = require("../model/sack");
const AddToSack = require("../model/addtosack");
const Pickup = require("../model/pickup");
const { default: mongoose } = require('mongoose');

const sackController = {
    createSack: async (req, res) => {
        try {
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

            const { description, location, kilo, dbSpoil, seller, stallNumber } = req.body;
            // console.log(dbSpoil, 'dbSpoil')

            const createdDate = new Date();

            const spoilDate = new Date(createdDate);
            spoilDate.setDate(spoilDate.getDate() + parseInt(dbSpoil, 10));
            // console.log(spoilDate, 'spoilDate')

            const sack = await Sack.create({
                seller,
                stallNumber,
                kilo,
                dbSpoil: spoilDate,
                description,
                location,
                status: 'posted',
                images: {
                    public_id: result.public_id,
                    url: result.url,
                },
            });

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
    getPickUpSacks: async (req, res) => {
        try {
            const { id } = req.params;
            // console.log(id)

            const pickUpSacks = await Pickup.find({ user: id });
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
            const { mySack, totalKilos } = req.body
            // console.log(id)
            // console.log(mySack)

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

            await Sack.updateMany(
                { _id: { $in: sackIds } },
                { $set: { status: "posted" } }
            );

            const result = await Pickup.findByIdAndDelete(id);

            res.status(200).json({ message: "pickupSack deleted successfully!" });

        } catch (error) {
            console.error("Error deleting pickupSack:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};
module.exports = sackController;