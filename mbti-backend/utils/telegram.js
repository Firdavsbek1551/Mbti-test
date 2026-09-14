const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Faqat ilova o'zi yig'gan ma'lumot (foydalanuvchi nomi, shaxsiyat tipi) yuboriladi.
// Telefon raqami yoki joylashuv HECH QACHON yuborilmaydi - bunday maydonlar mavjud emas.
async function sendTelegramMessage(text) {
  if (!TOKEN || !CHAT_ID) return; // Telegram sozlanmagan bo'lsa, jim o'tkazib yuboriladi
  try {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('Telegram API xatosi:', res.status, body);
    }
  } catch (err) {
    console.error('Telegram xabarini yuborishda xato:', err.message);
  }
}

module.exports = { sendTelegramMessage };
