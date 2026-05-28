import { useState, useEffect, useCallback } from 'react';
import { loadLocal, saveLocal, markPending, getPending } from '../services/syncService';
import { useOnlineStatus } from './useOnlineStatus';

export function useFlashcards() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    if (isOnline) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/flashcards`);
        if (res.ok) {
          const data = await res.json();
          setDecks(data);
          saveLocal(data);
        } else {
          setDecks(loadLocal());
        }
      } catch (error) {
        console.error('Lỗi khi lấy decks từ server:', error);
        setDecks(loadLocal());
      }
    } else {
      setDecks(loadLocal());
    }
    setLoading(false);
  }, [isOnline]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const saveAndSync = async (newDecks) => {
    setDecks(newDecks);
    saveLocal(newDecks);
    
    if (!isOnline) {
      markPending(newDecks);
    } else {
      markPending(newDecks);
      const { syncToServer } = await import('../services/syncService');
      await syncToServer();
      await fetchDecks();
    }
  };

  const createDeck = async (name, category, words) => {
    const newDeck = {
      _id: Date.now().toString(), // Tạm thời dùng timestamp làm ID nếu offline
      name,
      category,
      words,
      updatedAt: new Date().toISOString()
    };
    const newDecks = [newDeck, ...decks];
    await saveAndSync(newDecks);
  };

  const addWordsToDeck = async (deckId, newWords) => {
    const updatedDecks = decks.map(deck => {
      if (deck._id === deckId || deck.category.toLowerCase() === deckId.toLowerCase()) {
        const mergedWords = [...deck.words];
        newWords.forEach(nw => {
          if (!mergedWords.find(ew => ew.english.toLowerCase() === nw.english.toLowerCase())) {
            mergedWords.push(nw);
          }
        });
        return { ...deck, words: mergedWords, updatedAt: new Date().toISOString() };
      }
      return deck;
    });
    await saveAndSync(updatedDecks);
  };

  const deleteDeck = async (id) => {
    if (isOnline && !id.startsWith(String(new Date().getFullYear()))) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/flashcards/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Lỗi xóa deck server:', e);
      }
    }
    const newDecks = decks.filter(d => d._id !== id);
    await saveAndSync(newDecks);
  };

  const saveAuto = async (words) => {
    let currentDecks = [...decks];
    let isModified = false;
    
    words.forEach(word => {
      if (!word.vietnamese) return; // Chỉ lưu từ hợp lệ
      
      const category = word.category || 'Chung';
      const deckName = `Bộ thẻ ${category}`;
      
      const deckIndex = currentDecks.findIndex(d => d.category.toLowerCase() === category.toLowerCase());
      
      if (deckIndex >= 0) {
        const deck = currentDecks[deckIndex];
        const mergedWords = [...deck.words];
        if (!mergedWords.find(ew => ew.english.toLowerCase() === word.english.toLowerCase())) {
          mergedWords.push(word);
          currentDecks[deckIndex] = { ...deck, words: mergedWords, updatedAt: new Date().toISOString() };
          isModified = true;
        }
      } else {
        const newDeck = {
          _id: Date.now().toString() + Math.random().toString(36).substring(7),
          name: deckName,
          category,
          words: [word],
          updatedAt: new Date().toISOString()
        };
        currentDecks = [newDeck, ...currentDecks];
        isModified = true;
      }
    });
    
    if (isModified) {
      await saveAndSync(currentDecks);
    }
  };

  return { decks, loading, createDeck, addWordsToDeck, deleteDeck, saveAuto, refresh: fetchDecks };
}
