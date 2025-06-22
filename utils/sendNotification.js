const axios = require('axios');

const sendPushNotification = async (expoPushToken, title, body, targetRole) => {
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', {
      to: expoPushToken,
      title,
      body,
      data: {
        screen: 'Notification',
        targetRole: targetRole
      },
    });
  } catch (error) {
    console.error('Failed to send push notification:', error.message);
  }
};

module.exports = sendPushNotification;