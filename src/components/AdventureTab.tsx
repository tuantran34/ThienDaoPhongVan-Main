import React, { useState } from 'react';
import { GameState, AdventureLocation, Enemy } from '../types';
import { ADVENTURE_LOCATIONS, INITIAL_ITEMS, REALMS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { calculateCombatPower } from '../lib/utils';
import { Sword, Map, Shield, Zap, Skull, Sparkles, ChevronRight, Search, Heart, ShieldCheck, Award } from 'lucide-react';

interface AdventureTabProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  addNotification: (title: string, body: string, reward?: string) => void;
}

export function AdventureTab({ gameState, updateGameState, addNotification }: AdventureTabProps) {
  const [selectedLocation, setSelectedLocation] = useState<AdventureLocation | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [combatEnemy, setCombatEnemy] = useState<Enemy | null>(null);
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(0);
  const [playerCurrentHp, setPlayerCurrentHp] = useState(0);
  const [playerCurrentMp, setPlayerCurrentMp] = useState(0);
  const [playerCurrentAp, setPlayerCurrentAp] = useState(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isAutoExploring, setIsAutoExploring] = useState(false);
  const [combatResult, setCombatResult] = useState<{ type: 'win' | 'loss', rewards: any } | null>(null);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatLog]);

  // Handle Auto-Combat
  React.useEffect(() => {
    if (isCombatActive && combatEnemy) {
      const timer = setTimeout(() => {
        runAutoTurn(enemyCurrentHp, playerCurrentHp, playerCurrentMp, playerCurrentAp, combatEnemy);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isCombatActive, enemyCurrentHp, playerCurrentHp]);

  // Handle Auto-Explore
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoExploring && !isCombatActive && !isExploring && !isResting && selectedLocation) {
      if (gameState.ap < selectedLocation.apCostPerStep) {
        setIsAutoExploring(false);
        addNotification('⚠️ Hệ Thống', 'Hoạt lực cạn kiệt, tự động thám hiểm dừng lại.', 'red');
      } else if (gameState.hp < gameState.hpMax * 0.1) {
        setIsAutoExploring(false);
        addNotification('⚠️ Hệ Thống', 'Trạng thái quá kém, tự động thám hiểm dừng lại.', 'red');
      } else {
        timer = setTimeout(() => {
          handleMoveForward();
        }, 1500);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoExploring, isCombatActive, isExploring, isResting, selectedLocation, gameState.ap, gameState.hp]);

  const combatPower = calculateCombatPower(gameState);

  // Reset states when switching locations
  const handleSelectLocation = (loc: AdventureLocation) => {
    if (combatPower < loc.minDaoHanh) {
      addNotification('⚠️ Hệ Thống', 'Tu vi chưa đủ, tiến vào chỉ có con đường chết!', 'red');
      return;
    }
    setSelectedLocation(loc);
    setCurrentProgress(0);
    setIsExploring(false);
    setIsResting(false);
    setIsAutoExploring(false);
    setIsCombatActive(false);
    setCombatEnemy(null);
    setCombatResult(null);
  };

  const handleMoveForward = () => {
    if (!selectedLocation || isExploring || isResting || isCombatActive) return;
    
    if (gameState.ap < selectedLocation.apCostPerStep) {
      addNotification('⚠️ Cảnh báo', 'Hoạt lực cạn kiệt, cần nghỉ ngơi!');
      setIsAutoExploring(false);
      return;
    }

    if (gameState.hp <= 10) {
      addNotification('⚠️ Cảnh báo', 'Khí huyết quá thấp, không thể mạo hiểm!');
      setIsAutoExploring(false);
      return;
    }

    setIsExploring(true);
    setCombatResult(null);
    
    // Decrease AP
    updateGameState(prev => ({
      ...prev,
      ap: Math.max(0, prev.ap - selectedLocation.apCostPerStep)
    }));

    // Simulate travel time
    setTimeout(() => {
      const nextProgress = Math.min(selectedLocation.maxProgress, currentProgress + 5);
      
      if (nextProgress >= selectedLocation.maxProgress) {
        setCurrentProgress(0);
        addNotification('🎉 Chúc Mừng', `Ngươi đã chinh phục hoàn toàn ${selectedLocation.name}!`, '+100 Đạo Hạnh');
        updateGameState(gs => ({
          ...gs,
          daohanh: gs.daohanh + 100,
          fame: gs.fame + 50
        }));
        setSelectedLocation(null);
        setIsExploring(false);
        return;
      }

      setCurrentProgress(nextProgress);
      
      // Random Encounter Logic
      const roll = Math.random();
      if (roll < 0.35) {
        // Monster encounter
        const enemy = selectedLocation.enemies[Math.floor(Math.random() * selectedLocation.enemies.length)];
        const enemyInstance = { ...enemy };
        setCombatEnemy(enemyInstance);
        setEnemyCurrentHp(enemyInstance.hp);
        startCombat(enemyInstance);
      } else if (roll < 0.50) {
        // Fortune
        handleFortune();
      } else if (roll < 0.60) {
        // Trap
        handleTrap();
      } else {
        // Safe passage - Give small rewards
        handleSafePassage();
        setIsExploring(false);
      }
    }, 800);
  };

  const handleSafePassage = () => {
    const expGain = 5 + Math.floor(Math.random() * 5);
    const tuViGain = 2 + Math.floor(Math.random() * 3);
    
    // Chance to find herbs based on luck
    const herbChance = 0.1 + (gameState.luck / 100);
    let foundHerb = false;
    let herbName = '';

    if (Math.random() < herbChance) {
      foundHerb = true;
      // Basic herb for now
      herbName = 'Linh Thảo';
      updateGameState(prev => {
        const nextInventory = [...prev.inventory];
        const herbItem = INITIAL_ITEMS.find(i => i.id === 'mat1');
        if (herbItem) {
          const existing = nextInventory.find(i => i.id === herbItem.id);
          if (existing) {
            existing.qty += 1;
          } else {
            nextInventory.push({ ...herbItem, qty: 1 });
          }
        }
        return { ...prev, inventory: nextInventory };
      });
    }

    updateGameState(prev => ({
      ...prev,
      exp: prev.exp + expGain,
      tuVi: Math.min(prev.tuViMax, prev.tuVi + tuViGain)
    }));

    if (foundHerb) {
      addNotification('🌿 Thu Hoạch', `Ngươi tìm thấy một gốc ${herbName} bên đường.`, `+${expGain} EXP, +${tuViGain} Tu Vi`);
    }
  };

  const handleFortune = () => {
    const types = ['linhThach', 'tuVi', 'item'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (type === 'linhThach') {
      const amount = Math.floor(Math.random() * 50) + 20;
      updateGameState(prev => ({ ...prev, linhThach: prev.linhThach + amount }));
      addNotification('🍀 Cơ Duyên', 'Ngươi nhặt được một túi linh thạch đánh rơi.', `+${amount} Linh Thạch`);
    } else if (type === 'tuVi') {
      const amount = Math.floor(Math.random() * 100) + 50;
      updateGameState(prev => ({ ...prev, tuVi: prev.tuVi + amount }));
      addNotification('🍀 Cơ Duyên', 'Ngươi tìm thấy một nơi linh khí dồi dào, tu vi tăng tiến.', `+${amount} Tu Vi`);
    } else {
      addNotification('🍀 Cơ Duyên', 'Ngươi tìm thấy một ít thảo dược quý hiếm.', '+1 Linh Thảo');
      updateGameState(prev => {
        const nextInv = [...prev.inventory];
        const itemIdx = nextInv.findIndex(i => i.id === 'mat1');
        if (itemIdx !== -1) {
          nextInv[itemIdx] = { ...nextInv[itemIdx], qty: nextInv[itemIdx].qty + 1 };
        } else {
          const template = INITIAL_ITEMS.find(i => i.id === 'mat1');
          if (template) nextInv.push({ ...template, qty: 1 });
        }
        return { ...prev, inventory: nextInv };
      });
    }
    setIsExploring(false);
  };

  const handleTrap = () => {
    const agilityCheck = Math.random() * 100 < (gameState.agility + 20);
    if (agilityCheck) {
      addNotification('🏃 Thân Pháp', 'Ngươi nhanh nhẹn né tránh được một cạm bẫy nguy hiểm!', 'Thân pháp +1');
      updateGameState(prev => ({ ...prev, agility: prev.agility + 1 }));
    } else {
      const damage = 15;
      addNotification('🕸️ Cạm Bẫy', 'Ngươi dẫm phải cạm bẫy, bị thương không nhẹ.', `HP -${damage}`);
      updateGameState(prev => ({ ...prev, hp: Math.max(1, prev.hp - damage) }));
    }
    setIsExploring(false);
  };

  const startCombat = (enemy: Enemy) => {
    setIsCombatActive(true);
    setCombatResult(null);
    const initialLogs = [`Ngươi bắt gặp ${enemy.name}!`, `Cảnh giới: ${enemy.realm}`];
    setCombatLog(initialLogs);
    
    setEnemyCurrentHp(enemy.hp);
    setPlayerCurrentHp(gameState.hp);
    setPlayerCurrentMp(gameState.mp);
    setPlayerCurrentAp(gameState.ap);
    setSkillCooldowns({});
  };

  const runAutoTurn = (eHp: number, pHp: number, pMp: number, pAp: number, enemy: Enemy) => {
    if (!isCombatActive || eHp <= 0 || pHp <= 0) {
      checkCombatEnd(eHp, pHp, pMp, pAp, enemy);
      return;
    }

    // Player turn
    // Decrement cooldowns
    setSkillCooldowns(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id] > 0) next[id] -= 1;
      });
      return next;
    });

    const combatSkills = gameState.skills
      .filter(s => s.unlocked && s.type === 'combat')
      .sort((a, b) => b.level - a.level);
    
    // Find best skill not on cooldown
    const bestSkill = combatSkills.find(s => (skillCooldowns[s.id] || 0) <= 0);
    const canUseSkill = bestSkill && pMp >= (bestSkill.mpCost || 0);
    
    let damage = 0;
    let newMp = pMp;
    if (canUseSkill) {
      const mpCost = bestSkill.mpCost || 0;
      newMp -= mpCost;
      damage = Math.max(1, (gameState.atk + bestSkill.level * 10) - enemy.def);
      setCombatLog(prev => [...prev, `Ngươi thi triển [${bestSkill.name}], tiêu hao ${mpCost} Linh Lực, gây ${Math.floor(damage)} sát thương.`]);
      
      // Set cooldown (e.g., 3 turns)
      setSkillCooldowns(prev => ({ ...prev, [bestSkill.id]: 3 }));
    } else {
      damage = Math.max(1, (gameState.atk * 1.2) - enemy.def);
      setCombatLog(prev => [...prev, `Ngươi tấn công cơ bản, gây ${Math.floor(damage)} sát thương.`]);
    }

    const critChance = (gameState.luck + gameState.charm) / 500;
    if (Math.random() < critChance) {
      damage *= 2;
      setCombatLog(prev => [...prev, `✨ BẠO KÍCH! Sát thương tăng gấp bội!`]);
    }

    const nextEHp = Math.max(0, eHp - damage);
    setEnemyCurrentHp(nextEHp);
    setPlayerCurrentMp(newMp);

    // Enemy turn if still alive
    let nextPHp = pHp;
    if (nextEHp > 0) {
      if (Math.random() > 0.3) {
        const eDamage = Math.max(1, enemy.atk - gameState.def);
        nextPHp = Math.max(0, pHp - eDamage);
        setCombatLog(prev => [...prev, `${enemy.name} phản công, gây ${Math.floor(eDamage)} sát thương.`]);
      } else {
        setCombatLog(prev => [...prev, `${enemy.name} tấn công hụt!`]);
      }
      setPlayerCurrentHp(nextPHp);
    }

    if (nextEHp <= 0 || nextPHp <= 0) {
      setTimeout(() => checkCombatEnd(nextEHp, nextPHp, newMp, pAp, enemy), 400);
    }
  };

  const checkCombatEnd = (eHp: number, pHp: number, pMp: number, pAp: number, enemy: Enemy) => {
    if (eHp <= 0) {
      setCombatLog(prev => [...prev, `Ngươi thi triển thần thông, đánh bại ${enemy.name}!`]);
      setTimeout(() => handleWin(enemy, Math.max(0, pHp), Math.max(0, pMp), pAp), 600);
    } else if (pHp <= 0) {
      setCombatLog(prev => [...prev, `${enemy.name} quá mạnh, ngươi bị trọng thương và phải rút lui!`]);
      setTimeout(() => handleLoss(enemy, Math.max(1, pHp), Math.max(0, pMp), pAp), 600);
    }
  };



  const handleWin = (enemy: Enemy, finalHp: number, finalMp: number, finalAp: number) => {
    updateGameState(prev => {
      let nextInv = [...prev.inventory];
      
      // Handle rewards
      if (enemy.rewards.items) {
        enemy.rewards.items.forEach(rewardItem => {
          const existing = nextInv.find(i => i.id === rewardItem.itemId);
          if (existing) {
            existing.qty += rewardItem.qty;
          } else {
            const template = INITIAL_ITEMS.find(i => i.id === rewardItem.itemId);
            if (template) nextInv.push({ ...template, qty: rewardItem.qty });
          }
        });
      }
      
      // Handle drops
      if (enemy.drops) {
        enemy.drops.forEach(dropId => {
          if (Math.random() < 0.4) {
             const existingIdx = nextInv.findIndex(i => i.id === dropId);
             if (existingIdx !== -1) {
               nextInv[existingIdx] = { ...nextInv[existingIdx], qty: nextInv[existingIdx].qty + 1 };
             } else {
               const template = INITIAL_ITEMS.find(i => i.id === dropId);
               if (template) nextInv.push({ ...template, qty: 1 });
             }
          }
        });
      }

      return {
        ...prev,
        hp: Math.max(0, Math.min(prev.hpMax, finalHp)),
        mp: Math.max(0, Math.min(prev.mpMax, finalMp)),
        ap: Math.max(0, Math.min(prev.apMax, finalAp)),
        linhThach: prev.linhThach + (enemy.rewards.linhThach || 0),
        tuVi: prev.tuVi + (enemy.rewards.tuVi || 0),
        exp: prev.exp + (enemy.rewards.exp || 0),
        fame: prev.fame + 5,
        daohanh: prev.daohanh + 10,
        inventory: nextInv,
        cultivationHistory: [
          ...prev.cultivationHistory,
          { text: `Đánh bại ${enemy.name} tại ${selectedLocation?.name}`, timestamp: new Date().toISOString() }
        ]
      };
    });

    addNotification('⚔️ Chiến Thắng', `Đã đánh bại ${enemy.name}!`, `+${enemy.rewards.linhThach} Linh Thạch, +${enemy.rewards.tuVi} Tu Vi, +10 Đạo Hạnh`);
    setCombatResult({ type: 'win', rewards: enemy.rewards });
    setIsCombatActive(false);
    setCombatEnemy(null);
    setIsExploring(false);
  };

  const handleLoss = (enemy: Enemy, finalHp: number, finalMp: number, finalAp: number) => {
    updateGameState(prev => ({
      ...prev,
      hp: Math.max(1, finalHp),
      mp: finalMp,
      ap: finalAp,
      mood: Math.max(0, prev.mood - 10),
      cultivationHistory: [
        ...prev.cultivationHistory,
        { text: `Thất bại trước ${enemy.name} tại ${selectedLocation?.name}`, timestamp: new Date().toISOString() }
      ]
    }));

    addNotification('💀 Thất Bại', `Ngươi bị ${enemy.name} đánh bại.`, 'HP giảm mạnh, Tâm trạng -10');
    setCombatResult({ type: 'loss', rewards: null });
    setIsCombatActive(false);
    setCombatEnemy(null);
    setIsExploring(false);
    setIsAutoExploring(false);
  };

  const handleRest = () => {
    if (isExploring || isResting || isCombatActive || gameState.ap >= gameState.apMax) return;
    
    setIsResting(true);
    
    const restScenarios = [
      { msg: "Ngươi tìm thấy một phiến đá phẳng, ngồi xuống vận công điều tức.", gain: 30 + Math.floor(Math.random() * 20) },
      { msg: "Ngươi tựa lưng vào gốc cổ thụ, chợp mắt một lát để lấy lại sức.", gain: 25 + Math.floor(Math.random() * 15) },
      { msg: "Ngươi uống một ngụm nước suối trong vắt, cảm thấy tinh thần sảng khoái.", gain: 20 + Math.floor(Math.random() * 10) },
      { msg: "Ngươi thực hiện vài động tác giãn cơ, xua tan mệt mỏi.", gain: 15 + Math.floor(Math.random() * 15) },
      { msg: "Ngươi ngồi thiền định, linh khí xung quanh nhẹ nhàng thẩm thấu vào cơ thể.", gain: 40 + Math.floor(Math.random() * 20) }
    ];
    
    const scenario = restScenarios[Math.floor(Math.random() * restScenarios.length)];
    
    addNotification('🧘 Nghỉ ngơi', scenario.msg, `+${scenario.gain} AP`);
    
    setTimeout(() => {
      updateGameState(prev => ({
        ...prev,
        ap: Math.min(prev.apMax, prev.ap + scenario.gain)
      }));
      setIsResting(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-gold flex items-center gap-2">
            <Map className="text-gold" /> Thám Hiểm Thế Giới
          </h2>
          <p className="text-text-dim text-xs italic">Khám phá bí cảnh, trảm yêu trừ ma, tìm kiếm cơ duyên.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-sm min-w-[100px]">
            <div className="text-[9px] text-text-dim uppercase tracking-widest">Đạo Hạnh</div>
            <div className="text-sm font-serif text-yellow-500 flex items-center gap-1.5">
              <Zap size={12} /> {(combatPower || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-sm min-w-[120px]">
            <div className="text-[9px] text-text-dim uppercase tracking-widest">Cảnh Giới</div>
            <div className="text-sm font-serif text-purple-400 flex items-center gap-1.5">
              <Award size={12} /> {REALMS[gameState.realmIndex]}
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-sm min-w-[100px]">
            <div className="text-[9px] text-text-dim uppercase tracking-widest">Khí Huyết (HP)</div>
            <div className="text-sm font-serif text-red-500 flex items-center gap-1.5">
              <Heart size={12} /> {gameState.hp} / {gameState.hpMax}
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-sm min-w-[100px]">
            <div className="text-[9px] text-text-dim uppercase tracking-widest">Linh Lực (MP)</div>
            <div className="text-sm font-serif text-purple-400 flex items-center gap-1.5">
              <Zap size={12} /> {gameState.mp} / {gameState.mpMax}
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-sm min-w-[100px] flex items-center gap-3">
            <div>
              <div className="text-[9px] text-text-dim uppercase tracking-widest">Hoạt Lực (AP)</div>
              <div className="text-sm font-serif text-blue-500 flex items-center gap-1.5">
                <Sparkles size={12} /> {gameState.ap} / {gameState.apMax}
              </div>
            </div>
            <button
              onClick={handleRest}
              disabled={isExploring || isResting || isCombatActive || gameState.ap >= gameState.apMax}
              className={`ml-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter transition-all border ${
                isExploring || isResting || isCombatActive || gameState.ap >= gameState.apMax
                  ? 'border-blue-500/20 text-blue-500/40 cursor-not-allowed'
                  : 'border-blue-500 text-blue-400 hover:bg-blue-500/20 active:scale-95 animate-pulse'
              }`}
            >
              {isResting ? '...' : 'Nghỉ'}
            </button>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-sm min-w-[100px]">
            <div className="text-[9px] text-text-dim uppercase tracking-widest">Công Kích</div>
            <div className="text-sm font-serif text-red-500 flex items-center gap-1.5">
              <Sword size={12} /> {gameState.atk}
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-sm min-w-[100px]">
            <div className="text-[9px] text-text-dim uppercase tracking-widest">Phòng Thủ</div>
            <div className="text-sm font-serif text-blue-500 flex items-center gap-1.5">
              <Shield size={12} /> {gameState.def}
            </div>
          </div>
          {isCombatActive && combatEnemy && (
            <div className="bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-sm min-w-[140px] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.1)]">
              <div className="text-[9px] text-red-400/70 uppercase tracking-widest flex justify-between">
                <span>Yêu Thú</span>
                <span className="text-red-500 font-bold">ĐANG CHIẾN</span>
              </div>
              <div className="text-sm font-serif text-red-400 flex items-center gap-1.5">
                <Skull size={12} className="text-red-500" /> {combatEnemy.realm}
              </div>
            </div>
          )}
        </div>
      </div>

      {!selectedLocation ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2">
          {ADVENTURE_LOCATIONS.map(loc => {
            const isLocked = combatPower < loc.minDaoHanh;
            return (
              <motion.div
                key={loc.id}
                whileHover={!isLocked ? { scale: 1.02 } : {}}
                className={`relative group overflow-hidden rounded-lg border ${
                  isLocked ? 'border-gray-800 opacity-60' : 'border-gold/20 hover:border-gold/50 cursor-pointer'
                }`}
                onClick={() => handleSelectLocation(loc)}
              >
                <div className="aspect-video relative">
                  <img src={loc.bgImage} alt={loc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
                  
                  {isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-all group-hover:bg-black/70">
                      <div className="w-12 h-12 rounded-full border-2 border-red-500/50 flex items-center justify-center mb-3">
                        <Skull className="text-red-500 animate-pulse" size={24} />
                      </div>
                      <span className="text-sm text-red-400 font-serif font-bold uppercase tracking-widest mb-1">Yêu Khí Quá Nặng</span>
                      <div className="flex flex-col items-center bg-red-950/40 px-4 py-2 rounded border border-red-500/20">
                        <span className="text-[10px] text-red-300/70 uppercase tracking-tighter">Yêu cầu Đạo Hạnh</span>
                        <span className="text-lg font-serif text-red-400 font-bold">{(loc.minDaoHanh || 0).toLocaleString()}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-[10px] text-red-400/60 italic">
                        <ShieldCheck size={10} />
                        <span>Cần đột phá cảnh giới để tiến vào</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-bg-card">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-gold text-lg">{loc.name}</h3>
                    {isLocked && (
                      <span className="bg-red-500/10 text-red-400 text-[8px] px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-bold">Bị Khóa</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-text-dim uppercase">Khoảng cách: {loc.maxProgress} dặm</span>
                    {!isLocked ? (
                      <ChevronRight size={16} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Zap size={12} className="text-red-500/40" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="relative h-48 rounded-xl overflow-hidden border border-gold/20">
            <img src={selectedLocation.bgImage} alt={selectedLocation.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark to-transparent" />
            <div className="absolute bottom-4 left-6 flex items-end justify-between w-[calc(100%-3rem)]">
              <div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="text-xs text-gold/60 hover:text-gold flex items-center gap-1 mb-2"
                >
                  <Map size={12} /> Quay lại bản đồ
                </button>
                <h3 className="text-2xl font-serif text-gold">{selectedLocation.name}</h3>
              </div>
            </div>
          </div>

          {/* Floating Auto-Explore Button - Moved to be more visible and not covered by notifications */}
          <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 items-end">
            <AnimatePresence>
              {selectedLocation && !isCombatActive && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => setIsAutoExploring(!isAutoExploring)}
                  className={`group relative flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all border shadow-[0_5px_20px_rgba(0,0,0,0.5)] opacity-90 hover:opacity-100 ${
                    isAutoExploring 
                      ? 'bg-gold text-bg-dark border-gold' 
                      : 'bg-bg-dark/90 text-gold border-gold/30 hover:border-gold'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isAutoExploring ? 'bg-bg-dark animate-ping' : 'bg-gold'}`} />
                  <span className="text-[10px]">{isAutoExploring ? 'Đang Tự Động' : 'Tự Động'}</span>
                  
                  {/* Tooltip-like hint */}
                  <div className="absolute -top-12 right-0 bg-black/80 text-gold/80 text-[10px] px-3 py-1 rounded border border-gold/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Tự động di chuyển & chiến đấu
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            <div className="lg:col-span-2 flex flex-col space-y-4">
              <div className="bg-bg-card border border-gold/10 rounded-lg p-6 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
                
                <AnimatePresence mode="wait">
                  {isCombatActive && combatEnemy ? (
                    <motion.div 
                      key="combat"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full flex flex-col items-center space-y-6"
                    >
                      <div className="flex items-center justify-around w-full max-w-2xl bg-black/40 p-6 rounded-xl border border-gold/20 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-red-500/5" />
                        
                        {/* Player Side */}
                        <div className="flex flex-col items-center space-y-4 relative z-10">
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                              👤
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-400">TẦNG {gameState.realmIndex + 1}</div>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-serif text-blue-400 font-bold block">{gameState.heroName}</span>
                            <span className="text-[10px] text-blue-300/70 uppercase tracking-widest">{REALMS[gameState.realmIndex]}</span>
                          </div>
                          <div className="w-32 space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-red-400 font-bold uppercase">
                                <span>HP</span>
                                <span>{Math.max(0, Math.floor(playerCurrentHp))}/{gameState.hpMax}</span>
                              </div>
                              <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-red-600 to-red-400" 
                                  initial={{ width: '100%' }}
                                  animate={{ width: `${Math.min(100, Math.max(0, (playerCurrentHp / (gameState.hpMax || 1)) * 100))}%` }} 
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-purple-400 font-bold uppercase">
                                <span>MP</span>
                                <span>{Math.max(0, Math.floor(playerCurrentMp))}/{gameState.mpMax}</span>
                              </div>
                              <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400" 
                                  initial={{ width: '100%' }}
                                  animate={{ width: `${Math.min(100, Math.max(0, (playerCurrentMp / (gameState.mpMax || 1)) * 100))}%` }} 
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-blue-400 font-bold uppercase">
                                <span>AP</span>
                                <span>{Math.max(0, Math.floor(playerCurrentAp))}/{gameState.apMax}</span>
                              </div>
                              <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400" 
                                  initial={{ width: '100%' }}
                                  animate={{ width: `${Math.min(100, Math.max(0, (playerCurrentAp / (gameState.apMax || 1)) * 100))}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Đang Tự Động Chiến Đấu</span>
                          </div>
                          <div className="text-4xl font-black text-red-500 italic animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">VS</div>
                          <div className="mt-4 flex flex-col items-center gap-1">
                            <div className="w-1 h-12 bg-gradient-to-b from-transparent via-gold/20 to-transparent" />
                            <div className="text-[10px] text-gold/40 font-bold uppercase tracking-tighter">Quyết Đấu</div>
                            <div className="w-1 h-12 bg-gradient-to-t from-transparent via-gold/20 to-transparent" />
                          </div>
                        </div>

                        {/* Enemy Side */}
                        <div className="flex flex-col items-center space-y-4 relative z-10">
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                              {combatEnemy.icon}
                            </div>
                            <div className="absolute -bottom-2 -left-2 bg-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-400">YÊU</div>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-serif text-red-400 font-bold block">{combatEnemy.name}</span>
                            <span className="text-[10px] text-red-300/70 uppercase tracking-widest">{combatEnemy.realm}</span>
                          </div>
                          <div className="w-32 space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-red-400 font-bold uppercase">
                                <span>HP</span>
                                <span>{Math.max(0, Math.floor(enemyCurrentHp))}/{combatEnemy.hpMax}</span>
                              </div>
                              <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-red-600 to-red-400 animate-pulse" 
                                  initial={{ width: '100%' }}
                                  animate={{ width: `${Math.min(100, Math.max(0, (enemyCurrentHp / (combatEnemy.hpMax || 1)) * 100))}%` }} 
                                />
                              </div>
                            </div>
                            <div className="pt-3 flex justify-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500/40 animate-ping" />
                              <div className="w-2 h-2 rounded-full bg-red-500/40 animate-ping delay-75" />
                              <div className="w-2 h-2 rounded-full bg-red-500/40 animate-ping delay-150" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skills & Cooldowns Display */}
                      <div className="w-full max-w-md bg-black/40 p-4 rounded-xl border border-gold/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap size={14} className="text-purple-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Công Pháp Chiến Đấu</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {gameState.skills.filter(s => s.unlocked && s.type === 'combat').map(skill => {
                            const cooldown = skillCooldowns[skill.id] || 0;
                            return (
                              <div key={skill.id} className={`relative p-2 rounded border transition-all ${cooldown > 0 ? 'bg-gray-900/40 border-gray-700/30' : 'bg-purple-900/20 border-purple-500/30'}`}>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[10px] font-medium ${cooldown > 0 ? 'text-gray-500' : 'text-purple-300'}`}>
                                    {skill.icon} {skill.name}
                                  </span>
                                  {cooldown > 0 && (
                                    <span className="text-[10px] font-bold text-red-400">{cooldown}T</span>
                                  )}
                                </div>
                                {cooldown > 0 && (
                                  <div className="absolute inset-0 bg-black/40 rounded overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-purple-500/10"
                                      initial={{ width: '100%' }}
                                      animate={{ width: '0%' }}
                                      transition={{ duration: cooldown }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>



                      {combatResult && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`w-full max-w-md p-6 rounded-xl border-2 shadow-2xl backdrop-blur-md ${combatResult.type === 'win' ? 'bg-green-500/20 border-green-500/50 shadow-green-500/20' : 'bg-red-500/20 border-red-500/50 shadow-red-500/20'}`}
                        >
                          <div className="flex items-center justify-center gap-4 mb-6">
                            <div className={`p-3 rounded-full ${combatResult.type === 'win' ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                              {combatResult.type === 'win' ? (
                                <Award className="text-green-400" size={32} />
                              ) : (
                                <Skull className="text-red-400" size={32} />
                              )}
                            </div>
                            <h4 className={`font-serif text-3xl font-black uppercase tracking-widest ${combatResult.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                              {combatResult.type === 'win' ? 'Đại Thắng!' : 'Thảm Bại...'}
                            </h4>
                          </div>
                          
                          {combatResult.type === 'win' && combatResult.rewards && (
                            <div className="space-y-4">
                              <div className="text-center text-xs text-green-300/70 font-bold uppercase tracking-widest mb-2">Chiến lợi phẩm thu được</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 p-3 rounded-lg border border-gold/10 flex flex-col items-center">
                                  <span className="text-[10px] text-text-dim uppercase">Linh Thạch</span>
                                  <span className="text-lg font-serif text-gold">+{combatResult.rewards.linhThach}</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-lg border border-purple-500/10 flex flex-col items-center">
                                  <span className="text-[10px] text-text-dim uppercase">Tu Vi</span>
                                  <span className="text-lg font-serif text-purple-400">+{combatResult.rewards.tuVi}</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-lg border border-blue-500/10 flex flex-col items-center">
                                  <span className="text-[10px] text-text-dim uppercase">Kinh Nghiệm</span>
                                  <span className="text-lg font-serif text-blue-400">+{combatResult.rewards.exp}</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-lg border border-yellow-500/10 flex flex-col items-center">
                                  <span className="text-[10px] text-text-dim uppercase">Đạo Hạnh</span>
                                  <span className="text-lg font-serif text-yellow-500">+10</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {combatResult.type === 'loss' && (
                            <div className="text-center space-y-4">
                              <p className="text-sm text-red-200 leading-relaxed">
                                Đối phương quá mạnh, ngươi không địch lại và bị trọng thương. May mắn thoát được một kiếp nhưng tu vi bị tổn hại.
                              </p>
                              <div className="bg-black/40 p-3 rounded-lg border border-red-500/20 inline-block px-8">
                                <span className="text-xs text-red-400 font-bold uppercase tracking-widest">Tâm trạng -10</span>
                              </div>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => { setCombatResult(null); setIsExploring(false); }}
                            className={`w-full mt-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all ${combatResult.type === 'win' ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/40' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'}`}
                          >
                            Xác Nhận
                          </button>
                        </motion.div>
                      )}

                      <div 
                        ref={logContainerRef}
                        className="w-full max-w-md bg-black/60 rounded-lg border border-gold/10 p-4 h-40 overflow-y-auto custom-scrollbar font-sans text-xs space-y-2 shadow-inner"
                      >
                        {combatLog.map((log, i) => {
                          let colorClass = 'text-gold/80';
                          let icon = '•';
                          
                          if (log.includes('đánh bại')) { colorClass = 'text-green-400 font-bold'; icon = '🏆'; }
                          else if (log.includes('thất bại')) { colorClass = 'text-red-400 font-bold'; icon = '💀'; }
                          else if (log.includes('BẠO KÍCH')) { colorClass = 'text-yellow-400 font-black animate-pulse'; icon = '💥'; }
                          else if (log.includes('gây') && !log.includes('phản công')) { colorClass = 'text-blue-300'; icon = '⚔️'; }
                          else if (log.includes('phản công')) { colorClass = 'text-red-300'; icon = '💢'; }
                          else if (log.includes('tấn công hụt')) { colorClass = 'text-gray-400 italic'; icon = '💨'; }
                          else if (log.includes('bắt gặp')) { colorClass = 'text-white font-medium'; icon = '👁️'; }

                          return (
                            <div key={i} className={`flex gap-2 items-start py-1 border-b border-white/5 last:border-0 ${colorClass}`}>
                              <span className="shrink-0 opacity-70">{icon}</span>
                              <span className="leading-relaxed">{log}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="explore"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center space-y-8 w-full max-w-lg mx-auto"
                    >
                      {/* Central Progress Bar */}
                      <div className="w-full space-y-3">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Tiến trình thám hiểm</span>
                            <span className="text-xs text-gold/60 italic">Đang ở dặm thứ {currentProgress}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl text-gold font-serif font-bold">{currentProgress}</span>
                            <span className="text-xs text-text-dim ml-1">/ {selectedLocation.maxProgress} dặm</span>
                          </div>
                        </div>
                        <div className="h-5 bg-black/40 rounded-full border border-gold/20 p-1 overflow-hidden shadow-inner relative">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentProgress / selectedLocation.maxProgress) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 40, damping: 15 }}
                          />
                          {/* Progress markers */}
                          <div className="absolute inset-0 flex justify-between px-4 pointer-events-none">
                            {[25, 50, 75].map(p => (
                              <div key={p} className="h-full w-px bg-white/5" />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="w-32 h-32 rounded-full border-2 border-gold/10 flex items-center justify-center relative">
                        <div className={`absolute inset-0 border-2 border-gold/30 rounded-full ${isExploring || isResting ? 'animate-ping' : ''}`} />
                        <div className="absolute inset-0 bg-gold/5 rounded-full blur-xl" />
                        <Search size={48} className={`text-gold/40 relative z-10 ${isExploring || isResting ? 'animate-pulse' : ''}`} />
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h4 className="text-gold font-serif text-xl tracking-wide">{selectedLocation.name}</h4>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                          <Sparkles size={12} />
                          <span className="text-[11px] font-medium uppercase tracking-wider">Tiêu hao: {selectedLocation.apCostPerStep} Hoạt lực / bước</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4 w-full">
                        <button
                          onClick={handleMoveForward}
                          disabled={isExploring || isResting || isCombatActive || isAutoExploring}
                          className={`group relative px-16 py-4 rounded-sm font-serif text-xl tracking-widest transition-all overflow-hidden ${
                            isExploring || isResting || isCombatActive || isAutoExploring
                              ? 'bg-gold/10 text-gold/40 cursor-not-allowed' 
                              : 'bg-gold text-bg-dark hover:bg-gold-light shadow-2xl shadow-gold/30 active:scale-95'
                          }`}
                        >
                          <div className="relative z-10 flex items-center gap-3">
                            {isExploring ? (
                              <>
                                <div className="w-5 h-5 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                                <span>Đang tiến bước...</span>
                              </>
                            ) : (
                              <>
                                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                <span>Tiến bước thám hiểm</span>
                              </>
                            )}
                          </div>
                          
                          {!isExploring && !isResting && !isCombatActive && !isAutoExploring && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] px-2 py-0.5 font-sans font-bold uppercase tracking-tighter shadow-sm">
                              -{selectedLocation.apCostPerStep} AP
                            </div>
                          )}
                        </button>

                        <div className="flex items-center gap-4 w-full max-w-xs">
                          <div className="h-px flex-1 bg-gold/20" />
                          <span className="text-[10px] text-text-dim uppercase tracking-widest">Hoặc</span>
                          <div className="h-px flex-1 bg-gold/20" />
                        </div>

                        <button
                          onClick={handleRest}
                          disabled={isExploring || isResting || isCombatActive || isAutoExploring || gameState.ap >= gameState.apMax}
                          className={`flex items-center gap-2 px-8 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-all border ${
                            isExploring || isResting || isCombatActive || isAutoExploring || gameState.ap >= gameState.apMax
                              ? 'border-blue-500/10 text-blue-500/20 cursor-not-allowed'
                              : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500'
                          }`}
                        >
                          <Sparkles size={14} />
                          {isResting ? 'Đang thiền định...' : 'Thiền Định Hồi Phục'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-bg-card border border-gold/10 rounded-lg p-4">
                <h4 className="text-xs font-serif text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sword size={14} /> Trạng Thái Chiến Đấu
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-text-dim uppercase">
                      <span>Khí Huyết (HP)</span>
                      <span className="text-red-500">{gameState.hp} / {gameState.hpMax}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(gameState.hp / gameState.hpMax) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-text-dim uppercase">
                      <span>Linh Lực (MP)</span>
                      <span className="text-purple-500">{gameState.mp} / {gameState.mpMax}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${(gameState.mp / gameState.mpMax) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-text-dim uppercase">
                      <span>Hoạt Lực (AP)</span>
                      <span className="text-blue-500">{gameState.ap} / {gameState.apMax}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(gameState.ap / gameState.apMax) * 100}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <div className="text-[8px] text-text-dim uppercase">Công Kích</div>
                      <div className="text-xs text-red-500 font-bold">{gameState.atk}</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <div className="text-[8px] text-text-dim uppercase">Phòng Thủ</div>
                      <div className="text-xs text-blue-500 font-bold">{gameState.def}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[10px] text-text-dim uppercase mb-1">Cảnh Giới</div>
                    <div className="text-xs text-purple-400 font-serif">{REALMS[gameState.realmIndex]}</div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-card border border-gold/10 rounded-lg p-4">
                <h4 className="text-xs font-serif text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield size={14} /> Chỉ số thám hiểm
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gold/5 rounded border border-gold/5">
                    <div className="text-[10px] text-text-dim uppercase">Thân pháp</div>
                    <div className="text-sm text-gold">{gameState.agility}</div>
                  </div>
                  <div className="p-2 bg-gold/5 rounded border border-gold/5">
                    <div className="text-[10px] text-text-dim uppercase">May mắn</div>
                    <div className="text-sm text-gold">{gameState.luck}</div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-card border border-gold/10 rounded-lg p-4">
                <h4 className="text-xs font-serif text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Skull size={14} className="text-red-500" /> Yêu Thú Khu Vực
                </h4>
                <div className="space-y-3">
                  {selectedLocation.enemies.map(en => (
                    <div key={en.id} className="group/enemy relative flex items-center gap-3 p-2 bg-red-950/20 rounded border border-red-500/10 hover:border-red-500/30 transition-all">
                      <span className="text-2xl">{en.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-serif text-gold">{en.name}</div>
                        <div className="text-[10px] text-red-400 font-medium uppercase tracking-tighter">{en.realm}</div>
                        <div className="text-[9px] text-text-dim mt-1">HP: {en.hp} | ATK: {en.atk} | DEF: {en.def}</div>
                      </div>

                      {/* Tooltip for rewards */}
                      <div className="absolute left-0 bottom-full mb-2 w-48 bg-bg-dark border border-gold/30 p-3 rounded shadow-2xl opacity-0 group-hover/enemy:opacity-100 pointer-events-none transition-opacity z-50">
                        <div className="text-[10px] text-gold uppercase tracking-widest mb-2 border-b border-gold/10 pb-1">Phần thưởng tiềm năng</div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-dim">Linh Thạch:</span>
                            <span className="text-yellow-400">~{en.rewards.linhThach}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-dim">Tu Vi:</span>
                            <span className="text-purple-400">~{en.rewards.tuVi}</span>
                          </div>
                          {en.drops && en.drops.length > 0 && (
                            <div className="pt-1 mt-1 border-t border-white/5">
                              <div className="text-[9px] text-text-dim mb-1 italic">Vật phẩm có thể rơi:</div>
                              <div className="flex flex-wrap gap-1">
                                {en.drops.map(dropId => {
                                  const item = INITIAL_ITEMS.find(i => i.id === dropId);
                                  return (
                                    <span key={dropId} className="text-[10px] bg-white/5 px-1 rounded" title={item?.name}>
                                      {item?.icon || '📦'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-bg-dark border-r border-b border-gold/30 rotate-45" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
