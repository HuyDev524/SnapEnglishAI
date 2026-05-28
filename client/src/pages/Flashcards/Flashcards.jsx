import React, { useState, useEffect } from 'react';
import DeckGrid from '../../components/FlashcardDeck/DeckGrid';
import StudyMode from '../../components/FlashcardDeck/StudyMode';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import Toast from '../../components/Toast/Toast';
import { useFlashcards } from '../../hooks/useFlashcards';

const Flashcards = () => {
  const { decks, loading: isLoading, deleteDeck } = useFlashcards();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const handleConfirmDelete = async () => {
    if (!deckToDelete) return;
    try {
      await deleteDeck(deckToDelete._id || deckToDelete.id);
      showToast(`Đã xóa bộ thẻ "${deckToDelete.name}"`, 'success');
    } catch (error) {
      console.error('Error deleting deck:', error);
      showToast('Lỗi khi xóa bộ thẻ.', 'error');
    } finally {
      setDeckToDelete(null);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bộ thẻ của tôi</h1>
        <p className="text-gray-500 dark:text-gray-400">Quản lý và ôn tập từ vựng đã lưu.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <DeckGrid 
          decks={decks} 
          onSelectDeck={setSelectedDeck}
          onDeleteDeck={setDeckToDelete}
        />
      )}

      {selectedDeck && (
        <StudyMode 
          deck={selectedDeck} 
          onClose={() => setSelectedDeck(null)} 
        />
      )}

      <ConfirmDialog
        isOpen={!!deckToDelete}
        title="Xóa bộ thẻ"
        message={`Bạn có chắc chắn muốn xóa bộ thẻ "${deckToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeckToDelete(null)}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default Flashcards;
