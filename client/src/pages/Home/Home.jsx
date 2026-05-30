import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon } from 'lucide-react';
import UploadImage from '../../components/UploadImage/UploadImage';
import CameraDetection from '../../components/CameraDetection/CameraDetection';
import VocabularyCard from '../../components/VocabularyCard/VocabularyCard';
import { CardSkeleton } from '../../components/Skeleton/Skeleton';
import Toast from '../../components/Toast/Toast';
import { detectFromImage } from '../../services/detectionService';
import { getVocabulary } from '../../services/vocabularyService';
import { useFlashcards } from '../../hooks/useFlashcards';
import { fileToBase64, resizeImage } from '../../utils/imageUtils';

const Home = () => {
  const [useCamera, setUseCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [savedWords, setSavedWords] = useState(new Set());
  
  const { decks, createDeck, addWordsToDeck, saveAuto } = useFlashcards();

  const processImage = async (file) => {
    try {
      setIsProcessing(true);
      setResults([]);
      setSavedWords(new Set());
      
      const resizedBlob = await resizeImage(file);
      const base64Data = await fileToBase64(resizedBlob);
      
      let data = { labels: [], vocabulary: [] };
      let isOffline = !navigator.onLine;
      
      if (!isOffline) {
        try {
          data = await detectFromImage(base64Data, file.type);
        } catch (err) {
          console.warn('Backend unavailable, fallback to offline', err);
          isOffline = true;
        }
      }
      
      if (isOffline || data.fallback === 'coco' || data.mode === 'offline') {
        const { detectFromImageElement } = await import('../../services/cocoService');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // proceed even if error to prevent hang
        });
        
        data.labels = await detectFromImageElement(img);
        
        if (!isOffline && data.fallback === 'coco') {
          showToast('Sử dụng AI cục bộ do server quá tải', 'info');
        } else {
          showToast('Chế độ ngoại tuyến: Sử dụng AI cục bộ', 'info');
        }
      }
      
      if (!data.labels || data.labels.length === 0) {
        showToast('Không tìm thấy đồ vật. Hãy thử ảnh rõ hơn với ánh sáng tốt hơn.', 'error');
        return;
      }
      
      let vocab = data.vocabulary || [];
      if (isOffline || data.fallback === 'static' || vocab.length === 0) {
        const { lookupStatic } = await import('../../services/vocabularyService');
        vocab = lookupStatic(data.labels);
      }
      
      setResults(vocab);
      
      // Tự động lưu các từ vựng hợp lệ vào flashcard
      const validWords = vocab.filter(w => w.vietnamese);
      if (validWords.length > 0) {
        await saveAuto(validWords);
        
        // Cập nhật giao diện nút đã lưu
        const saved = new Set(savedWords);
        validWords.forEach(w => saved.add(w.english));
        setSavedWords(saved);
        
        showToast(`Đã tự động lưu ${validWords.length} từ vựng vào bộ thẻ!`, 'success');
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      showToast('Không thể nhận diện. Vui lòng thử lại sau.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    processImage(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResults([]);
    setIsProcessing(false);
  };

  const handleCameraCapture = (file) => {
    setUseCamera(false);
    handleImageSelect(file);
  };

  const handleSaveWord = async (word) => {
    try {
      const category = word.category || 'General';
      const deckName = category;
      
      const existingDeck = decks.find(d => d.category.toLowerCase() === category.toLowerCase());
      
      if (existingDeck) {
        await addWordsToDeck(existingDeck._id, [word]);
      } else {
        await createDeck(deckName, category, [word]);
      }
      
      setSavedWords(prev => new Set(prev).add(word.english));
      
      if (!navigator.onLine) {
        showToast(`Đã lưu cục bộ "${word.english}". Sẽ đồng bộ khi có kết nối.`, 'info');
      } else {
        showToast(`Đã lưu "${word.english}" vào ${deckName}`, 'success');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('Có lỗi xảy ra khi lưu. Đã lưu cục bộ. Sẽ đồng bộ khi có kết nối.', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Input Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Khám phá từ vựng</h1>
          
          {!useCamera && !previewUrl && (
            <button
              onClick={() => setUseCamera(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium"
            >
              <CameraIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Dùng Camera</span>
            </button>
          )}
        </div>

        {useCamera ? (
          <CameraDetection 
            onCapture={handleCameraCapture}
            onCancel={() => setUseCamera(false)}
            onError={(err) => {
              showToast(err, 'error');
              setUseCamera(false);
            }}
          />
        ) : (
          <UploadImage 
            onImageSelect={handleImageSelect}
            previewUrl={previewUrl}
            clearImage={clearImage}
          />
        )}
      </div>

      {/* Results Section */}
      {(isProcessing || results.length > 0) && (
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Kết quả nhận diện</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isProcessing ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              results.map((word, index) => (
                <VocabularyCard 
                  key={index} 
                  word={word} 
                  onSave={handleSaveWord}
                  isSaved={savedWords.has(word.english)}
                />
              ))
            )}
          </div>
        </div>
      )}

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

export default Home;
