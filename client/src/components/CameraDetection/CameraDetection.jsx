import React, { useRef, useEffect, useState } from 'react';
import useCamera from '../../hooks/useCamera';
import { Camera, SwitchCamera, StopCircle, RefreshCw } from 'lucide-react';

const CameraDetection = ({ onCapture, onCancel, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { stream, error, isFrontCamera, toggleCamera, startCamera, stopCamera } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && stream) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      // Mirror image if using front camera
      if (isFrontCamera) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          stopCamera();
          onCapture(file);
        }
        setIsCapturing(false);
      }, 'image/jpeg', 0.85);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-black shadow-xl">
      {error ? (
        <div className="flex flex-col items-center justify-center p-8 h-[300px] text-center bg-gray-900">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Quay lại
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-auto min-h-[300px] max-h-[70vh] object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6">
            <button
              onClick={onCancel}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
              title="Hủy"
            >
              <StopCircle className="w-6 h-6" />
            </button>
            
            <button
              onClick={captureFrame}
              disabled={isCapturing || !stream}
              className="p-4 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              title="Chụp ảnh"
            >
              <div className="w-10 h-10 rounded-full border-4 border-black flex items-center justify-center">
                {isCapturing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </div>
            </button>
            
            <button
              onClick={toggleCamera}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
              title="Đổi camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraDetection;
