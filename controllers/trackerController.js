const { cloudinary, secretKey } = require('../config/cloudinaryConfig')
const Tracker = require("../model/tracker")

exports.inputTrack = async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(
            req.file.path,
            {
                folder: "avatars",
                width: 200,
                crop: "scale",
            }
        );

        const { userId, notice, kilo, pigName, feed } = req.body;

        // Find existing tracker for the same user and pigName
        let existingTracker = await Tracker.findOne({ userId, pigName });

        const newTrackEntry = {
            weight: kilo,
            feed,
            image: [
                {
                    public_id: result.public_id,
                    url: result.secure_url,
                },
            ],
        };

        if (existingTracker) {
            // If tracker exists, push new track
            existingTracker.track.push(newTrackEntry);
            existingTracker.notice = notice;
            await existingTracker.save();

            return res.status(200).send({
                success: true,
                message: "Track updated successfully",
                record: existingTracker,
            });
        } else {
            // Create new tracker if not found
            const newTracker = await Tracker.create({
                userId,
                pigName,
                notice,
                track: [newTrackEntry],
            });

            return res.status(200).send({
                success: true,
                message: "New track created successfully",
                record: newTracker,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "Error in inputTrack API",
            error,
        });
    }
};

exports.getRecords = async (req, res) => {
    try {
        const { id } = req.params;
        const records = await Tracker.find({ userId: id }).sort({ createdAt: -1 });
        // console.log(notifications)
        res.status(200).json({ records });
    } catch (error) {
        console.error("Error fetching records:", error.message);
        res.status(500).json({ message: "Error fetching records" });
    }
};