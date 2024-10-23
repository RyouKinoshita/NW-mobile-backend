const sendToken = (user, statuscode, res, message = 'success') => {
    
    const token = user.getJwtToken();
    // const token = 'dummytoken'
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: false,
    }

    res.status(statuscode)
        // .clearCookie('token')
        // .cookie('token', token, options)
        // .cookie('user', JSON.stringify(user), options)
        .json({
            user,
            success: true,
            token,
            message,
        })
}

module.exports = sendToken;