const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Chuẩn hóa kết quả trả về từ OpenRouter, trả về mảng các nhãn (ví dụ: ['bottle', 'cup'])
 */
/**
 * Chuẩn hóa kết quả trả về từ OpenRouter, loại bỏ hội thoại thừa,
 * phân tích dòng có số thứ tự/ký tự đầu dòng và lọc nhãn rác.
 */
const normalizeLabels = (raw) => {
  if (!raw) return [];
  
  const items = [];
  const lines = String(raw).split(/\n+/);
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    const lowerLine = line.toLowerCase();
    // Bỏ qua các dòng hội thoại giới thiệu/kết luận phổ biến
    if (
      lowerLine.startsWith('here is') ||
      lowerLine.startsWith('here are') ||
      lowerLine.startsWith('i can see') ||
      lowerLine.startsWith('this image') ||
      lowerLine.startsWith('the image') ||
      lowerLine.startsWith('in this image') ||
      lowerLine.startsWith('there is') ||
      lowerLine.startsWith('there are') ||
      lowerLine.startsWith('sure') ||
      lowerLine.includes('visible object')
    ) {
      continue;
    }
    
    // Xóa ký tự đầu dòng như số thứ tự (e.g. "1. ", "2) ", "- ", "* ", "• ")
    let cleanLine = line
      .replace(/^[\d+\.\-\*\•\s\)\(]+/, '')
      .trim();
      
    if (!cleanLine) continue;
    
    // Tách tiếp bằng dấu phẩy nếu dòng chứa nhiều nhãn
    const parts = cleanLine.split(',');
    for (let part of parts) {
      part = part.trim()
        .replace(/^["'“‘]+|["'”’]+$/g, '') // Xóa dấu nháy bao quanh
        .replace(/\.$/, '') // Xóa dấu chấm cuối dòng/từ
        .trim();
        
      if (!part) continue;
      
      // Bỏ qua nếu từ quá dài (lớn hơn 4 từ hoặc 35 ký tự) vì có thể là câu giải thích/mô tả rác
      if (part.split(/\s+/).length > 4 || part.length > 35) {
        continue;
      }
      
      const lowerPart = part.toLowerCase();
      if (
        lowerPart === 'object' ||
        lowerPart === 'objects' ||
        lowerPart === 'none' ||
        lowerPart === 'no objects'
      ) {
        continue;
      }
      
      items.push(part);
    }
  }
  
  // Loại bỏ các nhãn trùng lặp (không phân biệt hoa thường)
  const uniqueItems = [];
  const seen = new Set();
  for (const item of items) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems;
};

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

  const prompt = `You are an English vocabulary teacher for Vietnamese learners. Given these objects: ${labels.join(', ')}.\nReturn a JSON array of objects. Each object MUST have these exact keys:\n- "english" (the word)\n- "ipa" (phonetic spelling)\n- "vietnamese" (Vietnamese translation)\n- "type" (part of speech, e.g., noun)\n- "example" (a simple English example sentence)\n- "category" (MUST be one of: Kitchen, Office, Technology, Electronics, Furniture, Nature, Animal, Vehicle, Sport, Clothing, Food, Outdoor, Person, Education, Medical, Entertainment, Beauty, Tools, Accessories, Gadgets, Household, General. VERY IMPORTANT: use "Accessories" for mouse pad/cables/wallet, "Gadgets" for computer mouse/smartwatch, "Household" for remote control/fan/clock.)\nReturn ONLY a raw JSON array. No markdown format (\`\`\`json). No explanations.`;

  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model: 'openrouter/free', // Tự động chọn model text miễn phí tốt nhất
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000, // Nâng từ 500 lên 2000 để tránh truncation
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
  return parseRobustJson(raw, 'OpenRouter');
};

module.exports = {
  detectObjects,
  getVocabulary
};