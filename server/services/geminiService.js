const axios = require('axios');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, payload, options, maxRetries = 2) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await axios.post(url, payload, options);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      const status = error.response?.status;
      if (status === 429 || (status >= 500 && status < 600)) {
        console.warn(`[Gemini] Lỗi ${status}. Đang thử lại lần ${attempt} sau 2000ms...`);
        await delay(2000);
      } else {
        throw error;
      }
    }
  }
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Dùng đúng slug ID của model
const GEMINI_OCR_MODEL = process.env.GEMINI_OCR_MODEL || 'gemini-2.5-flash';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

/**
 * Tạo prompt để nhận diện hình ảnh
 */
const buildVisionPrompt = () => `Look at this image carefully.\nList all visible objects in English as a comma-separated list.\nOutput object names only, nothing else.\nExample: bottle, cup, laptop, keyboard, chair`;

/**
 * Trích xuất đoạn text thực tế từ phản hồi của API Gemini
 */
const parseResponseText = (data) => {
  try {
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return null;
  }
};

/**
 * Chuẩn hóa kết quả trả về: chuyển đổi thành mảng các chuỗi nhãn
 */
const normalizeLabels = (raw) => {
  if (!raw) return [];
  const text = String(raw).trim();
  const cleaned = text
    .replace(/\n/g, ',')
    .replace(/\s*,\s*/g, ',')
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Gửi ảnh lên Gemini để nhận diện các đồ vật
 */
const detectObjects = async (imageBase64, mimeType) => {
  if (!GEMINI_API_KEY) throw new Error('Thiếu GEMINI_API_KEY trong .env');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_OCR_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  // Payload chuẩn của Gemini API cho Vision
  const payload = {
    contents: [
      {
        parts: [
          { text: buildVisionPrompt() },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ]
  };

  const response = await fetchWithRetry(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });

  const raw = parseResponseText(response.data);
  return normalizeLabels(raw);
};

/**
 * Gọi API Gemini (Text) để sinh từ vựng
 */
const getVocabulary = async (labels) => {
  if (!GEMINI_API_KEY) throw new Error('Thiếu GEMINI_API_KEY trong .env');
  if (!Array.isArray(labels) || labels.length === 0) return [];

  const prompt = `You are an English vocabulary teacher for Vietnamese learners. Given these objects: ${labels.join(', ')}.\nReturn a JSON array of objects. Each object MUST have these exact keys:\n- "english" (the word)\n- "ipa" (phonetic spelling)\n- "vietnamese" (Vietnamese translation)\n- "type" (part of speech, e.g., noun)\n- "example" (a simple English example sentence)\n- "category" (e.g., General, Food, Electronics)\nReturn ONLY a raw JSON array. No markdown format (\`\`\`json). No explanations.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  // Payload chuẩn của Gemini API cho Text
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const response = await fetchWithRetry(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });

  const raw = parseResponseText(response.data);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    const jsonMatch = raw.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Không thể parse dữ liệu từ vựng từ Gemini');
  }
};

module.exports = {
  detectObjects,
  getVocabulary
};