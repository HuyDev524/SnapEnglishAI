const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load các biến môi trường từ file .env
dotenv.config();

// Import các routes
const detectRouter = require('./routes/detect');
const flashcardsRouter = require('./routes/flashcards');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Tăng giới hạn dung lượng request để nhận ảnh base64

// Route health-check để Render.com wake-up server
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' });
});

// Gắn các routes vào ứng dụng
app.use('/api/detect', detectRouter);
app.use('/api/flashcards', flashcardsRouter);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Khởi động server và kết nối database
 */
const startServer = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('Thiếu MONGODB_URI trong file environment (.env)');
    }

    // Kết nối với MongoDB Atlas
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối thành công với MongoDB');

    // Mở port lắng nghe request
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại port ${PORT}`);
    });
  } catch (error) {
    console.error('Lỗi khởi động server:', error.message);
    process.exit(1); // Dừng app nếu không thể kết nối db
  }
};

startServer();
