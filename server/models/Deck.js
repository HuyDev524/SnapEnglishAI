const mongoose = require('mongoose');

// Schema cho từng từ vựng trong bộ thẻ (Flashcard)
const wordSchema = new mongoose.Schema({
  english: { type: String, required: true },
  ipa: { type: String, default: '' },
  vietnamese: { type: String, default: '' },
  type: { type: String, default: '' },     
  example: { type: String, default: '' }    
});

// Schema cho một bộ thẻ (Deck)
const deckSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },       // Tên hiển thị của bộ thẻ (thường trùng với category)
    category: { type: String, required: true },   // Chủ đề (vd: Kitchen, Office) dùng để gom nhóm
    words: { type: [wordSchema], default: [] }    // Danh sách các từ vựng thuộc bộ thẻ này
  },
  {
    timestamps: true // Tự động thêm createdAt và updatedAt
  }
);

module.exports = mongoose.model('Deck', deckSchema);
