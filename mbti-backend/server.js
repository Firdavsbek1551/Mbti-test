require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const resultsRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} manzilida ishga tushdi`);
});
