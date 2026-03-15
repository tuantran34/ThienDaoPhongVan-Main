import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Sword, Map } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Chào mừng Tu Tiên Giả!',
    content: 'Bạn vừa trùng sinh vào thế giới tu tiên. Hãy bắt đầu hành trình nghịch thiên cải mệnh của mình!',
    icon: BookOpen,
  },
  {
    title: 'Cơ chế Tu Luyện',
    content: 'Để tăng tu vi, bạn cần thực hiện các hoạt động tu luyện hoặc khám phá. Tu vi cao giúp bạn đột phá cảnh giới và mạnh mẽ hơn.',
    icon: BookOpen,
  },
  {
    title: 'Kỹ năng & Chiến đấu',
    content: 'Học và nâng cấp kỹ năng để gia tăng sức mạnh chiến đấu. Kỹ năng sẽ giúp bạn vượt qua các thử thách khó khăn.',
    icon: Sword,
  },
  {
    title: 'Khám phá Thế giới',
    content: 'Sử dụng bản đồ để khám phá các khu vực mới, thu thập tài nguyên và đối mặt với yêu thú.',
    icon: Map,
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-card border border-gold/20 p-6 rounded-2xl max-w-md w-full shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-gold flex items-center gap-2">
              {(() => {
                const Icon = TUTORIAL_STEPS[currentStep].icon;
                return <Icon className="w-6 h-6" />;
              })()}
              {TUTORIAL_STEPS[currentStep].title}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-[#e8dcc8] mb-8 leading-relaxed">
            {TUTORIAL_STEPS[currentStep].content}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={nextStep}
              className="bg-gold text-bg-dark px-6 py-2 rounded-full font-bold hover:bg-gold-light transition-colors"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
