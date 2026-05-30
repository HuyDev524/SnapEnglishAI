const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// Sử dụng OpenAI tương thích API của Groq
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * Bộ giải mã JSON siêu mạnh mẽ để bóc tách, dọn dẹp và sửa các lỗi cú pháp
 * thường gặp như trailing commas trong phản hồi từ LLM nhỏ.
 */
const parseRobustJson = (raw, serviceName) => {
  if (!raw) return [];
  let cleaned = String(raw).trim();
  
  // Tìm khối mảng JSON [ ... ]
  const jsonMatch = cleaned.match(/\[([\s\S]*)\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Dọn dẹp ký tự markdown
  cleaned = cleaned
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
    
  // Xử lý trailing commas (dấu phẩy thừa ở cuối trước ngoặc ] hoặc })
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`[${serviceName} JSON Parse Error] Thất bại khi phân tích cú pháp JSON.`);
    console.error(`[${serviceName} Raw Content]:\n`, raw);
    throw new Error(`Không thể parse dữ liệu JSON từ ${serviceName}`);
  }
};

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

  const prompt = `You are an English vocabulary teacher for Vietnamese learners. Given these objects: ${labels.join(', ')}.\nReturn a JSON array of objects. Each object MUST have these exact keys:\n- "english" (the word)\n- "ipa" (phonetic spelling)\n- "vietnamese" (Vietnamese translation)\n- "type" (part of speech, e.g., noun)\n- "example" (a simple English example sentence)\n- "category" (MUST be one of: Kitchen, Office, Technology, Electronics, Furniture, Nature, Animal, Vehicle, Sport, Clothing, Food, Outdoor, Person, Education, Medical, Entertainment, Beauty, Tools, Accessories, Gadgets, Household, General. VERY IMPORTANT: use "Accessories" for mouse pad/cables/wallet, "Gadgets" for computer mouse/smartwatch, "Household" for remote control/fan/clock.)\nReturn ONLY a raw JSON array. No markdown format (\`\`\`json). No explanations.`;

  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000, // Nâng từ 500 lên 2000 để tránh truncation khi sinh nhiều từ
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
  return parseRobustJson(raw, 'Groq');
};

module.exports = {
  getVocabulary
};
