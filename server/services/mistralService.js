const axios = require('axios');

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
// Sử dụng API chuẩn của Mistral
const MISTRAL_BASE_URL = 'https://api.mistral.ai';

/**
 * [Fallback 3 cho AI Text] Dùng Mistral AI để sinh từ vựng JSON nếu các AI khác đều thất bại
 */
const getVocabulary = async (labels) => {
  if (!MISTRAL_API_KEY) {
    throw new Error('Thiếu MISTRAL_API_KEY trong .env');
  }
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }

  const prompt = `You are an English vocabulary teacher for Vietnamese learners. Given these objects: ${labels.join(', ')}.\nReturn a JSON array of objects. Each object MUST have these exact keys:\n- "english" (the word)\n- "ipa" (phonetic spelling)\n- "vietnamese" (Vietnamese translation)\n- "type" (part of speech, e.g., noun)\n- "example" (a simple English example sentence)\n- "category" (e.g., General, Food, Electronics)\nReturn ONLY a raw JSON array. No markdown format (\`\`\`json). No explanations.`;

  const response = await axios.post(
    `${MISTRAL_BASE_URL}/v1/chat/completions`,
    {
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) return [];

  // Phân tích cú pháp JSON an toàn
  try {
    return JSON.parse(raw);
  } catch (error) {
    const jsonMatch = String(raw).match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Không thể parse dữ liệu JSON từ Mistral');
  }
};

module.exports = {
  getVocabulary
};
