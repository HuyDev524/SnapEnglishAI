const geminiService = require('../services/geminiService');
const openrouterService = require('../services/openrouterService');
const groqService = require('../services/groqService');
const mistralService = require('../services/mistralService');
const cocoService = require('../services/cocoService');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chuẩn hóa một từ vựng để đảm bảo dữ liệu hợp lệ và không có khoảng trắng thừa
 */
const normalizeVocabularyItem = (item) => ({
  english: String(item?.english || '').trim(),
  ipa: String(item?.ipa || '').trim(),
  vietnamese: String(item?.vietnamese || '').trim(),
  type: String(item?.type || '').trim(),
  example: String(item?.example || '').trim()
});

/**
 * Chuẩn hóa mảng từ vựng, lọc bỏ các item không có từ tiếng Anh
 */
const normalizeVocabulary = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item.english === 'string' && item.english.trim() !== '')
    .map(normalizeVocabularyItem);
};

/**
 * Fallback chain 2: Sinh từ vựng từ các nhãn đồ vật đã nhận diện
 * Gemini -> OpenRouter -> Groq -> Mistral
 * Nếu tất cả đều thất bại, trả về danh sách từ cơ bản chỉ có tiếng Anh.
 */
const getVocabularyFromLabels = async (labels) => {
  const sources = [
    //name: 'gemini', fn: geminiService.getVocabulary },
    { name: 'openrouter', fn: openrouterService.getVocabulary },
    { name: 'groq', fn: groqService.getVocabulary },
    { name: 'mistral', fn: mistralService.getVocabulary }
  ];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    
    // Đợi trước mọi request (kể cả request đầu tiên) để tránh 429 nếu gọi API liên tiếp
    console.log(`[Vocabulary] Đang chờ 3500ms trước khi gọi ${source.name}...`);
    await delay(3500);
    
    try {
      const result = await source.fn(labels);
      const vocabulary = normalizeVocabulary(result);
      if (vocabulary.length > 0) {
        console.log(`[Vocabulary] Sinh từ vựng thành công qua ${source.name}`);
        return { vocabulary, fallback: source.name !== 'gemini' ? source.name : null };
      }
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      console.warn(`[Vocabulary] ${source.name} thất bại. Lỗi từ AI:`, JSON.stringify(errorDetails, null, 2));
    }
  }

  console.log('[Vocabulary] Tất cả cloud AI thất bại, trả về static fallback');
  // Nếu tất cả API đều thất bại, tạo mảng trống để client tự lookup tĩnh
  const staticFallbackVocab = labels.map((label) => ({
    english: String(label).trim(),
    ipa: '',
    vietnamese: '',
    type: '',
    example: ''
  }));
  
  return { vocabulary: staticFallbackVocab, fallback: 'static' };
};

/**
 * Fallback chain 1: Nhận diện đồ vật từ ảnh
 * Gemini -> OpenRouter -> COCO-SSD (stub offline trên server, frontend sẽ xử lý thực tế)
 */
const findLabelsWithFallback = async (imageBase64, mimeType) => {
  const detectors = [
    //name: 'gemini', fn: geminiService.detectObjects },
    { name: 'openrouter', fn: openrouterService.detectObjects },
    { name: 'coco', fn: cocoService.detectObjects }
  ];

  for (let i = 0; i < detectors.length; i++) {
    const detector = detectors[i];
    
    if (detector.name !== 'coco') {
      // Đợi trước mọi request đến cloud AI
      console.log(`[Detect] Đang chờ 3500ms trước khi gọi ${detector.name}...`);
      await delay(3500);
    }
    
    try {
      const labels = await detector.fn(imageBase64, mimeType);
      if (Array.isArray(labels) && labels.length > 0) {
        console.log(`[Detect] Nhận diện thành công qua ${detector.name}. Số lượng: ${labels.length}`);
        return { source: detector.name, labels };
      }
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      console.warn(`[Detect] ${detector.name} thất bại. Lỗi từ AI:`, JSON.stringify(errorDetails, null, 2));
    }
  }

  // Nếu không ai thành công, trả về rỗng và báo dùng fallback 'coco'
  console.log('[Detect] Tất cả detector thất bại, dùng fallback coco');
  return { source: 'coco', labels: [] };
};

/**
 * [POST] Xử lý toàn bộ luồng: Nhận ảnh -> Nhận diện nhãn -> Lấy từ vựng
 */
const handleDetect = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Yêu cầu cung cấp imageBase64' });
    }

    // Bước 1: Nhận diện nhãn (Object Detection)
    const { source: detectSource, labels } = await findLabelsWithFallback(imageBase64, mimeType);

    // Nếu fallback là coco, báo về cho frontend biết
    if (detectSource === 'coco' || labels.length === 0) {
      return res.status(200).json({
        labels: [],
        vocabulary: [],
        fallback: 'coco'
      });
    }

    // Bước 2: Sinh từ vựng (Vocabulary Generation)
    const { vocabulary, fallback: vocabFallback } = await getVocabularyFromLabels(labels);

    return res.status(200).json({
      labels,
      vocabulary,
      fallback: vocabFallback // null nếu dùng Gemini, 'static' hoặc tên AI khác nếu là fallback
    });
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[Detect System Error]', JSON.stringify(errorDetails, null, 2));
    return res.status(500).json({
      error: 'Không thể xử lý yêu cầu detect.'
    });
  }
};

module.exports = {
  handleDetect
};
