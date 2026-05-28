const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// Sử dụng OpenAI tương thích API của Groq
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * [Fallback 2 cho AI Text] Dùng Groq (Llama 3.1) để sinh từ vựng JSON nếu Gemini và OpenRouter thất bại
 */
const getVocabulary = async (labels) => {
  if (!GROQ_API_KEY) {
    throw new Error('Thiếu GROQ_API_KEY trong .env');
  }
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }

  const prompt = `You are an English vocabulary teacher for Vietnamese learners. Given these objects: ${labels.join(', ')}.\nReturn a JSON array of objects. Each object MUST have these exact keys:\n- "english" (the word)\n- "ipa" (phonetic spelling)\n- "vietnamese" (Vietnamese translation)\n- "type" (part of speech, e.g., noun)\n- "example" (a simple English example sentence)\n- "category" (e.g., General, Food, Electronics)\nReturn ONLY a raw JSON array. No markdown format (\`\`\`json). No explanations.`;

  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
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
    throw new Error('Không thể parse dữ liệu JSON từ Groq');
  }
};

module.exports = {
  getVocabulary
};
