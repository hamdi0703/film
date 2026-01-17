import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length > 0) {
      onSave(inputKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-white text-center">Tria'ya Hoşgeldiniz</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center text-sm">
          Kütüphaneye erişmek için lütfen kişisel TMDB API Anahtarınızı girin.
          <br/>
          <span className="text-xs opacity-70">(Sadece tarayıcınızda yerel olarak saklanır)</span>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="TMDB API Anahtarını Girin"
            className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-transparent focus:border-neutral-900 dark:focus:border-white outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!inputKey}
            className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Keşfetmeye Başla
          </button>
        </form>
        <div className="mt-4 text-center">
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                API Anahtarı Al
            </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;