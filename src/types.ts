export type Realm = string;

export type RelationshipStage = 'stranger' | 'acquaint' | 'close' | 'intimate' | 'married';

export interface ChatMessage {
  role: 'user' | 'npc';
  text: string;
}

export interface InteractionLogItem {
  type: 'chat' | 'intimate' | 'cultivation' | 'event';
  timestamp: string;
  content: string;
  role?: 'user' | 'npc';
}

export interface HaremSkill {
  id: string;
  name: string;
  desc: string;
  level: number;
  maxLevel: number;
  buffDesc: string;
}

export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female';
  title: string;
  icon: string;
  bannerBg: string;
  desc: string;
  personality: string;
  hiddenTrait?: string; // Revealed at high affection
  likes: string[];
  dislikes?: string[]; // Added dislikes
  gifts: string[];
  affection: number;
  stage: RelationshipStage;
  unlocked: boolean;
  isMet: boolean;
  inHarem: boolean;
  chatHistory: ChatMessage[];
  interactionLog: InteractionLogItem[];
  systemPrompt: string;
  
  // Harem System
  haremRealm: string;
  haremSkills: HaremSkill[];

  // Detailed Information
  background?: string; // Gia cảnh
  age?: number; // Tuổi tác
  measurements?: string; // Số đo 3 vòng
  skinColor?: string; // Màu da
  beauty?: string; // Vẻ đẹp
  height?: string; // Chiều cao
  weight?: string; // Cân nặng
  currentThoughts?: string; // Đang có suy nghĩ gì
  bodyStatus?: string; // Tình trạng cơ thể (thay đổi sau khi song tu/giao hợp)
  sexualPreference?: string; // Thích hoan ái kiểu nào
  favoritePositions?: string[]; // Tư thế nào
  unlockHint?: string; // Gợi ý cách gặp/mở khóa
  suggestedQuestions?: string[]; // Câu hỏi gợi ý cho chat
}

export interface Skill {
  id: string;
  name: string;
  type: 'cultivation' | 'combat' | 'charm' | 'knowledge' | 'crafting' | 'special';
  icon: string;
  desc: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  mastery?: number; // 0-100
  mpCost?: number;
  unlockRealmIndex?: number; // Realm index required to unlock
  upgradeCost?: {
    linhThach: number;
    exp: number;
  };
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legend';
  qty: number;
  desc: string;
  origin?: string; // Where to find
  effect?: string; // What it does
  bonus?: { atk?: number; def?: number; hp?: number; };
  isEquipped?: boolean;
}

export interface Recipe {
  id: string;
  outputItemId: string;
  outputName: string;
  outputIcon: string;
  outputDesc: string;
  outputType: string;
  outputRarity: 'common' | 'rare' | 'epic' | 'legend';
  materials: {
    itemId: string;
    name: string;
    qty: number;
    originHint?: string; // Where to find this material
  }[];
  requiredRealmIndex?: number;
  requiredSkillId?: string;
  requiredSkillLevel?: number;
  successRateBase?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  price: number;
  unlockRealm: number;
}

export type QuestType = 'main' | 'side' | 'daily';
export type QuestStatus = 'active' | 'ready' | 'claimed';

export interface QuestReward {
  linhThach?: number;
  tuVi?: number;
  exp?: number;
  items?: { itemId: string; qty: number }[];
  fame?: number;
  charm?: number;
}

export interface Quest {
  id: string;
  name: string;
  desc: string;
  type: QuestType;
  status: QuestStatus;
  icon: string;
  progress: number;
  target: number;
  rewards: QuestReward;
  requirements?: {
    realmIndex?: number;
    level?: number;
    fame?: number;
  };
  lastCompletedAt?: string; // For daily quests
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: 'cultivation' | 'combat' | 'harem' | 'wealth' | 'fame' | 'knowledge' | 'crafting' | 'special';
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface StoryHistoryItem {
  text: string;
  scene: string;
  summary?: string;
  isBookmarked?: boolean;
}

export interface HaremEvent {
  characterId: string;
  title: string;
  body: string;
  choices: {
    text: string;
    result: string;
    action: (prev: GameState) => GameState;
  }[];
}

export interface CultivationLogItem {
  text: string;
  timestamp: string;
}

export interface RandomEvent {
  id: string;
  title: string;
  desc: string;
  image?: string;
  choices: {
    text: string;
    result: string;
    effects?: {
      linhThach?: number;
      tuVi?: number;
      exp?: number;
      fame?: number;
      haoguang?: number;
      charm?: number;
      mood?: number;
      affection?: { [characterId: string]: number };
    };
    action?: (prev: GameState) => GameState;
  }[];
}

export interface MiniGame {
  id: string;
  name: string;
  type: 'chess' | 'poetry' | 'dice';
  difficulty: number;
  reward: QuestReward;
}

export interface Enemy {
  id: string;
  name: string;
  realm: string;
  hp: number;
  hpMax: number;
  atk: number;
  def: number;
  power: number;
  icon: string;
  desc: string;
  rewards: QuestReward;
  drops?: string[];
}

export interface AdventureLocation {
  id: string;
  name: string;
  minDaoHanh: number;
  enemies: Enemy[];
  bgImage: string;
  maxProgress: number;
  apCostPerStep: number;
  region?: string;
  mythology: string;
  history: string;
  size: string;
  hiddenQuests: Quest[];
  subLocations: string[];
  characters: string[];
  shops: string[];
  buildings: string[];
}
export interface GameState {
  heroName: string;
  realmIndex: number;
  tuVi: number;
  tuViMax: number;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  ap: number;
  apMax: number;
  charm: number;
  luck: number;
  agility: number;
  linhThach: number;
  haoguang: number;
  wisdom: number;
  fame: number;
  chapter: number;
  stage: number;
  location: string;
  characters: Character[];
  skills: Skill[];
  inventory: Item[];
  equippedWeaponId?: string;
  equippedArmorId?: string;
  quests: Quest[];
  storyChoiceCount: number;
  currentStoryContext: string;
  storyHistory: StoryHistoryItem[];
  currentStoryPage: number;
  currentChoices: Choice[];
  loadingChoices: boolean;
  activeHaremEvent: HaremEvent | null;
  activeRandomEvent: RandomEvent | null;
  started: boolean;
  
  // Combat Stats
  atk: number;
  def: number;
  daohanh: number;
  
  // New UX Features
  bookmarks: number[]; // indices of bookmarked pages

  // Character Details
  age: number;
  root: string; // Căn cốt
  fate: string; // Mệnh cách
  titles: string[]; // Danh hiệu
  background?: string; // Gia cảnh
  measurements?: string; // Số đo 3 vòng
  skinColor?: string; // Màu da
  beauty?: string; // Vẻ đẹp
  height?: string; // Chiều cao
  weight?: string; // Cân nặng
  currentThoughts?: string; // Đang có suy nghĩ gì
  bodyStatus?: string; // Tình trạng cơ thể
  sexualPreference?: string; // Thích hoan ái kiểu nào
  favoritePositions?: string[]; // Tư thế nào
  
  cultivationHistory: CultivationLogItem[]; // Lịch sử tu luyện
  achievements: Achievement[];
  mood: number; // 0-100, affects cultivation
  exp: number;
  tutorialCompleted: boolean;
}

export interface Choice {
  style: 'cold' | 'warm' | 'bold';
  label: string;
  text: string;
  impact?: string;
  effects?: {
    linhThach?: number;
    tuVi?: number;
    exp?: number;
    fame?: number;
    haoguang?: number;
    charm?: number;
    mood?: number;
    affection?: { [characterId: string]: number };
  };
}
