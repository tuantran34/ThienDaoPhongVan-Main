import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LoadingScreen } from './components/LoadingScreen';
import { StoryTab } from './components/StoryTab';
import { HaremTab } from './components/HaremTab';
import { RandomEventModal } from './components/RandomEventModal';
import { MiniGameModal } from './components/MiniGameModal';
import { SkillsTab } from './components/SkillsTab';
import { InventoryTab } from './components/InventoryTab';
import { StatusTab } from './components/StatusTab';
import { QuestsTab } from './components/QuestsTab';
import { AdventureTab } from './components/AdventureTab';
import { WorldMapTab } from './components/WorldMapTab';
import { NotificationSystem } from './components/NotificationSystem';
import { HaremEventModal } from './components/HaremEventModal';
import { TutorialModal } from './components/TutorialModal';
import { MainMenu } from './components/MainMenu';
import { GameState, Character, Item, Choice, Quest, Achievement, RandomEvent, MiniGame } from './types';
import { INITIAL_CHARACTERS, INITIAL_SKILLS, INITIAL_ITEMS, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS, REALMS, RANDOM_EVENTS } from './constants';
import { AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'thien_dao_phong_van_save';
const QUICK_SAVE_KEY = 'thien_dao_phong_van_quick_save';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('story');
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string, reward?: string}[]>([]);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGame | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const defaultState: GameState = {
      heroName: 'Vô Danh Hiệp Khách',
      realmIndex: 1,
      tuVi: 0,
      tuViMax: 500,
      hp: 200,
      hpMax: 200,
      mp: 150,
      mpMax: 150,
      ap: 100,
      apMax: 100,
      charm: 25,
      luck: 10,
      agility: 10,
      linhThach: 350,
      haoguang: 20,
      wisdom: 1,
      fame: 10,
      chapter: 1,
      stage: 1,
      location: 'Thanh Vân Trấn',
      characters: INITIAL_CHARACTERS,
      skills: INITIAL_SKILLS,
      inventory: INITIAL_ITEMS,
      quests: INITIAL_QUESTS,
      storyChoiceCount: 0,
      currentStoryContext: 'Bạn là một thanh niên 24 tuổi từ thế kỷ 21, trùng sinh tại Thanh Vân Trấn trong thân xác một thiếu niên có linh căn thấp kém. Không có thiên phú mạnh mẽ, bạn chỉ có thể dựa vào kiến thức uyên bác và tư duy hiện đại để từng bước nghịch thiên cải mệnh, khám phá bí mật của đại đạo tu tiên.',
      storyHistory: [],
      currentStoryPage: 0,
      currentChoices: [],
      loadingChoices: false,
      activeHaremEvent: null,
      activeRandomEvent: null,
      started: false,
      atk: 40,
      def: 10,
      daohanh: 0,
      bookmarks: [],
      age: 24,
      root: 'Tạp Linh Căn (Ngũ Hành)',
      fate: 'Phàm Nhân Nghịch Thiên',
      titles: ['Trùng Sinh Giả'],
      cultivationHistory: [{ text: 'Trùng sinh trở lại Thanh Vân Trấn với linh căn thấp kém, bắt đầu hành trình dùng tri thức hiện đại để tu tiên.', timestamp: new Date().toISOString() }],
      achievements: INITIAL_ACHIEVEMENTS,
      mood: 80,
      exp: 100,
      tutorialCompleted: false,
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure quests are unique by ID and merge with default quests if new ones were added to constants
        const mergedQuests = [...defaultState.quests];
        if (parsed.quests && Array.isArray(parsed.quests)) {
          parsed.quests.forEach((savedQuest: any) => {
            const index = mergedQuests.findIndex(q => q.id === savedQuest.id);
            if (index !== -1) {
              mergedQuests[index] = { ...mergedQuests[index], ...savedQuest };
            }
          });
        }

        return { 
          ...defaultState, 
          ...parsed,
          quests: mergedQuests
        };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const addNotification = useCallback((title: string, body: string, reward?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, body, reward }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const handleQuickSave = useCallback(() => {
    localStorage.setItem(QUICK_SAVE_KEY, JSON.stringify(gameState));
    addNotification('💾 Đã Lưu Nhanh', 'Tiến trình hiện tại đã được ghi nhớ.', 'Nhấn Ctrl+L để tải lại');
  }, [gameState, addNotification]);

  const handleQuickLoad = useCallback(() => {
    const saved = localStorage.getItem(QUICK_SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(parsed);
        addNotification('📂 Đã Tải Nhanh', 'Đã quay lại điểm lưu trước đó.', 'Tiến trình đã được khôi phục');
      } catch (e) {
        console.error("Failed to load quick save", e);
        addNotification('❌ Lỗi Tải', 'Không thể khôi phục điểm lưu.', 'Dữ liệu có thể đã bị hỏng');
      }
    } else {
      addNotification('❓ Không Có Bản Lưu', 'Bạn chưa thực hiện lưu nhanh lần nào.', 'Nhấn Ctrl+S để lưu');
    }
  }, [addNotification]);

  const handleSavePartial = useCallback((key: string, data: any, label: string) => {
    localStorage.setItem(`partial_save_${key}`, JSON.stringify(data));
    addNotification(`💾 Đã Lưu ${label}`, 'Dữ liệu thành phần đã được ghi nhớ cục bộ.', 'Có thể tải lại bất cứ lúc nào');
  }, [addNotification]);

  const handleLoadPartial = useCallback((key: string, label: string) => {
    const saved = localStorage.getItem(`partial_save_${key}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        addNotification(`📂 Đã Tải ${label}`, 'Dữ liệu thành phần đã được khôi phục.', 'Thành công');
        return parsed;
      } catch (e) {
        console.error(`Failed to load partial save ${key}`, e);
        addNotification(`❌ Lỗi Tải ${label}`, 'Dữ liệu có thể đã bị hỏng.', 'Thất bại');
      }
    } else {
      addNotification(`❓ Không Có Bản Lưu ${label}`, 'Chưa có dữ liệu lưu cho thành phần này.', 'Hãy lưu trước');
    }
    return null;
  }, [addNotification]);

  const triggerRandomEvent = useCallback(() => {
    const chance = Math.random();
    if (chance < 0.2) { // 20% chance
      const randomEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      setGameState(prev => ({ ...prev, activeRandomEvent: randomEvent }));
    }
  }, []);

  const handleRandomEventSelect = (choiceIndex: number) => {
    const event = gameState.activeRandomEvent;
    if (!event) return;

    const choice = event.choices[choiceIndex];
    addNotification(event.title, choice.text);

    setGameState(prev => {
      let newState = { ...prev, activeRandomEvent: null };
      
      if (choice.effects) {
        if (choice.effects.linhThach) newState.linhThach += choice.effects.linhThach;
        if (choice.effects.tuVi) newState.tuVi += choice.effects.tuVi;
        if (choice.effects.exp) newState.exp += choice.effects.exp;
        if (choice.effects.fame) newState.fame += choice.effects.fame;
        if (choice.effects.haoguang) newState.haoguang += choice.effects.haoguang;
        if (choice.effects.charm) newState.charm += choice.effects.charm;
        if (choice.effects.mood) newState.mood = Math.min(100, Math.max(0, newState.mood + choice.effects.mood));
        
        // Handle affection effects
        if (choice.effects.affection) {
          Object.entries(choice.effects.affection).forEach(([charId, amount]) => {
            newState.characters = newState.characters.map(c => 
              c.id === charId ? { ...c, affection: Math.min(100, Math.max(0, c.affection + amount)) } : c
            );
          });
        }
      }

      return newState;
    });
  };

  const checkAchievements = useCallback((state: GameState) => {
    let updated = false;
    const newAchievements = state.achievements.map(ach => {
      if (ach.isUnlocked) return ach;

      let shouldUnlock = false;
      switch (ach.id) {
        case 'ach2': // Nhất Đại Tông Sư - Nguyên Anh
          if (state.realmIndex >= 10) shouldUnlock = true;
          break;
        case 'ach3': // Đào Hoa Vận - 3 giai nhân
          if (state.characters.filter(c => c.inHarem).length >= 3) shouldUnlock = true;
          break;
        case 'ach4': // Phú Khả Địch Quốc - 10,000 Linh Thạch
          if (state.linhThach >= 10000) shouldUnlock = true;
          break;
        case 'ach5': // Danh Chấn Giang Hồ - Danh vọng 50
          if (state.fame >= 50) shouldUnlock = true;
          break;
      }

      if (shouldUnlock) {
        updated = true;
        addNotification('🏆 Thành Tựu Mới!', `Bạn đã đạt được: ${ach.name}`, ach.desc);
        return { ...ach, isUnlocked: true, unlockedAt: new Date().toISOString() };
      }
      return ach;
    });

    if (updated) {
      return { ...state, achievements: newAchievements };
    }
    return state;
  }, [addNotification]);

  const getHaremBuffs = useCallback(() => {
    const buffs = {
      linhThachMult: 1,
      tuViMult: 1,
      charmMult: 1,
      fameMult: 1,
      allStatsMult: 1
    };

    gameState.characters.forEach(c => {
      if (!c.inHarem) return;

      // Realm Buffs
      if (c.haremRealm === 'Tâm Đầu Ý Hợp') buffs.linhThachMult += 0.05;
      if (c.haremRealm === 'Thề Non Hẹn Biển') buffs.tuViMult += 0.10;
      if (c.haremRealm === 'Sắc Son Một Lòng') buffs.charmMult += 0.15;
      if (c.haremRealm === 'Phu Thê Giao Hòa') buffs.allStatsMult += 0.20;

      // Skill Buffs
      c.haremSkills?.forEach(skill => {
        if (skill.buffDesc.includes('Tu Vi')) buffs.tuViMult += (skill.level * 0.05);
        if (skill.buffDesc.includes('Vàng')) buffs.linhThachMult += (skill.level * 0.05);
        if (skill.buffDesc.includes('Danh vọng')) buffs.fameMult += (skill.level * 0.05);
      });
    });

    // Apply allStatsMult to others
    const finalMult = buffs.allStatsMult;
    return {
      linhThachMult: buffs.linhThachMult * finalMult,
      tuViMult: buffs.tuViMult * finalMult,
      charmMult: buffs.charmMult * finalMult,
      fameMult: buffs.fameMult * finalMult
    };
  }, [gameState.characters]);

  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      let next = updater(prev);
      
      // Apply Harem Buffs to gains if they increased
      const buffs = getHaremBuffs();
      if (next.tuVi > prev.tuVi) {
        const gain = next.tuVi - prev.tuVi;
        next.tuVi = prev.tuVi + Math.floor(gain * buffs.tuViMult);
      }
      if (next.linhThach > prev.linhThach) {
        const gain = next.linhThach - prev.linhThach;
        next.linhThach = prev.linhThach + Math.floor(gain * buffs.linhThachMult);
      }
      if (next.fame > prev.fame) {
        const gain = next.fame - prev.fame;
        next.fame = prev.fame + Math.floor(gain * buffs.fameMult);
      }
      if (next.charm > prev.charm) {
        const gain = next.charm - prev.charm;
        next.charm = prev.charm + Math.floor(gain * buffs.charmMult);
      }

      // Check for level up (Breakthrough)
      if (next.tuVi >= next.tuViMax) {
        const overflow = next.tuVi - next.tuViMax;
        const newRealmIndex = Math.min(next.realmIndex + 1, REALMS.length - 1);
        
        if (newRealmIndex > next.realmIndex) {
          const nextHpMax = next.hpMax + 100;
          const nextApMax = next.apMax + 50;
          const nextAtk = next.atk + 15;
          const nextDef = next.def + 5;

          addNotification('⚡ Đột Phá Thành Công!', `Đã thăng lên ${REALMS[newRealmIndex]}`, 'HP/AP/ATK/DEF tăng mạnh!');
          
          next = {
            ...next,
            tuVi: overflow,
            tuViMax: Math.floor(next.tuViMax * 1.5),
            realmIndex: newRealmIndex,
            hpMax: nextHpMax,
            hp: nextHpMax,
            apMax: nextApMax,
            ap: nextApMax,
            atk: nextAtk,
            def: nextDef,
            haoguang: next.haoguang + 10,
            charm: next.charm + 2,
            fame: next.fame + 5,
            cultivationHistory: [...(next.cultivationHistory || []), { text: `Đột phá thành công lên ${REALMS[newRealmIndex]}`, timestamp: new Date().toISOString() }]
          };
        } else {
          // Already at max realm
          next.tuVi = next.tuViMax;
        }
      }

      // Check achievements
      return checkAchievements(next);
    });
  }, [addNotification, checkAchievements]);

  const handleStartGame = (name: string) => {
    updateGameState(prev => ({
      ...prev,
      heroName: name || prev.heroName,
      started: true
    }));
  };

  const handleTutorialClose = () => {
    updateGameState(prev => ({ ...prev, tutorialCompleted: true }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const handleExportSave = useCallback(() => {
    const dataStr = JSON.stringify(gameState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `thien_dao_phong_van_save_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addNotification('📤 Xuất File Thành Công', 'Tiến trình đã được lưu vào file JSON.', 'Bạn có thể dùng file này để import ở máy khác');
  }, [gameState, addNotification]);

  const handleImportSave = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation
        if (parsed && typeof parsed === 'object' && 'heroName' in parsed && 'realmIndex' in parsed) {
          setGameState(parsed);
          addNotification('📥 Nhập File Thành Công', 'Tiến trình đã được khôi phục từ file.', 'Chào mừng trở lại!');
        } else {
          throw new Error('Invalid save file format');
        }
      } catch (err) {
        console.error("Failed to import save", err);
        addNotification('❌ Lỗi Nhập File', 'File không hợp lệ hoặc bị hỏng.', 'Vui lòng kiểm tra lại file');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  }, [addNotification]);

  const handleClaimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || quest.status !== 'ready') return prev;

      const rewards = quest.rewards;
      let nextInventory = [...prev.inventory];
      
      if (rewards.items) {
        rewards.items.forEach(rewardItem => {
          const existing = nextInventory.find(i => i.id === rewardItem.itemId);
          if (existing) {
            nextInventory = nextInventory.map(i => i.id === rewardItem.itemId ? { ...i, qty: i.qty + rewardItem.qty } : i);
          } else {
            // Find item template from INITIAL_ITEMS
            const template = INITIAL_ITEMS.find(i => i.id === rewardItem.itemId);
            if (template) {
              nextInventory.push({ ...template, qty: rewardItem.qty });
            }
          }
        });
      }

      addNotification('🎁 Đã Nhận Thưởng', `Nhiệm vụ: ${quest.name}`, `+${rewards.linhThach || 0} Linh Thạch, +${rewards.tuVi || 0} Tu Vi, +${rewards.exp || 0} EXP`);

      return {
        ...prev,
        linhThach: prev.linhThach + (rewards.linhThach || 0),
        tuVi: prev.tuVi + (rewards.tuVi || 0),
        exp: prev.exp + (rewards.exp || 0),
        fame: prev.fame + (rewards.fame || 0),
        charm: prev.charm + (rewards.charm || 0),
        inventory: nextInventory,
        quests: prev.quests.map(q => q.id === questId ? { ...q, status: 'claimed' as const } : q)
      };
    });
  }, [addNotification]);

  const updateQuestProgress = useCallback((questId: string, amount: number) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || (quest.status !== 'active' && quest.status !== 'ready')) return prev;

      const newProgress = Math.min(quest.target, quest.progress + amount);
      if (newProgress === quest.progress) return prev;

      const newStatus = newProgress >= quest.target ? 'ready' : 'active';

      if (newStatus === 'ready' && quest.status === 'active') {
        addNotification('📜 Nhiệm Vụ Hoàn Thành', quest.name, 'Nhấn vào tab Nhiệm Vụ để nhận thưởng');
      }

      return {
        ...prev,
        quests: prev.quests.map(q => q.id === questId ? { ...q, progress: newProgress, status: newStatus as any } : q)
      };
    });
  }, [addNotification]);

  // Automatic Quest Progression based on Game State
  useEffect(() => {
    if (!gameState.started) return;

    // Main Quest 1: Bước Đầu Tu Tiên (realmIndex >= 0)
    const qMain1 = gameState.quests.find(q => q.id === 'q_main_1');
    if (qMain1 && qMain1.status === 'active' && gameState.realmIndex >= 0 && qMain1.progress < 1) {
      updateQuestProgress('q_main_1', 1);
    }

    // Main Quest 2: Khai Phá Tiềm Năng (realmIndex >= 1)
    const qMain2 = gameState.quests.find(q => q.id === 'q_main_2');
    if (qMain2 && qMain2.status === 'active' && gameState.realmIndex >= 1 && qMain2.progress < 1) {
      updateQuestProgress('q_main_2', 1);
    }

    // Daily Quest 2: Tích Tiểu Thành Đại (earn 500 Linh Thạch)
    const qDaily2 = gameState.quests.find(q => q.id === 'q_daily_2');
    if (qDaily2 && qDaily2.status === 'active') {
      const currentLinhThach = gameState.linhThach;
      if (currentLinhThach >= 500 && qDaily2.progress < 500) {
        updateQuestProgress('q_daily_2', 500 - qDaily2.progress);
      } else if (currentLinhThach > qDaily2.progress && currentLinhThach < 500) {
        updateQuestProgress('q_daily_2', currentLinhThach - qDaily2.progress);
      }
    }

    // Daily Quest 3: Hành Thiện Tích Đức (earn 50 fame)
    const qDaily3 = gameState.quests.find(q => q.id === 'q_daily_3');
    if (qDaily3 && qDaily3.status === 'active') {
      const currentFame = gameState.fame;
      if (currentFame >= 50 && qDaily3.progress < 50) {
        updateQuestProgress('q_daily_3', 50 - qDaily3.progress);
      } else if (currentFame > qDaily3.progress && currentFame < 50) {
        updateQuestProgress('q_daily_3', currentFame - qDaily3.progress);
      }
    }

    // Side Quest 1: Gặp Gỡ Giai Nhân (unlock 3 characters)
    const qSide1 = gameState.quests.find(q => q.id === 'q_side_1');
    if (qSide1 && qSide1.status === 'active') {
      const unlockedCount = gameState.characters.filter(c => c.unlocked).length;
      if (unlockedCount > qSide1.progress) {
        updateQuestProgress('q_side_1', unlockedCount - qSide1.progress);
      }
    }

    // Linh Thạch quest
    const linhThachQuest = gameState.quests.find(q => q.id === 'q_main_3');
    if (linhThachQuest && linhThachQuest.status === 'active' && gameState.linhThach >= linhThachQuest.target && linhThachQuest.progress < linhThachQuest.target) {
      updateQuestProgress('q_main_3', linhThachQuest.target - linhThachQuest.progress);
    }

    // Affection quest
    const affectionQuest = gameState.quests.find(q => q.id === 'q_side_5');
    if (affectionQuest && affectionQuest.status === 'active') {
      const maxAffection = Math.max(...gameState.characters.map(c => c.affection));
      if (maxAffection >= affectionQuest.target && affectionQuest.progress < affectionQuest.target) {
        updateQuestProgress('q_side_5', affectionQuest.target - affectionQuest.progress);
      }
    }
  }, [gameState.realmIndex, gameState.linhThach, gameState.fame, gameState.characters, gameState.started, updateQuestProgress]);

  const handleUpgradeSkill = useCallback((skillId: string) => {
    setGameState(prev => {
      const skill = prev.skills.find(s => s.id === skillId);
      if (!skill || !skill.unlocked || skill.level >= skill.maxLevel) return prev;

      const cost = skill.upgradeCost || { linhThach: 100, exp: 200 };
      if (prev.linhThach < cost.linhThach || prev.exp < cost.exp) {
        addNotification('❌ Không Đủ Tài Nguyên', 'Bạn cần thêm Linh Thạch hoặc EXP để nâng cấp.', `Cần: ${cost.linhThach} Linh Thạch, ${cost.exp} EXP`);
        return prev;
      }

      const nextLevel = skill.level + 1;
      const nextCost = {
        linhThach: Math.floor(cost.linhThach * (1.5 + (nextLevel * 0.2))),
        exp: Math.floor(cost.exp * (1.5 + (nextLevel * 0.2)))
      };

      addNotification('✨ Nâng Cấp Thành Công!', `Kỹ năng ${skill.name} đã đạt cấp ${nextLevel}`, 'Sức mạnh đã được gia tăng');

      return {
        ...prev,
        linhThach: prev.linhThach - cost.linhThach,
        exp: prev.exp - cost.exp,
        skills: prev.skills.map(s => s.id === skillId ? {
          ...s,
          level: nextLevel,
          mastery: 0,
          upgradeCost: nextCost
        } : s)
      };
    });
  }, [addNotification]);

  useEffect(() => {
    const checkDailyReset = () => {
      const lastReset = localStorage.getItem('last_daily_reset');
      const today = new Date().toDateString();

      if (lastReset !== today) {
        setGameState(prev => ({
          ...prev,
          quests: prev.quests.map(q => 
            q.type === 'daily' 
              ? { ...q, progress: 0, status: 'active' as const } 
              : q
          )
        }));
        localStorage.setItem('last_daily_reset', today);
        addNotification('🌅 Ngày Mới Bắt Đầu', 'Nhiệm vụ hàng ngày đã được làm mới!', 'Hãy tiếp tục tu luyện');
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000 * 60); // Check every hour
    return () => clearInterval(interval);
  }, [addNotification]);

  useEffect(() => {
    if (!gameState.started) return;
    
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.05) { // 5% chance every 30s
        const events = [
          { title: '🌟 Cơ Duyên Xuất Hiện!', body: 'Ngươi tìm thấy một viên đan dược ven đường.', reward: '+1 Hồi Xuân Đan', action: (prev: GameState) => {
            const existing = prev.inventory.find(i => i.id === 'it1');
            if (existing) {
              return { ...prev, inventory: prev.inventory.map(i => i.id === 'it1' ? { ...i, qty: i.qty + 1 } : i) };
            }
            return prev;
          }},
          { title: '💰 Nhặt Được Tài Lộc', body: 'Một chiếc ví tiền rơi xuống từ trên cao.', reward: '+80 Linh Thạch', action: (prev: GameState) => ({ ...prev, linhThach: prev.linhThach + 80 }) },
          { title: '⚡ Thiên Lôi T淬體', body: 'Sét trời đánh qua người, linh mạch thông suốt!', reward: '+150 Tu Vi', action: (prev: GameState) => ({ ...prev, tuVi: prev.tuVi + 150 }) },
          { title: '💡 Khám Phá Mới', body: 'Ngươi vừa lĩnh ngộ được một nguyên lý khoa học áp dụng vào tu hành.', reward: '+1 Trí Tuệ', action: (prev: GameState) => ({ ...prev, wisdom: prev.wisdom + 1 }) },
          { title: '📣 Tiếng Lành Đồn Xa', body: 'Hành động nghĩa hiệp của ngươi được dân chúng ca tụng.', reward: '+20 Danh Vọng', action: (prev: GameState) => ({ ...prev, fame: prev.fame + 20 }) },
          { 
            title: '🕸️ Trận Pháp Bí Mật', 
            body: 'Ngươi phát hiện một trận pháp ẩn giấu trong rừng.', 
            reward: 'Phát hiện kho báu!', 
            action: (prev: GameState) => {
              const tranPhap = prev.skills.find(s => s.id === 'sk10');
              if (tranPhap && tranPhap.level >= 2) {
                return { ...prev, linhThach: prev.linhThach + 500, tuVi: prev.tuVi + 200 };
              }
              return { ...prev, tuVi: prev.tuVi + 50 }; // Small tuVi for just seeing it
            },
            condition: (prev: GameState) => {
              const tranPhap = prev.skills.find(s => s.id === 'sk10');
              return !!(tranPhap && tranPhap.level >= 1);
            }
          },
          { 
            title: '⚠️ Cạm Bẫy Linh Trận', 
            body: 'Ngươi vô tình bước vào một sát trận cổ xưa!', 
            reward: 'Thoát hiểm ngoạn mục', 
            action: (prev: GameState) => {
              const tranPhap = prev.skills.find(s => s.id === 'sk10');
              if (tranPhap && tranPhap.level >= 3) {
                return { ...prev, tuVi: prev.tuVi + 300 }; // Gained insight
              }
              return { ...prev, linhThach: Math.max(0, prev.linhThach - 100), mood: Math.max(0, prev.mood - 10) }; // Lost linhThach/mood
            }
          }
        ];

        const availableEvents = events.filter(ev => !ev.condition || ev.condition(gameState));
        const ev = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        updateGameState(ev.action);
        addNotification(ev.title, ev.body, ev.reward);
      }

      // Harem Event Trigger (3% chance every 30s)
      if (rand < 0.03) {
        setGameState(prev => {
          const unlockedCharacters = prev.characters.filter(w => w.unlocked);
          if (unlockedCharacters.length === 0 || prev.activeHaremEvent) return prev;

          const character = unlockedCharacters[Math.floor(Math.random() * unlockedCharacters.length)];
          
          // Define some generic harem events
          const haremEvents = [
            {
              characterId: character.id,
              title: `💌 Thư Tay Từ ${character.name}`,
              body: `${character.name} gửi cho ngươi một bức thư tay, hẹn gặp tại rừng trúc vào đêm nay. Nàng dường như có tâm sự muốn nói.`,
              choices: [
                {
                  text: 'Đến điểm hẹn đúng giờ',
                  result: `Ngươi và ${character.name} đã có một buổi tối trò chuyện sâu sắc dưới ánh trăng.`,
                  action: (p: GameState) => ({
                    ...p,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 5),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Thư Tay Từ ${character.name}. Kết quả: Ngươi và nàng đã có một buổi tối trò chuyện sâu sắc dưới ánh trăng.`
                      }]
                    } : w)
                  })
                },
                {
                  text: 'Gửi thư trả lời bận tu luyện',
                  result: `${character.name} có chút hụt hẫng nhưng nàng hiểu cho chí hướng của ngươi.`,
                  action: (p: GameState) => ({
                    ...p,
                    tuVi: p.tuVi + 50,
                    characters: p.characters.map(w => w.id === character.id ? {
                      ...w,
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Thư Tay Từ ${character.name}. Kết quả: Ngươi từ chối để tập trung tu luyện.`
                      }]
                    } : w)
                  })
                }
              ]
            },
            {
              characterId: character.id,
              title: `🎁 Món Quà Bất Ngờ`,
              body: `${character.name} đang phân vân không biết nên chọn món trang sức nào. Nàng nhờ ngươi tư vấn.`,
              choices: [
                {
                  text: 'Chọn chiếc trâm ngọc thanh nhã',
                  result: `${character.name} rất thích gu thẩm mỹ của ngươi.`,
                  action: (p: GameState) => ({
                    ...p,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 3),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Món Quà Bất Ngờ. Kết quả: Ngươi chọn trâm ngọc, nàng rất hài lòng.`
                      }]
                    } : w),
                    charm: p.charm + 1
                  })
                },
                {
                  text: 'Chọn sợi dây chuyền vàng lộng lẫy',
                  result: `${character.name} cảm thấy ngươi thật hào phóng.`,
                  action: (p: GameState) => ({
                    ...p,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 2),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Món Quà Bất Ngờ. Kết quả: Ngươi chọn dây chuyền vàng, nàng cảm kích sự hào phóng.`
                      }]
                    } : w),
                    linhThach: Math.max(0, p.linhThach - 50)
                  })
                }
              ]
            },
            {
              characterId: character.id,
              title: `⚔️ Thử Thách Cùng ${character.name}`,
              body: `${character.name} muốn cùng ngươi luận bàn võ học để nâng cao thực chiến.`,
              choices: [
                {
                  text: 'Dốc hết sức mình thi đấu',
                  result: `Cả hai đều mồ hôi đầm đìa nhưng cảm thấy sảng khoái vô cùng.`,
                  action: (p: GameState) => ({
                    ...p,
                    tuVi: p.tuVi + 100,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 2),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Thử Thách Cùng ${character.name}. Kết quả: Hai người dốc sức luận bàn, tu vi tinh tiến.`
                      }]
                    } : w)
                  })
                },
                {
                  text: 'Nhẹ nhàng nhường nhịn nàng',
                  result: `${character.name} nhận ra sự quan tâm của ngươi, nàng mỉm cười dịu dàng.`,
                  action: (p: GameState) => ({
                    ...p,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 4),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Thử Thách Cùng ${character.name}. Kết quả: Ngươi nhường nhịn nàng, tình cảm thêm gắn bó.`
                      }]
                    } : w)
                  })
                }
              ]
            },
            {
              characterId: character.id,
              title: `🔥 Sóng Gió Giao Hảo`,
              body: `Một đệ tử khác trong tông môn buông lời khiếm nhã với ${character.name}. Nàng đang cố gắng giữ bình tĩnh nhưng đôi mắt đã đỏ hoe.`,
              choices: [
                {
                  text: 'Công khai bảo vệ nàng',
                  result: `Ngươi đã khiến kẻ kia phải câm lặng. ${character.name} cảm thấy vô cùng an toàn khi bên ngươi.`,
                  action: (p: GameState) => ({
                    ...p,
                    fame: p.fame + 10,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 6),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Sóng Gió Giao Hảo. Kết quả: Ngươi bảo vệ nàng trước kẻ xấu, danh vọng tăng cao.`
                      }]
                    } : w)
                  })
                },
                {
                  text: 'Khuyên nàng không nên chấp nhặt',
                  result: `${character.name} tuy nghe lời nhưng trong lòng vẫn có chút buồn bã.`,
                  action: (p: GameState) => ({
                    ...p,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.max(0, w.affection - 2),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Sóng Gió Giao Hảo. Kết quả: Ngươi khuyên nàng nhẫn nhịn, nàng có chút buồn.`
                      }]
                    } : w)
                  })
                }
              ]
            },
            {
              characterId: character.id,
              title: `🤫 Cuộc Gặp Bí Mật`,
              body: `${character.name} rủ ngươi lẻn ra ngoài thành đi dạo chợ đêm, tránh xa sự giám sát của tông môn.`,
              choices: [
                {
                  text: 'Đồng ý và cùng nàng đi chơi',
                  result: `Hai người đã có những giây phút vui vẻ, cùng ăn những món ăn vỉa hè ngon tuyệt.`,
                  action: (p: GameState) => ({
                    ...p,
                    linhThach: Math.max(0, p.linhThach - 30),
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.min(100, w.affection + 7),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Cuộc Gặp Bí Mật. Kết quả: Hai người cùng dạo chợ đêm, kỉ niệm khó quên.`
                      }]
                    } : w)
                  })
                },
                {
                  text: 'Từ chối vì quy định tông môn',
                  result: `${character.name} thở dài thất vọng, nàng lủi thủi quay về phòng.`,
                  action: (p: GameState) => ({
                    ...p,
                    characters: p.characters.map(w => w.id === character.id ? { 
                      ...w, 
                      affection: Math.max(0, w.affection - 3),
                      interactionLog: [...(w.interactionLog || []), {
                        type: 'event' as const,
                        timestamp: new Date().toISOString(),
                        content: `Sự kiện: Cuộc Gặp Bí Mật. Kết quả: Ngươi từ chối vì quy định, nàng thất vọng.`
                      }]
                    } : w)
                  })
                }
              ]
            }
          ];

          const selectedEvent = haremEvents[Math.floor(Math.random() * haremEvents.length)];
          return { ...prev, activeHaremEvent: selectedEvent };
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [gameState.started, updateGameState, addNotification]);

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  if (!gameState.started) {
    return (
      <MainMenu 
        onNewGame={(name) => setGameState(prev => ({ ...prev, started: true, heroName: name }))}
        onLoadGame={() => {
          const saved = localStorage.getItem(QUICK_SAVE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setGameState({ ...parsed, started: true });
            } catch (e) {
              console.error("Failed to load save", e);
            }
          }
        }}
        hasSave={!!localStorage.getItem(QUICK_SAVE_KEY)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-bg-dark text-[#e8dcc8] font-chinese overflow-hidden">
      <Sidebar 
        gameState={gameState} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onReset={handleReset}
      />
      
      <main className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">
        {activeTab === 'story' && (
          <StoryTab 
            gameState={gameState} 
            updateGameState={updateGameState} 
            onStart={handleStartGame}
            addNotification={addNotification}
            onQuickSave={handleQuickSave}
            onQuickLoad={handleQuickLoad}
            onSavePartial={handleSavePartial}
            onLoadPartial={handleLoadPartial}
            updateQuestProgress={updateQuestProgress}
            triggerRandomEvent={triggerRandomEvent}
          />
        )}
        {activeTab === 'harem' && (
          <HaremTab 
            gameState={gameState} 
            updateGameState={updateGameState}
            addNotification={addNotification}
            onSavePartial={handleSavePartial}
            onLoadPartial={handleLoadPartial}
            updateQuestProgress={updateQuestProgress}
            onStartMiniGame={(game) => setActiveMiniGame(game)}
          />
        )}
        {activeTab === 'skills' && (
          <SkillsTab 
            gameState={gameState} 
            onUpgrade={handleUpgradeSkill}
            updateQuestProgress={updateQuestProgress}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab 
            gameState={gameState} 
            updateGameState={updateGameState}
            addNotification={addNotification}
          />
        )}
        {activeTab === 'status' && (
          <StatusTab 
            gameState={gameState} 
            updateGameState={updateGameState}
            addNotification={addNotification}
            onReset={handleReset}
            onExport={handleExportSave}
            onImport={handleImportSave}
            onTabChange={setActiveTab}
            updateQuestProgress={updateQuestProgress}
          />
        )}
        {activeTab === 'quests' && (
          <QuestsTab 
            gameState={gameState} 
            onClaimReward={handleClaimQuestReward}
          />
        )}
        {activeTab === 'adventure' && (
          <AdventureTab 
            gameState={gameState} 
            updateGameState={setGameState}
            addNotification={addNotification}
          />
        )}
        {activeTab === 'worldmap' && (
          <WorldMapTab 
            gameState={gameState} 
            updateGameState={updateGameState}
            onTabChange={setActiveTab}
          />
        )}
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <NotificationSystem notifications={notifications} />

      <AnimatePresence>
        {gameState.activeHaremEvent && (
          <HaremEventModal 
            event={gameState.activeHaremEvent}
            characterIcon={gameState.characters.find(w => w.id === gameState.activeHaremEvent?.characterId)?.icon || '🌸'}
            onClose={(action, result) => {
              updateGameState(action);
              if (result) {
                addNotification('💖 Sự Kiện Hoàn Tất', result);
              }
              updateGameState(prev => ({ ...prev, activeHaremEvent: null }));
            }}
          />
        )}

        {gameState.activeRandomEvent && (
          <RandomEventModal 
            event={gameState.activeRandomEvent} 
            onSelect={handleRandomEventSelect} 
          />
        )}

        {gameState.started && !gameState.tutorialCompleted && (
          <TutorialModal onClose={handleTutorialClose} />
        )}

        {activeMiniGame && (
          <MiniGameModal 
            game={activeMiniGame} 
            onClose={(won) => {
              if (won) {
                addNotification('🏆 Thắng Lợi!', `Bạn đã thắng trò chơi ${activeMiniGame.name}.`, `Nhận ${activeMiniGame.reward.linhThach} Linh Thạch`);
                setGameState(prev => ({ ...prev, linhThach: prev.linhThach + (activeMiniGame.reward.linhThach || 0) }));
              }
              setActiveMiniGame(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
