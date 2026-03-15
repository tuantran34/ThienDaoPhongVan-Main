import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, GameState, RelationshipStage } from '../types';
import { chatWithCharacter, generateIntimateScene, generateCultivationScene } from '../services/gemini';
import { cn } from '../lib/utils';
import { Send, X, Zap, Heart, XCircle, HelpCircle, Save, FolderOpen, ChevronDown, ChevronUp, Gift, History, Star, Info } from 'lucide-react';
import { REALMS, HAREM_REALMS, MINI_GAMES } from '../constants';

interface HaremTabProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  addNotification: (title: string, body: string, reward?: string) => void;
  onSavePartial: (key: string, data: any, label: string) => void;
  onLoadPartial: (key: string, label: string) => any;
  updateQuestProgress: (questId: string, amount: number) => void;
  onStartMiniGame: (game: any) => void;
}

export function HaremTab({ gameState, updateGameState, addNotification, onSavePartial, onLoadPartial, updateQuestProgress, onStartMiniGame }: HaremTabProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [modalType, setModalType] = useState<'chat' | 'detail' | 'cultivation' | 'intimate' | 'gift' | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'normal' | 'harem'>('normal');

  const handleGift = (characterId: string, items: { itemId: string, qty: number }[]) => {
    const character = gameState.characters.find(x => x.id === characterId);
    if (!character) return;

    updateGameState(prev => {
      let totalGain = 0;
      const newInventory = prev.inventory.map(invItem => {
        const giftItem = items.find(i => i.itemId === invItem.id);
        if (giftItem) {
          const isPreferred = character.gifts.includes(invItem.name);
          const baseGain = isPreferred ? 20 : 10;
          totalGain += baseGain * giftItem.qty;
          return { ...invItem, qty: invItem.qty - giftItem.qty };
        }
        return invItem;
      }).filter(i => i.qty > 0);

      const newCharacters = prev.characters.map(w => {
        if (w.id === characterId) {
          const newAffection = Math.min(100, w.affection + totalGain);
          const newRealm = getHaremRealm(newAffection);
          const newStage = getStage(newAffection);
          
          if (newRealm !== w.haremRealm) {
            addNotification('🎊 Đột Phá Cảnh Giới Hậu Cung!', `${w.name} đã đạt cảnh giới ${newRealm}`, 'Mở khóa buff mới');
          }

          return { ...w, affection: newAffection, stage: newStage, haremRealm: newRealm };
        }
        return w;
      });

      return { ...prev, inventory: newInventory, characters: newCharacters };
    });

    addNotification('🎁 Tặng quà thành công!', `${character.name} rất vui khi nhận được quà của bạn.`, `Thiện cảm +${items.reduce((acc, curr) => acc + curr.qty, 0) * 10}+`);
    setModalType(null);
  };

  const handleUnlock = (characterId: string) => {
    if (characterId === 'kiep') {
      const stone = gameState.inventory.find(i => i.name === 'Ma Tinh Thạch');
      if (stone) {
        updateGameState(prev => ({
          ...prev,
          inventory: prev.inventory.map(i => i.id === stone.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
          characters: prev.characters.map(w => w.id === characterId ? { ...w, unlocked: true } : w)
        }));
        addNotification('🌙 Mở Khóa Thành Công!', 'Kiếp Hoa Mộng Tinh đã gia nhập hậu cung', 'Duyên phận mới bắt đầu...');
      } else {
        addNotification('🔒 Chưa Đủ Điều Kiện', 'Cần có Ma Tinh Thạch để gặp nàng', 'Mua tại Cửa Hàng (cần Trúc Cơ)');
      }
    } else if (characterId === 'loi_phuong') {
      if (gameState.realmIndex >= 3) {
        updateGameState(prev => ({
          ...prev,
          characters: prev.characters.map(w => w.id === characterId ? { ...w, unlocked: true } : w)
        }));
        addNotification('⚡ Mở Khóa Thành Công!', 'Lôi Phượng đã chú ý đến uy phong của bạn', 'Nữ soái đã xuất hiện');
      } else {
        addNotification('🔒 Chưa Đủ Điều Kiện', 'Cần đạt cảnh giới Trúc Cơ để gặp nữ soái', 'Hãy tiếp tục tu luyện');
      }
    } else if (characterId === 'doc_nguyet') {
      const dan = gameState.inventory.find(i => i.name === 'Ngũ Độc Đan');
      if (dan) {
        updateGameState(prev => ({
          ...prev,
          inventory: prev.inventory.map(i => i.id === dan.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
          characters: prev.characters.map(w => w.id === characterId ? { ...w, unlocked: true } : w)
        }));
        addNotification('🐍 Mở Khóa Thành Công!', 'Độc Cô Nguyệt đã bị thu hút bởi độc đan của bạn', 'Độc nữ đã xuất hiện');
      } else {
        addNotification('🔒 Chưa Đủ Điều Kiện', 'Cần có Ngũ Độc Đan để dẫn dụ nàng', 'Mua tại Cửa Hàng');
      }
    } else if (characterId === 'bao_nhi') {
      const coin = gameState.inventory.find(i => i.name === 'Cổ Tiền Vàng');
      if (coin) {
        updateGameState(prev => ({
          ...prev,
          inventory: prev.inventory.map(i => i.id === coin.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0),
          characters: prev.characters.map(w => w.id === characterId ? { ...w, unlocked: true } : w)
        }));
        addNotification('💎 Mở Khóa Thành Công!', 'Vạn Bảo Nhi đã xuất hiện vì mùi tiền cổ', 'Thần giữ của đã gia nhập');
      } else {
        addNotification('🔒 Chưa Đủ Điều Kiện', 'Cần có Cổ Tiền Vàng để gọi nàng dậy', 'Mua tại Cửa Hàng');
      }
    }
  };

  const normalCharacters = gameState.characters.filter(w => !w.inHarem);
  const haremCharacters = gameState.characters.filter(w => w.inHarem);

  return (
    <div className="p-6 md:p-8">
      <h2 className="font-serif text-gold text-2xl border-b border-gold/25 pb-3 mb-6 tracking-widest uppercase">
        🤝 Bằng Hữu
      </h2>

      <div className="flex border-b border-gold/25 mb-8">
        <button 
          onClick={() => setActiveSubTab('normal')}
          className={cn(
            "px-6 py-2 text-sm tracking-[0.2em] transition-all duration-300 border-b-2 -mb-[1px] uppercase",
            activeSubTab === 'normal' ? "text-gold border-gold" : "text-text-dim border-transparent hover:text-gold/60"
          )}
        >
          Nhân Vật ({normalCharacters.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('harem')}
          className={cn(
            "px-6 py-2 text-sm tracking-[0.2em] transition-all duration-300 border-b-2 -mb-[1px] uppercase",
            activeSubTab === 'harem' ? "text-gold border-gold" : "text-text-dim border-transparent hover:text-gold/60"
          )}
        >
          Hậu Cung ({haremCharacters.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'harem' ? (
          <motion.div 
            key="harem-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {haremCharacters.length === 0 ? (
              <div className="col-span-full py-20 text-center text-text-dim italic border border-dashed border-gold/10 rounded-sm">
                Chưa có giai nhân nào gia nhập hậu cung...
              </div>
            ) : (
              haremCharacters
                .sort((a, b) => b.affection - a.affection)
                .map(character => (
                  <HaremCharacterCard 
                    key={character.id} 
                    character={character} 
                    showMiniGame={true}
                    onChat={() => { setSelectedCharacter(character); setModalType('chat'); }}
                    onGift={() => { setSelectedCharacter(character); setModalType('gift'); }}
                    onDetail={() => { setSelectedCharacter(character); setModalType('detail'); }}
                    onCultivate={() => { setSelectedCharacter(character); setModalType('cultivation'); }}
                    onIntimate={() => { setSelectedCharacter(character); setModalType('intimate'); }}
                    onUnlock={() => handleUnlock(character.id)}
                    onStartMiniGame={() => {
                      const randomGame = MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)];
                      onStartMiniGame(randomGame);
                    }}
                  />
                ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="normal-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {normalCharacters.length === 0 ? (
              <div className="col-span-full py-20 text-center text-text-dim italic border border-dashed border-gold/10 rounded-sm">
                Chưa gặp gỡ nhân vật nào trong hành trình...
              </div>
            ) : (
              normalCharacters
                .sort((a, b) => b.affection - a.affection)
                .map(character => (
                  <HaremCharacterCard 
                    key={character.id} 
                    character={character} 
                    showMiniGame={false}
                    onChat={() => { setSelectedCharacter(character); setModalType('chat'); }}
                    onGift={() => { setSelectedCharacter(character); setModalType('gift'); }}
                    onDetail={() => { setSelectedCharacter(character); setModalType('detail'); }}
                    onCultivate={() => { setSelectedCharacter(character); setModalType('cultivation'); }}
                    onIntimate={() => { setSelectedCharacter(character); setModalType('intimate'); }}
                    onUnlock={() => handleUnlock(character.id)}
                    onStartMiniGame={() => {
                      const randomGame = MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)];
                      onStartMiniGame(randomGame);
                    }}
                  />
                ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCharacter && modalType === 'gift' && (
          <GiftModal 
            character={selectedCharacter}
            inventory={gameState.inventory}
            onClose={() => { setSelectedCharacter(null); setModalType(null); }}
            onGift={(items) => handleGift(selectedCharacter.id, items)}
          />
        )}
        {selectedCharacter && modalType === 'chat' && (
          <ChatModal 
            characterId={selectedCharacter.id}
            gameState={gameState}
            heroName={gameState.heroName}
            storyContext={gameState.currentStoryContext}
            playerInfo={`Cảnh giới: ${REALMS[gameState.realmIndex]}, Mị lực: ${gameState.charm}, Hào quang: ${gameState.haoguang}, Linh Thạch: ${gameState.linhThach}`}
            onClose={() => { setSelectedCharacter(null); setModalType(null); }}
            onUpdateCharacter={(updated) => {
              updateGameState(prev => ({
                ...prev,
                characters: prev.characters.map(w => w.id === updated.id ? updated : w)
              }));
            }}
            onSavePartial={onSavePartial}
            onLoadPartial={onLoadPartial}
            updateQuestProgress={updateQuestProgress}
          />
        )}
        {selectedCharacter && modalType === 'detail' && (
          <CharacterDetailModal 
            characterId={selectedCharacter.id}
            gameState={gameState}
            onClose={() => { setSelectedCharacter(null); setModalType(null); }}
          />
        )}
        {selectedCharacter && modalType === 'cultivation' && (
          <CultivationModal 
            characterId={selectedCharacter.id}
            gameState={gameState}
            heroName={gameState.heroName}
            storyContext={gameState.currentStoryContext}
            onClose={() => { setSelectedCharacter(null); setModalType(null); }}
            onUpdateCharacter={(updated) => {
              updateGameState(prev => ({
                ...prev,
                characters: prev.characters.map(w => w.id === updated.id ? updated : w)
              }));
            }}
            onReward={(tuVi: number) => {
              updateGameState(prev => ({
                ...prev,
                tuVi: prev.tuVi + tuVi
              }));
              updateQuestProgress('q_daily_1', 1);
              addNotification('✨ Song Tu Thành Công', `Tu vi tăng thêm ${tuVi} điểm`, 'Linh lực dồi dào');
            }}
          />
        )}
        {selectedCharacter && modalType === 'intimate' && (
          <IntimateModal 
            characterId={selectedCharacter.id}
            gameState={gameState}
            heroName={gameState.heroName}
            storyContext={gameState.currentStoryContext}
            onClose={() => { setSelectedCharacter(null); setModalType(null); }}
            onUpdateCharacter={(updated) => {
              updateGameState(prev => ({
                ...prev,
                characters: prev.characters.map(w => w.id === updated.id ? updated : w)
              }));
            }}
            onReward={(tuVi: number) => {
              updateGameState(prev => ({
                ...prev,
                tuVi: prev.tuVi + tuVi
              }));
              addNotification('💖 Động Phòng Hoa Chúc', `Tình cảm thăng hoa, tu vi tăng ${tuVi}`, 'Một đêm xuân nồng');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getHaremRealm(affection: number): string {
  if (affection >= 80) return 'Phu Thê Giao Hòa';
  if (affection >= 60) return 'Sắc Son Một Lòng';
  if (affection >= 40) return 'Thề Non Hẹn Biển';
  if (affection >= 20) return 'Tâm Đầu Ý Hợp';
  return 'Sơ Kiến';
}

function HaremCharacterCard({ character, onChat, onGift, onDetail, onCultivate, onIntimate, onUnlock, onStartMiniGame, showMiniGame }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'status' | 'skills' | 'history'>('status');

  const stageLabels = { 
    stranger: 'Người Lạ', 
    acquaint: 'Sơ Quen', 
    close: 'Thân Thiết', 
    intimate: 'Tri Kỷ', 
    married: 'Phu Thê' 
  };
  
  const stageColors = {
    stranger: 'from-gray-500/20 to-gray-600/20 text-gray-400 border-gray-500/30',
    acquaint: 'from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30',
    close: 'from-gold/20 to-gold-dark/20 text-gold border-gold/30',
    intimate: 'from-red-500/30 to-red-600/20 text-red-300 border-red-500/40',
    married: 'from-purple-500/40 to-purple-600/20 text-purple-300 border-purple-500/50'
  };

  const isHighAffection = character.affection >= 70;
  const currentStage = character.stage as keyof typeof stageLabels;
  const currentRealm = HAREM_REALMS.find(r => r.name === character.haremRealm) || HAREM_REALMS[0];

  return (
    <motion.div 
      layout
      className={cn(
        "group relative bg-bg-card border border-gold/20 rounded-lg overflow-hidden transition-all duration-500 hover:border-gold/60 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]",
        !character.unlocked && "opacity-75 grayscale-[0.5]",
        isHighAffection && "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
      )}
    >
      {/* Character Banner/Icon */}
      <div 
        className="h-32 flex items-center justify-center text-6xl relative overflow-hidden cursor-pointer group-hover:scale-105 transition-transform duration-700"
        style={{ background: character.bannerBg || 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent opacity-60" />
        <motion.div 
          initial={false}
          animate={{ scale: isExpanded ? 1.2 : 1 }}
          className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          {character.isMet ? character.icon : '🔒'}
        </motion.div>

        {character.isMet && isHighAffection && (
          <div className="absolute top-3 right-3 bg-red-600/90 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest font-bold shadow-lg z-20">
            ❤️ Gắn Kết
          </div>
        )}
        
        <div className="absolute bottom-3 right-3 text-gold/40 group-hover:text-gold transition-colors z-20">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      <div className="p-5 relative">
        {/* Header Info */}
        <div className="flex justify-between items-start mb-4">
          <div className="cursor-pointer flex-1" onClick={() => setIsExpanded(!isExpanded)}>
            <h3 className="font-serif text-gold text-xl group-hover:text-gold-light transition-colors">
              {character.isMet ? character.name : '??? ???'}
            </h3>
            <p className="text-[10px] text-text-dim tracking-[0.2em] uppercase font-medium mt-0.5">
              {character.isMet ? character.title : '— Ẩn Danh —'}
            </p>
          </div>
          
          {character.isMet && (
            <div className="flex flex-col items-end gap-1.5">
              <div className={cn(
                "text-[9px] px-2.5 py-0.5 rounded-sm border bg-gradient-to-br uppercase tracking-widest font-bold shadow-sm",
                stageColors[currentStage]
              )}>
                {stageLabels[currentStage]}
              </div>
              <div className="text-[8px] text-gold/70 font-bold uppercase tracking-tighter bg-gold/5 px-1.5 py-0.5 rounded border border-gold/10">
                {character.haremRealm}
              </div>
            </div>
          )}
        </div>
        
        {/* Affection Bar */}
        <div className="mb-5 bg-black/20 p-2 rounded border border-white/5">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-text-dim uppercase tracking-widest font-bold">Thiện cảm</span>
            <span className="text-gold font-mono">{character.affection}%</span>
          </div>
          <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${character.affection}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && character.isMet && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 mb-5 pt-4 border-t border-gold/10">
                {/* Sub-tabs for detailed info */}
                <div className="flex bg-black/40 rounded p-1 gap-1">
                  {(['status', 'skills', 'history'] as const).map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveDetailTab(tab)}
                      className={cn(
                        "flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-all rounded",
                        activeDetailTab === tab 
                          ? "bg-gold/10 text-gold shadow-sm" 
                          : "text-text-dim hover:text-gold/60"
                      )}
                    >
                      {tab === 'status' ? 'Trạng Thái' : tab === 'skills' ? 'Kỹ Năng' : 'Hồi Ức'}
                    </button>
                  ))}
                </div>

                <div className="min-h-[120px]">
                  {activeDetailTab === 'status' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-3"
                    >
                      <div className="bg-gold/5 p-3 rounded border border-gold/10 relative overflow-hidden group/realm">
                        <div className="absolute top-0 right-0 p-1 opacity-10 group-hover/realm:opacity-30 transition-opacity">
                          <Star size={24} className="text-gold" />
                        </div>
                        <div className="text-[9px] text-gold uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1.5">
                          <Star size={10} /> Cảnh Giới: {character.haremRealm}
                        </div>
                        <div className="text-[11px] text-text-main italic leading-relaxed">
                          <span className="text-gold/60 mr-1">Hiệu quả:</span> {currentRealm.buff}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-black/30 p-3 rounded border border-white/5 hover:border-gold/20 transition-colors">
                          <div className="text-[8px] text-text-dim uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1.5">
                            <Info size={10} className="text-blue-400" /> Tâm tư hiện tại
                          </div>
                          <div className="text-[11px] text-text-main italic leading-relaxed">
                            "{character.currentThoughts || 'Đang tĩnh tâm tu luyện...'}"
                          </div>
                        </div>
                        <div className="bg-black/30 p-3 rounded border border-white/5 hover:border-gold/20 transition-colors">
                          <div className="text-[8px] text-text-dim uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1.5">
                            <Heart size={10} className="text-red-400" /> Trạng thái cơ thể
                          </div>
                          <div className="text-[11px] text-text-main italic leading-relaxed">
                            "{character.bodyStatus || 'Khí huyết bình ổn.'}"
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeDetailTab === 'skills' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2.5"
                    >
                      {character.haremSkills && character.haremSkills.length > 0 ? (
                        character.haremSkills.map((skill: any) => (
                          <div key={skill.id} className="bg-black/30 p-3 rounded border border-white/5 hover:border-emerald-500/20 transition-colors">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs text-gold font-serif font-bold">{skill.name}</span>
                              <span className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20">Lv.{skill.level}/{skill.maxLevel}</span>
                            </div>
                            <p className="text-[10px] text-text-dim leading-relaxed mb-2">{skill.desc}</p>
                            <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                              <Zap size={10} /> {skill.buffDesc}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-text-dim italic">
                          <HelpCircle size={24} className="opacity-20 mb-2" />
                          <span className="text-[10px]">Chưa mở khóa kỹ năng nào...</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeDetailTab === 'history' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2.5"
                    >
                      {character.interactionLog && character.interactionLog.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2.5 pr-1.5">
                          {[...character.interactionLog].reverse().slice(0, 5).map((log, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex justify-between items-center text-[8px] mb-1.5">
                                <span className={cn(
                                  "uppercase tracking-widest font-bold px-1.5 py-0.5 rounded",
                                  log.type === 'chat' ? "text-blue-400 bg-blue-400/10" : 
                                  log.type === 'cultivation' ? "text-gold bg-gold/10" : "text-red-400 bg-red-400/10"
                                )}>
                                  {log.type === 'chat' ? 'Hội thoại' : log.type === 'cultivation' ? 'Song tu' : 'Hoan ái'}
                                </span>
                                <span className="text-text-dim font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[11px] text-text-main italic leading-relaxed line-clamp-2">"{log.content}"</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-text-dim italic">
                          <History size={24} className="opacity-20 mb-2" />
                          <span className="text-[10px]">Chưa có lịch sử tương tác...</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interaction Buttons */}
        {character.isMet ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={onChat} 
              className="group/btn py-2.5 border border-gold/20 text-[10px] text-text-dim hover:text-gold hover:border-gold hover:bg-gold/5 transition-all rounded flex items-center justify-center gap-2 uppercase tracking-widest font-bold"
            >
              <Send size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" /> 
              Truyền Âm
            </button>
            <button 
              onClick={onGift} 
              className="group/btn py-2.5 border border-gold/20 text-[10px] text-text-dim hover:text-gold hover:border-gold hover:bg-gold/5 transition-all rounded flex items-center justify-center gap-2 uppercase tracking-widest font-bold"
            >
              <Gift size={12} className="group-hover/btn:scale-110 transition-transform" /> 
              Tặng Quà
            </button>
            
            {showMiniGame && (
              <button 
                onClick={onStartMiniGame} 
                className="group/btn py-2.5 border border-gold/20 text-[10px] text-text-dim hover:text-gold hover:border-gold hover:bg-gold/5 transition-all rounded flex items-center justify-center gap-2 uppercase tracking-widest font-bold"
              >
                <Zap size={12} className="group-hover/btn:animate-pulse" /> 
                Trò Chơi
              </button>
            )}
            
            <button 
              onClick={character.affection >= 15 ? onDetail : undefined} 
              className={cn(
                "group/btn py-2.5 border border-gold/20 text-[10px] text-text-dim transition-all rounded flex items-center justify-center gap-2 uppercase tracking-widest font-bold",
                character.affection < 15 ? "opacity-30 cursor-not-allowed" : "hover:text-gold hover:border-gold hover:bg-gold/5",
                !showMiniGame && "col-span-1"
              )}
            >
              <Info size={12} /> Hồ Sơ
            </button>
            
            <button 
              onClick={character.affection >= 40 ? onCultivate : undefined} 
              className={cn(
                "group/btn py-2.5 border border-gold/20 text-[10px] text-text-dim transition-all rounded flex items-center justify-center gap-2 uppercase tracking-widest font-bold",
                character.affection < 40 ? "opacity-30 cursor-not-allowed" : "hover:text-gold hover:border-gold hover:bg-gold/5 shadow-[0_0_10px_rgba(212,175,55,0.1)]",
                !showMiniGame && "col-span-2"
              )}
            >
              <Zap size={12} className="text-gold" /> Song Tu
            </button>
            
            {character.inHarem && (
              <button 
                onClick={character.affection >= 70 ? onIntimate : undefined} 
                className={cn(
                  "group/btn py-2.5 border border-red-500/20 text-[10px] text-text-dim transition-all rounded flex items-center justify-center gap-2 uppercase tracking-widest font-bold col-span-2",
                  character.affection < 70 ? "opacity-30 cursor-not-allowed" : "hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                )}
              >
                <Heart size={12} className={cn(character.affection >= 70 && "text-red-500 animate-pulse")} /> 
                Động Phòng
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={onUnlock} 
            className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold text-bg-dark text-[11px] font-bold hover:scale-[1.02] transition-all rounded uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
          >
            <Save size={14} /> Mở Khóa Duyên Phận
          </button>
        )}
      </div>
    </motion.div>
  );
}

function GiftModal({ character, inventory, onClose, onGift }: any) {
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: number }>({});
  const giftItems = inventory.filter(i => i.type === 'Quà Tặng' && i.qty > 0);

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      if (current >= maxQty) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: current + 1 };
    });
  };

  const handleGiftClick = () => {
    const items = Object.entries(selectedItems).map(([itemId, qty]) => ({ itemId, qty }));
    if (items.length === 0) return;
    onGift(items);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-card border border-gold/60 rounded-sm w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-gold/25 flex items-center justify-between bg-gold/5">
          <h3 className="font-serif text-gold text-lg">🎁 Tặng Quà Cho {character.name}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-gold transition-colors"><X size={20} /></button>
        </div>

        <div className="p-4 bg-gold/5 border-b border-gold/10">
          <div className="text-[10px] text-gold uppercase tracking-widest mb-2 font-bold">Sở thích của nàng</div>
          <div className="flex flex-wrap gap-2">
            {character.gifts.map((g: string, i: number) => (
              <span key={i} className="text-[10px] bg-gold/10 text-gold px-2 py-1 rounded-full border border-gold/20 flex items-center gap-1">
                <Star size={8} /> {g}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 custom-scrollbar">
          {giftItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-dim italic">Không có quà tặng trong túi đồ...</div>
          ) : (
            giftItems.map(item => {
              const isPreferred = character.gifts.includes(item.name);
              const selectedQty = selectedItems[item.id] || 0;
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleItem(item.id, item.qty)}
                  className={cn(
                    "p-3 border rounded-sm cursor-pointer transition-all relative",
                    selectedQty > 0 ? "border-gold bg-gold/10" : "border-white/10 bg-white/5 hover:border-gold/50",
                    isPreferred && "ring-1 ring-gold/30"
                  )}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-[10px] text-gold font-bold truncate">{item.name}</div>
                  <div className="text-[8px] text-text-dim">Sở hữu: {item.qty}</div>
                  {isPreferred && (
                    <div className="absolute top-1 right-1 text-[7px] bg-red-deep text-white px-1 rounded-full uppercase">Yêu thích</div>
                  )}
                  {selectedQty > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-gold text-bg-dark rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg">
                      {selectedQty}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gold/25 bg-gold/5 flex gap-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2 border border-gold/25 text-text-dim text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Hủy
          </button>
          <button 
            onClick={handleGiftClick}
            disabled={Object.keys(selectedItems).length === 0}
            className="flex-2 py-2 bg-linear-to-br from-gold-dark to-gold text-bg-dark text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
          >
            Xác Nhận Tặng ({Object.values(selectedItems).reduce((a, b) => a + b, 0)})
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CultivationModal({ characterId, gameState, heroName, storyContext, onClose, onUpdateCharacter, onReward }: any) {
  const [scene, setScene] = useState<string>('');
  const [bodyStatus, setBodyStatus] = useState<string>('');
  const [thoughts, setThoughts] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const character = gameState.characters.find(w => w.id === characterId)!;

  useEffect(() => {
    const generate = async () => {
      try {
        const systemPrompt = `Bạn là một tác giả viết truyện tiên hiệp chuyên nghiệp. Hãy miêu tả cảnh song tu một cách huyền ảo, tinh tế, tập trung vào sự giao hòa linh lực và cảm xúc giữa hai nhân vật.`;
        const stageLabels = { stranger: 'Người Lạ', acquaint: 'Sơ Quen', close: 'Thân Thiết', intimate: 'Tri Kỷ', married: 'Phu Thê' };
        const text = await generateCultivationScene(character, systemPrompt, heroName, storyContext, stageLabels[character.stage as keyof typeof stageLabels] || 'Thân Thiết');
        
        // Parse body status and thoughts if present
        let mainScene = text;
        let extractedStatus = character.bodyStatus;
        let extractedThoughts = character.currentThoughts;

        if (text.includes('---')) {
          const parts = text.split('---');
          mainScene = parts[0].trim();
          const extraInfo = parts[1].trim();
          
          const statusMatch = extraInfo.match(/Tình trạng cơ thể:?\s*(.*)/i);
          const thoughtsMatch = extraInfo.match(/Suy nghĩ hiện tại:?\s*(.*)/i);
          
          if (statusMatch) extractedStatus = statusMatch[1].trim();
          if (thoughtsMatch) extractedThoughts = thoughtsMatch[1].trim();
        }

        setScene(mainScene);
        setBodyStatus(extractedStatus);
        setThoughts(extractedThoughts);
        
        // Update affection and stage
        const newAffection = Math.min(100, character.affection + 5);
        const newStage = getStage(newAffection);

        onUpdateCharacter({ 
          ...character, 
          affection: newAffection, 
          stage: newStage,
          inHarem: true,
          bodyStatus: extractedStatus,
          currentThoughts: extractedThoughts,
          interactionLog: [...(character.interactionLog || []), {
            type: 'cultivation' as const,
            timestamp: new Date().toISOString(),
            content: mainScene
          }]
        });
        
        // Reward Tu Vi based on affection and realm
        const tuViReward = 50 + (character.affection * 2) + (gameState.realmIndex * 100);
        onReward(tuViReward);
      } catch (error) {
        console.error(error);
        setScene('Linh khí hỗn loạn, không thể tiếp tục song tu lúc này...');
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-card border border-gold/30 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl shadow-gold/10"
      >
        <div className="p-4 border-bottom border-gold/20 flex justify-between items-center bg-gold/5">
          <div>
            <h3 className="font-serif text-gold text-xl flex items-center gap-2">
              <Zap className="text-gold animate-pulse" size={20} />
              Song Tu Cùng {character.name}
            </h3>
            <p className="text-[10px] text-text-dim uppercase tracking-widest">Linh nhục hợp nhất • Tu vi tinh tiến</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-gold transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-2 border-gold/20 rounded-full animate-spin border-t-gold"></div>
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold animate-pulse" size={32} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-gold font-serif text-lg animate-pulse">Đang vận chuyển linh khí...</p>
                <p className="text-text-dim text-xs italic">"Âm dương giao hòa, vạn vật sinh sôi..."</p>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="prose prose-invert prose-gold max-w-none">
                <div className="text-text-main leading-relaxed text-lg space-y-6 first-letter:text-5xl first-letter:font-serif first-letter:text-gold first-letter:mr-3 first-letter:float-left italic">
                  {scene.split('\n').map((para, i) => para.trim() && (
                    <p key={i} className="mb-6 drop-shadow-sm">{para}</p>
                  ))}
                </div>
              </div>

              {(bodyStatus || thoughts) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 p-6 bg-gold/5 border border-gold/20 rounded-sm space-y-4"
                >
                  {bodyStatus && (
                    <div>
                      <div className="text-[10px] text-gold uppercase tracking-[0.2em] mb-1 font-bold">Tình trạng cơ thể</div>
                      <div className="text-sm text-text-main italic">"{bodyStatus}"</div>
                    </div>
                  )}
                  {thoughts && (
                    <div>
                      <div className="text-[10px] text-red-light uppercase tracking-[0.2em] mb-1 font-bold">Suy nghĩ thầm kín</div>
                      <div className="text-sm text-text-main italic">"{thoughts}"</div>
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className="mt-12 pt-8 border-t border-gold/20 text-center">
                <button 
                  onClick={onClose}
                  className="px-12 py-3 bg-gold/10 border border-gold/50 text-gold hover:bg-gold/20 transition-all rounded-sm uppercase tracking-[0.2em] font-serif text-sm"
                >
                  Kết Thúc Vận Công
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ChatModal({ characterId, gameState, heroName, storyContext, playerInfo, onClose, onUpdateCharacter, onSavePartial, onLoadPartial, updateQuestProgress }: any) {
  const character = gameState.characters.find((w: any) => w.id === characterId);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [character?.chatHistory, isTyping, activeTab]);

  if (!character) return null;

  const handleSaveChat = () => {
    const chatData = {
      chatHistory: character.chatHistory,
      affection: character.affection,
      stage: character.stage,
      interactionLog: character.interactionLog
    };
    onSavePartial(`chat_${character.id}`, chatData, `Hội Thoại ${character.name}`);
  };

  const handleLoadChat = () => {
    const loaded = onLoadPartial(`chat_${character.id}`, `Hội Thoại ${character.name}`);
    if (loaded) {
      onUpdateCharacter({
        ...character,
        ...loaded
      });
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isTyping) return;
    
    const userMsg = messageText.trim();
    if (!overrideInput) setInput('');
    
    const updatedCharacter = {
      ...character,
      chatHistory: [...character.chatHistory, { role: 'user', text: userMsg }],
      interactionLog: [...(character.interactionLog || []), {
        type: 'chat' as const,
        timestamp: new Date().toISOString(),
        content: userMsg,
        role: 'user'
      }]
    };
    onUpdateCharacter(updatedCharacter);
    
    setIsTyping(true);
    setShowSuggestions(false);
    try {
      const stageLabels = { stranger: 'Người Lạ', acquaint: 'Sơ Quen', close: 'Thân Thiết', intimate: 'Tri Kỷ', married: 'Phu Thê' };
      const reply = await chatWithCharacter(
        character, 
        character.systemPrompt, 
        character.chatHistory, 
        userMsg, 
        storyContext, 
        playerInfo,
        stageLabels[character.stage as keyof typeof stageLabels] || 'Người Lạ'
      );

      // Extract thoughts if AI provides them (optional, but good for immersion)
      let finalReply = reply;
      let updatedThoughts = character.currentThoughts;
      if (reply.includes('---')) {
        const parts = reply.split('---');
        finalReply = parts[0].trim();
        const thoughtsMatch = parts[1].match(/Suy nghĩ:?\s*(.*)/i);
        if (thoughtsMatch) updatedThoughts = thoughtsMatch[1].trim();
      }

      const finalCharacter = {
        ...updatedCharacter,
        chatHistory: [...updatedCharacter.chatHistory, { role: 'npc', text: finalReply }],
        interactionLog: [...(updatedCharacter.interactionLog || []), {
          type: 'chat' as const,
          timestamp: new Date().toISOString(),
          content: finalReply,
          role: 'npc'
        }],
        currentThoughts: updatedThoughts,
        affection: Math.min(100, updatedCharacter.affection + 2),
        stage: getStage(Math.min(100, updatedCharacter.affection + 2))
      };
      updateQuestProgress('q_daily_2', 1);
      onUpdateCharacter(finalCharacter);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const interactionOptions = [
    { label: 'Trêu chọc', text: `[Trêu chọc] Này ${character.name}, hôm nay nàng trông thật... khác lạ.` },
    { label: 'Khen ngợi', text: `[Khen ngợi] ${character.name}, vẻ đẹp của nàng hôm nay khiến ta không thể rời mắt.` },
    { label: 'Hỏi thăm', text: `[Hỏi thăm] Nàng đang suy nghĩ gì vậy? Có chuyện gì khiến nàng bận tâm sao?` },
    { label: 'Thổ lộ', text: `[Thổ lộ] ${character.name}, ta thực sự rất trân trọng những giây phút bên cạnh nàng.` },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card border border-gold/60 rounded-sm w-full max-w-lg h-[80vh] flex flex-col shadow-2xl shadow-black/80"
      >
        <div className="p-4 border-b border-gold/25 flex items-center justify-between relative overflow-hidden">
          {character.affection >= 70 && (
            <div className="absolute inset-0 bg-red-deep/5 pointer-events-none animate-pulse" />
          )}
          <div className="relative z-10 flex flex-col">
            <h3 className="font-serif text-gold text-lg">💬 {character.name}</h3>
            {character.affection >= 70 && character.hiddenTrait && (
              <div className="text-[8px] text-red-light italic">Đã thấu hiểu: {character.hiddenTrait}</div>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn("text-xs uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'chat' ? "text-gold border-gold" : "text-text-dim border-transparent")}
            >
              Trò Chuyện
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn("text-xs uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'history' ? "text-gold border-gold" : "text-text-dim border-transparent")}
            >
              Hồi Ức
            </button>
            <div className="flex gap-2 ml-2 border-l border-gold/20 pl-4">
              <button 
                onClick={handleSaveChat}
                className="text-gold/60 hover:text-gold transition-colors"
                title="Lưu nhanh hội thoại này"
              >
                <Save size={16} />
              </button>
              <button 
                onClick={handleLoadChat}
                className="text-gold/60 hover:text-gold transition-colors"
                title="Tải nhanh hội thoại này"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-gold transition-colors"><X size={20} /></button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {activeTab === 'chat' ? (
            <>
              {(character.chatHistory?.length || 0) === 0 && (
                <div className="text-center text-text-dim text-sm py-12 italic">Hãy bắt đầu cuộc trò chuyện...</div>
              )}
              {character.chatHistory?.map((m: any, idx: number) => (
                <div key={idx} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                  <div className="text-[10px] text-text-dim mb-1">{m.role === 'user' ? heroName : character.name}</div>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-sm text-sm leading-relaxed",
                    m.role === 'user' ? "bg-gold/10 border border-gold/20" : "bg-black/40 border border-white/5"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <div className="text-[10px] text-text-dim mb-1">{character.name}</div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-sm flex gap-1">
                    <div className="w-1 h-1 bg-gold rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {(character.interactionLog?.length || 0) === 0 && (
                <div className="text-center text-text-dim text-sm py-12 italic">Chưa có hồi ức nào được ghi lại...</div>
              )}
              {character.interactionLog?.map((log: any, idx: number) => (
                <div key={idx} className="border-l-2 border-gold/30 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-bold",
                      log.type === 'chat' ? "bg-blue-500/20 text-blue-300" :
                      log.type === 'intimate' ? "bg-red-500/20 text-red-300" :
                      log.type === 'cultivation' ? "bg-gold/20 text-gold" : "bg-gray-500/20 text-gray-300"
                    )}>
                      {log.type === 'chat' ? 'Truyền Âm' : log.type === 'intimate' ? 'Mật Đàm' : log.type === 'cultivation' ? 'Song Tu' : 'Sự Kiện'}
                    </span>
                    <span className="text-[9px] text-text-dim">{log.timestamp}</span>
                  </div>
                  <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                    {log.role && <span className="text-gold font-bold mr-2">{log.role === 'user' ? heroName : character.name}:</span>}
                    {log.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'chat' && (
          <div className="p-4 border-t border-gold/25 flex flex-col gap-2">
            {/* Interaction Options */}
            <div className="flex flex-wrap gap-2 mb-2">
              {interactionOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(opt.text)}
                  disabled={isTyping}
                  className="px-3 py-1 border border-gold/20 text-[10px] text-text-dim hover:text-gold hover:border-gold hover:bg-gold/5 transition-all rounded-full uppercase tracking-widest disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {showSuggestions && character.suggestedQuestions && character.suggestedQuestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 mb-2 p-2 bg-gold/5 border border-gold/10 rounded-sm"
              >
                {character.suggestedQuestions.map((q: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-[10px] bg-gold/10 border border-gold/20 text-gold px-2 py-1 rounded-full hover:bg-gold/20 transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
            <div className="flex gap-2">
              {character.suggestedQuestions && character.suggestedQuestions.length > 0 && (
                <button 
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className={cn(
                    "p-2 border border-gold/25 rounded-sm transition-all",
                    showSuggestions ? "bg-gold/20 text-gold border-gold" : "text-text-dim hover:text-gold hover:border-gold"
                  )}
                  title="Gợi ý câu hỏi"
                >
                  <HelpCircle size={18} />
                </button>
              )}
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Nói với ${character.name}...`}
                className="flex-1 bg-bg-dark border border-gold/25 text-text-main px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-gold"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isTyping}
                className="bg-linear-to-br from-gold-dark to-gold text-bg-dark px-4 py-2 rounded-sm font-serif font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CharacterDetailModal({ characterId, gameState, onClose }: any) {
  const character = gameState.characters.find((w: any) => w.id === characterId);
  if (!character) return null;

  const details = [
    { label: 'Gia cảnh', value: character.background || 'Chưa rõ' },
    { label: 'Tuổi tác', value: character.age ? `${character.age} tuổi` : 'Chưa rõ' },
    { label: 'Số đo 3 vòng', value: character.measurements || 'Chưa rõ' },
    { label: 'Màu da', value: character.skinColor || 'Chưa rõ' },
    { label: 'Tính cách', value: character.personality },
    { label: 'Vẻ đẹp', value: character.beauty || 'Chưa rõ' },
    { label: 'Chiều cao', value: character.height || 'Chưa rõ' },
    { label: 'Cân nặng', value: character.weight || 'Chưa rõ' },
    { label: 'Đang suy nghĩ', value: character.currentThoughts || 'Đang tĩnh tâm...' },
    { label: 'Tình trạng cơ thể', value: character.bodyStatus || 'Bình thường' },
    { label: 'Sở thích hoan ái', value: character.sexualPreference || 'Chưa rõ' },
    { label: 'Tư thế yêu thích', value: character.favoritePositions?.join(', ') || 'Chưa rõ' },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-card border border-gold/60 rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-gold/25 flex items-center justify-between bg-gold/5">
          <h3 className="font-serif text-gold text-lg">📜 Hồ Sơ Giai Nhân — {character.name}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-gold transition-colors"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-linear-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-sm flex items-center justify-center text-6xl shadow-inner">
                {character.icon}
              </div>
              <div className="text-center">
                <div className="font-serif text-gold text-xl mb-1">{character.name}</div>
                <div className="text-[10px] text-text-dim tracking-widest uppercase">{character.title}</div>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map((d, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-sm">
                  <div className="text-[10px] text-gold/60 uppercase tracking-widest mb-1 font-bold">{d.label}</div>
                  <div className="text-sm text-text-main">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gold/5 border border-gold/20 p-4 rounded-sm">
              <div className="text-xs text-gold uppercase tracking-widest mb-2 font-bold">Tiểu sử & Mô tả</div>
              <p className="text-sm text-text-main leading-relaxed italic">"{character.desc}"</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-sm">
                <div className="text-xs text-emerald-400 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                  <Heart size={14} /> Sở Thích
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.likes.map((like: string, i: number) => (
                    <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-200 px-2 py-1 rounded-full border border-emerald-500/20">
                      {like}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-sm">
                <div className="text-xs text-red-400 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                  <XCircle size={14} /> Sở Ghét
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.dislikes && character.dislikes.length > 0 ? (
                    character.dislikes.map((dislike: string, i: number) => (
                      <span key={i} className="text-[10px] bg-red-500/10 text-red-200 px-2 py-1 rounded-full border border-red-500/20">
                        {dislike}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-text-dim italic">Chưa rõ...</span>
                  )}
                </div>
              </div>
            </div>

            {character.hiddenTrait && character.affection >= 70 && (
              <div className="bg-red-deep/10 border border-red-deep/30 p-4 rounded-sm">
                <div className="text-xs text-red-light uppercase tracking-widest mb-2 font-bold">Bản chất ẩn sâu</div>
                <p className="text-sm text-text-main leading-relaxed italic">"{character.hiddenTrait}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gold/25 flex justify-center bg-gold/5">
          <button 
            onClick={onClose}
            className="bg-linear-to-br from-gold-dark to-gold text-bg-dark px-12 py-2 rounded-sm font-serif font-bold text-sm hover:scale-105 transition-transform uppercase tracking-widest"
          >
            Đóng Hồ Sơ
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function getStage(affection: number): RelationshipStage {
  if (affection >= 90) return 'married';
  if (affection >= 70) return 'intimate';
  if (affection >= 40) return 'close';
  if (affection >= 15) return 'acquaint';
  return 'stranger';
}

function IntimateModal({ characterId, gameState, heroName, storyContext, onClose, onUpdateCharacter, onReward }: any) {
  const [scene, setScene] = useState<string>('');
  const [bodyStatus, setBodyStatus] = useState<string>('');
  const [thoughts, setThoughts] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const character = gameState.characters.find(w => w.id === characterId)!;

  useEffect(() => {
    const generate = async () => {
      try {
        const systemPrompt = `Bạn là một tác giả viết truyện tiên hiệp diễm tình chuyên nghiệp. Hãy miêu tả cảnh mật đàm ân ái một cách nồng cháy, chi tiết, trần trụi nhưng vẫn mang phong vị cổ trang tu tiên.`;
        const stageLabels = { stranger: 'Người Lạ', acquaint: 'Sơ Quen', close: 'Thân Thiết', intimate: 'Tri Kỷ', married: 'Phu Thê' };
        const text = await generateIntimateScene(
          character, 
          systemPrompt, 
          stageLabels[character.stage as keyof typeof stageLabels] || 'Tri Kỷ', 
          heroName, 
          storyContext,
          gameState.mood
        );
        
        // Parse body status and thoughts if present
        let mainScene = text;
        let extractedStatus = character.bodyStatus;
        let extractedThoughts = character.currentThoughts;

        if (text.includes('---')) {
          const parts = text.split('---');
          mainScene = parts[0].trim();
          const extraInfo = parts[1].trim();
          
          const statusMatch = extraInfo.match(/Tình trạng cơ thể:?\s*(.*)/i);
          const thoughtsMatch = extraInfo.match(/Suy nghĩ hiện tại:?\s*(.*)/i);
          
          if (statusMatch) extractedStatus = statusMatch[1].trim();
          if (thoughtsMatch) extractedThoughts = thoughtsMatch[1].trim();
        }

        setScene(mainScene);
        setBodyStatus(extractedStatus);
        setThoughts(extractedThoughts);
        
        // Update affection and stage
        const newAffection = Math.min(100, character.affection + 10);
        const newStage = getStage(newAffection);

        onUpdateCharacter({ 
          ...character, 
          affection: newAffection, 
          stage: newStage,
          bodyStatus: extractedStatus,
          currentThoughts: extractedThoughts,
          interactionLog: [...(character.interactionLog || []), {
            type: 'intimate' as const,
            timestamp: new Date().toISOString(),
            content: mainScene
          }]
        });
        
        // Reward Tu Vi based on affection and realm
        const tuViReward = 100 + (character.affection * 3) + (gameState.realmIndex * 150);
        onReward(tuViReward);
      } catch (error) {
        console.error(error);
        setScene('Không gian bỗng trở nên tĩnh lặng, dường như nàng đang có tâm sự...');
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-card border border-red-deep/30 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl shadow-red-deep/20"
      >
        <div className="p-4 border-b border-red-deep/20 flex justify-between items-center bg-red-deep/5">
          <div>
            <h3 className="font-serif text-red-light text-xl flex items-center gap-2">
              <Heart className="text-red-deep animate-pulse" size={20} />
              Động Phòng Hoa Chúc — {character.name}
            </h3>
            <p className="text-[10px] text-text-dim uppercase tracking-widest">Linh nhục hợp nhất • Một đêm xuân nồng</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-gold transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-2 border-red-deep/20 rounded-full animate-spin border-t-red-deep"></div>
                <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-deep animate-pulse" size={32} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-red-light font-serif text-lg animate-pulse">Đang chuẩn bị đêm xuân...</p>
                <p className="text-text-dim text-xs italic">"Loan phụng đảo điên, mây mưa vần vũ..."</p>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="prose prose-invert prose-red max-w-none">
                <div className="text-text-main leading-relaxed text-lg space-y-6 first-letter:text-6xl first-letter:font-serif first-letter:text-red-deep first-letter:mr-3 first-letter:float-left italic">
                  {scene.split('\n').map((para, i) => para.trim() && (
                    <p key={i} className="mb-6 drop-shadow-sm">{para}</p>
                  ))}
                </div>
              </div>

              {(bodyStatus || thoughts) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 p-6 bg-red-deep/5 border border-red-deep/20 rounded-sm space-y-4"
                >
                  {bodyStatus && (
                    <div>
                      <div className="text-[10px] text-red-light uppercase tracking-[0.2em] mb-1 font-bold">Tình trạng cơ thể</div>
                      <div className="text-sm text-text-main italic">"{bodyStatus}"</div>
                    </div>
                  )}
                  {thoughts && (
                    <div>
                      <div className="text-[10px] text-red-light uppercase tracking-[0.2em] mb-1 font-bold">Suy nghĩ thầm kín</div>
                      <div className="text-sm text-text-main italic">"{thoughts}"</div>
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className="mt-12 pt-8 border-t border-red-deep/20 text-center">
                <button 
                  onClick={onClose}
                  className="px-12 py-3 bg-red-deep/10 border border-red-deep/50 text-red-light hover:bg-red-deep/20 transition-all rounded-sm uppercase tracking-[0.2em] font-serif text-sm"
                >
                  Rời Khỏi Khuê Phòng
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
