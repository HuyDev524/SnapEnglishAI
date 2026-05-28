import { useState, useRef, useCallback, useEffect } from 'react';

const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isFrontCamera ? 'user' : 'environment' }
      });
      setStream(mediaStream);
    } catch (err) {
      console.error('Không thể truy cập camera:', err);
      setError('Không có quyền truy cập camera. Vui lòng dùng tải ảnh lên.');
    }
  }, [isFrontCamera, stream]);

  const toggleCamera = useCallback(() => {
    setIsFrontCamera(prev => !prev);
  }, []);

  useEffect(() => {
    // If stream is active and user toggles camera, restart
    if (stream) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFrontCamera]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { stream, error, isFrontCamera, toggleCamera, startCamera, stopCamera };
};

export default useCamera;
