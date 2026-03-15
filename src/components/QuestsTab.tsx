import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quest, GameState, QuestType } from '../types';
import { Scroll, CheckCircle2, Gift, Trophy, Clock, Zap, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuestsTabProps {
  gameState: GameState;
  onClaimReward: (questId: string) => void;
}

export const QuestsTab: React.FC<QuestsTabProps> = ({ gameState, onClaimReward }) => {
  const [activeFilter, setActiveFilter] = React.useState<QuestType | 'all'>('all');

  const activeQuests = gameState.quests.filter(q => 
    (activeFilter === 'all' || q.type === activeFilter) && q.status === 'active'
  );

  const historyQuests = gameState.quests.filter(q => 
    (activeFilter === 'all' || q.type === activeFilter) && (q.status === 'ready' || q.status === 'claimed')
  );

  const questTypes: { id: QuestType | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'Tất Cả', icon: Scroll },
    { id: 'main', label: 'Chính Tuyến', icon: Trophy },
    { id: 'side', label: 'Phụ Tuyến', icon: Zap },
    { id: 'daily', label: 'Hàng Ngày', icon: Clock },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card/50 p-4 rounded-2xl border border-gold/10 backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-serif text-gold flex items-center gap-2">
            <Scroll className="w-6 h-6" />
            Cơ Duyên Giang Hồ
          </h2>
          <p className="text-xs text-gold/60 mt-1">Hoàn thành thử thách để nhận kỳ ngộ và tài bảo.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {questTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                activeFilter === type.id 
                  ? 'bg-gold text-bg-dark shadow-lg shadow-gold/20' 
                  : 'bg-bg-card2 text-gold/60 hover:text-gold hover:bg-bg-card border border-gold/5'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-8">
        {/* Active Quests */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif text-gold/60 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <Scroll className="w-4 h-4" />
            Cơ Duyên Đang Thực Hiện
          </h3>
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {activeQuests.length > 0 ? (
                activeQuests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative bg-bg-card border ${
                      quest.status === 'ready' 
                        ? 'border-gold/40 shadow-lg shadow-gold/5' 
                        : 'border-gold/10'
                    } rounded-2xl p-5 overflow-hidden transition-all duration-300`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                       <span className="text-8xl">{quest.icon}</span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        quest.status === 'ready' ? 'bg-gold/20 text-gold' : 'bg-bg-card2 text-gold/40'
                      }`}>
                        <span className="text-2xl">{quest.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className={`font-serif text-lg truncate ${
                            quest.status === 'ready' ? 'text-gold-light' : 'text-gold'
                          }`}>
                            {quest.name}
                          </h3>
                          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            quest.type === 'main' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                            quest.type === 'side' ? 'border-jade/30 text-jade-light bg-jade/5' :
                            'border-purple-500/30 text-purple-400 bg-purple-500/5'
                          }`}>
                            {quest.type === 'main' ? 'Chính Tuyến' : quest.type === 'side' ? 'Phụ Tuyến' : 'Hàng Ngày'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gold/60 mb-4 line-clamp-2">{quest.desc}</p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-gold/40 uppercase tracking-tighter">
                            <span>Tiến độ</span>
                            <span>{quest.progress} / {quest.target}</span>
                          </div>
                          <div className="h-1.5 bg-bg-dark rounded-full overflow-hidden border border-gold/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                              className={`h-full ${
                                quest.status === 'ready' ? 'bg-gold' : 'bg-gold/40'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Rewards */}
                        <div className="mt-4 flex flex-wrap gap-3">
                          {quest.rewards.linhThach && (
                            <div className="flex items-center gap-1 text-xs text-gold/80 bg-gold/5 px-2 py-1 rounded-lg border border-gold/10">
                              <span className="text-yellow-500">💰</span>
                              {quest.rewards.linhThach} Linh Thạch
                            </div>
                          )}
                          {quest.rewards.exp && (
                            <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/5 px-2 py-1 rounded-lg border border-purple-500/10">
                              <span className="text-purple-500">✨</span>
                              {quest.rewards.exp} Tu Vi
                            </div>
                          )}
                          {quest.rewards.fame && (
                            <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10">
                              <span className="text-blue-500">📣</span>
                              {quest.rewards.fame} Danh Vọng
                            </div>
                          )}
                          {quest.rewards.charm && (
                            <div className="flex items-center gap-1 text-xs text-pink-400 bg-pink-500/5 px-2 py-1 rounded-lg border border-pink-500/10">
                              <span className="text-pink-500">💖</span>
                              {quest.rewards.charm} Mị Lực
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {quest.status === 'ready' ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onClaimReward(quest.id)}
                            className="bg-gold text-bg-dark px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gold/20 hover:bg-gold-light transition-colors"
                          >
                            Nhận Thưởng
                          </motion.button>
                        ) : (
                          <div className="flex items-center gap-1 text-gold/30 text-sm italic">
                            <Circle className="w-4 h-4" />
                            Đang làm...
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 bg-bg-card/30 rounded-3xl border border-gold/5 border-dashed">
                  <p className="text-gold/40 text-sm">Không có cơ duyên nào đang thực hiện.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History Quests */}
        {historyQuests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-serif text-gold/60 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Lịch Sử Cơ Duyên
            </h3>
            <div className="grid gap-3">
              {historyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={cn(
                    "bg-bg-card/40 border rounded-xl p-4 flex items-center justify-between transition-all duration-300",
                    quest.status === 'claimed' ? "border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100" : "border-gold/30 bg-gold/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("text-2xl", quest.status === 'claimed' ? "opacity-50" : "opacity-100")}>{quest.icon}</div>
                    <div>
                      <h4 className="font-serif text-gold text-sm">{quest.name}</h4>
                      <p className="text-[10px] text-gold/40">{quest.desc}</p>
                    </div>
                  </div>
                  
                  {quest.status === 'ready' ? (
                    <button
                      onClick={() => onClaimReward(quest.id)}
                      className="bg-gold text-bg-dark px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg shadow-gold/20 hover:bg-gold-light transition-colors uppercase tracking-widest"
                    >
                      Nhận Thưởng
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-jade-light text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã Hoàn Thành
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
