import { Character, Skill, Item, ShopItem, Quest, Realm, Recipe, Achievement, RandomEvent, AdventureLocation, Enemy } from '../types';

export const REALMS: Realm[] = [
  'Phàm Nhân',
  'Luyện Khí (Tầng 1)', 'Luyện Khí (Tầng 2)', 'Luyện Khí (Tầng 3)', 'Luyện Khí (Tầng 4)', 'Luyện Khí (Tầng 5)', 'Luyện Khí (Tầng 6)', 'Luyện Khí (Tầng 7)', 'Luyện Khí (Tầng 8)', 'Luyện Khí (Tầng 9)',
  'Trúc Cơ (Sơ Kỳ)', 'Trúc Cơ (Trung Kỳ)', 'Trúc Cơ (Hậu Kỳ)', 'Trúc Cơ (Viên Mãn)',
  'Kết Đan (Sơ Kỳ)', 'Kết Đan (Trung Kỳ)', 'Kết Đan (Hậu Kỳ)', 'Kết Đan (Viên Mãn)',
  'Nguyên Anh (Sơ Kỳ)', 'Nguyên Anh (Trung Kỳ)', 'Nguyên Anh (Hậu Kỳ)', 'Nguyên Anh (Viên Mãn)',
  'Hóa Thần (Sơ Kỳ)', 'Hóa Thần (Trung Kỳ)', 'Hóa Thần (Hậu Kỳ)', 'Hóa Thần (Viên Mãn)',
  'Luyện Hư Kỳ', 'Hợp Thể Kỳ', 'Đại Thừa Kỳ', 'Độ Kiếp Kỳ', 'Chân Tiên'
];

export const HAREM_REALMS = [
  { name: 'Sơ Kiến', minAffection: 0, buff: 'Cảm tình ban đầu, bắt đầu hiểu về nhau.' },
  { name: 'Tâm Đầu Ý Hợp', minAffection: 100, buff: 'Tăng 5% tốc độ tu luyện khi song tu.' },
  { name: 'Thề Non Hẹn Biển', minAffection: 300, buff: 'Tăng 10% tỷ lệ đột phá thành công.' },
  { name: 'Sắc Son Một Lòng', minAffection: 600, buff: 'Tăng 15% hiệu quả dược phẩm khi nàng ban tặng.' },
  { name: 'Phu Thê Giao Hòa', minAffection: 1000, buff: 'Cảnh giới cao nhất, tâm ý tương thông, tăng 20% mọi chỉ số khi ở cạnh.' },
];

export const INITIAL_CHARACTERS: Character[] = [];
export const INITIAL_SKILLS: Skill[] = [];
export const INITIAL_ITEMS: Item[] = [];
export const INITIAL_QUESTS: Quest[] = [];
export const INITIAL_ACHIEVEMENTS: Achievement[] = [];
export const RANDOM_EVENTS: RandomEvent[] = [];
export const ADVENTURE_LOCATIONS: AdventureLocation[] = [];
export const SHOP_DATA: ShopItem[] = [];
export const CRAFTING_RECIPES: Recipe[] = [];
export const MINI_GAMES: any[] = [];
