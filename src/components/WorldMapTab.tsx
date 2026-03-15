import React from 'react';
import { GameState } from '../types';
import { ADVENTURE_LOCATIONS } from '../constants';
import { MapPin, Users, ShoppingBag, Castle, ScrollText, Sword } from 'lucide-react';

interface WorldMapTabProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  onTabChange: (tab: string) => void;
}

export const WorldMapTab: React.FC<WorldMapTabProps> = ({ gameState, updateGameState, onTabChange }) => {
  const handleTravel = (locationName: string) => {
    updateGameState(prev => ({ ...prev, location: locationName }));
    onTabChange('adventure');
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-serif text-gold mb-6">Bản Đồ Thế Giới</h2>
      
      {/* Legend Section */}
      <div className="bg-bg-card border border-gold/20 p-4 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-gold mb-3">Chú Thích Bản Đồ</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm text-[#e8dcc8]">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold" /> Di chuyển tới</div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gold" /> Nhân vật</div>
          <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-gold" /> Cửa hiệu</div>
          <div className="flex items-center gap-2"><Castle className="w-4 h-4 text-gold" /> Tòa phủ</div>
          <div className="flex items-center gap-2"><ScrollText className="w-4 h-4 text-gold" /> Nhiệm vụ ẩn</div>
          <div className="flex items-center gap-2"><Sword className="w-4 h-4 text-gold" /> Yêu thú</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ADVENTURE_LOCATIONS.map((loc) => (
          <div key={loc.id} className="bg-bg-card border border-gold/20 p-6 rounded-xl shadow-lg hover:border-gold/50 transition-all">
            <h3 className="text-2xl font-bold text-gold mb-2">{loc.name}</h3>
            <p className="text-sm text-gold/80 italic mb-4">{loc.mythology}</p>
            <div className="space-y-2 text-sm text-[#e8dcc8] mb-4">
              <p><span className="font-bold">Lịch sử:</span> {loc.history}</p>
              <p><span className="font-bold">Độ lớn:</span> {loc.size}</p>
              <p className="flex items-center gap-2"><Sword className="w-4 h-4" /> <span className="font-bold">Yêu thú:</span> {loc.enemies.map(e => e.name).join(', ')}</p>
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-bold"><ScrollText className="w-4 h-4" /> Nhiệm vụ ẩn:</p>
                {loc.hiddenQuests.length > 0 ? (
                  loc.hiddenQuests.map(q => (
                    <div key={q.id} className="ml-6 text-xs bg-bg-dark p-2 rounded border border-gold/10">
                      <p className="font-bold text-gold">{q.name}</p>
                      <p className="text-gold/70">{q.desc}</p>
                      <p className="text-emerald-400">Phần thưởng: {q.rewards.linhThach ? `${q.rewards.linhThach} Linh Thạch, ` : ''}{q.rewards.tuVi ? `${q.rewards.tuVi} Tu Vi, ` : ''}{q.rewards.exp ? `${q.rewards.exp} EXP` : ''}</p>
                    </div>
                  ))
                ) : <p className="ml-6 text-xs text-gold/70">Không có</p>}
              </div>
              <p><span className="font-bold">Vị trí:</span> {loc.subLocations.join(', ')}</p>
              <p className="flex items-center gap-2"><Users className="w-4 h-4" /> <span className="font-bold">Nhân vật:</span> {loc.characters.join(', ')}</p>
              <p className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> <span className="font-bold">Cửa hiệu:</span> {loc.shops.join(', ')}</p>
              <p className="flex items-center gap-2"><Castle className="w-4 h-4" /> <span className="font-bold">Tòa phủ:</span> {loc.buildings.join(', ')}</p>
            </div>
            <button 
              onClick={() => handleTravel(loc.name)}
              className="w-full flex items-center justify-center gap-2 bg-gold text-bg-dark px-4 py-2 rounded-full font-bold hover:bg-gold-light transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Di chuyển tới
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
