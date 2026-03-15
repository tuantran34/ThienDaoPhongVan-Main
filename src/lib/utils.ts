import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GameState } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the total combat power (Đạo Hạnh) of the player.
 * This is a centralized formula used across the application.
 */
export function calculateCombatPower(gameState: GameState): number {
  const {
    realmIndex = 0,
    atk = 0,
    def = 0,
    hpMax = 0,
    apMax = 0,
    haoguang = 0,
    fame = 0,
    daohanh = 0,
    inventory = [],
    equippedWeaponId,
    equippedArmorId,
  } = gameState;

  const equippedItems = inventory.filter(i => i.id === equippedWeaponId || i.id === equippedArmorId);
  const itemBonuses = equippedItems.reduce((acc, item) => {
    if (item.bonus) {
      acc.atk += (item.bonus.atk || 0);
      acc.def += (item.bonus.def || 0);
      acc.hp += (item.bonus.hp || 0);
    }
    return acc;
  }, { atk: 0, def: 0, hp: 0 });

  return Math.floor(
    (realmIndex * 400) + 
    ((atk + itemBonuses.atk) * 5) + 
    ((def + itemBonuses.def) * 8) + 
    ((hpMax + itemBonuses.hp) / 20) + 
    (apMax / 20) + 
    (haoguang * 3) + 
    (fame * 1) +
    (daohanh * 1)
  );
}
