const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Chuẩn hóa kết quả trả về từ OpenRouter, trả về mảng các nhãn (ví dụ: ['bottle', 'cup'])
 */
const normalizeLabels = (raw) => {
  if (!raw) return [];
  return String(raw)
    .replace(/\n/g, ',')
    .replace(/\s*,\s*/g, ',')
    .replace(/\.$/, '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * [Fallback 1 cho AI Vision] Dùng mô hình LLaMA Vision miễn phí qua OpenRouter để nhận diện ảnh
 */
const detectObjects = async (imageBase64, mimeType) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Thiếu OPENROUTER_API_KEY trong .env');
  }

  const prompt = `Look at this image carefully. List all visible objects in English as a comma-separated list. Output object names only, nothing else.`;

  // Theo README: Dùng mô hình meta-llama/llama-3.2-11b-vision-instruct:free
  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model: 'openrouter/free',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30s timeout
    }
  );

  const usedModel = response.data?.model || 'unknown';
  console.log(`[OpenRouter Vision] Đã tự động chọn model: ${usedModel}`);
  
  const text = response.data?.choices?.[0]?.message?.content;
  return normalizeLabels(text);
};

/**
 * [Fallback 1 cho AI Text] Dùng OpenRouter để sinh từ vựng JSON nếu Gemini thất bại
 */
const getVocabulary = async (labels) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Thiếu OPENROUTER_API_KEY trong .env');
  }
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }

  const prompt = `You are an English vocabulary teacher for Vietnamese learners. Given these objects: ${labels.join(', ')}.\nReturn a JSON array of objects. Each object MUST have these exact keys:\n- "english" (the word)\n- "ipa" (phonetic spelling)\n- "vietnamese" (Vietnamese translation)\n- "type" (part of speech, e.g., noun)\n- "example" (a simple English example sentence)\n- "category" (e.g., General, Food, Electronics)\nReturn ONLY a raw JSON array. No markdown format (\`\`\`json). No explanations.`;

  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model: 'openrouter/free', // Tự động chọn model text miễn phí tốt nhất
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const usedModel = response.data?.model || 'unknown';
  console.log(`[OpenRouter Text] Đã tự động chọn model: ${usedModel}`);

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) return [];

  // Parse JSON an toàn
  try {
    return JSON.parse(raw);
  } catch (error) {
    const jsonMatch = raw.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Không thể parse dữ liệu JSON từ OpenRouter');
  }
};

module.exports = {
  detectObjects,
  getVocabulary
};