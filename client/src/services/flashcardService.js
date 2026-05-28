// Gom nhóm các từ vựng theo chủ đề (category)
export function groupByCategory(vocabularyItems) {
  if (!Array.isArray(vocabularyItems)) return {};
  
  return vocabularyItems.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

// Kiểm tra xem các category đã có trong danh sách bộ thẻ hiện tại chưa
export function findExistingDecks(grouped, savedDecks) {
  return Object.keys(grouped).map(category => {
    const existing = savedDecks.find(
      d => d.category.toLowerCase() === category.toLowerCase()
    );
    return { category, words: grouped[category], existing: existing || null };
  });
}

// Tìm các từ mới chưa có trong bộ thẻ cũ để tránh trùng lặp
export function findNewWords(newWords, existingWords) {
  if (!existingWords || !existingWords.length) return newWords;
  
  return newWords.filter(
    nw => !existingWords.find(ew => ew.english.toLowerCase() === nw.english.toLowerCase())
  );
}

export async function getDecks() {
  const localData = localStorage.getItem('aievw_decks');
  return localData ? JSON.parse(localData) : [];
}

export async function saveDeck(deckData) {
  let decks = await getDecks();
  const existingDeckIndex = decks.findIndex(d => d.category.toLowerCase() === deckData.category.toLowerCase());

  if (existingDeckIndex >= 0) {
    const existingDeck = decks[existingDeckIndex];
    const newWords = findNewWords(deckData.words, existingDeck.words || []);
    existingDeck.words = [...(existingDeck.words || []), ...newWords];
    existingDeck.updatedAt = new Date().toISOString();
    decks[existingDeckIndex] = existingDeck;
  } else {
    decks.push({
      _id: Date.now().toString(),
      name: deckData.name,
      category: deckData.category,
      words: deckData.words,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  localStorage.setItem('aievw_decks', JSON.stringify(decks));
  return true;
}

export async function deleteDeck(deckId) {
  let decks = await getDecks();
  decks = decks.filter(d => (d._id || d.id) !== deckId);
  localStorage.setItem('aievw_decks', JSON.stringify(decks));
  return true;
}
