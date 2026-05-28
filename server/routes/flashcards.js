const express = require('express');
const flashcardsController = require('../controllers/flashcardsController');

const router = express.Router();

// Lấy danh sách toàn bộ thẻ
router.get('/', flashcardsController.getDecks);

// Thêm mới hoặc cập nhật bộ thẻ
router.post('/', flashcardsController.createOrUpdateDeck);

// Đồng bộ hàng loạt từ localStorage lên server
router.post('/sync', flashcardsController.syncDecks);

// Cập nhật thông tin bộ thẻ theo ID
router.put('/:id', flashcardsController.updateDeck);

// Xóa bộ thẻ theo ID
router.delete('/:id', flashcardsController.deleteDeck);

module.exports = router;
