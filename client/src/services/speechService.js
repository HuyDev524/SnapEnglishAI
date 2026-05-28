export function speak(text) {
  if (!text) return;
  
  // Sử dụng Google Translate TTS API (không chính thức nhưng phổ biến cho thủ thuật nhỏ)
  const audioUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=en-US&q=${encodeURIComponent(text)}`;
  
  const audio = new Audio(audioUrl);
  
  audio.play().catch(() => {
    // Fallback: dùng Web Speech API nếu Google Translate API fail (ví dụ do CORS hoặc offline)
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  });
}
