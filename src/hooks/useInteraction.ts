import { useGameStore } from '../store/gameStore';

export const useInteraction = () => {
  const { characters, inventory, updateAffection, useItem } = useGameStore();

  const giveGift = (characterId: string, itemId: string) => {
    const character = characters.find(c => c.id === characterId);
    const item = inventory.find(i => i.id === itemId);

    if (!character || !item) return;

    const isLiked = character.likes.includes(item.name);
    const isDisliked = character.dislikes?.includes(item.name);
    
    let affectionBonus = isLiked ? 20 : (isDisliked ? -10 : 5);
    
    updateAffection(characterId, affectionBonus);
    useItem(itemId);
  };

  return { giveGift };
};
