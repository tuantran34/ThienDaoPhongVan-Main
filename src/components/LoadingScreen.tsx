import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('Đang khởi tạo hệ thống...');

  useEffect(() => {
    const steps = [
      { text: 'Kết nối hệ thống tu tiên...', target: 20 },
      { text: 'Tải dữ liệu giao hảo...', target: 40 },
      { text: 'Khởi tạo thiên đạo...', target: 60 },
      { text: 'Chuẩn bị mạch truyện...', target: 80 },
      { text: 'Hoàn tất...', target: 100 },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setText(step.text);
        setProgress(prev => {
          if (prev >= step.target) {
            currentStep++;
            return prev;
          }
          return prev + 2;
        });
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 bg-bg-dark flex flex-col items-center justify-center z-[9999]"
    >
      <div className="font-serif text-6xl text-gold mb-4 tracking-[0.3em] animate-pulse-gold">
        天道風雲
      </div>
      <div className="text-text-dim text-sm tracking-[0.2em] mb-8">
        THIÊN ĐẠO PHONG VÂN
      </div>
      
      <div className="w-[200px] h-[2px] bg-gold/15 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-linear-to-r from-gold-dark to-gold-light"
          animate={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-text-dim text-xs mt-3 tracking-[0.15em]">
        {text}
      </div>
    </motion.div>
  );
}
