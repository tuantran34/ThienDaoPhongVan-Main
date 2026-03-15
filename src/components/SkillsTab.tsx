import React, { useState } from 'react';
import { GameState } from '../types';
import { cn } from '../lib/utils';
import { Award, Shield, Zap, Star, Trophy, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SkillsTabProps {
  gameState: GameState;
  onUpgrade: (skillId: string) => void;
  updateQuestProgress: (questId: string, amount: number) => void;
}

export function SkillsTab({ gameState, onUpgrade, updateQuestProgress }: SkillsTabProps) {
  const [activeView, setActiveView] = useState<'skills' | 'achievements'>('skills');
  const [skillFilter, setSkillFilter] = useState('all');
  const [achFilter, setAchFilter] = useState('all');

  const skillCategories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'cultivation', label: 'Tu Tâm Pháp' },
    { id: 'combat', label: 'Võ Học' },
    { id: 'knowledge', label: 'Kiến Thức' },
    { id: 'crafting', label: 'Luyện Đan' },
    { id: 'charm', label: 'Mị Lực' },
    { id: 'special', label: 'Đặc Biệt' },
  ];

  const achCategories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'cultivation', label: 'Tu Luyện' },
    { id: 'combat', label: 'Chiến Đấu' },
    { id: 'harem', label: 'Hậu Cung' },
    { id: 'wealth', label: 'Tài Phú' },
    { id: 'fame', label: 'Danh Vọng' },
    { id: 'knowledge', label: 'Kiến Thức' },
    { id: 'special', label: 'Đặc Biệt' },
  ];

  const skillTypeLabels: Record<string, string> = { 
    cultivation: '修 · Tu Tâm Pháp', 
    combat: '战 · Võ Học', 
    knowledge: '识 · Kiến Thức',
    crafting: '炼 · Luyện Đan',
    charm: '魅 · Mị Lực', 
    special: '异 · Đặc Biệt' 
  };

  const achTypeLabels: Record<string, string> = {
    cultivation: '修 · Tu Luyện',
    combat: '战 · Chiến Đấu',
    harem: '情 · Hậu Cung',
    wealth: '财 · Tài Phú',
    fame: '名 · Danh Vọng',
    knowledge: '识 · Kiến Thức',
    special: '异 · Đặc Biệt'
  };

  const filteredSkills = skillFilter === 'all' 
    ? gameState.skills 
    : gameState.skills.filter(s => s.type === skillFilter);

  const groupedSkills = skillCategories
    .filter(cat => cat.id !== 'all')
    .map(cat => ({
      ...cat,
      skills: filteredSkills.filter(s => s.type === cat.id)
    }))
    .filter(group => group.skills.length > 0);

  const filteredAchievements = achFilter === 'all'
    ? gameState.achievements
    : gameState.achievements.filter(a => a.category === achFilter);

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isUnlocked === b.isUnlocked) return 0;
    return a.isUnlocked ? -1 : 1;
  });

  const groupedAchievements = achCategories
    .filter(cat => cat.id !== 'all')
    .map(cat => ({
      ...cat,
      achievements: sortedAchievements.filter(a => a.category === cat.id)
    }))
    .filter(group => group.achievements.length > 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-10">
        <div className="bg-bg-card border border-gold/20 p-1 rounded-full flex gap-1 shadow-lg">
          <button
            onClick={() => setActiveView('skills')}
            className={cn(
              "px-8 py-2 rounded-full text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2",
              activeView === 'skills' 
                ? "bg-gold text-bg-dark font-bold shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
                : "text-text-dim hover:text-gold"
            )}
          >
            <Zap size={14} /> Công Pháp
          </button>
          <button
            onClick={() => setActiveView('achievements')}
            className={cn(
              "px-8 py-2 rounded-full text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2",
              activeView === 'achievements' 
                ? "bg-gold text-bg-dark font-bold shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
                : "text-text-dim hover:text-gold"
            )}
          >
            <Trophy size={14} /> Chiến Tích
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'skills' ? (
          <motion.div
            key="skills-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold/25 pb-6 mb-8">
              <div>
                <h2 className="font-serif text-gold text-3xl tracking-widest uppercase mb-2">
                  ⚔️ Kỹ Năng Hệ Thống
                </h2>
                <p className="text-text-dim text-xs tracking-wider italic">
                  Tu luyện võ học, rèn luyện tâm pháp để đạt tới đỉnh cao võ đạo.
                </p>
              </div>
              
              <div className="flex items-center gap-6 bg-gold/5 px-4 py-2 rounded-sm border border-gold/10">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-dim uppercase tracking-tighter">Linh Thạch Hiện Có</span>
                  <span className="text-gold font-bold">💰 {(gameState.linhThach || 0).toLocaleString()}</span>
                </div>
                <div className="w-px h-8 bg-gold/20" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-dim uppercase tracking-tighter">EXP Hiện Có</span>
                  <span className="text-blue-400 font-bold">⚡ {(gameState.exp || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mb-12 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md py-4 border-b border-gold/10">
              {skillCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSkillFilter(cat.id)}
                  className={cn(
                    "px-5 py-2 border border-gold/25 text-[10px] rounded-sm transition-all duration-200 tracking-widest uppercase",
                    skillFilter === cat.id 
                      ? "bg-gold text-bg-dark border-gold font-bold shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
                      : "text-text-dim hover:text-gold hover:bg-gold/5"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-16">
              {groupedSkills.map(group => (
                <div key={group.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-linear-to-r from-transparent to-gold/20" />
                    <h3 className="font-serif text-gold/80 text-xl tracking-[0.3em] uppercase flex items-center gap-3">
                      <span className="text-2xl opacity-50">#</span> {group.label}
                    </h3>
                    <div className="h-px flex-1 bg-linear-to-l from-transparent to-gold/20" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.skills.map(skill => (
                      <div 
                        key={skill.id}
                        className={cn(
                          "bg-bg-card border border-gold/20 p-5 rounded-sm transition-all duration-500 hover:border-gold/50 group relative overflow-hidden flex flex-col",
                          !skill.unlocked && "grayscale opacity-60"
                        )}
                      >
                        {/* Decorative Background Icon */}
                        <div className="absolute -right-4 -top-4 text-6xl opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                          {skill.icon}
                        </div>

                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]">
                            {skill.icon}
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-text-dim tracking-widest uppercase mb-1">{skillTypeLabels[skill.type]}</div>
                            <div className="font-serif text-gold text-lg leading-none">{skill.name}</div>
                          </div>
                        </div>

                        <div className="text-[11px] text-text-main leading-relaxed mb-6 flex-1 italic opacity-80">
                          {skill.unlocked ? skill.desc : '— Bí tịch chưa được khai mở —'}
                        </div>
                        
                        {skill.unlocked ? (
                          <div className="space-y-4">
                            {/* Level Progress */}
                            <div>
                              <div className="flex justify-between items-end mb-1.5">
                                <span className="text-[10px] text-text-dim uppercase tracking-widest">Cấp Độ</span>
                                <span className="text-xs text-gold font-bold">{skill.level} <span className="text-text-dim font-normal">/ {skill.maxLevel}</span></span>
                              </div>
                              <div className="flex gap-1 h-1.5">
                                {Array.from({ length: skill.maxLevel }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={cn(
                                      "flex-1 rounded-full transition-all duration-500",
                                      i < skill.level 
                                        ? "bg-linear-to-r from-gold-dark to-gold shadow-[0_0_5px_rgba(201,168,76,0.5)]" 
                                        : "bg-white/5"
                                    )} 
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Mastery Bar */}
                            {skill.mastery !== undefined && (
                              <div>
                                <div className="flex justify-between items-end mb-1.5">
                                  <span className="text-[10px] text-text-dim uppercase tracking-widest">Độ Thuần Thục</span>
                                  <span className="text-[10px] text-jade-light font-mono">{skill.mastery}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-jade-light shadow-[0_0_8px_rgba(61,158,128,0.4)] transition-all duration-1000"
                                    style={{ width: `${skill.mastery}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* MP Cost */}
                            {skill.mpCost !== undefined && (
                              <div className="flex justify-between items-center py-1 border-t border-white/5">
                                <span className="text-[10px] text-text-dim uppercase tracking-widest">Tiêu hao</span>
                                <span className="text-[10px] text-blue-400 font-mono">{skill.mpCost} MP</span>
                              </div>
                            )}

                            {/* Upgrade Button */}
                            {skill.level < skill.maxLevel && (
                              <button
                                onClick={() => {
                                  onUpgrade(skill.id);
                                  updateQuestProgress('q_side_3', 1);
                                }}
                                disabled={gameState.linhThach < (skill.upgradeCost?.linhThach || 0) || gameState.exp < (skill.upgradeCost?.exp || 0)}
                                className={cn(
                                  "w-full py-2.5 border border-gold/30 rounded-sm text-[10px] uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group/btn",
                                  "hover:bg-gold/10 hover:border-gold active:scale-[0.98]",
                                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                )}
                              >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  <span>Nâng Cấp</span>
                                  {skill.upgradeCost && (
                                    <span className="text-text-dim lowercase tracking-normal flex items-center gap-2 border-l border-gold/20 pl-2">
                                      <span className={cn(gameState.linhThach < skill.upgradeCost.linhThach ? "text-red-400" : "text-gold")}>
                                        {skill.upgradeCost.linhThach}💰
                                      </span>
                                      <span className={cn(gameState.exp < skill.upgradeCost.exp ? "text-red-400" : "text-blue-400")}>
                                        {skill.upgradeCost.exp}⚡
                                      </span>
                                    </span>
                                  )}
                                </span>
                              </button>
                            )}

                            {skill.level === skill.maxLevel && (
                              <div className="w-full py-2 border border-jade/30 bg-jade/5 rounded-sm text-[10px] text-jade-light text-center uppercase tracking-[0.2em]">
                                Đã Đạt Đỉnh Phong
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] text-text-dim italic">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse" />
                              Yêu cầu: Đạt tới cảnh giới cao hơn để lĩnh ngộ
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="achievements-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold/25 pb-6 mb-8">
              <div>
                <h2 className="font-serif text-gold text-3xl tracking-widest uppercase mb-2">
                  🏆 Kho Tàng Thành Tựu
                </h2>
                <p className="text-text-dim text-xs tracking-wider italic">
                  Ghi danh vào sử sách tu tiên thông qua những cột mốc vĩ đại.
                </p>
              </div>
              
              <div className="bg-gold/5 px-6 py-3 rounded-sm border border-gold/10 flex items-center gap-4">
                <div className="text-gold">
                  <Trophy size={24} />
                </div>
                <div>
                  <div className="text-[10px] text-text-dim uppercase tracking-widest">Tiến Độ Hoàn Thành</div>
                  <div className="text-xl font-bold text-gold">
                    {gameState.achievements.filter(a => a.isUnlocked).length} <span className="text-text-dim text-sm font-normal">/ {gameState.achievements.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mb-12 sticky top-0 z-20 bg-bg-dark/80 backdrop-blur-md py-4 border-b border-gold/10">
              {achCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setAchFilter(cat.id)}
                  className={cn(
                    "px-5 py-2 border border-gold/25 text-[10px] rounded-sm transition-all duration-200 tracking-widest uppercase",
                    achFilter === cat.id 
                      ? "bg-gold text-bg-dark border-gold font-bold shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
                      : "text-text-dim hover:text-gold hover:bg-gold/5"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-16">
              {groupedAchievements.map(group => (
                <div key={group.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-linear-to-r from-transparent to-gold/20" />
                    <h3 className="font-serif text-gold/80 text-xl tracking-[0.3em] uppercase flex items-center gap-3">
                      <span className="text-2xl opacity-50">#</span> {group.label}
                    </h3>
                    <div className="h-px flex-1 bg-linear-to-l from-transparent to-gold/20" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.achievements.map(ach => (
                      <div 
                        key={ach.id} 
                        className={cn(
                          "p-6 rounded-sm border transition-all duration-500 relative overflow-hidden group flex flex-col h-full",
                          ach.isUnlocked 
                            ? "bg-bg-card border-gold/40 shadow-[0_0_25px_rgba(201,168,76,0.1)]" 
                            : "bg-white/5 border-white/10 opacity-40 grayscale blur-[1px] hover:blur-none transition-all duration-700"
                        )}
                      >
                        {/* Background Decoration */}
                        <div className="absolute -right-6 -bottom-6 text-8xl opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                          {ach.icon}
                        </div>

                        <div className="flex items-start gap-5 relative z-10 mb-4">
                          <div className={cn(
                            "w-16 h-16 rounded-sm flex items-center justify-center text-4xl shadow-inner transition-all duration-500",
                            ach.isUnlocked 
                              ? "bg-gold/20 border border-gold/40 group-hover:bg-gold/30 group-hover:border-gold" 
                              : "bg-white/5 border border-white/10"
                          )}>
                            {ach.isUnlocked ? ach.icon : <Lock size={24} className="text-text-dim" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className={cn(
                                "font-serif text-lg tracking-wide",
                                ach.isUnlocked ? "text-gold-light" : "text-text-dim"
                              )}>
                                {ach.name}
                              </div>
                              {ach.isUnlocked && (
                                <div className="bg-gold/20 text-gold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                  Đã Đạt
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-text-dim font-mono mb-2">
                              {ach.isUnlocked && ach.unlockedAt 
                                ? (() => {
                                    const d = new Date(ach.unlockedAt);
                                    return isNaN(d.getTime()) ? 'Ngày không xác định' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                  })()
                                : '— Chưa đạt được —'}
                            </div>
                            <div className="text-[9px] text-gold/50 uppercase tracking-widest italic">
                              {achTypeLabels[ach.category]}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-text-main leading-relaxed opacity-80 flex-1 italic">
                          {ach.desc}
                        </p>

                        {ach.isUnlocked && (
                          <div className="mt-4 pt-4 border-t border-gold/10 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[9px] text-gold/60 uppercase tracking-widest">
                              <Star size={10} /> Thành tựu vĩnh cửu
                            </div>
                            <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(201,168,76,0.8)]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Treasure Vault Decoration */}
            <div className="mt-12 p-10 border border-gold/10 bg-gold/5 rounded-sm text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, rgba(201,168,76,0.05), transparent 70%)" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="text-gold opacity-30 flex justify-center gap-8">
                  <Shield size={40} />
                  <Award size={48} />
                  <Star size={40} />
                </div>
                <h4 className="font-serif text-gold text-xl tracking-[0.3em] uppercase">Vạn Cổ Trường Tồn</h4>
                <p className="text-text-dim text-xs italic leading-loose">
                  "Mỗi thành tựu là một dấu ấn trên con đường nghịch thiên cải mệnh. Những kẻ phàm phu tục tử chỉ thấy vinh quang, nhưng bậc đại năng thấu hiểu đó là mồ hôi, máu và ý chí sắt đá."
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
