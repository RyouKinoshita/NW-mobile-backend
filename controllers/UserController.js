const User = require('../models/user');
const sendToken = require('../routes/jwtToken');
exports.register = async (req, res, next) => {
    try {
        const file = req.file;
        const fileName = file.filename;
        if (!file) return res.status(400).send('No image in the request');
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        req.body.image = `${basePath}${fileName}`
        const user = await User.create(req.body)
        if (!user) {
            return res.status(400).send('the user cannot be created!')
        }
        return sendToken(user, 200, res, 'Success');
    } catch (err) {
        return res.status(400).json({
            message: 'Please try again later',
            success: false,
        })
    }
}
exports.login = async () => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter email & password' })
        }
        let user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        }
        const passwordMatched = await user.comparePassword(password);
        if (!passwordMatched) {
            return res.status(401).json({ message: 'Invalid Email or Password' })
        }
        user = await User.findOne(user._id);
        sendToken(user, 200, res)
    } catch (err) {
        return res.status(400).json({
            message: 'Please try again later',
            success: false,
        })
    }
}