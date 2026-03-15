import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GameState, Choice } from '../types';
import { generateStoryStream, generateChoices, generateSummary, detectCharacters } from '../services/gemini';
import { REALMS } from '../constants';
import { STORY_DATA } from '../storyData';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Book, Settings, Bookmark, BookmarkCheck, History, Save, FolderOpen } from 'lucide-react';

interface StoryTabProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
  onStart: (name: string) => void;
  addNotification: (title: string, body: string, reward?: string) => void;
  onQuickSave: () => void;
  onQuickLoad: () => void;
  onSavePartial: (key: string, data: any, label: string) => void;
  onLoadPartial: (key: string, label: string) => any;
  updateQuestProgress: (questId: string, amount: number) => void;
  triggerRandomEvent: () => void;
}

export function StoryTab({ gameState, updateGameState, onStart, addNotification, onQuickSave, onQuickLoad, onSavePartial, onLoadPartial, updateQuestProgress, triggerRandomEvent }: StoryTabProps) {
  const [nameInput, setNameInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showEventBadge, setShowEventBadge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTravelLog, setShowTravelLog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [autoScroll, setAutoScroll] = useState(false);

  // Remove the auto-scroll effect during streaming
  // useEffect(() => {
  //   if (isStreaming && bottomRef.current && autoScroll) {
  //     bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
  //   }
  // }, [streamingText, isStreaming, autoScroll]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [gameState.currentStoryPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onQuickSave();
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        onQuickLoad();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onQuickSave, onQuickLoad]);

  const startNewStory = async (nameOverride?: string) => {
    const heroName = nameOverride || gameState.heroName;
    setIsStreaming(true);
    setStreamingText('');
    
    // Use static story data for offline play
    const stage = STORY_DATA.find(s => s.id === `stage_${gameState.stage}`);
    const chapter = stage?.chapters.find(c => c.id === `stage_${gameState.stage}_chapter_${gameState.chapter}`);
    
    if (chapter) {
      setStreamingText(chapter.content);
      setIsStreaming(false);
      updateGameState(prev => ({
        ...prev,
        currentStoryContext: chapter.content,
        currentChoices: chapter.choices,
        storyHistory: [...prev.storyHistory, { text: chapter.content, scene: chapter.title, summary: chapter.title }]
      }));
      return;
    }
    
    // Fallback to AI generation if static data is missing
    const charInfo = `Nhân vật: "${heroName}"
    Cảnh giới: ${REALMS[gameState.realmIndex]}
    Tuổi: ${gameState.age}
    Căn cốt: ${gameState.root}
    Mệnh cách: ${gameState.fate}
    Danh hiệu: ${gameState.titles.join(', ')}
    Chỉ số: Mị lực ${gameState.charm}, Linh Thạch ${gameState.linhThach}, Hào quang ${gameState.haoguang}, Danh vọng ${gameState.fame}.`;

    const haremInfo = gameState.characters
      .filter(c => c.unlocked)
      .map(c => `${c.name} (${c.title}, Thiện cảm: ${c.affection}/100, Giai đoạn: ${c.stage})`)
      .join(', ');

    const prompt = `Hãy bắt đầu một chương truyện kiếm hiệp tu tiên hệ thống trường thiên cho nhân vật sau:
    ${charInfo}
    
    Bối cảnh: Nhân vật chính là nam, mang theo ký ức về một thế giới xa lạ, bỗng nhiên trùng sinh vào thân xác một thiếu niên tại Thanh Vân Trấn. 
    ${haremInfo ? `Các giai nhân đã quen biết: ${haremInfo}. Hãy lồng ghép họ vào cốt truyện một cách tự nhiên nếu phù hợp.` : ""}

    Yêu cầu cốt truyện:
    1. Mạch truyện chậm rãi, tập trung vào sự ngỡ ngàng khi trùng sinh và những suy nghĩ, quan sát chi tiết về thế giới mới (phong cách "Phàm nhân tu tiên").
    2. Nhân vật chính bắt đầu dùng kiến thức uyên bác (Toán, Lý, Hóa, Thiên văn, Địa lý, Văn thơ...) để cải thiện cuộc sống và giải quyết các vấn đề nan giải của giới tu tiên một cách tinh tế, không dùng thuật ngữ hiện đại lộ liễu.
    3. Miêu tả chi tiết cảm giác sinh hoạt, những bữa cơm gia đình, những mối quan hệ láng giềng và sự khắc nghiệt của giới tu tiên.
    4. Văn phong cổ điển, giàu hình ảnh, lồng ghép tư duy logic và nghệ thuật một cách tinh tế. Hãy làm cho người đọc cảm thấy nhân vật thực sự đang "sống" bằng trí tuệ của mình.`;

    let fullText = '';
    try {
      const stream = generateStoryStream(prompt);
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingText(fullText);
      }
      
      const finalStory = fullText;
      
      // Update state immediately after streaming finishes
      updateGameState(prev => {
        const nextChapter = prev.storyHistory.length % 5 === 0 ? prev.chapter + 1 : prev.chapter;
        const nextLocation = prev.storyHistory.length % 5 === 0 ? getRandomLocation() : prev.location;
        
        if (nextChapter > prev.chapter) {
          addNotification('📖 Chương Mới Mở Ra', `Chương ${nextChapter}`, 'Hành trình tiếp tục...');
        }

        const coNguSkill = prev.skills.find(s => s.id === 'sk12');
        const tuViBonus = coNguSkill ? coNguSkill.level * 15 : 0;

        return {
          ...prev,
          tuVi: prev.tuVi + 50 + tuViBonus,
          linhThach: prev.linhThach + 20,
          storyChoiceCount: prev.storyChoiceCount + 1,
          currentStoryContext: finalStory,
          chapter: nextChapter,
          location: nextLocation,
          storyHistory: [...prev.storyHistory, { text: finalStory, scene: 'Gặp Gỡ Định Mệnh', summary: 'Đang tóm tắt...' }],
          currentStoryPage: prev.storyHistory.length
        };
      });
      
      setStreamingText('');
      setIsStreaming(false);

      // Detect characters in parallel
      const unmetCharacters = gameState.characters.filter(c => !c.isMet);
      detectCharacters(finalStory, unmetCharacters).then(metIds => {
        if (metIds.length > 0) {
          updateGameState(prev => ({
            ...prev,
            characters: prev.characters.map(c => 
              metIds.includes(c.id) ? { ...c, isMet: true } : c
            )
          }));
          
          metIds.forEach(id => {
            const char = gameState.characters.find(c => c.id === id);
            if (char) {
              addNotification('🤝 Nhân Vật Mới', `Bạn đã gặp gỡ ${char.name}`, 'Xem trong Harem');
            }
          });
        }
      });

      // Fetch summary and choices in parallel
      Promise.all([
        generateSummary(finalStory).then(summary => {
          updateGameState(prev => ({
            ...prev,
            storyHistory: prev.storyHistory.map((item, idx) => 
              idx === prev.storyHistory.length - 1 ? { ...item, summary } : item
            )
          }));
        }),
        fetchChoices(finalStory)
      ]);
    } catch (e) {
      console.error(e);
      setIsStreaming(false);
    }
  };

  // Recovery effect: if game started but no history, start the story
  useEffect(() => {
    if (gameState.started && gameState.storyHistory.length === 0 && !isStreaming && !streamingText) {
      startNewStory(gameState.heroName);
    }
  }, [gameState.started, gameState.storyHistory.length, isStreaming, streamingText, gameState.heroName]);

  const fetchChoices = async (context: string) => {
    updateGameState(prev => ({ ...prev, loadingChoices: true }));
    const newChoices = await generateChoices(context);
    updateGameState(prev => ({ ...prev, currentChoices: newChoices, loadingChoices: false }));
  };

  const handleChoice = async (choice?: Choice) => {
    updateGameState(prev => ({ ...prev, currentChoices: [] }));
    setIsStreaming(true);
    setStreamingText('');
    
    const contextSummary = gameState.currentStoryContext.slice(-1000);
    let prompt = '';
    
    const isRandomEvent = Math.random() < 0.25; // 25% chance for a random event
    const randomEvents = [
      "Nhân vật chính vô tình nhặt được một vật phẩm quý hiếm hoặc một cuốn bí kíp thất truyền trên đường đi.",
      "Gặp gỡ một cao nhân ẩn thế đang giả làm người thường, người này có thể chỉ điểm hoặc ban cho một cơ duyên.",
      "Bị tấn công bất ngờ bởi một con yêu thú mạnh mẽ hoặc một nhóm sát thủ bí ẩn.",
      "Phát hiện ra một di tích cổ xưa hoặc một hang động chứa đầy linh khí.",
      "Vô tình bị cuốn vào một cuộc tranh chấp giữa các môn phái lớn.",
      "Hệ thống đột ngột đưa ra một nhiệm vụ khẩn cấp với phần thưởng cực lớn nhưng rủi ro cao."
    ];
    const selectedEvent = isRandomEvent ? randomEvents[Math.floor(Math.random() * randomEvents.length)] : null;

    if (isRandomEvent) {
      setShowEventBadge(true);
      setTimeout(() => setShowEventBadge(false), 5000);
    }

    const knowledgeInfo = gameState.skills
      .filter(s => s.type === 'knowledge' && s.unlocked)
      .map(s => `${s.name} (Cấp ${s.level})`)
      .join(', ');

    const playerInfo = `Nhân vật: "${gameState.heroName}"
    Cảnh giới: ${REALMS[gameState.realmIndex]}
    Tuổi: ${gameState.age}
    Căn cốt: ${gameState.root}
    Mệnh cách: ${gameState.fate}
    Danh hiệu: ${gameState.titles.join(', ')}
    Chỉ số: Mị lực ${gameState.charm}, Linh Thạch ${gameState.linhThach}, Hào quang ${gameState.haoguang}, Danh vọng ${gameState.fame}.
    Kiến thức: ${knowledgeInfo || 'Chưa có kiến thức đặc biệt'}.
    Người chơi là một thiếu niên mang theo ký ức về một thế giới xa lạ, sở hữu kho tàng kiến thức uyên bác.
    
    Lưu ý: Các chỉ số và kiến thức trên ảnh hưởng trực tiếp đến khả năng thành công và phản ứng của thế giới. 
    - Mị lực cao giúp các giai nhân dễ có thiện cảm.
    - Linh Thạch nhiều cho phép thực hiện các lựa chọn tốn kém.
    - Hào quang cao tăng tỷ lệ gặp kỳ ngộ.
    - Danh vọng cao khiến NPC kính nể hoặc e dè.
    - Kiến thức (Toán học, Vật lý, Hóa học, Thiên văn, Địa lý, Văn thơ, Ngoại giao, Đàm phán, Phong thủy, Chế tác, Hội họa, Âm luật...) mở ra các lựa chọn chuyên sâu và tăng hiệu quả hành động liên quan.`;

    const haremInfo = gameState.characters
      .filter(c => c.unlocked)
      .map(c => `${c.name} (${c.title}, Thiện cảm: ${c.affection}/100, Giai đoạn: ${c.stage})`)
      .join(', ');

    if (choice) {
      prompt = `Kiếm hiệp tu tiên hệ thống. ${playerInfo}
      Tình huống trước đó: ${contextSummary}
      Lựa chọn của người chơi: "${choice.text}" (Phong cách: ${choice.label}).
      ${haremInfo ? `Các giai nhân đã quen biết: ${haremInfo}. Hãy lồng ghép họ vào cốt truyện một cách tự nhiên nếu phù hợp.` : ""}
      ${isRandomEvent ? `SỰ KIỆN NGẪU NHIÊN: ${selectedEvent}. Hãy lồng ghép sự kiện này vào diễn biến tiếp theo.` : ""}
      Hãy viết tiếp diễn biến câu chuyện một cách chi tiết, chậm rãi, tập trung vào nội tâm và sinh hoạt hằng ngày. 
      Lồng ghép các yếu tố sử dụng kiến thức uyên bác, nghệ thuật hoặc ngoại giao nếu phù hợp một cách tinh tế.
      Nếu người chơi có kiến thức phù hợp, hãy cho họ những khoảnh khắc "Ngộ đạo" hoặc thành công rực rỡ.
      Sử dụng văn phong "Phàm nhân tu tiên" kết hợp với tư duy logic sắc bén.`;
    } else {
      prompt = `Kiếm hiệp tu tiên hệ thống. ${playerInfo}
      Tình huống trước đó: ${contextSummary}
      ${haremInfo ? `Các giai nhân đã quen biết: ${haremInfo}. Hãy lồng ghép họ vào cốt truyện một cách tự nhiên nếu phù hợp.` : ""}
      ${isRandomEvent ? `SỰ KIỆN NGẪU NHIÊN: ${selectedEvent}. Hãy lồng ghép sự kiện này vào diễn biến tiếp theo.` : ""}
      Hãy viết tiếp diễn biến câu chuyện, dẫn dắt người chơi đi sâu hơn vào cốt truyện. 
      Tốc độ mạch truyện chậm, chi tiết, miêu tả rõ suy nghĩ và cảm giác sinh hoạt của nhân vật.
      Sử dụng văn phong "Phàm nhân tu tiên" kết hợp với tư duy logic sắc bén.`;
    }

    let fullText = '';
    try {
      const stream = generateStoryStream(prompt);
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingText(fullText);
      }
      
      // Update state immediately after streaming finishes
      const finalStory = fullText;
      
      updateGameState(prev => {
        const nextChapter = prev.storyHistory.length % 5 === 0 ? prev.chapter + 1 : prev.chapter;
        const nextLocation = prev.storyHistory.length % 5 === 0 ? getRandomLocation() : prev.location;
        
        if (nextChapter > prev.chapter) {
          addNotification('📖 Chương Mới Mở Ra', `Chương ${nextChapter}`, 'Hành trình tiếp tục...');
        }

        const coNguSkill = prev.skills.find(s => s.id === 'sk12');
        const tuViBonus = coNguSkill ? coNguSkill.level * 15 : 0;

        // Apply choice effects if they exist
        const linhThachEffect = choice?.effects?.linhThach || 20;
        const tuViEffect = choice?.effects?.tuVi || 50;
        const fameEffect = choice?.effects?.fame || 0;
        const haoguangEffect = choice?.effects?.haoguang || 0;
        const charmEffect = choice?.effects?.charm || 0;
        const moodEffect = choice?.effects?.mood || 0;
        const affectionEffects = choice?.effects?.affection || {};

        if (fameEffect !== 0) addNotification(fameEffect > 0 ? '📈 Danh Vọng Tăng' : '📉 Danh Vọng Giảm', `Danh vọng thay đổi ${fameEffect}`, fameEffect > 0 ? 'Tiếng lành đồn xa' : 'Tai tiếng lan truyền');
        if (haoguangEffect !== 0) addNotification(haoguangEffect > 0 ? '✨ Hào Quang Tăng' : '🌑 Hào Quang Giảm', `Hào quang thay đổi ${haoguangEffect}`, haoguangEffect > 0 ? 'Kỳ ngộ đang tới' : 'Vận khí suy giảm');
        if (moodEffect !== 0) addNotification(moodEffect > 0 ? '😊 Tâm Trạng Tốt' : '😔 Tâm Trạng Xấu', `Tâm trạng thay đổi ${moodEffect}`, moodEffect > 0 ? 'Tinh thần sảng khoái' : 'Cảm thấy mệt mỏi');

        Object.entries(affectionEffects).forEach(([charId, amount]) => {
          const char = prev.characters.find(c => c.id === charId);
          if (char && amount !== 0) {
            addNotification(amount > 0 ? '❤️ Thiện Cảm Tăng' : '💔 Thiện Cảm Giảm', `${char.name}: ${amount > 0 ? '+' : ''}${amount}`, amount > 0 ? 'Mối quan hệ tiến triển' : 'Quan hệ rạn nứt');
          }
        });

        return {
          ...prev,
          tuVi: prev.tuVi + tuViEffect + tuViBonus,
          linhThach: prev.linhThach + linhThachEffect,
          fame: prev.fame + fameEffect,
          haoguang: prev.haoguang + haoguangEffect,
          charm: prev.charm + charmEffect,
          mood: Math.max(0, Math.min(100, prev.mood + moodEffect)),
          characters: prev.characters.map(c => {
            const effect = affectionEffects[c.id];
            if (effect) {
              return { ...c, affection: Math.max(0, Math.min(100, c.affection + effect)) };
            }
            return c;
          }),
          storyChoiceCount: prev.storyChoiceCount + 1,
          currentStoryContext: finalStory,
          chapter: nextChapter,
          location: nextLocation,
          storyHistory: [...prev.storyHistory, { text: finalStory, scene: choice ? `Lựa chọn: ${choice.label}` : 'Tiếp Diễn', summary: 'Đang tóm tắt...' }],
          currentStoryPage: prev.storyHistory.length
        };
      });
      
      setStreamingText('');
      setIsStreaming(false);
      updateQuestProgress('q_side_2', 1);
      triggerRandomEvent();

      // Detect characters
      const unmetCharacters = gameState.characters.filter(c => !c.isMet);
      detectCharacters(finalStory, unmetCharacters).then(metIds => {
        if (metIds.length > 0) {
          updateGameState(prev => ({
            ...prev,
            characters: prev.characters.map(c => 
              metIds.includes(c.id) ? { ...c, isMet: true } : c
            )
          }));
          
          metIds.forEach(id => {
            const char = gameState.characters.find(c => c.id === id);
            if (char) {
              addNotification('🤝 Nhân Vật Mới', `Bạn đã gặp gỡ ${char.name}`, 'Xem trong Harem');
            }
          });
        }
      });

      // Fetch summary and choices in parallel with a slight delay to ensure state is updated
      setTimeout(() => {
        Promise.all([
          generateSummary(finalStory).then(summary => {
            updateGameState(prev => ({
              ...prev,
              storyHistory: prev.storyHistory.map((item, idx) => 
                idx === prev.storyHistory.length - 1 ? { ...item, summary } : item
              )
            }));
          }),
          fetchChoices(finalStory)
        ]);
      }, 100);
    } catch (e) {
      console.error(e);
      setIsStreaming(false);
    }
  };

  const [customInput, setCustomInput] = useState('');

  const handleCustomInteraction = async () => {
    if (!customInput.trim()) return;
    const message = customInput.trim();
    setCustomInput('');
    
    updateGameState(prev => ({ ...prev, currentChoices: [] }));
    setIsStreaming(true);
    setStreamingText('');
    
    const contextSummary = gameState.currentStoryContext.slice(-1000);
    
    const knowledgeInfo = gameState.skills
      .filter(s => s.type === 'knowledge' && s.unlocked)
      .map(s => `${s.name} (Cấp ${s.level})`)
      .join(', ');
    
    const playerInfo = `Nhân vật: "${gameState.heroName}" (${REALMS[gameState.realmIndex]}). 
    Linh Thạch: ${gameState.linhThach}, Hào Quang: ${gameState.haoguang}, Danh Vọng: ${gameState.fame}.
    Kiến thức: ${knowledgeInfo || 'Chưa có kiến thức đặc biệt'}.
    Người chơi là một thiếu niên mang theo ký ức về một thế giới xa lạ, sở hữu kho tàng kiến thức uyên bác.`;

    const haremInfo = gameState.characters
      .filter(c => c.unlocked)
      .map(c => `${c.name} (${c.title}, Thiện cảm: ${c.affection}/100, Giai đoạn: ${c.stage})`)
      .join(', ');

    const prompt = `Kiếm hiệp tu tiên hệ thống. ${playerInfo}
    Tình huống trước đó: ${contextSummary}
    ${haremInfo ? `Các giai nhân đã quen biết: ${haremInfo}.` : ""}
    HÀNH ĐỘNG/LỜI NÓI CỦA NGƯỜI CHƠI: "${message}".
    
    Hãy viết tiếp diễn biến câu chuyện dựa trên hành động hoặc lời nói này của người chơi. 
    Nếu người chơi đang nói chuyện với một nhân vật, hãy để nhân vật đó đáp lại một cách phù hợp với tính cách và mức độ thân thiết.
    Nếu người chơi sử dụng kiến thức (Toán, Lý, Hóa, Thiên văn, Địa lý, Văn thơ, Ngoại giao, Đàm phán, Phong thủy, Chế tác, Hội họa, Âm luật...) trong hành động, hãy miêu tả kết quả một cách chuyên nghiệp và ấn tượng, tránh dùng thuật ngữ hiện đại lộ liễu.
    Miêu tả chi tiết phản ứng của môi trường và các nhân vật xung quanh.
    Văn phong: "Phàm nhân tu tiên" kết hợp với tư duy logic sắc bén.`;

    let fullText = '';
    try {
      const stream = generateStoryStream(prompt);
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingText(fullText);
      }
      
      const finalStory = fullText;
      
      // Update state immediately after streaming finishes
      updateGameState(prev => {
        const nextChapter = prev.storyHistory.length % 5 === 0 ? prev.chapter + 1 : prev.chapter;
        const nextLocation = prev.storyHistory.length % 5 === 0 ? getRandomLocation() : prev.location;
        
        const coNguSkill = prev.skills.find(s => s.id === 'sk12');
        const tuViBonus = coNguSkill ? coNguSkill.level * 20 : 0;

        return {
          ...prev,
          tuVi: prev.tuVi + 60 + tuViBonus, // Slightly more tuVi for custom interaction
          linhThach: prev.linhThach + 25,
          storyChoiceCount: prev.storyChoiceCount + 1,
          currentStoryContext: finalStory,
          chapter: nextChapter,
          location: nextLocation,
          storyHistory: [...prev.storyHistory, { text: finalStory, scene: 'Tương Tác Tự Do', summary: 'Đang tóm tắt...' }],
          currentStoryPage: prev.storyHistory.length
        };
      });
      
      setStreamingText('');
      setIsStreaming(false);
      updateQuestProgress('q_side_2', 1);
      triggerRandomEvent();

      // Detect characters
      const unmetCharacters = gameState.characters.filter(c => !c.isMet);
      detectCharacters(finalStory, unmetCharacters).then(metIds => {
        if (metIds.length > 0) {
          updateGameState(prev => ({
            ...prev,
            characters: prev.characters.map(c => 
              metIds.includes(c.id) ? { ...c, isMet: true } : c
            )
          }));
          
          metIds.forEach(id => {
            const char = gameState.characters.find(c => c.id === id);
            if (char) {
              addNotification('🤝 Nhân Vật Mới', `Bạn đã gặp gỡ ${char.name}`, 'Xem trong Harem');
            }
          });
        }
      });

      // Fetch summary and choices in parallel with a slight delay to ensure state is updated
      setTimeout(() => {
        Promise.all([
          generateSummary(finalStory).then(summary => {
            updateGameState(prev => ({
              ...prev,
              storyHistory: prev.storyHistory.map((item, idx) => 
                idx === prev.storyHistory.length - 1 ? { ...item, summary } : item
              )
            }));
          }),
          fetchChoices(finalStory)
        ]);
      }, 100);
    } catch (e) {
      console.error(e);
      setIsStreaming(false);
    }
  };

  const getRandomLocation = () => {
    const locs = ['Thiên Kiếm Sơn', 'Huyết Hoa Cốc', 'Vân Mộng Hải', 'Linh Tuyền Thành', 'Băng Phong Lĩnh', 'Đào Hoa Đảo'];
    return locs[Math.floor(Math.random() * locs.length)];
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < gameState.storyHistory.length) {
      updateGameState(prev => ({ ...prev, currentStoryPage: page }));
    }
  };

  const toggleBookmark = (pageIndex: number) => {
    updateGameState(prev => {
      const isBookmarked = prev.bookmarks.includes(pageIndex);
      const newBookmarks = isBookmarked 
        ? prev.bookmarks.filter(i => i !== pageIndex)
        : [...prev.bookmarks, pageIndex];
      
      const newHistory = prev.storyHistory.map((item, idx) => 
        idx === pageIndex ? { ...item, isBookmarked: !isBookmarked } : item
      );

      return { ...prev, bookmarks: newBookmarks, storyHistory: newHistory };
    });
    
    const isNowBookmarked = !gameState.bookmarks.includes(pageIndex);
    addNotification(
      isNowBookmarked ? '🔖 Đã Đánh Dấu' : '🗑️ Đã Bỏ Đánh Dấu',
      `Trang truyện số ${pageIndex + 1} đã được cập nhật.`,
      isNowBookmarked ? 'Lưu vào danh sách yêu thích' : 'Xóa khỏi danh sách'
    );
  };

  if (!gameState.started) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 text-center bg-bg-card/50 backdrop-blur-sm border border-gold/20 rounded-lg">
        <h1 className="font-serif text-5xl text-gold tracking-widest mb-2 drop-shadow-[0_0_20px_rgba(201,168,76,0.4)]">
          天道風雲
        </h1>
        <div className="text-text-dim tracking-[0.2em] mb-8 text-sm">THIÊN ĐẠO PHONG VÂN</div>
        <p className="text-text-main leading-relaxed mb-8 text-sm italic">
          "Thiên địa bất nhân, vạn vật như sô cẩu. Ngươi — một thiếu niên mang theo ký ức về một thế giới xa lạ, bỗng nhiên trùng sinh vào thế giới tu tiên tàn khốc. Với kho tàng kiến thức uyên bác và một Hệ Thống thần bí trong tay, liệu ngươi có thể nghịch thiên cải mệnh, chinh phục tam giới?"
        </p>
        <div className="mb-8">
          <input 
            type="text" 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nhập tên của ngươi..."
            className="bg-bg-card border border-gold/30 text-gold-light font-serif text-xl px-6 py-3 text-center rounded-sm w-full max-w-xs focus:outline-none focus:border-gold shadow-inner"
            maxLength={20}
          />
        </div>
        <button 
          onClick={() => {
            const name = nameInput.trim() || 'Vô Danh';
            onStart(name);
            startNewStory(name);
          }}
          className="bg-linear-to-r from-red-deep via-[#5a0f0f] to-red-deep border border-gold-dark text-gold-light font-serif text-lg tracking-[0.2em] px-12 py-4 cursor-pointer rounded-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(139,26,26,0.6)] relative overflow-hidden group"
        >
          <span className="relative z-10">✦ KHAI THỦ TRUYỀN KỲ ✦</span>
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-linear-to-b from-bg-dark to-bg-mid">
      <header className="px-8 py-4 border-b border-gold/25 bg-bg-dark/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center bg-gold/5 text-gold font-serif text-lg shadow-[0_0_15px_rgba(201,168,76,0.2)]">
            {gameState.chapter}
          </div>
          <div>
            <div className="text-[10px] text-gold/60 tracking-[0.3em] uppercase font-bold">Chương {gameState.chapter}</div>
            <h2 className="font-serif text-gold-light text-lg leading-tight">
              {getChapterName(gameState.chapter)}
            </h2>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center flex-1 max-w-md">
          <div className="text-[9px] text-text-dim tracking-[0.5em] uppercase mb-1">
            {isStreaming ? "Đang viết tiếp..." : "Diễn Biến Hiện Tại"}
          </div>
          <div className="text-sm text-text-main font-medium italic line-clamp-1 text-center px-4 border-x border-gold/10">
            {isStreaming ? (
              <span className="animate-pulse">Thiên đạo đang vận chuyển...</span>
            ) : (
              gameState.storyHistory[gameState.currentStoryPage]?.summary || "Đang khởi tạo hành trình..."
            )}
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2, 3, 4].map((i) => {
              const pageInChapter = gameState.currentStoryPage % 5;
              const isActive = i === pageInChapter;
              const isPast = i < pageInChapter;
              return (
                <div 
                  key={i}
                  className={`h-1 w-8 rounded-full transition-all duration-500 ${
                    isActive ? "bg-gold shadow-[0_0_8px_rgba(201,168,76,0.8)] w-12" : 
                    isPast ? "bg-gold/40" : "bg-gold/10"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] text-text-dim tracking-[0.2em] uppercase mb-0.5">Vị Trí Hiện Tại</div>
            <div className="text-xs text-gold flex items-center justify-end gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {gameState.location}
            </div>
          </div>
          
          <div className="flex items-center gap-2 border-l border-gold/20 pl-6">
            <button 
              onClick={() => setShowTravelLog(true)}
              className="p-2.5 bg-white/5 hover:bg-gold/10 text-gold/60 hover:text-gold transition-all rounded-sm border border-transparent hover:border-gold/30"
              title="Nhật ký hành trình"
            >
              <History size={18} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2.5 bg-white/5 hover:bg-gold/10 text-gold/60 hover:text-gold transition-all rounded-sm border border-transparent hover:border-gold/30"
              title="Cài đặt hiển thị"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 relative custom-scrollbar">
        {/* Random Event Badge */}
        <AnimatePresence>
          {showEventBadge && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-24 left-1/2 z-30 bg-linear-to-r from-gold/90 to-gold-light/90 text-bg-main px-6 py-2 rounded-full font-serif text-sm tracking-[0.2em] shadow-[0_0_20px_rgba(201,168,76,0.5)] border border-white/20"
            >
              ✨ SỰ KIỆN BẤT NGỜ ✨
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Scroll Buttons */}
        <div className="fixed right-8 bottom-24 z-20 flex flex-col gap-2">
          <button 
            onClick={scrollToTop}
            className="p-3 bg-bg-card/80 backdrop-blur-md border border-gold/30 text-gold rounded-full hover:bg-gold/20 transition-all shadow-lg"
            title="Lên đầu trang"
          >
            <ArrowUp size={20} />
          </button>
          <button 
            onClick={scrollToBottom}
            className="p-3 bg-bg-card/80 backdrop-blur-md border border-gold/30 text-gold rounded-full hover:bg-gold/20 transition-all shadow-lg"
            title="Xuống cuối trang"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Story Content - Only show current page */}
        {gameState.storyHistory?.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            {/* Page Navigation */}
            <div className="flex items-center justify-between mb-12 border-b border-gold/10 pb-4 bg-bg-dark/40 backdrop-blur-sm sticky top-0 z-20 pt-2">
              <button 
                onClick={() => goToPage(gameState.currentStoryPage - 1)}
                disabled={gameState.currentStoryPage === 0}
                className="flex items-center gap-1 text-[10px] text-text-dim hover:text-gold disabled:opacity-30 transition-all uppercase tracking-widest px-2 py-1 rounded hover:bg-gold/5"
              >
                <ChevronLeft size={14} /> Trước
              </button>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleBookmark(gameState.currentStoryPage)}
                  className={`p-1.5 rounded-full transition-all ${gameState.bookmarks.includes(gameState.currentStoryPage) ? 'text-gold bg-gold/10' : 'text-text-dim hover:text-gold/60 hover:bg-white/5'}`}
                  title={gameState.bookmarks.includes(gameState.currentStoryPage) ? "Bỏ đánh dấu" : "Đánh dấu trang này"}
                >
                  {gameState.bookmarks.includes(gameState.currentStoryPage) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
                <div className="text-[11px] text-gold/60 font-serif tracking-[0.2em] bg-gold/5 px-3 py-1 rounded-full border border-gold/10">
                  {gameState.currentStoryPage + 1} / {gameState.storyHistory.length}
                </div>
              </div>

              <button 
                onClick={() => goToPage(gameState.currentStoryPage + 1)}
                disabled={gameState.currentStoryPage === gameState.storyHistory.length - 1}
                className="flex items-center gap-1 text-[10px] text-text-dim hover:text-gold disabled:opacity-30 transition-all uppercase tracking-widest px-2 py-1 rounded hover:bg-gold/5"
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>

            {/* Current Page Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={gameState.currentStoryPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                {gameState.storyHistory[gameState.currentStoryPage] && (
                  <>
                    <div className="mb-12 text-center">
                      <div className="text-[10px] tracking-[0.4em] text-gold/40 uppercase mb-2">Hồi Thứ {gameState.currentStoryPage + 1}</div>
                      <h1 className="font-serif text-3xl md:text-4xl text-gold-light tracking-widest mb-4 drop-shadow-sm leading-relaxed px-4">
                        {gameState.storyHistory[gameState.currentStoryPage].summary || gameState.storyHistory[gameState.currentStoryPage].scene}
                      </h1>
                      <div className="flex justify-center items-center gap-4">
                        <div className="h-[1px] w-12 bg-linear-to-r from-transparent to-gold/30" />
                        <div className="w-2 h-2 rotate-45 border border-gold/40" />
                        <div className="h-[1px] w-12 bg-linear-to-l from-transparent to-gold/30" />
                      </div>
                    </div>

                    <div className="story-text selection:bg-gold/30 selection:text-white">
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => {
                            const content = children?.toString() || '';
                            if (content.includes('[HỆ THỐNG:')) {
                              const msg = content.replace('[HỆ THỐNG:', '').replace(']', '');
                              return <div className="sys-msg">⚡ HỆ THỐNG: {msg}</div>;
                            }
                            if (content.includes('"') || content.includes('—')) {
                              return <p className="dialogue">{children}</p>;
                            }
                            return <p>{children}</p>;
                          }
                        }}
                      >
                        {gameState.storyHistory[gameState.currentStoryPage].text}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : !isStreaming && gameState.started && (
          <div className="flex flex-col items-center justify-center py-20 text-text-dim">
            <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
            <p className="font-serif tracking-widest text-sm">✦ ĐANG KHỞI TẠO MẠCH TRUYỆN... ✦</p>
          </div>
        )}

        {/* Streaming Text - Only show if we are on the latest page or starting new */}
        {isStreaming && (
          <div className="max-w-3xl mx-auto py-8">
            <div className="text-[10px] tracking-[0.4em] text-gold/40 uppercase mb-8 text-center">— ĐANG DIỄN BIẾN —</div>
            <div className="story-text relative after:content-['▋'] after:text-gold after:animate-pulse bg-gold/5 p-8 rounded-sm border border-gold/10 shadow-inner">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => {
                    const content = children?.toString() || '';
                    if (content.includes('[HỆ THỐNG:')) {
                      const msg = content.replace('[HỆ THỐNG:', '').replace(']', '');
                      return <div className="sys-msg">⚡ HỆ THỐNG: {msg}</div>;
                    }
                    return <p className="animate-in fade-in duration-1000">{children}</p>;
                  }
                }}
              >
                {streamingText}
              </ReactMarkdown>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="flex gap-2 items-center text-gold/40 text-[10px] tracking-widest uppercase">
                <div className="w-1 h-1 bg-gold rounded-full animate-ping" />
                Thiên cơ đang hiển lộ...
              </div>
            </div>
          </div>
        )}

        {/* Choices - Only show on the latest page */}
        {!isStreaming && gameState.currentStoryPage === gameState.storyHistory.length - 1 && (
          <div className="max-w-3xl mx-auto pt-4 pb-12">
            {(gameState.currentChoices?.length || 0) > 0 ? (
              <>
                <div className="text-[11px] tracking-[0.2em] text-text-dim mb-4 text-center">— LỰA CHỌN CỦA NGƯƠI —</div>
                <div className="space-y-3">
                  {gameState.loadingChoices ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <div className="flex gap-2 animate-typing">
                        <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                        <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                        <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                      </div>
                      <div className="text-[11px] text-gold/60 tracking-[0.3em] uppercase font-serif">✦ Thiên cơ đang xoay chuyển... ✦</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {gameState.currentChoices?.map((choice, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => handleChoice(choice)}
                          className="w-full p-5 bg-bg-card/40 border border-gold/20 text-left rounded-sm transition-all duration-500 hover:border-gold/60 hover:bg-gold/5 group relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                          <div className="flex gap-5 items-center">
                            <div className="w-10 h-10 flex items-center justify-center bg-gold/10 rounded-full border border-gold/20 group-hover:bg-gold/20 transition-colors">
                              <span className="text-xl">
                                {choice.style === 'cold' ? '❄️' : choice.style === 'warm' ? '🔥' : '⚡'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[9px] text-gold/50 tracking-[0.3em] uppercase font-bold">[{choice.label}]</span>
                                {choice.impact && (
                                  <span className="text-[8px] text-text-dim/60 italic group-hover:text-gold/60 transition-colors">
                                    {choice.impact}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm leading-relaxed text-text-main group-hover:text-gold-light transition-colors">{choice.text}</span>
                            </div>
                            <ChevronRight size={16} className="text-gold/0 group-hover:text-gold transition-all -translate-x-2 group-hover:translate-x-0" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex justify-center">
                {gameState.loadingChoices ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex gap-1 animate-typing">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    </div>
                    <div className="text-[11px] text-text-dim tracking-widest">✦ ĐANG TÌM KIẾM BƯỚC NGOẶT... ✦</div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleChoice()}
                    className="bg-linear-to-br from-gold-dark to-gold text-bg-dark px-12 py-3 rounded-sm font-serif font-bold text-sm tracking-[0.3em] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(201,168,76,0.3)]"
                  >
                    TIẾP TỤC HÀNH TRÌNH ⟶
                  </button>
                )}
              </div>
            )}

            {/* Custom Interaction Input */}
            {!isStreaming && !gameState.loadingChoices && (
              <div className="mt-12 pt-8 border-t border-gold/10">
                <div className="text-[10px] tracking-[0.3em] text-gold/40 mb-6 text-center uppercase font-serif">— Tương Tác Tự Do —</div>
                <div className="flex gap-3 bg-black/20 p-2 rounded-sm border border-gold/5 focus-within:border-gold/30 transition-all">
                  <input 
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomInteraction()}
                    placeholder="Ngươi muốn nói gì hoặc làm gì?..."
                    className="flex-1 bg-transparent text-gold-light px-4 py-3 rounded-sm focus:outline-none text-sm placeholder:text-text-dim/50"
                  />
                  <button 
                    onClick={handleCustomInteraction}
                    disabled={!customInput.trim()}
                    className="bg-linear-to-br from-gold-dark/80 to-gold/80 text-bg-dark px-8 py-3 rounded-sm text-xs font-serif font-bold tracking-[0.2em] hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase"
                  >
                    Gửi Đi
                  </button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="h-[1px] w-8 bg-gold/10" />
                  <p className="text-[9px] text-text-dim italic uppercase tracking-widest">
                    Tác động đến thiên mệnh bằng ý chí của ngươi
                  </p>
                  <div className="h-[1px] w-8 bg-gold/10" />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} className="h-1 w-full" />
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-bg-card border border-gold/30 rounded-lg p-8 shadow-2xl"
            >
              <h3 className="font-serif text-2xl text-gold mb-6 text-center tracking-widest uppercase">Cài Đặt & Lưu Trữ</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="text-[10px] text-gold/60 tracking-widest uppercase mb-2">Quản lý tiến trình</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        onQuickSave();
                        setShowSettings(false);
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-gold/10 border border-gold/30 text-gold font-serif text-sm tracking-widest hover:bg-gold/20 transition-all rounded-sm"
                    >
                      <Save size={16} /> LƯU NHANH
                    </button>
                    <button 
                      onClick={() => {
                        onQuickLoad();
                        setShowSettings(false);
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-gold/10 border border-gold/30 text-gold font-serif text-sm tracking-widest hover:bg-gold/20 transition-all rounded-sm"
                    >
                      <FolderOpen size={16} /> TẢI NHANH
                    </button>
                  </div>
                  <div className="text-[9px] text-text-dim italic text-center">Mẹo: Sử dụng Ctrl+S để lưu và Ctrl+L để tải nhanh.</div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gold/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-gold/60 tracking-widest uppercase">Tối ưu hiển thị</div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onSavePartial('settings', { autoScroll }, 'Cài Đặt')}
                        className="p-1 text-gold/60 hover:text-gold transition-colors"
                        title="Lưu cài đặt"
                      >
                        <Save size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          const loaded = onLoadPartial('settings', 'Cài Đặt');
                          if (loaded && typeof loaded.autoScroll === 'boolean') {
                            setAutoScroll(loaded.autoScroll);
                          }
                        }}
                        className="p-1 text-gold/60 hover:text-gold transition-colors"
                        title="Tải cài đặt"
                      >
                        <FolderOpen size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-main">Tự động cuộn khi stream</span>
                    <button 
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${autoScroll ? 'bg-gold' : 'bg-bg-dark border border-gold/30'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${autoScroll ? 'right-1 bg-bg-dark' : 'left-1 bg-gold'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full py-3 bg-linear-to-r from-red-deep to-[#5a0f0f] border border-gold/30 text-gold-light font-serif tracking-widest hover:brightness-110 transition-all rounded-sm"
                  >
                    ĐÓNG CÀI ĐẶT
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Travel Log Modal */}
      <AnimatePresence>
        {showTravelLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTravelLog(false)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl h-[80vh] bg-bg-card border border-gold/30 rounded-lg flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gold/20 flex justify-between items-center bg-bg-dark/40">
                <h3 className="font-serif text-2xl text-gold tracking-widest flex items-center gap-3">
                  <History size={24} /> NHẬT KÝ HÀNH TRÌNH
                </h3>
                <button onClick={() => setShowTravelLog(false)} className="text-text-dim hover:text-gold">
                  Đóng
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {gameState.storyHistory.length === 0 ? (
                  <div className="text-center py-20 text-text-dim italic">Chưa có ghi chép nào...</div>
                ) : (
                  gameState.storyHistory.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 border rounded-sm transition-all cursor-pointer ${gameState.currentStoryPage === idx ? 'bg-gold/5 border-gold/40' : 'bg-bg-dark/20 border-gold/10 hover:border-gold/30'}`}
                      onClick={() => {
                        goToPage(idx);
                        setShowTravelLog(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-sm font-mono">#{idx + 1}</span>
                          <h4 className="font-serif text-gold-light">{item.scene}</h4>
                        </div>
                        {item.isBookmarked && <BookmarkCheck size={14} className="text-gold" />}
                      </div>
                      <p className="text-sm text-text-main line-clamp-2 italic mb-2">
                        {item.summary || "Đang tóm tắt diễn biến..."}
                      </p>
                      <div className="text-[10px] text-text-dim uppercase tracking-widest">
                        Nhấn để xem lại chi tiết
                      </div>
                    </div>
                  ))
                )}
              </div>

              {gameState.bookmarks.length > 0 && (
                <div className="p-4 bg-gold/5 border-t border-gold/20">
                  <div className="text-[10px] text-gold tracking-widest uppercase mb-2">Đã đánh dấu ({gameState.bookmarks.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {gameState.bookmarks.map(idx => (
                      <button 
                        key={idx}
                        onClick={() => {
                          goToPage(idx);
                          setShowTravelLog(false);
                        }}
                        className="text-[10px] bg-bg-card border border-gold/30 px-3 py-1 rounded-full hover:bg-gold/20 transition-all"
                      >
                        Trang {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getChapterName(chapter: number) {
  const names = [
    'Giác Ngộ - Trùng Sinh Chi Thủy',
    'Sơ Nhập Giang Hồ - Thanh Vân Phong Vân',
    'Thiên Cơ Biến - Bí Mật Tàng Kinh',
    'Phong Ba Tứ Khởi - Loạn Thế Anh Hùng',
    'Anh Hùng Xuất Thế - Danh Chấn Thiên Hạ',
    'Vạn Cổ Trường Tồn - Đạo Tâm Vĩnh Hằng',
    'Luân Hồi Chuyển Thế - Nhân Quả Tuần Hoàn',
    'Thần Ma Đại Chiến - Hỗn Độn Sơ Khai'
  ];
  return names[(chapter - 1) % names.length] || 'Vận Mệnh Mới - Khai Thiên Lập Địa';
}
