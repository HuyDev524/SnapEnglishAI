import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Volume2, RotateCcw } from 'lucide-react';
import { speak } from '../../services/speechService';

const StudyMode = ({ deck, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const words = deck.words || [];

  if (words.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">Bộ thẻ này hiện chưa có từ vựng nào.</p>
          <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 150);
  };

  const handleSpeak = async (e) => {
    e.stopPropagation();
    setIsPlaying(true);
    await speak(currentWord.english);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{deck.name}</h2>
        </div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Card Container with Perspective */}
        <div className="w-full max-w-md h-[400px] perspective-1000 relative">
          {/* Card Inner */}
          <div 
            className={`w-full h-full relative transition-transform duration-500 preserve-3d cursor-pointer shadow-xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center">
              <button
                onClick={handleSpeak}
                className={`absolute top-6 right-6 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isPlaying ? 'text-indigo-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}
              >
                <Volume2 className="w-6 h-6" />
              </button>
              
              <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
                {currentWord.english}
              </h3>
              {currentWord.ipa && (
                <p className="text-xl text-indigo-500 dark:text-indigo-400 font-mono">
                  /{currentWord.ipa}/
                </p>
              )}
              
              <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-50">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Chạm để lật
                </p>
              </div>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center justify-center p-8 text-center rotate-y-180">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium mb-4">
                {currentWord.type}
              </span>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {currentWord.vietnamese}
              </h3>
              
              {currentWord.example && (
                <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl w-full">
                  <p className="text-gray-600 dark:text-gray-300 italic text-lg">
                    "{currentWord.example}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-12">
          <button 
            onClick={handlePrev}
            className="p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={handleNext}
            className="p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyMode;
