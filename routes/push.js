const express = require('express');
const router = express.Router();
const User = require('../model/user'); // Adjust path to your user model
const axios = require('axios');

router.put('/update/token', async (req, res) => {
  const { userId, expoPushToken } = req.body;

  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: 'userId and expoPushToken are required' });
  }

  try {
    await User.findByIdAndUpdate(userId, { expoPushToken }, { new: true });
    res.status(200).json({ success: true, message: 'Push token updated' });
  } catch (error) {
    console.error('Error updating token:', error.message);
    res.status(500).json({ error: 'Failed to update token' });
  }
});

// Send notification to user using Expo's push API
router.post('/send', async (req, res) => {
  const { to, title, body, data } = req.body;

  if (!to || !title || !body) {
    return res.status(400).json({ error: 'Missing to, title, or body' });
  }

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', {
      to,
      sound: 'default',
      title,
      body,
      data,
    }, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    });
    console.log('Expo response:', response.data);

    res.status(200).json({ success: true, result: response.data });
  } catch (err) {
    console.error('Error sending push:', err.message);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
});

module.exports = router;