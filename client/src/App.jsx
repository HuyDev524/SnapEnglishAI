import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Flashcards from './pages/Flashcards/Flashcards';
import { syncToServer } from './services/syncService';
import Toast from './components/Toast/Toast';
import Navbar from './components/Navbar/Navbar';

function App() {
  const [toast, setToast] = useState(null);

  // Wake-up backend server (Render.com)
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ping`).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      await syncToServer();
      setToast({ message: 'Đã đồng bộ dữ liệu lên cloud', type: 'success' });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Navbar />
      <main>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flashcards" element={<Flashcards />} />
      </Routes>
      </main>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default App;
