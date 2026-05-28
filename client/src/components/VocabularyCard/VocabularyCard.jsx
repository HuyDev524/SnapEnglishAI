import React, { useState } from 'react';
import { Volume2, PlusCircle, CheckCircle, Tag } from 'lucide-react';
import { speak } from '../../services/speechService';
import { getCategoryColor } from '../../utils/categoryColors';

const VocabularyCard = ({ word, onSave, isSaved }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!word) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu từ vựng</p>
      </div>
    );
  }

  const handleSpeak = async () => {
    setIsPlaying(true);
    await speak(word.english);
    setIsPlaying(false);
  };

  const categoryStyle = getCategoryColor(word.category || 'General');

  const isIncomplete = !word.vietnamese;

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
              {word.english}
              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isPlaying ? 'text-indigo-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </h3>
            {word.ipa && (
              <p className="text-indigo-600 dark:text-indigo-400 font-mono mt-1 opacity-80">
                /{word.ipa}/
              </p>
            )}
          </div>
          
          {word.category && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${categoryStyle}`}>
              <Tag className="w-3 h-3" />
              {word.category}
            </span>
          )}
        </div>

        {isIncomplete ? (
          <div className="py-4 text-center border-t border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Không có dữ liệu từ vựng</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-16">
                Nghĩa
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {word.vietnamese} <span className="text-gray-400 dark:text-gray-500 font-normal italic text-sm">({word.type})</span>
              </p>
            </div>

            {word.example && (
              <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-16 pt-0.5">
                  Ví dụ
                </span>
                <p className="text-gray-600 dark:text-gray-300 text-sm italic flex-1">
                  "{word.example}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 sm:px-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end">
        <button
          onClick={() => onSave(word)}
          disabled={isSaved || isIncomplete}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            (isSaved || isIncomplete)
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Đã lưu
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              Lưu vào bộ thẻ
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VocabularyCard;
