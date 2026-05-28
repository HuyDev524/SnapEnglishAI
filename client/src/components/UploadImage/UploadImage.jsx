import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

const UploadImage = ({ onImageSelect, previewUrl, clearImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndProcessFile = (file) => {
    setError('');
    if (!file) return;

    // Check size (<= 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh quá lớn. Kích thước tối đa là 10MB.');
      return;
    }

    // Check type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một file ảnh hợp lệ.');
      return;
    }

    onImageSelect(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [onImageSelect]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  if (previewUrl) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner group">
        <img 
          src={previewUrl} 
          alt="Preview" 
          className="w-full h-auto max-h-[60vh] object-contain"
        />
        <button
          onClick={clearImage}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          title="Xóa ảnh"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <input 
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center p-6 pointer-events-none">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-full shadow-sm">
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
          
          <div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Nhấn để tải ảnh lên hoặc kéo thả
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Hỗ trợ PNG, JPG, WEBP (Tối đa 10MB)
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <p className="mt-3 text-sm text-red-500 flex items-center gap-1 font-medium">
          <X className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
};

export default UploadImage;
