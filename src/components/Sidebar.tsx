import React from 'react';
import { BookOpen, Heart, Sword, Package, BarChart2, ScrollText, RefreshCw, Beaker, Map, Globe } from 'lucide-react';
import { GameState } from '../types';
import { REALMS } from '../constants';
import { cn } from '../lib/utils';

interface SidebarProps {
  gameState: GameState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
}

export function Sidebar({ gameState, activeTab, setActiveTab, onReset }: SidebarProps) {
  const navItems = [
    { id: 'story', label: 'Mạch Truyện', icon: BookOpen },
    { id: 'quests', label: 'Cơ Duyên', icon: ScrollText, badge: gameState.quests.some(q => q.status === 'ready') },
    { id: 'harem', label: 'Bằng Hữu', icon: Heart },
    { id: 'worldmap', label: 'Bản Đồ', icon: Globe },
    { id: 'adventure', label: 'Thám Hiểm', icon: Map },
    { id: 'skills', label: 'Công Pháp', icon: Sword },
    { id: 'inventory', label: 'Túi Trữ Vật', icon: Package },
    { id: 'status', label: 'Trạng Thái', icon: BarChart2 },
  ];

  const haremCount = gameState.characters.filter(w => w.inHarem).length;
  const friendCount = gameState.characters.filter(w => w.isMet).length;

  return (
    <aside className="hidden md:flex w-56 flex-col bg-linear-to-b from-bg-mid to-bg-dark/95 border-r border-gold/25 relative z-10">
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-linear-to-b from-transparent via-gold to-transparent opacity-50" />
      
      <div className="text-center py-6 px-4 border-b border-gold/25 mb-2">
        <h1 className="font-serif text-2xl text-gold tracking-widest leading-tight">
          天道<br />風雲
        </h1>
        <div className="text-[10px] text-text-dim tracking-[0.2em] mt-1">
          THIÊN ĐẠO PHONG VÂN
        </div>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-200 border-l-4 text-sm tracking-wider relative",
              activeTab === item.id 
                ? "text-gold border-gold bg-gold/10" 
                : "text-text-dim border-transparent hover:text-gold-light hover:bg-gold/5"
            )}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.badge && haremCount > 0 && (
              <span className="ml-auto bg-red-deep text-white text-[10px] px-1.5 py-0.5 rounded-full animate-badge-pulse">
                !
              </span>
            )}
          </button>
        ))}
        
        <div className="h-[1px] bg-gold/25 mx-4 my-2" />
      </nav>

      <div className="mt-auto p-4 border-t border-gold/25 bg-black/20">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-text-dim">Cảnh giới</span>
          <span className="text-gold font-medium">{REALMS[gameState.realmIndex]}</span>
        </div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-text-dim">Mị lực</span>
          <span className="text-gold font-medium">{gameState.charm}</span>
        </div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-text-dim">Tài lộc</span>
          <span className="text-gold font-medium">{gameState.linhThach}</span>
        </div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-text-dim">Danh vọng</span>
          <span className="text-gold font-medium">{gameState.fame}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-text-dim">Bằng hữu</span>
          <span className="text-gold font-medium">{friendCount} người</span>
        </div>
      </div>
    </aside>
  );
}
