import React, { useState } from 'react';

interface MainMenuProps {
  onNewGame: (name: string) => void;
  onLoadGame: () => void;
  hasSave: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onLoadGame, hasSave }) => {
  const [name, setName] = useState('Vô Danh Hiệp Khách');
  const [isChoosingNewGame, setIsChoosingNewGame] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark text-[#e8dcc8] font-chinese">
      <div className="bg-bg-card p-8 rounded-xl border border-gold/20 shadow-2xl text-center max-w-md w-full">
        <h1 className="text-4xl font-serif text-gold mb-8">Trùng Sinh Chi Lộ</h1>
        
        {isChoosingNewGame ? (
          <div className="mb-6 text-left">
            <label className="block text-sm mb-2 text-gold/80">Tên nhân vật:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-bg-dark border border-gold/30 rounded-lg text-[#e8dcc8] focus:outline-none focus:border-gold mb-4"
            />
            <button
              onClick={() => onNewGame(name)}
              className="w-full py-3 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg transition-all"
            >
              Bắt Đầu
            </button>
            <button
              onClick={() => setIsChoosingNewGame(false)}
              className="w-full py-3 mt-2 text-gold/60 hover:text-gold transition-all"
            >
              Quay lại
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setIsChoosingNewGame(true)}
              className="w-full py-3 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg transition-all"
            >
              Chơi Mới
            </button>
            <button
              onClick={onLoadGame}
              disabled={!hasSave}
              className={`w-full py-3 border rounded-lg transition-all ${
                hasSave 
                  ? 'bg-jade/10 hover:bg-jade/20 border-jade/30' 
                  : 'opacity-50 cursor-not-allowed border-gray-600'
              }`}
            >
              Chơi Từ File Lưu {hasSave ? '' : '(Chưa có)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
