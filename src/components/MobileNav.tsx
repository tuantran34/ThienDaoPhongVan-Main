import React from 'react';
import { BookOpen, Heart, Sword, Package, BarChart2, ScrollText, Beaker, Map } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const tabs = [
    { id: 'story', label: 'Truyện', icon: BookOpen },
    { id: 'quests', label: 'Cơ Duyên', icon: ScrollText },
    { id: 'harem', label: 'Bằng Hữu', icon: Heart },
    { id: 'adventure', label: 'Thám Hiểm', icon: Map },
    { id: 'skills', label: 'Công Pháp', icon: Sword },
    { id: 'inventory', label: 'Túi Trữ Vật', icon: Package },
    { id: 'status', label: 'Trạng Thái', icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-mid border-t border-gold/25 z-50 flex py-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 p-2 transition-colors duration-200",
            activeTab === tab.id ? "text-gold" : "text-text-dim"
          )}
        >
          <tab.icon size={20} />
          <span className="text-[10px] tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
