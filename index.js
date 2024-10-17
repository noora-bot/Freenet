const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7555454519:AAEoh9h13uVa3jjjVefavFzusHSOmCj9Cu4';
const bot = new TelegramBot(token, {polling: true});

const config = {
  user_login: 'k7747608@gmail.com',
  api_key: 'taOTbZk5McDLdx1fmhsq84JW3VSNGCjX',
  sms_type: 'SMS_WORLD'
};

async function sendSMS(recipient, message, sender) {
  try {
    const response = await axios.post('https://api.octopush.com/v1/public/sms-campaign/send', {
      api_key: config.api_key,
      user_login: config.user_login,
      sms_text: message,
      sms_recipients: [recipient],
      sms_type: config.sms_type,
      sms_sender: sender,
      request_id: Date.now().toString()
    });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

async function getBalance() {
  try {
    const response = await axios.get(`https://api.octopush.com/v1/public/credit-account?api_key=${config.api_key}&user_login=${config.user_login}`);
    return response.data.credit;
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

const userStates = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'مرحبًا! أنا بوت لإرسال الرسائل النصية. استخدم /sendsms لإرسال رسالة.');
});

bot.onText(/\/sendsms/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: 1 };
  bot.sendMessage(chatId, 'الرجاء إدخال رقم الهاتف المستلم:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userStates[chatId]) return;

  switch (userStates[chatId].step) {
    case 1:
      userStates[chatId].recipient = text;
      userStates[chatId].step = 2;
      bot.sendMessage(chatId, 'الرجاء إدخال نص الرسالة:');
      break;
    case 2:
      userStates[chatId].message = text;
      userStates[chatId].step = 3;
      bot.sendMessage(chatId, 'الرجاء إدخال معرف المرسل (Caller ID):');
      break;
    case 3:
      userStates[chatId].sender = text;
      const { recipient, message, sender } = userStates[chatId];
      
      try {
        const result = await sendSMS(recipient, message, sender);
        bot.sendMessage(chatId, `تم إرسال الرسالة بنجاح!\nالنتيجة: ${JSON.stringify(result)}`);
        
        const balance = await getBalance();
        bot.sendMessage(chatId, `رصيدك المتبقي هو: ${balance}`);
      } catch (error) {
        bot.sendMessage(chatId, `حدث خطأ أثناء إرسال الرسالة: ${error.message}`);
      }
      
      delete userStates[chatId];
      break;
  }
});

console.log('بوت تليجرام قيد التشغيل...');
