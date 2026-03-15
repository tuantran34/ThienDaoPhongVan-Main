import { Choice } from './types';

export interface StoryChapter {
  id: string;
  title: string;
  content: string;
  choices: Choice[];
}

export interface StoryStage {
  id: string;
  name: string;
  chapters: StoryChapter[];
}

export const STORY_DATA: StoryStage[] = Array.from({ length: 5 }, (_, stageIndex) => ({
  id: `stage_${stageIndex + 1}`,
  name: `Giai đoạn ${stageIndex + 1}`,
  chapters: Array.from({ length: 10 }, (_, chapterIndex) => ({
    id: `stage_${stageIndex + 1}_chapter_${chapterIndex + 1}`,
    title: `Hồi ${chapterIndex + 1}: Tên hồi truyện`,
    content: `Nội dung của hồi ${chapterIndex + 1} giai đoạn ${stageIndex + 1}...`,
    choices: [
      { style: 'warm', label: 'Lựa chọn 1', text: 'Mô tả lựa chọn 1' },
      { style: 'cold', label: 'Lựa chọn 2', text: 'Mô tả lựa chọn 2' }
    ]
  }))
}));
