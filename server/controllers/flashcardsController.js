const Deck = require('../models/Deck');

/**
 * Chuẩn hóa chuỗi (xóa khoảng trắng thừa)
 */
const normalizeString = (value) => String(value || '').trim();

/**
 * Loại bỏ các từ trùng lặp trong danh sách từ vựng (dựa vào từ tiếng Anh)
 * @param {Array} words - Danh sách các từ vựng
 * @returns {Array} Danh sách từ đã loại bỏ trùng lặp
 */
const dedupeWords = (words) => {
  const map = new Map();
  (words || []).forEach((word) => {
    if (!word || !word.english) return;
    const key = String(word.english).trim().toLowerCase();
    if (!key) return;
    
    // Nếu chưa có từ này, thêm vào map
    if (!map.has(key)) {
      map.set(key, {
        english: normalizeString(word.english),
        ipa: normalizeString(word.ipa),
        vietnamese: normalizeString(word.vietnamese),
        type: normalizeString(word.type),
        example: normalizeString(word.example)
      });
    }
  });
  return Array.from(map.values());
};

/**
 * [GET] Lấy danh sách tất cả bộ thẻ
 */
const getDecks = async (req, res) => {
  try {
    const decks = await Deck.find().sort({ updatedAt: -1 });
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách bộ thẻ' });
  }
};

/**
 * [POST] Tạo mới hoặc cập nhật bộ thẻ (nếu đã tồn tại category)
 */
const createOrUpdateDeck = async (req, res) => {
  try {
    const { name, category, words } = req.body;
    if (!category || !name) {
      return res.status(400).json({ error: 'Thiếu name hoặc category của deck' });
    }

    const normalizedCategory = String(category).trim().toLowerCase();
    const normalizedName = String(name).trim();

    // Tìm deck có category tương ứng (không phân biệt hoa thường)
    const existingDeck = await Deck.findOne({
      category: { $regex: `^${normalizedCategory}$`, $options: 'i' }
    });

    const dedupedWords = dedupeWords(words || []);

    // Nếu deck đã tồn tại, gộp từ vựng (merge words)
    if (existingDeck) {
      const mergedWords = dedupeWords([...existingDeck.words, ...dedupedWords]);
      existingDeck.name = normalizedName;
      existingDeck.category = normalizedCategory;
      existingDeck.words = mergedWords;
      await existingDeck.save();
      return res.json(existingDeck);
    }

    // Nếu deck chưa tồn tại, tạo mới
    const deck = await Deck.create({
      name: normalizedName,
      category: normalizedCategory,
      words: dedupedWords
    });

    res.status(201).json(deck);
  } catch (error) {
    res.status(500).json({ error: 'Không thể lưu deck mới' });
  }
};

/**
 * [PUT] Cập nhật bộ thẻ theo ID
 */
const updateDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, words } = req.body;
    
    const deck = await Deck.findById(id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck không tồn tại' });
    }

    if (name) deck.name = normalizeString(name);
    if (category) deck.category = normalizeString(category).toLowerCase();
    if (words) deck.words = dedupeWords(words);

    await deck.save();
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: 'Không thể cập nhật deck' });
  }
};

/**
 * [DELETE] Xóa bộ thẻ theo ID
 */
const deleteDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const deck = await Deck.findByIdAndDelete(id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck không tìm thấy' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Không thể xóa deck' });
  }
};

/**
 * [POST] /sync - Đồng bộ hàng loạt từ localStorage của client lên server
 */
const syncDecks = async (req, res) => {
  try {
    const { decks } = req.body;
    if (!Array.isArray(decks)) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ, yêu cầu mảng decks' });
    }

    const results = [];

    for (const clientDeck of decks) {
      if (!clientDeck.category || !clientDeck.name) continue;

      const normalizedCategory = String(clientDeck.category).trim().toLowerCase();
      const existingDeck = await Deck.findOne({
        category: { $regex: `^${normalizedCategory}$`, $options: 'i' }
      });

      const clientWords = dedupeWords(clientDeck.words || []);

      if (existingDeck) {
        // Resolve conflict bằng updatedAt: Server wins
        // Nếu Server có dữ liệu mới hơn (updatedAt lớn hơn), ta chỉ lấy những từ mới từ client thêm vào (merge)
        // Thay vì ghi đè hoàn toàn. Nếu client mới hơn, ta cũng merge để không mất dữ liệu.
        const mergedWords = dedupeWords([...existingDeck.words, ...clientWords]);
        existingDeck.words = mergedWords;
        // Nếu tên có thay đổi và client mới hơn, có thể cập nhật tên
        if (clientDeck.updatedAt && existingDeck.updatedAt) {
           const clientTime = new Date(clientDeck.updatedAt).getTime();
           const serverTime = new Date(existingDeck.updatedAt).getTime();
           if (clientTime > serverTime) {
             existingDeck.name = String(clientDeck.name).trim();
           }
        }
        await existingDeck.save();
        results.push(existingDeck);
      } else {
        // Tạo mới
        const newDeck = await Deck.create({
          name: String(clientDeck.name).trim(),
          category: normalizedCategory,
          words: clientWords
        });
        results.push(newDeck);
      }
    }

    res.json({ success: true, syncedCount: results.length, decks: results });
  } catch (error) {
    console.error('Lỗi khi đồng bộ:', error);
    res.status(500).json({ error: 'Không thể đồng bộ dữ liệu' });
  }
};

module.exports = {
  getDecks,
  createOrUpdateDeck,
  updateDeck,
  deleteDeck,
  syncDecks
};
