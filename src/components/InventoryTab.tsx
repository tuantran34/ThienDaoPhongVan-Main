import React, { useState, useMemo } from 'react';
import { GameState, ShopItem, Recipe, Item } from '../types';
import { SHOP_DATA, REALMS, CRAFTING_RECIPES, INITIAL_ITEMS } from '../constants';
import { cn } from '../lib/utils';

interface InventoryTabProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  addNotification: (title: string, body: string, reward?: string) => void;
}

type ItemCategory = 'All' | 'Đan Dược' | 'Nguyên Liệu' | 'Trang Bị' | 'Quà Tặng' | 'Khác';

export function InventoryTab({ gameState, updateGameState, addNotification }: InventoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'bag' | 'shop' | 'craft' | 'forge'>('bag');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<ItemCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rarity' | 'qty' | 'name'>('rarity');

  const handleUseItem = (itemId: string) => {
    const item = gameState.inventory.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'Đan Dược') {
      updateGameState(prev => {
        let next = { ...prev };
        let notificationBody = 'Linh lực hồi phục, tinh thần sảng khoái';
        let notificationReward = '+50 Tu Vi';

        // Base Tu Vi gain
        next.tuVi += 50;

        // Specific effects based on item ID or name
        if (item.id === 'pill_hp_max' || item.name === 'Tẩy Tủy Đan') {
          next.hpMax += 100;
          next.hp += 100;
          notificationBody = 'Cơ thể được tẩy tủy, khí huyết dồi dào hơn.';
          notificationReward = '+100 HP Giới Hạn';
        } else if (item.id === 'pill_mp_max' || item.name === 'Linh Hải Đan') {
          next.mpMax += 50;
          next.mp += 50;
          notificationBody = 'Khai mở linh hải, linh lực dồi dào hơn.';
          notificationReward = '+50 MP Giới Hạn';
        } else if (item.id === 'pill_ap_max' || item.name === 'Linh Nguyên Đan') {
          next.apMax += 50;
          next.ap += 50;
          notificationBody = 'Thân thể dẻo dai, hoạt lực dồi dào hơn.';
          notificationReward = '+50 AP Giới Hạn';
        } else if (item.id === 'pill_atk' || item.name === 'Lực Đạo Đan') {
          next.atk += 10;
          notificationBody = 'Sức mạnh bộc phát, công kích tăng tiến.';
          notificationReward = '+10 Công Kích';
        } else if (item.id === 'pill_def' || item.name === 'Hộ Thể Đan') {
          next.def += 5;
          notificationBody = 'Thân thể cứng cáp, phòng thủ kiên cố.';
          notificationReward = '+5 Phòng Thủ';
        } else if (item.id === 'pill_wisdom' || item.name === 'Tuệ Nhãn Đan') {
          next.wisdom += 2;
          notificationBody = 'Trí tuệ minh mẫn, thấu hiểu đạo lý.';
          notificationReward = '+2 Học Thức';
        } else if (item.name === 'Hồi Xuân Đan') {
          next.hp = Math.min(next.hpMax, next.hp + Math.floor(next.hpMax * 0.3));
          next.mp = Math.min(next.mpMax, next.mp + Math.floor(next.mpMax * 0.3));
          notificationBody = 'Thương thế hồi phục, linh lực tràn đầy.';
          notificationReward = '+30% HP, +30% MP';
        } else if (item.name === 'Bổ Huyết Đan') {
          next.hp = Math.min(next.hpMax, next.hp + 200);
          notificationBody = 'Khí huyết hồi phục, sắc mặt hồng hào.';
          notificationReward = '+200 HP';
        } else if (item.name === 'Bổ Linh Đan') {
          next.mp = Math.min(next.mpMax, next.mp + 150);
          notificationBody = 'Linh lực hồi phục, tinh thần sảng khoái.';
          notificationReward = '+150 MP';
        } else if (item.name === 'Thanh Thần Đan') {
          next.ap = Math.min(next.apMax, next.ap + 50);
          notificationBody = 'Xua tan mệt mỏi, hoạt lực hồi sinh.';
          notificationReward = '+50 AP';
        }

        next.inventory = prev.inventory.map(i => 
          i.id === itemId ? { ...i, qty: i.qty - 1 } : i
        ).filter(i => i.qty > 0);

        addNotification(`💊 Sử dụng ${item.name}`, notificationBody, notificationReward);
        return next;
      });
    }
  };

  const handleBuyItem = (shopItem: ShopItem) => {
    if (gameState.linhThach < shopItem.price) return;

    updateGameState(prev => {
      const existing = prev.inventory.find(i => i.name === shopItem.name);
      let newInventory;
      if (existing) {
        newInventory = prev.inventory.map(i => 
          i.id === existing.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        newInventory = [...prev.inventory, {
          id: 'bought_' + Date.now(),
          name: shopItem.name,
          icon: shopItem.icon,
          type: shopItem.name.includes('Đan') ? 'Đan Dược' : 'Quà Tặng',
          rarity: 'rare',
          qty: 1,
          desc: shopItem.desc
        }];
      }

      return {
        ...prev,
        linhThach: prev.linhThach - shopItem.price,
        inventory: newInventory
      };
    });

    addNotification('✅ Mua thành công!', `Đã mua ${shopItem.name}`, `-${shopItem.price} Linh Thạch`);
  };

  const handleCraft = (recipe: Recipe) => {
    // Check if materials are enough
    const hasMaterials = recipe.materials.every(mat => {
      const item = gameState.inventory.find(i => i.id === mat.itemId);
      return item && item.qty >= mat.qty;
    });

    if (!hasMaterials) {
      addNotification('❌ Thất bại!', 'Không đủ nguyên liệu để luyện chế.', '');
      return;
    }

    // Check realm requirement
    if (recipe.requiredRealmIndex && gameState.realmIndex < recipe.requiredRealmIndex) {
      addNotification('❌ Thất bại!', `Yêu cầu cảnh giới ${REALMS[recipe.requiredRealmIndex]}`, '');
      return;
    }

    // Check skill requirement
    if (recipe.requiredSkillId) {
      const skill = gameState.skills.find(s => s.id === recipe.requiredSkillId);
      if (!skill || skill.level < (recipe.requiredSkillLevel || 1)) {
        const skillName = skill?.name || 'Kỹ năng yêu cầu';
        addNotification('❌ Thất bại!', `Yêu cầu ${skillName} cấp ${recipe.requiredSkillLevel}`, '');
        return;
      }
    }

    // Perform crafting
    updateGameState(prev => {
      let next = { ...prev };
      const duocLySkill = next.skills.find(s => s.id === 'sk9');
      const luyenKhiSkill = next.skills.find(s => s.id === 'sk11');
      const giaKimSkill = next.skills.find(s => s.id === 'sk13');
      
      const isMedicine = recipe.outputType === 'Đan Dược';
      const isEquipment = recipe.outputType === 'Vũ Khí' || recipe.outputType === 'Trang Sức';
      
      // Success Rate Logic
      let successChance = recipe.successRateBase || 0.8;
      if (isMedicine && duocLySkill) successChance += (duocLySkill.level * 0.02);
      if (isEquipment && luyenKhiSkill) successChance += (luyenKhiSkill.level * 0.02);
      if (giaKimSkill) successChance += (giaKimSkill.level * 0.03); // Alchemy bonus
      
      const isSuccess = Math.random() < successChance;
      
      if (!isSuccess) {
        // Deduct materials anyway
        next.inventory = next.inventory.map(item => {
          const matReq = recipe.materials.find(m => m.itemId === item.id);
          if (matReq) {
            return { ...item, qty: item.qty - matReq.qty };
          }
          return item;
        }).filter(item => item.qty > 0);
        
        setTimeout(() => addNotification('💥 Luyện Chế Thất Bại!', `Lò luyện bị nổ, nguyên liệu đã mất sạch...`, 'Cần nâng cao kỹ năng kiến thức'), 100);
        return next;
      }

      // Mastery gain logic
      if (recipe.requiredSkillId) {
        next.skills = next.skills.map(s => {
          if (s.id === recipe.requiredSkillId) {
            const currentMastery = s.mastery || 0;
            // Luyện Khí Thuật (sk11) tăng kinh nghiệm khi rèn đúc
            const gain = Math.max(5, 20 - (s.level - (recipe.requiredSkillLevel || 1)) * 5);
            const nextMastery = currentMastery + gain;
            if (nextMastery >= 100 && s.level < s.maxLevel) {
              setTimeout(() => addNotification('🎊 Thăng Cấp Kỹ Năng!', `Kỹ năng ${s.name} đã đạt cấp ${s.level + 1}`, ''), 200);
              return { ...s, level: s.level + 1, mastery: 0 };
            }
            return { ...s, mastery: Math.min(100, nextMastery) };
          }
          return s;
        });
      }

      // Refund Logic (Resource saving)
      let refundChance = 0;
      if (isMedicine && duocLySkill) refundChance += duocLySkill.level * 0.05;
      if (isEquipment && luyenKhiSkill) refundChance += luyenKhiSkill.level * 0.05;
      if (giaKimSkill) refundChance += giaKimSkill.level * 0.02;

      // Deduct materials with refund chance
      next.inventory = next.inventory.map(item => {
        const matReq = recipe.materials.find(m => m.itemId === item.id);
        if (matReq) {
          const shouldRefund = Math.random() < refundChance;
          if (shouldRefund) {
            // Save 1 unit if possible
            return { ...item, qty: item.qty - Math.max(0, matReq.qty - 1) };
          }
          return { ...item, qty: item.qty - matReq.qty };
        }
        return item;
      }).filter(item => item.qty > 0);

      // Add output item
      const existing = next.inventory.find(i => i.id === recipe.outputItemId);
      if (existing) {
        next.inventory = next.inventory.map(i => 
          i.id === recipe.outputItemId ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        next.inventory.push({
          id: recipe.outputItemId,
          name: recipe.outputName,
          icon: recipe.outputIcon,
          type: recipe.outputType,
          rarity: recipe.outputRarity,
          qty: 1,
          desc: recipe.outputDesc
        });
      }

      setTimeout(() => addNotification('✨ Luyện Chế Thành Công!', `Đã tạo ra ${recipe.outputName}`, `+1 ${recipe.outputName}`), 100);
      
      return next;
    });
  };

  const filteredInventory = useMemo(() => {
    // Create a list of all items, using INITIAL_ITEMS as the template
    let allItems: Item[] = INITIAL_ITEMS.map(template => {
      const ownedItem = gameState.inventory.find(i => i.id === template.id);
      return {
        ...template,
        qty: ownedItem ? ownedItem.qty : 0
      };
    });
    
    // Filter by category
    if (inventoryFilter !== 'All') {
      allItems = allItems.filter(i => i.type === inventoryFilter);
    }
    
    // Filter by search
    if (searchQuery) {
      allItems = allItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    // Sort
    allItems.sort((a, b) => {
      // Primary sort: Owned (qty > 0) first, Unowned (qty === 0) last
      const aOwned = a.qty > 0 ? 1 : 0;
      const bOwned = b.qty > 0 ? 1 : 0;
      if (aOwned !== bOwned) return bOwned - aOwned;

      // Secondary sort based on user selection
      if (sortBy === 'rarity') {
        const rarityMap = { 'common': 0, 'rare': 1, 'epic': 2, 'legend': 3 };
        return rarityMap[b.rarity] - rarityMap[a.rarity];
      }
      if (sortBy === 'qty') return b.qty - a.qty;
      return a.name.localeCompare(b.name);
    });
    
    return allItems;
  }, [gameState.inventory, inventoryFilter, searchQuery, sortBy]);

  const rarityColors = {
    common: 'border-gray-500/30 text-gray-400 bg-gray-500/5',
    rare: 'border-jade/50 text-jade-light bg-jade/5',
    epic: 'border-gold/50 text-gold bg-gold/5',
    legend: 'border-red-deep/70 text-red-400 bg-red-deep/5 shadow-[0_0_15px_rgba(139,26,26,0.2)]'
  };

  return (
    <div className="min-h-full bg-bg-dark/50 backdrop-blur-md">
      {/* Header Section */}
      <div className="p-6 border-b border-gold/20 bg-linear-to-b from-bg-card/50 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-gold text-3xl tracking-[0.2em] uppercase mb-1">
              Túi Trữ Vật
            </h2>
            <p className="text-[10px] text-text-dim uppercase tracking-widest">Không gian giới tử • Chứa đựng vạn vật</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-bg-card border border-gold/20 px-4 py-2 rounded-sm flex items-center gap-3">
              <span className="text-yellow-500 text-lg">💰</span>
              <div>
                <div className="text-[9px] text-text-dim uppercase tracking-tighter">Linh Thạch</div>
                <div className="text-sm font-mono text-yellow-400 font-bold">{(gameState.linhThach || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-bg-card border border-gold/20 px-4 py-2 rounded-sm flex items-center gap-3">
              <span className="text-blue-500 text-lg">📜</span>
              <div>
                <div className="text-[9px] text-text-dim uppercase tracking-tighter">Học Thức</div>
                <div className="text-sm font-mono text-blue-400 font-bold">Cấp {gameState.wisdom}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-6 border-b border-gold/10 bg-bg-dark/30">
        {[
          { id: 'bag', label: 'Túi Đồ', icon: '🎒' },
          { id: 'shop', label: 'Linh Bảo Các', icon: '💎' },
          { id: 'craft', label: 'Đan Phương', icon: '📜' },
          { id: 'forge', label: 'Rèn Đúc', icon: '🔨' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "px-8 py-4 text-xs tracking-[0.2em] uppercase transition-all duration-300 border-b-2 -mb-[1px] flex items-center gap-2",
              activeSubTab === tab.id 
                ? "text-gold border-gold bg-gold/5" 
                : "text-text-dim border-transparent hover:text-gold/70"
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeSubTab === 'bag' && (
          <div className="space-y-6">
            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-bg-card/30 p-4 rounded-lg border border-gold/10">
              <div className="flex flex-wrap gap-2">
                {['All', 'Đan Dược', 'Nguyên Liệu', 'Trang Bị', 'Quà Tặng', 'Khác'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInventoryFilter(cat as ItemCategory)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-full transition-all border",
                      inventoryFilter === cat 
                        ? "bg-gold text-bg-dark border-gold font-bold" 
                        : "bg-transparent text-text-dim border-gold/20 hover:border-gold/50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <input 
                    type="text"
                    placeholder="Tìm kiếm vật phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-dark border border-gold/20 rounded-sm px-4 py-2 text-xs text-gold placeholder:text-text-dim focus:outline-hidden focus:border-gold/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-bg-dark border border-gold/20 rounded-sm px-3 py-2 text-[10px] text-gold uppercase tracking-widest focus:outline-hidden"
                >
                  <option value="rarity">Phẩm cấp</option>
                  <option value="qty">Số lượng</option>
                  <option value="name">Tên</option>
                </select>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredInventory.length === 0 ? (
                <div className="col-span-full py-32 text-center">
                  <div className="text-4xl mb-4 opacity-20">📦</div>
                  <p className="text-text-dim italic text-sm tracking-widest">Túi trữ vật trống rỗng...</p>
                </div>
              ) : (
                filteredInventory.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "group relative bg-bg-card/40 border p-4 text-center rounded-lg cursor-pointer transition-all duration-300 hover:bg-gold/5 hover:-translate-y-1",
                      rarityColors[item.rarity],
                      item.qty === 0 && "grayscale opacity-40 border-white/5 bg-white/5"
                    )}
                  >
                    <div className="absolute top-2 right-2 text-[10px] font-mono opacity-60">
                      {item.qty > 0 ? `x${item.qty}` : 'Chưa có'}
                    </div>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                    <div className="font-serif text-xs mb-1 truncate font-bold">{item.name}</div>
                    <div className="text-[8px] opacity-60 uppercase tracking-tighter">{item.type}</div>
                    
                    {/* Rarity Indicator */}
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-1 rounded-b-lg",
                      item.qty === 0 ? "bg-white/10" : (
                        item.rarity === 'common' ? "bg-gray-500/30" :
                        item.rarity === 'rare' ? "bg-jade/50" :
                        item.rarity === 'epic' ? "bg-gold/50" :
                        "bg-red-deep/70"
                      )
                    )} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'shop' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center py-8 border-b border-gold/10">
              <h3 className="font-serif text-gold text-2xl tracking-[0.3em] uppercase mb-2">Linh Bảo Các</h3>
              <p className="text-xs text-text-dim italic">"Nơi hội tụ kỳ trân dị bảo của cửu châu đại lục"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHOP_DATA.map(item => {
                const isLocked = gameState.realmIndex < item.unlockRealm;
                const canAfford = gameState.linhThach >= item.price;
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "group relative bg-bg-card/60 border border-gold/20 p-5 flex items-center gap-5 rounded-xl transition-all duration-500 hover:border-gold/50 hover:bg-gold/5",
                      isLocked && "opacity-40 grayscale"
                    )}
                  >
                    <div className="relative w-16 h-16 flex items-center justify-center bg-bg-dark rounded-lg border border-gold/10 text-4xl group-hover:scale-110 transition-transform">
                      {isLocked ? '🔒' : item.icon}
                      {!isLocked && <div className="absolute inset-0 bg-gold/5 animate-pulse rounded-lg" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-serif text-gold text-base font-bold truncate">
                          {isLocked ? 'Vật Phẩm Bí Ẩn' : item.name}
                        </div>
                        {!isLocked && <span className="text-[10px] text-jade-light bg-jade/10 px-2 py-0.5 rounded-full border border-jade/20">Sẵn có</span>}
                      </div>
                      
                      <p className="text-[11px] text-text-dim line-clamp-2 mb-3 leading-relaxed">
                        {isLocked ? `Yêu cầu đạt đến cảnh giới: ${REALMS[item.unlockRealm]}` : item.desc}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-yellow-500 font-mono font-bold">
                          {isLocked ? '???' : `${item.price.toLocaleString()} Linh Thạch`}
                        </div>
                        
                        <button
                          disabled={isLocked || !canAfford}
                          onClick={() => handleBuyItem(item)}
                          className={cn(
                            "px-5 py-2 rounded-sm font-serif text-[10px] tracking-widest uppercase transition-all",
                            !isLocked && canAfford 
                              ? "bg-gold text-bg-dark font-bold hover:scale-105 shadow-lg shadow-gold/10" 
                              : "bg-white/5 text-text-dim border border-white/10"
                          )}
                        >
                          {isLocked ? 'Khóa' : canAfford ? 'Mua Ngay' : 'Thiếu Tiền'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'craft' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center py-8 border-b border-gold/10">
              <h3 className="font-serif text-gold text-2xl tracking-[0.3em] uppercase mb-2">Đan Phương Bí Tịch</h3>
              <p className="text-xs text-text-dim italic">"Dùng thiên địa làm lò, lấy âm dương làm than"</p>
              
              {/* Skill Progress */}
              <div className="mt-6 max-w-xs mx-auto bg-bg-card border border-gold/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gold uppercase tracking-widest font-bold">Luyện Đan Thuật</span>
                  <span className="text-[10px] text-gold font-mono">Cấp {gameState.skills.find(s => s.id === 'sk9')?.level || 1}</span>
                </div>
                <div className="h-1.5 w-full bg-bg-dark rounded-full overflow-hidden border border-gold/10">
                  <div 
                    className="h-full bg-linear-to-r from-gold-dark to-gold transition-all duration-500"
                    style={{ width: `${gameState.skills.find(s => s.id === 'sk9')?.mastery || 0}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[8px] text-text-dim uppercase tracking-tighter">
                  Độ thuần thục: {gameState.skills.find(s => s.id === 'sk9')?.mastery || 0}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {CRAFTING_RECIPES.filter(r => r.outputType === 'Đan Dược').map(recipe => {
                const skill = gameState.skills.find(s => s.id === recipe.requiredSkillId);
                const skillLevel = skill?.level || 1;
                const isSkillMet = !recipe.requiredSkillLevel || skillLevel >= recipe.requiredSkillLevel;
                const isRealmMet = !recipe.requiredRealmIndex || gameState.realmIndex >= recipe.requiredRealmIndex;
                
                const hasMaterials = recipe.materials.every(mat => {
                  const item = gameState.inventory.find(i => i.id === mat.itemId);
                  return item && item.qty >= mat.qty;
                });
                
                const canCraft = hasMaterials && isRealmMet && isSkillMet;
                const isLocked = !isSkillMet || !isRealmMet;

                return (
                  <div key={recipe.id} className={cn(
                    "bg-bg-card/50 border border-gold/20 rounded-xl overflow-hidden flex flex-col transition-all duration-300",
                    isLocked && "opacity-60 grayscale-[0.5]"
                  )}>
                    <div className="p-5 bg-linear-to-r from-gold/10 to-transparent border-b border-gold/10 flex items-center gap-4">
                      <div className="text-4xl w-12 h-12 flex items-center justify-center bg-bg-dark rounded-lg border border-gold/20">
                        {isLocked ? '🔒' : recipe.outputIcon}
                      </div>
                      <div>
                        <h4 className="font-serif text-gold text-lg">{isLocked ? 'Đan Phương Bí Ẩn' : recipe.outputName}</h4>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest">
                          {isLocked ? 'Chưa đạt yêu cầu' : `${recipe.outputType} • ${recipe.outputRarity}`}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 flex-1 space-y-4">
                      {!isLocked ? (
                        <>
                          <div>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">Nguyên liệu cần thiết</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {recipe.materials.map(mat => {
                                const owned = gameState.inventory.find(i => i.id === mat.itemId)?.qty || 0;
                                const isEnough = owned >= mat.qty;
                                return (
                                  <div key={mat.itemId} className={cn(
                                    "flex items-center justify-between p-2 rounded-lg border text-[11px]",
                                    isEnough ? "bg-jade/5 border-jade/20 text-jade-light" : "bg-red-deep/5 border-red-deep/20 text-red-400"
                                  )}>
                                    <span>{mat.name}</span>
                                    <span className="font-mono">{owned}/{mat.qty}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gold/10 flex items-center justify-between">
                            <div className="text-[10px] text-text-dim">
                              <div className="flex flex-col gap-1">
                                {recipe.requiredRealmIndex && (
                                  <div className={cn(isRealmMet ? "text-jade-light" : "text-red-400")}>
                                    Cảnh giới: {REALMS[recipe.requiredRealmIndex]}
                                  </div>
                                )}
                                {recipe.requiredSkillLevel && (
                                  <div className={cn(isSkillMet ? "text-jade-light" : "text-red-400")}>
                                    Luyện Đan: Cấp {recipe.requiredSkillLevel}
                                  </div>
                                )}
                                <div className="mt-1">Tỷ lệ thành công: {Math.floor((recipe.successRateBase || 0.8) * 100)}%</div>
                              </div>
                            </div>

                            <button
                              disabled={!canCraft}
                              onClick={() => handleCraft(recipe)}
                              className={cn(
                                "px-6 py-2.5 rounded-sm font-serif text-xs tracking-widest uppercase transition-all",
                                canCraft 
                                  ? "bg-linear-to-r from-red-deep to-red-800 text-white font-bold hover:scale-105 shadow-lg shadow-red-900/20" 
                                  : "bg-white/5 text-text-dim border border-white/10"
                              )}
                            >
                              Luyện Chế
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-xs text-text-dim mb-4">Bạn chưa đủ trình độ để thấu hiểu đan phương này.</p>
                          <div className="flex flex-col gap-2 items-center">
                            {recipe.requiredSkillLevel && (
                              <div className={cn("text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border", isSkillMet ? "border-jade/30 text-jade-light" : "border-red-deep/30 text-red-400")}>
                                Yêu cầu Luyện Đan: Cấp {recipe.requiredSkillLevel}
                              </div>
                            )}
                            {recipe.requiredRealmIndex && (
                              <div className={cn("text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border", isRealmMet ? "border-jade/30 text-jade-light" : "border-red-deep/30 text-red-400")}>
                                Yêu cầu Cảnh giới: {REALMS[recipe.requiredRealmIndex]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'forge' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center py-8 border-b border-gold/10">
              <h3 className="font-serif text-gold text-2xl tracking-[0.3em] uppercase mb-2">Thần Binh Lò</h3>
              <p className="text-xs text-text-dim italic">"Rèn đúc thần binh, chấn động cửu châu"</p>
              
              {/* Skill Progress */}
              <div className="mt-6 max-w-xs mx-auto bg-bg-card border border-gold/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gold uppercase tracking-widest font-bold">Luyện Khí Thuật</span>
                  <span className="text-[10px] text-gold font-mono">Cấp {gameState.skills.find(s => s.id === 'sk11')?.level || 1}</span>
                </div>
                <div className="h-1.5 w-full bg-bg-dark rounded-full overflow-hidden border border-gold/10">
                  <div 
                    className="h-full bg-linear-to-r from-gold-dark to-gold transition-all duration-500"
                    style={{ width: `${gameState.skills.find(s => s.id === 'sk11')?.mastery || 0}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[8px] text-text-dim uppercase tracking-tighter">
                  Độ thuần thục: {gameState.skills.find(s => s.id === 'sk11')?.mastery || 0}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {CRAFTING_RECIPES.filter(r => r.outputType !== 'Đan Dược').map(recipe => {
                const skill = gameState.skills.find(s => s.id === recipe.requiredSkillId);
                const skillLevel = skill?.level || 1;
                const isSkillMet = !recipe.requiredSkillLevel || skillLevel >= recipe.requiredSkillLevel;
                const isRealmMet = !recipe.requiredRealmIndex || gameState.realmIndex >= recipe.requiredRealmIndex;
                
                const hasMaterials = recipe.materials.every(mat => {
                  const item = gameState.inventory.find(i => i.id === mat.itemId);
                  return item && item.qty >= mat.qty;
                });
                
                const canCraft = hasMaterials && isRealmMet && isSkillMet;
                const isLocked = !isSkillMet || !isRealmMet;

                return (
                  <div key={recipe.id} className={cn(
                    "bg-bg-card/50 border border-gold/20 rounded-xl overflow-hidden flex flex-col transition-all duration-300",
                    isLocked && "opacity-60 grayscale-[0.5]"
                  )}>
                    <div className="p-5 bg-linear-to-r from-gold/10 to-transparent border-b border-gold/10 flex items-center gap-4">
                      <div className="text-4xl w-12 h-12 flex items-center justify-center bg-bg-dark rounded-lg border border-gold/20">
                        {isLocked ? '🔒' : recipe.outputIcon}
                      </div>
                      <div>
                        <h4 className="font-serif text-gold text-lg">{isLocked ? 'Thần Binh Bí Tịch' : recipe.outputName}</h4>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest">
                          {isLocked ? 'Chưa đạt yêu cầu' : `${recipe.outputType} • ${recipe.outputRarity}`}
                        </p>
                        {/* Hiển thị chỉ số cộng thêm nếu là trang bị */}
                        {!isLocked && recipe.outputType !== 'Đan Dược' && (
                          <div className="text-[10px] text-jade-light mt-1 font-mono">
                            {INITIAL_ITEMS.find(i => i.id === recipe.outputItemId)?.effect}
                          </div>
                        )}
                        {/* Hiển thị nguồn gốc */}
                        {!isLocked && (
                          <div className="text-[10px] text-gold/70 mt-1 font-serif italic">
                            Nguồn gốc: {INITIAL_ITEMS.find(i => i.id === recipe.outputItemId)?.origin}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 space-y-4">
                      {!isLocked ? (
                        <>
                          <div>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-3">Nguyên liệu cần thiết</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {recipe.materials.map(mat => {
                                const owned = gameState.inventory.find(i => i.id === mat.itemId)?.qty || 0;
                                const isEnough = owned >= mat.qty;
                                return (
                                  <div key={mat.itemId} className={cn(
                                    "flex items-center justify-between p-2 rounded-lg border text-[11px]",
                                    isEnough ? "bg-jade/5 border-jade/20 text-jade-light" : "bg-red-deep/5 border-red-deep/20 text-red-400"
                                  )}>
                                    <span>{mat.name}</span>
                                    <span className="font-mono">{owned}/{mat.qty}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gold/10 flex items-center justify-between">
                            <div className="text-[10px] text-text-dim">
                              <div className="flex flex-col gap-1">
                                {recipe.requiredRealmIndex && (
                                  <div className={cn(isRealmMet ? "text-jade-light" : "text-red-400")}>
                                    Cảnh giới: {REALMS[recipe.requiredRealmIndex]}
                                  </div>
                                )}
                                {recipe.requiredSkillLevel && (
                                  <div className={cn(isSkillMet ? "text-jade-light" : "text-red-400")}>
                                    Luyện Khí: Cấp {recipe.requiredSkillLevel}
                                  </div>
                                )}
                                <div className="mt-1">Tỷ lệ thành công: {Math.floor((recipe.successRateBase || 0.8) * 100)}%</div>
                              </div>
                            </div>

                            <button
                              disabled={!canCraft}
                              onClick={() => handleCraft(recipe)}
                              className={cn(
                                "px-6 py-2.5 rounded-sm font-serif text-xs tracking-widest uppercase transition-all",
                                canCraft 
                                  ? "bg-linear-to-r from-red-deep to-red-800 text-white font-bold hover:scale-105 shadow-lg shadow-red-900/20" 
                                  : "bg-white/5 text-text-dim border border-white/10"
                              )}
                            >
                              Rèn Đúc
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-xs text-text-dim mb-4">Bạn chưa đủ trình độ để thấu hiểu bí tịch này.</p>
                          <div className="flex flex-col gap-2 items-center">
                            {recipe.requiredSkillLevel && (
                              <div className={cn("text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border", isSkillMet ? "border-jade/30 text-jade-light" : "border-red-deep/30 text-red-400")}>
                                Yêu cầu Luyện Khí: Cấp {recipe.requiredSkillLevel}
                              </div>
                            )}
                            {recipe.requiredRealmIndex && (
                              <div className={cn("text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border", isRealmMet ? "border-jade/30 text-jade-light" : "border-red-deep/30 text-red-400")}>
                                Yêu cầu Cảnh giới: {REALMS[recipe.requiredRealmIndex]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-bg-dark border border-gold/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(201,168,76,0.15)]">
            {/* Modal Header */}
            <div className={cn(
              "p-8 text-center border-b border-gold/20 relative overflow-hidden",
              selectedItem.rarity === 'legend' && "bg-radial-gradient(circle at 50% 0%, rgba(139,26,26,0.2), transparent 70%)",
              selectedItem.rarity === 'epic' && "bg-radial-gradient(circle at 50% 0%, rgba(201,168,76,0.15), transparent 70%)"
            )}>
              <div className="absolute top-4 right-6 text-gold/30 font-serif text-4xl italic opacity-20 select-none">
                {selectedItem.rarity.toUpperCase()}
              </div>
              
              <div className="relative inline-block mb-6">
                <div className="text-7xl animate-pulse">{selectedItem.icon}</div>
                <div className={cn(
                  "absolute -inset-4 rounded-full blur-2xl opacity-20",
                  selectedItem.rarity === 'common' ? "bg-gray-500" :
                  selectedItem.rarity === 'rare' ? "bg-jade" :
                  selectedItem.rarity === 'epic' ? "bg-gold" :
                  "bg-red-deep"
                )} />
              </div>
              
              <h3 className="text-3xl font-serif text-gold mb-2 uppercase tracking-[0.3em] font-bold">{selectedItem.name}</h3>
              <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] text-text-dim uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  {selectedItem.type}
                </span>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border",
                  rarityColors[selectedItem.rarity]
                )}>
                  Phẩm cấp: {selectedItem.rarity}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gold/20 rounded-full" />
                  <p className="text-text-dim text-sm leading-relaxed italic pl-4">
                    "{selectedItem.desc}"
                  </p>
                </div>
                
                {selectedItem.effect && (
                  <div className="bg-jade/5 border border-jade/20 p-5 rounded-xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-jade-light">✨</span>
                      <p className="text-[11px] text-jade-light font-bold uppercase tracking-[0.2em]">Công dụng thần bí</p>
                    </div>
                    <p className="text-sm text-jade-light/90 leading-relaxed">{selectedItem.effect}</p>
                  </div>
                )}

                {selectedItem.origin && (
                  <div className="bg-gold/5 border border-gold/10 p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-gold">📍</span>
                      <p className="text-[11px] text-gold font-bold uppercase tracking-[0.2em]">Nguồn gốc xuất xứ</p>
                    </div>
                    <p className="text-sm text-gold/80 leading-relaxed">{selectedItem.origin}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-4 border-y border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-text-dim text-xs uppercase tracking-widest">Số lượng hiện có</span>
                  </div>
                  <span className={cn(
                    "font-mono text-xl font-bold",
                    selectedItem.qty > 0 ? "text-white" : "text-text-dim"
                  )}>
                    {selectedItem.qty}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-4 rounded-lg bg-white/5 text-text-dim font-serif text-xs tracking-widest uppercase hover:bg-white/10 transition-all border border-white/10"
                >
                  Đóng lại
                </button>
                {selectedItem.type === 'Đan Dược' && selectedItem.qty > 0 && (
                  <button
                    onClick={() => {
                      handleUseItem(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    className="flex-1 py-4 rounded-lg bg-linear-to-r from-gold-dark to-gold text-bg-dark font-serif text-xs tracking-widest uppercase font-bold shadow-xl shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Sử Dụng Ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
