import React from 'react';
import DeckCard from './DeckCard';

const DeckGrid = ({ decks, onSelectDeck, onDeleteDeck }) => {
  if (!decks || decks.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 mb-2">Chưa có bộ thẻ nào.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Hãy nhận diện đồ vật và lưu từ vựng để tạo bộ thẻ.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map(deck => (
        <DeckCard 
          key={deck._id || deck.id} 
          deck={deck} 
          onClick={() => onSelectDeck(deck)}
          onDelete={(e) => {
            e.stopPropagation();
            onDeleteDeck(deck);
          }}
        />
      ))}
    </div>
  );
};

export default DeckGrid;
