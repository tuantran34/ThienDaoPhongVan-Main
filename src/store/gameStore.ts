import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, StoryResponse } from '../types';
import { INITIAL_CHARACTERS, INITIAL_SKILLS, INITIAL_ITEMS, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS } from '../constants';

interface GameStore extends GameState {
  addGold: (amount: number) => void;
  gainExp: (amount: number) => void;
  absorbQi: (amount: number) => void;
  levelUp: () => void;
  updateAffection: (characterId: string, amount: number) => void;
  useItem: (itemId: string) => void;
  updateStoryState: (response: StoryResponse) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // Initial state
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

      // Actions
      addGold: (amount) => set((state) => ({ linhThach: state.linhThach + amount })),
      gainExp: (amount) => set((state) => ({ exp: state.exp + amount })),
      absorbQi: (amount) => set((state) => ({ tuVi: state.tuVi + amount })),
      levelUp: () => set((state) => ({ realmIndex: state.realmIndex + 1, tuVi: 0, tuViMax: state.tuViMax * 1.5 })),
      updateAffection: (characterId, amount) => set((state) => ({
        characters: state.characters.map(char => 
          char.id === characterId 
            ? { ...char, affection: Math.min(100, Math.max(0, char.affection + amount)) } 
            : char
        )
      })),
      useItem: (itemId) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item || item.qty <= 0) return state;
        
        return {
          inventory: state.inventory.map(i => 
            i.id === itemId ? { ...i, qty: i.qty - 1 } : i
          )
        };
      }),
      updateStoryState: (response) => set((state) => {
        const { effects } = response;
        return {
          currentStoryContext: response.content,
          currentChoices: response.choices,
          linhThach: effects?.linhThach ? state.linhThach + effects.linhThach : state.linhThach,
          tuVi: effects?.tuVi ? state.tuVi + effects.tuVi : state.tuVi,
          exp: effects?.exp ? state.exp + effects.exp : state.exp,
          fame: effects?.fame ? state.fame + effects.fame : state.fame,
          charm: effects?.charm ? state.charm + effects.charm : state.charm,
          mood: effects?.mood ? Math.min(100, Math.max(0, state.mood + effects.mood)) : state.mood,
          characters: effects?.affection ? state.characters.map(char =>
            effects.affection![char.id]
              ? { ...char, affection: Math.min(100, Math.max(0, char.affection + effects.affection![char.id])) }
              : char
          ) : state.characters
        };
      }),
    }),
    {
      name: 'thien_dao_phong_van_save', // name of the item in the storage (must be unique)
    }
  )
);
