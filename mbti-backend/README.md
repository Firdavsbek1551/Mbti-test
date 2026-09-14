# MBTI test sayti — Backend

Node.js + Express + SQLite backend. Ro'yxatdan o'tish, kirish, test natijalarini saqlash, natijani email orqali yuborish, do'stlarni taklif qilish tizimi, admin panel va Telegram bot bildirishnomalari mavjud.

## Telegram bot NIMA yuboradi

- Yangi foydalanuvchi ro'yxatdan o'tganda: **foydalanuvchi nomi**, kim taklif qilgani (agar bo'lsa) va **vaqt**.
- Test tugaganda: **foydalanuvchi nomi**, **shaxsiyat tipi** (masalan `INTJ`) va **vaqt**.

Telefon raqami yoki joylashuv HECH QACHON yig'ilmaydi va yuborilmaydi — bunday maydonlar ilovada umuman yo'q.

## 1. O'rnatish

```bash
cd mbti-backend
npm install
cp .env.example .env
```

`.env` faylini oching va to'ldiring (har bir qatorning ma'nosi `.env.example` ichida yozilgan):

```
PORT=3000
JWT_SECRET=...
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_USERNAMES=
```

## 2. Telegram bot yaratish

1. Telegram'da **@BotFather** ga o'ting, `/newbot` yuboring, botga nom bering.
2. Berilgan tokenni `.env` dagi `TELEGRAM_BOT_TOKEN` ga qo'ying.
3. Botingizga `/start` deb yozing (bot avval sizdan xabar olishi kerak).
4. Brauzerda oching: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Javobdagi `"chat":{"id":123456789}` raqamini `TELEGRAM_CHAT_ID` ga qo'ying.

## 3. Email yuborishni sozlash (Gmail)

1. Google hisobingizda **2 bosqichli tasdiqlash**ni yoqing (myaccount.google.com/security).
2. `myaccount.google.com/apppasswords` sahifasiga kiring, yangi **App Password** yarating.
3. `.env` faylida:
   - `SMTP_USER` — to'liq Gmail manzilingiz
   - `SMTP_PASS` — App Password (oddiy Gmail parolingiz emas!)
   - `SMTP_FROM` — odatda `SMTP_USER` bilan bir xil

Bu sozlanmasa, email yuborish tugmasi xatolik qaytaradi, lekin qolgan sayt normal ishlayveradi.

## 4. Admin bo'lish

1. Avval oddiy foydalanuvchi sifatida saytda **ro'yxatdan o'ting**.
2. `.env` faylidagi `ADMIN_USERNAMES` ga o'sha foydalanuvchi nomingizni yozing (bir nechta bo'lsa vergul bilan: `admin1,admin2`).
3. Serverni qayta ishga tushiring (`npm start`).
4. Endi saytga kirganingizda boshqaruv panelida **"Admin panel"** havolasi chiqadi, yoki to'g'ridan-to'g'ri `/admin.html` manziliga o'ting va o'sha hisobingiz bilan kiring.

Admin panelda ko'rinadi: jami foydalanuvchilar, jami testlar, shaxsiyat tiplari taqsimoti, eng ko'p taklif qilganlar reytingi, va barcha foydalanuvchilar jadvali (email, ro'yxatdan o'tgan sana, test soni, oxirgi natija, kimni taklif qilgani).

## 5. Do'stlarni taklif qilish qanday ishlaydi

Har bir foydalanuvchi boshqaruv panelida o'zining shaxsiy havolasini ko'radi:
`https://saytingiz.com/?ref=foydalanuvchi_nomi`

Kimdir shu havola orqali ro'yxatdan o'tsa, kim uni taklif qilgani bazada saqlanadi va taklif qilgan odamning hisobida "necha kishi qo'shildi" ko'rsatiladi. Bu ma'lumot ham faqat ilova ichida ko'rinadi — tashqariga yubormaydi.

## 6. Ishga tushirish

```bash
npm start
```

Sayt `http://localhost:3000` da ochiladi, admin panel esa `http://localhost:3000/admin.html` da.

## 7. Internetga chiqarish (deploy)

- **Railway** yoki **Render** — GitHub repo'ni ulaysiz, `.env` o'zgaruvchilarini platforma paneliga kiritasiz.
- **VPS** — Node.js o'rnatib, `pm2 start server.js` bilan doimiy ishlatasiz, `nginx` orqali domenga bog'laysiz.

## Papka tuzilishi

```
mbti-backend/
  server.js            — asosiy server fayli
  db.js                — SQLite jadvallari va migratsiyalar
  middleware/auth.js   — oddiy foydalanuvchi JWT tekshiruvi
  middleware/admin.js  — admin huquqini tekshirish
  routes/auth.js       — ro'yxatdan o'tish / kirish / /me
  routes/results.js    — test natijalari, qoralama, email yuborish
  routes/admin.js      — statistika va foydalanuvchilar ro'yxati
  utils/telegram.js    — Telegram bildirishnomalari
  utils/mailer.js      — email yuborish (Gmail SMTP)
  public/index.html    — asosiy sayt
  public/admin.html    — admin panel
  mbti.db              — SQLite ma'lumotlar bazasi (avtomatik yaratiladi)
```

## API yo'llari

| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/auth/register` | Yangi hisob `{username, password, email?, ref?}` |
| POST | `/api/auth/login` | Kirish `{username, password}` |
| GET | `/api/auth/me` | Joriy foydalanuvchi ma'lumoti + taklif soni (token kerak) |
| GET | `/api/results` | Barcha natijalar (token kerak) |
| POST | `/api/results` | Yangi natija saqlash `{type, scores}` (token kerak) |
| POST | `/api/results/send-email` | Natijani emailga yuborish `{type, scores, email?}` (token kerak) |
| GET/PUT | `/api/results/draft` | Yarim qolgan testni saqlash/olish (token kerak) |
| GET | `/api/admin/stats` | Umumiy statistika (faqat admin) |
| GET | `/api/admin/users` | Barcha foydalanuvchilar ro'yxati (faqat admin) |

Token — `Authorization: Bearer <token>` header orqali yuboriladi.
