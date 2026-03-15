import React, { useState } from 'react';
import { GameState } from '../types';
import { REALMS } from '../constants';
import { cn, calculateCombatPower } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { 
  User, 
  Zap, 
  TrendingUp, 
  Award, 
  History, 
  Scroll, 
  RefreshCcw, 
  ShieldCheck, 
  Sparkles,
  Coins,
  Briefcase,
  Users,
  Flame,
  Star,
  Activity,
  Heart,
  Target,
  Sword,
  Shield,
  Download,
  Upload,
  Save
} from 'lucide-react';

interface StatusTabProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  addNotification: (title: string, body: string, reward?: string) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTabChange?: (tab: string) => void;
  updateQuestProgress: (questId: string, amount: number) => void;
}

const TITLE_BUFFS: Record<string, { desc: string, stats: string }> = {
  'Trùng Sinh Giả': { desc: 'Người quay về từ tương lai.', stats: '+10% Tốc độ tu luyện, +5 Hào quang' },
  'Thiên Lựa Chi Tử': { desc: 'Đứa con của trời.', stats: '+20 Hào quang, +10% May mắn' },
  'Nhất Đại Tông Sư': { desc: 'Bậc thầy của một thế hệ.', stats: '+50 Danh vọng, +10% Sát thương' },
};

export function StatusTab({ 
  gameState, 
  updateGameState, 
  addNotification, 
  onReset, 
  onExport,
  onImport,
  onTabChange, 
  updateQuestProgress 
}: StatusTabProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBreakthroughModal, setShowBreakthroughModal] = useState(false);
  const [isCultivating, setIsCultivating] = useState(false);
  const [shake, setShake] = useState(false);
  const [breakthroughResult, setBreakthroughResult] = useState<{ success: boolean; msg: string } | null>(null);
  
  const expPct = Math.floor((gameState.tuVi / gameState.tuViMax) * 100);
  const canBreakthrough = gameState.tuVi >= gameState.tuViMax;

  const currentRealm = REALMS[gameState.realmIndex];
  const nextRealm = REALMS[gameState.realmIndex + 1];

  // Determine required pill based on next realm
  let requiredPillId = '';
  if (gameState.realmIndex === 9) requiredPillId = 'pill_truc_co'; // Luyện Khí 9 -> Trúc Cơ
  if (gameState.realmIndex === 13) requiredPillId = 'pill_chan_nguyen'; // Trúc Cơ Viên Mãn -> Kết Đan
  if (gameState.realmIndex === 17) requiredPillId = 'pill_hang_tran'; // Kết Đan Viên Mãn -> Nguyên Anh
  if (gameState.realmIndex === 21) requiredPillId = 'pill_nguyen_anh'; // Nguyên Anh Viên Mãn -> Hóa Thần

  const pillItem = requiredPillId ? gameState.inventory.find(i => i.id === requiredPillId) : null;
  const pillQty = pillItem ? pillItem.qty : 0;
  const hasRequiredPill = pillQty > 0;

  const baseSuccessRate = 0.05; // 5% base
  const pillBonusPerUnit = 0.30; // Each pill adds 30%
  const totalSuccessRate = Math.min(1, baseSuccessRate + (pillQty * pillBonusPerUnit));

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleCultivate = () => {
    if (isCultivating) return;
    setIsCultivating(true);
    triggerShake();
    
    setTimeout(() => {
      // Mood affects gain: mood 100 = 1.5x gain, mood 0 = 0.5x gain
      const moodMultiplier = 0.5 + (gameState.mood / 100);
      const baseGain = Math.floor(Math.random() * 5) + 5;
      const gain = Math.floor(baseGain * moodMultiplier);
      const expGain = Math.floor(gain / 2); // Also gain some EXP for skills
      const statChance = Math.random();
      
      updateGameState(prev => {
        let next = { 
          ...prev, 
          tuVi: prev.tuVi + gain,
          exp: prev.exp + expGain,
          mood: Math.max(0, prev.mood - 2), // Cultivating is tiring
          cultivationHistory: [
            ...prev.cultivationHistory, 
            { text: `Tu luyện tại chỗ, nhận ${gain} Tu Vi & ${expGain} EXP (Tâm cảnh: ${prev.mood}%)`, timestamp: new Date().toISOString() }
          ]
        };
        
        // Update quest progress
        updateQuestProgress('q_daily_1', 1);

        // Small chance to improve stats based on root
        if (statChance < 0.15) {
          const statsToImprove = ['charm', 'haoguang', 'fame', 'hpMax', 'apMax', 'atk', 'def'];
          const stat = statsToImprove[Math.floor(Math.random() * statsToImprove.length)] as keyof GameState;
          if (typeof next[stat] === 'number') {
            const gainAmount = (stat === 'hpMax' || stat === 'apMax') ? 5 : 1;
            (next[stat] as number) += gainAmount;
            
            let statLabel = stat.toUpperCase();
            if (stat === 'hpMax') statLabel = 'HP TỐI ĐA';
            if (stat === 'apMax') statLabel = 'AP TỐI ĐA';
            if (stat === 'atk') statLabel = 'CÔNG KÍCH';
            if (stat === 'def') statLabel = 'PHÒNG THỦ';

            next.cultivationHistory = [
              ...next.cultivationHistory.slice(0, -1),
              { 
                text: `Tu luyện tại chỗ, nhận ${gain} Tu Vi. Ngộ đạo thành công, +${gainAmount} ${statLabel}`, 
                timestamp: new Date().toISOString() 
              }
            ];
            addNotification('✨ Ngộ Đạo', `Trong lúc tu luyện, ngươi chợt ngộ ra chân lý.`, `+${gainAmount} ${statLabel}`);
          }
        }
        
        return next;
      });
      
      addNotification('🧘 Tu Luyện', `Ngươi cảm thấy linh lực trong người tăng tiến.`, `+${gain} Tu Vi`);
      setIsCultivating(false);
    }, 1500);
  };

  const handleBreakthrough = () => {
    if (!canBreakthrough) return;
    
    if (!nextRealm) {
      addNotification('✨ Đỉnh Phong', 'Ngươi đã đạt đến cảnh giới cao nhất hiện tại.', 'Vô địch thiên hạ');
      return;
    }

    const roll = Math.random();
    const isSuccess = roll < totalSuccessRate;

    if (isSuccess) {
      updateGameState(prev => {
        const nextHpMax = prev.hpMax + (prev.realmIndex + 1) * 500;
        const nextApMax = prev.apMax + (prev.realmIndex + 1) * 200;
        const nextAtk = prev.atk + (prev.realmIndex + 1) * 50;
        const nextDef = prev.def + (prev.realmIndex + 1) * 20;

        // Consume pills used
        let newInventory = [...prev.inventory];
        if (requiredPillId) {
          // Consume all pills of this type (up to 4 for max benefit, but let's just consume all for simplicity or up to what they have)
          newInventory = newInventory.map(item => 
            item.id === requiredPillId ? { ...item, qty: 0 } : item
          ).filter(item => item.qty > 0 || item.type !== 'Đan Dược');
        }

        return {
          ...prev,
          realmIndex: prev.realmIndex + 1,
          tuVi: 0,
          tuViMax: Math.floor(prev.tuViMax * 1.5), // Increase max for next level
          hpMax: nextHpMax,
          hp: nextHpMax,
          apMax: nextApMax,
          ap: nextApMax,
          atk: nextAtk,
          def: nextDef,
          haoguang: prev.haoguang + 50,
          charm: prev.charm + 5,
          fame: prev.fame + 10,
          inventory: newInventory,
          cultivationHistory: [...prev.cultivationHistory, { text: `Đột phá thành công lên ${REALMS[prev.realmIndex + 1]}`, timestamp: new Date().toISOString() }]
        };
      });

      setBreakthroughResult({ success: true, msg: `Chúc mừng! Ngươi đã đột phá thành công lên ${REALMS[gameState.realmIndex + 1]}.` });
      addNotification('⚡ Đột Phá Thành Công', `Ngươi đã đạt tới ${REALMS[gameState.realmIndex + 1]}.`, 'HP/AP/ATK/DEF tăng mạnh!');
    } else {
      // Failure consequences
      updateGameState(prev => {
        // Lose 20% of current max Tu Vi on failure
        const tuViLoss = Math.floor(prev.tuViMax * 0.2);
        const nextTuVi = Math.max(0, prev.tuVi - tuViLoss);
        
        // Consume pills even on failure
        let newInventory = [...prev.inventory];
        if (requiredPillId) {
          newInventory = newInventory.map(item => 
            item.id === requiredPillId ? { ...item, qty: 0 } : item
          ).filter(item => item.qty > 0 || item.type !== 'Đan Dược');
        }

        return {
          ...prev,
          tuVi: nextTuVi,
          hp: Math.max(1, Math.floor(prev.hp * 0.5)), // Lose 50% current HP
          inventory: newInventory,
          cultivationHistory: [...prev.cultivationHistory, { text: `Đột phá thất bại, tổn thất ${tuViLoss} Tu Vi`, timestamp: new Date().toISOString() }]
        };
      });

      setBreakthroughResult({ success: false, msg: `Đột phá thất bại! Kinh mạch bị tổn thương, tu vi bị đẩy lùi.` });
      addNotification('❌ Đột Phá Thất Bại', `Kinh mạch nghịch chuyển, tu vi tổn thất nặng nề.`, 'Cần cẩn trọng hơn!');
    }
  };

  const combatPower = calculateCombatPower(gameState);

  const radarData = [
    { subject: 'CÔNG', A: Math.min(100, combatPower / 500), fullMark: 100 },
    { subject: 'PHÚ', A: Math.min(100, gameState.linhThach / 100), fullMark: 100 },
    { subject: 'MỊ', A: Math.min(100, gameState.charm * 2), fullMark: 100 },
    { subject: 'DANH', A: Math.min(100, gameState.fame * 2), fullMark: 100 },
    { subject: 'VẬN', A: Math.min(100, gameState.haoguang), fullMark: 100 },
  ];

  const statGroups = [
    {
      title: 'THIÊN MỆNH',
      icon: <Target size={14} className="text-red-500" />,
      stats: [
        { 
          label: 'ĐẠO HẠNH', 
          value: (combatPower || 0).toLocaleString(), 
          icon: <Zap size={16} />, 
          color: 'text-yellow-500',
          desc: 'Tổng hợp sức mạnh bản thân, bao gồm cảnh giới, hào quang, danh vọng và công pháp.',
          tab: 'skills'
        },
        { 
          label: 'CẢNH GIỚI', 
          value: REALMS[gameState.realmIndex], 
          icon: <Award size={16} />, 
          color: 'text-purple-400',
          desc: 'Cảnh giới tu vi hiện tại của ngươi.',
          tab: 'status'
        },
        { 
          label: 'CÔNG KÍCH', 
          value: (gameState.atk || 0).toLocaleString(), 
          icon: <Sword size={16} />, 
          color: 'text-red-500',
          desc: 'Khả năng gây sát thương vật lý và pháp thuật.',
          tab: 'status'
        },
        { 
          label: 'PHÒNG THỦ', 
          value: (gameState.def || 0).toLocaleString(), 
          icon: <Shield size={16} />, 
          color: 'text-blue-500',
          desc: 'Khả năng chống đỡ và giảm sát thương nhận vào.',
          tab: 'status'
        },
      ]
    },
    {
      title: 'NHÂN DUYÊN',
      icon: <Heart size={14} className="text-pink-500" />,
      stats: [
        { 
          label: 'MỊ LỰC', 
          value: (gameState.charm || 0).toLocaleString(), 
          icon: <Sparkles size={16} />, 
          color: 'text-pink-400',
          desc: 'Ảnh hưởng đến khả năng thu phục giai nhân và tỷ lệ thành công của các sự kiện tình cảm.',
          tab: 'harem'
        },
        { 
          label: 'HẬU CUNG', 
          value: (gameState.characters?.filter(w => w.inHarem).length || 0).toLocaleString(), 
          icon: <Users size={16} />, 
          color: 'text-red-400',
          desc: 'Số lượng giai nhân đã kết duyên. Càng đông, linh lực song tu càng mạnh.',
          tab: 'harem'
        },
        { 
          label: 'DANH VỌNG', 
          value: (gameState.fame || 0).toLocaleString(), 
          icon: <Award size={16} />, 
          color: 'text-purple-400',
          desc: 'Mở khóa các nhiệm vụ cao cấp và tăng uy tín trong giới tu tiên.',
          tab: 'status'
        },
      ]
    },
    {
      title: 'TIẾN ĐỘ',
      icon: <Activity size={14} className="text-cyan-500" />,
      stats: [
        { 
          label: 'HÀO QUANG', 
          value: (gameState.haoguang || 0).toLocaleString(), 
          icon: <Flame size={16} />, 
          color: 'text-orange-400',
          desc: 'Vận khí thiên mệnh, giúp tăng tỷ lệ gặp kỳ ngộ và may mắn trong chiến đấu.',
          tab: 'status'
        },
        { 
          label: 'CHIẾN TÍCH', 
          value: (gameState.achievements?.filter(a => a.isUnlocked).length || 0).toLocaleString(), 
          icon: <TrendingUp size={16} />, 
          color: 'text-cyan-400',
          desc: 'Số lượng chiến tích đã đạt được trong quá trình tu hành.',
          tab: 'skills'
        },
      ]
    }
  ];

  const handleUnlockSkill = (skillId: string) => {
    const skill = gameState.skills.find(s => s.id === skillId);
    if (!skill) return;

    if (gameState.realmIndex < (skill.unlockRealmIndex || 0)) {
      addNotification('❌ Thất bại', `Cần đạt đến ${REALMS[skill.unlockRealmIndex || 0]} để mở khóa.`, '');
      return;
    }

    const unlockCost = 500; // Cost 500 Tu Vi to unlock a new skill
    if (gameState.tuVi < unlockCost) {
      addNotification('❌ Thất bại', `Cần ${unlockCost} Tu Vi để lĩnh ngộ kỹ năng này.`, '');
      return;
    }

    updateGameState(prev => {
      const updatedSkills = prev.skills.map(s => 
        s.id === skillId ? { ...s, unlocked: true } : s
      );
      return { 
        ...prev, 
        skills: updatedSkills,
        tuVi: prev.tuVi - unlockCost
      };
    });

    addNotification('✨ Mở Khóa Thành Công', `Ngươi đã lĩnh ngộ được ${skill.name}!`, skill.desc);
  };

  const skillsByRealm = gameState.skills.reduce((acc, skill) => {
    const realmIdx = skill.unlockRealmIndex || 0;
    if (!acc[realmIdx]) acc[realmIdx] = [];
    acc[realmIdx].push(skill);
    return acc;
  }, {} as Record<number, typeof gameState.skills>);

  // Get relevant realms (current and next few)
  const relevantRealmIndices = Object.keys(skillsByRealm)
    .map(Number)
    .filter(idx => idx <= gameState.realmIndex + 10) // Show up to 10 stages ahead
    .sort((a, b) => a - b);

  return (
    <motion.div 
      animate={shake ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.1, repeat: 4 }}
      className="p-3 md:p-5 space-y-5 pb-24 max-w-7xl mx-auto"
    >
      {/* --- TOP ROW: NAMEPLATE & VITALITY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Character Nameplate - Premium Editorial Style */}
        <div className="lg:col-span-8 bg-bg-card border border-gold/20 rounded-2xl p-5 relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 bg-linear-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {/* Avatar Section - More Compact */}
            <div className="relative">
              <div className="w-24 h-24 rounded-xl border border-gold/30 p-1 bg-bg-dark flex items-center justify-center overflow-hidden shadow-lg group-hover:border-gold transition-all duration-500">
                <div className="text-5xl transform group-hover:scale-110 transition-transform duration-500">🧙‍♂️</div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gold text-bg-dark p-1 rounded-md shadow-md border border-bg-dark">
                <ShieldCheck size={14} />
              </div>
            </div>

            {/* Name & Identity - Tighter Layout */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
                <h3 className="font-serif text-3xl text-gold-light tracking-tight leading-none">{gameState.heroName}</h3>
                <div className="flex gap-1.5 justify-center">
                  {gameState.titles.slice(0, 2).map((title, i) => (
                    <span key={i} className="bg-gold/10 border border-gold/20 text-gold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold">
                      {title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start text-[9px] text-text-dim tracking-widest uppercase font-semibold">
                <span className="flex items-center gap-1"><User size={10} className="text-gold/50" /> {gameState.age} Tuổi</span>
                <span className="flex items-center gap-1"><Sparkles size={10} className="text-gold/50" /> {gameState.root}</span>
                <span className="flex items-center gap-1"><Target size={10} className="text-gold/50" /> {gameState.fate}</span>
              </div>

              {/* Quick Stats - More Integrated */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[7px] text-text-dim uppercase tracking-tighter mb-0.5">Đạo Hạnh</span>
                  <span className="text-xs text-yellow-500 font-bold font-mono">{(combatPower || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[7px] text-text-dim uppercase tracking-tighter mb-0.5">Linh Thạch</span>
                  <span className="text-xs text-jade-light font-bold font-mono">{(gameState.linhThach || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[7px] text-text-dim uppercase tracking-tighter mb-0.5">Danh Vọng</span>
                  <span className="text-xs text-purple-400 font-bold font-mono">{(gameState.fame || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Status Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-bg-dark/40 border border-white/5 px-2 py-0.5 rounded-full">
            <div className="w-1 h-1 rounded-full bg-jade animate-pulse" />
            <span className="text-[8px] text-text-dim uppercase tracking-widest">{gameState.location}</span>
          </div>
        </div>

        {/* Vitality & Cultivation - Very Compact */}
        <div className="lg:col-span-4 bg-bg-card border border-gold/20 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-red-deep/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-dim tracking-[0.2em] uppercase font-bold">Tu Vi</span>
              <span className="text-[9px] text-gold-light font-serif tracking-widest uppercase">{REALMS[gameState.realmIndex]}</span>
            </div>

            {/* Progress Bars - Tighter */}
            <div className="space-y-2.5">
              {/* Tu Vi Bar */}
              <div className="space-y-1">
                <div className="h-1.5 bg-bg-dark rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-linear-to-r from-red-deep via-gold to-gold-light rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${expPct}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-text-dim font-mono">
                  <span>{expPct}%</span>
                  <span>{gameState.tuVi} / {gameState.tuViMax}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* HP Bar */}
                <div className="space-y-1">
                  <div className="h-1 bg-bg-dark rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-red-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(gameState.hp / gameState.hpMax) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] text-text-dim uppercase font-bold">
                    <span>HP</span>
                    <span className="text-red-500">{gameState.hp}/{gameState.hpMax}</span>
                  </div>
                </div>
                {/* MP Bar */}
                <div className="space-y-1">
                  <div className="h-1 bg-bg-dark rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(gameState.mp / gameState.mpMax) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] text-text-dim uppercase font-bold">
                    <span>MP</span>
                    <span className="text-purple-500">{gameState.mp}/{gameState.mpMax}</span>
                  </div>
                </div>
                {/* AP Bar */}
                <div className="space-y-1">
                  <div className="h-1 bg-bg-dark rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(gameState.ap / gameState.apMax) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] text-text-dim uppercase font-bold">
                    <span>AP</span>
                    <span className="text-blue-500">{gameState.ap}/{gameState.apMax}</span>
                  </div>
                </div>
              </div>

              {/* Mood Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-bg-dark rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      gameState.mood > 70 ? "bg-jade" : gameState.mood > 30 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${gameState.mood}%` }}
                  />
                </div>
                <span className={cn("text-[8px] font-bold", gameState.mood > 70 ? "text-jade-light" : gameState.mood > 30 ? "text-yellow-400" : "text-red-400")}>
                  {gameState.mood}%
                </span>
              </div>
            </div>

            {/* Action Buttons - More Compact */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={handleCultivate}
                disabled={isCultivating || canBreakthrough}
                className={cn(
                  "py-2 rounded-lg font-serif text-[9px] tracking-[0.1em] flex items-center justify-center gap-1.5 transition-all border",
                  isCultivating ? "bg-white/5 text-text-dim border-white/5 cursor-not-allowed" : 
                  canBreakthrough ? "bg-white/5 text-text-dim border-white/5 cursor-not-allowed" :
                  "bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 active:scale-95"
                )}
              >
                {isCultivating ? <RefreshCcw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {isCultivating ? 'TU LUYỆN...' : 'TU LUYỆN'}
              </button>

              <button 
                onClick={() => setShowBreakthroughModal(true)}
                disabled={!canBreakthrough}
                className={cn(
                  "py-2 rounded-lg font-serif text-[9px] tracking-[0.1em] flex items-center justify-center gap-1.5 transition-all border",
                  canBreakthrough 
                    ? "bg-linear-to-r from-red-deep to-purple-deep text-white border-transparent shadow-lg animate-pulse" 
                    : "bg-white/5 border-white/10 text-text-dim cursor-not-allowed"
                )}
              >
                <Zap size={10} /> ĐỘT PHÁ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MIDDLE ROW: ATTRIBUTES BENTO GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Radar Chart - Smaller & Tucked */}
        <div className="lg:col-span-3 bg-bg-card border border-gold/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-[240px]">
          <div className="text-[8px] text-text-dim tracking-[0.2em] uppercase mb-1 font-bold">Thiên Phú</div>
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                <PolarGrid stroke="#c9a84c" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8e9299', fontSize: 8, fontWeight: 'bold' }} />
                <Radar
                  name="Sức Mạnh"
                  dataKey="A"
                  stroke="#c9a84c"
                  fill="#c9a84c"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attributes Bento Grid - 3 Categories */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category 1: Chiến Đấu */}
          <div className="bg-bg-card/40 border border-gold/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-gold/10 pb-2">
              <Sword size={12} className="text-red-500" />
              <span className="text-[9px] text-text-dim tracking-[0.1em] font-bold uppercase">Chiến Đấu</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {statGroups[0].stats.map((stat, idx) => (
                <motion.button 
                  key={idx} 
                  whileHover={{ x: 2 }}
                  onClick={() => onTabChange && onTabChange(stat.tab)}
                  className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center justify-between hover:border-gold/30 transition-all group relative"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1 rounded-lg bg-bg-dark/50", stat.color)}>
                      {React.cloneElement(stat.icon as React.ReactElement<{ size?: number }>, { size: 12 })}
                    </div>
                    <div>
                      <div className="text-[7px] text-text-dim uppercase tracking-tighter">{stat.label}</div>
                      <div className="font-serif text-xs text-gold-light">{stat.value}</div>
                    </div>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 bg-bg-dark border border-gold/30 rounded text-[8px] text-text-dim opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-tight">
                    {stat.desc}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Category 2: Nhân Duyên & Xã Giao */}
          <div className="bg-bg-card/40 border border-gold/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-gold/10 pb-2">
              <Heart size={12} className="text-pink-500" />
              <span className="text-[9px] text-text-dim tracking-[0.1em] font-bold uppercase">Nhân Duyên</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {statGroups[1].stats.map((stat, idx) => (
                <motion.button 
                  key={idx} 
                  whileHover={{ x: 2 }}
                  onClick={() => onTabChange && onTabChange(stat.tab)}
                  className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center justify-between hover:border-gold/30 transition-all group relative"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1 rounded-lg bg-bg-dark/50", stat.color)}>
                      {React.cloneElement(stat.icon as React.ReactElement<{ size?: number }>, { size: 12 })}
                    </div>
                    <div>
                      <div className="text-[7px] text-text-dim uppercase tracking-tighter">{stat.label}</div>
                      <div className="font-serif text-xs text-gold-light">{stat.value}</div>
                    </div>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 bg-bg-dark border border-gold/30 rounded text-[8px] text-text-dim opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-tight">
                    {stat.desc}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Category 3: Ngoại Hình & Đặc Điểm (New Attributes) */}
          <div className="bg-bg-card/40 border border-gold/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-gold/10 pb-2">
              <Sparkles size={12} className="text-cyan-500" />
              <span className="text-[9px] text-text-dim tracking-[0.1em] font-bold uppercase">Ngoại Hình</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-bg-dark/50 text-cyan-400"><Activity size={12} /></div>
                  <div>
                    <div className="text-[7px] text-text-dim uppercase tracking-tighter">Vẻ Đẹp</div>
                    <div className="font-serif text-xs text-gold-light">{gameState.beauty || 'Bình Phàm'}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-bg-dark/50 text-orange-400"><Flame size={12} /></div>
                  <div>
                    <div className="text-[7px] text-text-dim uppercase tracking-tighter">Hào Quang</div>
                    <div className="font-serif text-xs text-gold-light">{gameState.haoguang}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-bg-dark/50 text-purple-400"><User size={12} /></div>
                  <div>
                    <div className="text-[7px] text-text-dim uppercase tracking-tighter">Số Đo</div>
                    <div className="font-serif text-xs text-gold-light">{gameState.measurements || 'Chưa rõ'}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-bg-dark/50 text-yellow-400"><Star size={12} /></div>
                  <div>
                    <div className="text-[7px] text-text-dim uppercase tracking-tighter">Căn Cốt</div>
                    <div className="font-serif text-xs text-gold-light">{gameState.root}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: PROGRESSION & HISTORY --- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Realm Progression - Vertical Timeline Style */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-gold/10 pb-2">
            <h3 className="font-serif text-gold text-base flex items-center gap-2 uppercase tracking-widest">
              <Scroll size={16} /> Lộ Trình Tu Tiên
            </h3>
          </div>

          <div className="space-y-3">
            {relevantRealmIndices.slice(0, 3).map((realmIdx, rIdx) => {
              const isCurrentOrPast = realmIdx <= gameState.realmIndex;
              const isCurrent = realmIdx === gameState.realmIndex;
              const realmSkills = skillsByRealm[realmIdx] || [];
              
              return (
                <motion.div 
                  key={realmIdx}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: rIdx * 0.05 }}
                  className={cn(
                    "bg-bg-card/30 border rounded-xl p-3 flex items-center gap-4 transition-all relative overflow-hidden",
                    isCurrent ? "border-gold/40 bg-gold/5 shadow-md" :
                    isCurrentOrPast ? "border-gold/10" : "border-white/5 opacity-30 grayscale"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0",
                    isCurrent ? "bg-gold text-bg-dark border-gold" :
                    isCurrentOrPast ? "bg-bg-dark border-gold/20 text-gold" : "bg-bg-dark border-white/10 text-text-dim"
                  )}>
                    {isCurrent ? <Zap size={14} /> : <span className="text-[10px] font-serif">{realmIdx + 1}</span>}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-serif text-sm uppercase tracking-wider", isCurrentOrPast ? "text-gold-light" : "text-text-dim")}>
                        {REALMS[realmIdx]}
                      </span>
                      {isCurrent && <span className="text-[7px] bg-gold/20 text-gold px-1 rounded font-bold uppercase">Hiện Tại</span>}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      {realmSkills.map(skill => (
                        <span key={skill.id} className={cn("text-[8px] px-1.5 py-0.5 rounded border", skill.unlocked ? "bg-jade/10 border-jade/20 text-jade-light" : "bg-white/5 border-white/5 text-text-dim")}>
                          {skill.unlocked ? skill.name : '???'}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* History - Simple List */}
        <div className="xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gold/10 pb-2">
            <h3 className="font-serif text-gold text-base flex items-center gap-2 uppercase tracking-widest">
              <History size={16} /> Nhật Ký
            </h3>
          </div>
          <div className="bg-bg-card/20 border border-gold/10 rounded-xl h-[220px] overflow-y-auto custom-scrollbar p-3 space-y-3">
            {gameState.cultivationHistory.slice().reverse().slice(0, 10).map((entry, i) => (
              <div key={i} className="flex gap-2 text-[10px]">
                <span className="text-gold/30 font-mono flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-text-dim leading-tight">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Breakthrough Modal */}
      <AnimatePresence>
        {showBreakthroughModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-dark border border-gold/40 rounded-lg w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center border-b border-gold/20 bg-radial-gradient(circle at 50% 0%, rgba(201,168,76,0.1), transparent 70%)">
                <h3 className="text-2xl font-serif text-gold mb-1 uppercase tracking-widest">Đột Phá Cảnh Giới</h3>
                <p className="text-text-dim text-[10px] tracking-widest uppercase">Từ {currentRealm} lên {nextRealm}</p>
              </div>

              <div className="p-8 space-y-6">
                {!breakthroughResult ? (
                  <>
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full animate-pulse" />
                        <Award className="w-20 h-20 text-gold relative z-10" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-sm p-4 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-text-dim text-[10px] uppercase tracking-widest">Tỷ lệ cơ bản:</span>
                          <span className="text-white font-mono">{(baseSuccessRate * 100).toFixed(0)}%</span>
                        </div>
                        {requiredPillId && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-text-dim text-[10px] uppercase tracking-widest">Hỗ trợ đan dược:</span>
                            <span className={cn("font-mono", hasRequiredPill ? "text-jade-light" : "text-red-400")}>
                              {hasRequiredPill ? `+${(pillQty * pillBonusPerUnit * 100).toFixed(0)}% (${pillQty} viên)` : 'Không có'}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                          <span className="text-gold font-serif uppercase tracking-widest">Tổng tỷ lệ:</span>
                          <span className="text-gold font-serif text-xl">{(totalSuccessRate * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      {requiredPillId && (
                        <div className={cn(
                          "p-4 rounded-sm border flex items-center gap-4",
                          hasRequiredPill ? "bg-jade/10 border-jade/30" : "bg-red-500/10 border-red-500/30"
                        )}>
                          <div className="w-12 h-12 rounded-sm bg-bg-dark border border-gold/20 flex items-center justify-center text-2xl shadow-inner">
                            {pillItem?.icon || '💊'}
                          </div>
                          <div className="flex-1">
                            <p className="font-serif text-gold text-sm">{pillItem?.name || 'Cần Đan Dược'}</p>
                            <p className="text-[10px] text-text-dim uppercase tracking-tighter">
                              {hasRequiredPill ? `Đang có: ${pillItem?.qty}` : 'Chưa có đan dược hỗ trợ'}
                            </p>
                          </div>
                          {!hasRequiredPill && (
                            <button 
                              onClick={() => {
                                setShowBreakthroughModal(false);
                                onTabChange?.('inventory');
                              }}
                              className="text-[9px] bg-gold text-bg-dark px-3 py-1 rounded-sm font-bold uppercase tracking-widest"
                            >
                              Tìm Kiếm
                            </button>
                          )}
                        </div>
                      )}

                      <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-4">
                        <p className="text-red-400 text-[9px] text-center italic leading-relaxed">
                          * Cảnh báo: Đột phá thất bại sẽ gây tổn thương kinh mạch, giảm Tu Vi và HP hiện tại.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setShowBreakthroughModal(false)}
                        className="flex-1 py-3 rounded-sm bg-white/5 text-text-dim font-serif text-[10px] tracking-widest uppercase hover:bg-white/10 transition-colors"
                      >
                        Hủy Bỏ
                      </button>
                      <button
                        onClick={handleBreakthrough}
                        className="flex-1 py-3 rounded-sm bg-linear-to-r from-gold to-gold-light text-bg-dark font-serif text-[10px] tracking-widest uppercase shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Bắt Đầu
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="flex justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center text-5xl border-2",
                          breakthroughResult.success ? "bg-jade/20 text-jade border-jade/40 shadow-[0_0_30px_rgba(0,168,107,0.2)]" : "bg-red-500/20 text-red-500 border-red-500/40 shadow-[0_0_30px_rgba(139,26,26,0.2)]"
                        )}
                      >
                        {breakthroughResult.success ? <Sparkles className="w-12 h-12" /> : <Flame className="w-12 h-12" />}
                      </motion.div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className={cn(
                        "text-2xl font-serif uppercase tracking-widest",
                        breakthroughResult.success ? "text-jade-light" : "text-red-400"
                      )}>
                        {breakthroughResult.success ? "Thành Công!" : "Thất Bại!"}
                      </h4>
                      <p className="text-text-dim text-xs leading-relaxed">{breakthroughResult.msg}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowBreakthroughModal(false);
                        setBreakthroughResult(null);
                      }}
                      className="w-full py-3 rounded-sm bg-gold text-bg-dark font-serif text-[10px] tracking-widest uppercase hover:bg-gold-light transition-colors"
                    >
                      Xác Nhận
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System / Save Section */}
      <div className="border-t border-gold/10 pt-8 mt-12">
        <div className="bg-bg-card/40 border border-gold/10 p-6 rounded-lg space-y-6">
          <div className="flex items-center gap-3 border-b border-gold/10 pb-3">
            <Save size={18} className="text-gold" />
            <h3 className="font-serif text-gold text-lg uppercase tracking-widest">Hệ Thống Lưu Trữ</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-gold-light">
                <Download size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Xuất File Tiến Trình</span>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">
                Tải xuống file JSON chứa toàn bộ dữ liệu tu luyện hiện tại của ngươi. Ngươi có thể dùng file này để chơi tiếp trên thiết bị khác.
              </p>
              <button 
                onClick={onExport}
                className="w-full py-2 bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest rounded hover:bg-gold/20 transition-all flex items-center justify-center gap-2"
              >
                <Download size={12} /> Tải Xuống File Save
              </button>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-jade-light">
                <Upload size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Nhập File Tiến Trình</span>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">
                Chọn file JSON đã lưu trước đó để khôi phục lại tiến trình tu luyện. <span className="text-red-400 font-bold">Lưu ý: Dữ liệu hiện tại sẽ bị ghi đè.</span>
              </p>
              <label className="w-full py-2 bg-jade/10 border border-jade/30 text-jade-light text-[10px] font-bold uppercase tracking-widest rounded hover:bg-jade/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={12} /> Chọn File Để Nhập
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={onImport}
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Section */}
      <div className="border-t border-red-deep/30 pt-8 mt-12">
        <div className="bg-red-deep/5 border border-red-deep/20 p-8 rounded-lg text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-deep/10 flex items-center justify-center text-red-light border border-red-deep/30">
              <TrendingUp size={32} className="rotate-180" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-red-light text-2xl">Luân Hồi Chuyển Thế</h3>
            <p className="text-text-dim text-xs max-w-md mx-auto leading-relaxed italic">
              "Cát bụi trở về với cát bụi. Khi một kiếp người khép lại, linh hồn sẽ bước vào luân hồi để bắt đầu một hành trình mới. Ngươi có chắc chắn muốn từ bỏ tu vi hiện tại để làm lại cuộc đời?"
            </p>
          </div>
          
          <AnimatePresence mode="wait">
            {!showConfirm ? (
              <motion.button 
                key="reset-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => setShowConfirm(true)}
                className="bg-linear-to-r from-red-deep to-[#5a0f0f] border border-red-light/30 text-red-light px-12 py-3 rounded-sm font-serif text-sm tracking-[0.2em] hover:bg-red-deep hover:text-white transition-all duration-300 shadow-lg group"
              >
                <span className="flex items-center gap-2">
                  ✦ LÀM LẠI CUỘC ĐỜI ✦
                </span>
              </motion.button>
            ) : (
              <motion.div 
                key="confirm-box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-red-light text-sm font-serif animate-pulse uppercase tracking-widest">
                  NGƯƠI CÓ CHẮC CHẮN MUỐN XÓA BỎ TU VI?
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={onReset}
                    className="bg-red-deep text-white px-8 py-2 rounded-sm text-xs tracking-widest hover:bg-red-light transition-colors border border-red-light/30"
                  >
                    XÁC NHẬN
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="bg-white/10 text-text-dim px-8 py-2 rounded-sm text-xs tracking-widest hover:bg-white/20 transition-colors border border-white/10"
                  >
                    HỦY BỎ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
