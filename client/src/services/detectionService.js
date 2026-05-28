export async function detectFromImage(imageBase64, mimeType) {
  if (!navigator.onLine) {
    return { labels: [], vocabulary: [], mode: 'offline' };
  }
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType })
    });
    
    if (!res.ok) {
      throw new Error(`Lỗi từ máy chủ: ${res.status}`);
    }
    
    const data = await res.json();
    return { ...data, mode: 'online' };
  } catch (error) {
    console.error('Lỗi khi gọi API detect:', error);
    throw error;
  }
}
