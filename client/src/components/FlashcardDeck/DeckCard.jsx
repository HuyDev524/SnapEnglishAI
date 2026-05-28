import React from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { getCategoryColor } from '../../utils/categoryColors';

const DeckCard = ({ deck, onClick, onDelete }) => {
  const categoryStyle = getCategoryColor(deck.category);

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${categoryStyle.split(' ')[0]} bg-opacity-20 dark:bg-opacity-10`}>
          <Layers className={`w-6 h-6 ${categoryStyle.split(' ')[1]}`} />
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Xóa bộ thẻ"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
        {deck.name}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {deck.words?.length || 0} từ vựng
      </p>
      
      {deck.category && (
        <div className="mt-4 inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {deck.category}
        </div>
      )}
    </div>
  );
};

export default DeckCard;
