const STORAGE_KEY = 'aievw_decks';
const PENDING_KEY = 'aievw_sync_pending';

export function saveLocal(decks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markPending(decks) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(decks));
}

export function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}

export function getPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function syncToServer() {
  const pending = getPending();
  if (!pending.length || !navigator.onLine) return;
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/flashcards/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decks: pending })
    });
    
    if (res.ok) {
      clearPending();
      console.log('Đã đồng bộ dữ liệu flashcard lên server.');
    } else {
      console.error('Đồng bộ thất bại, HTTP status:', res.status);
    }
  } catch (error) {
    console.error('Lỗi kết nối khi đồng bộ flashcards:', error);
  }
}
