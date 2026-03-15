import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HaremEvent, GameState } from '../types';
import { X, Heart, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface HaremEventModalProps {
  event: HaremEvent;
  characterIcon: string;
  onClose: (action: (prev: GameState) => GameState, result: string) => void;
}

export function HaremEventModal({ event, characterIcon, onClose }: HaremEventModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    setShowResult(true);
  };

  const handleFinish = () => {
    if (selectedOption !== null) {
      onClose(event.choices[selectedOption].action, event.choices[selectedOption].result);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg-card border border-gold/40 w-full max-w-md rounded-sm shadow-2xl shadow-gold/10 overflow-hidden"
      >
        <div className="p-4 border-b border-gold/20 flex justify-between items-center bg-gold/5">
          <h3 className="font-serif text-gold text-lg flex items-center gap-2">
            <Heart className="text-red-deep animate-pulse" size={18} />
            Sự Kiện Giao Hảo
          </h3>
          {!showResult && (
            <button onClick={() => onClose((p) => p, '')} className="text-text-dim hover:text-gold">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border border-gold/20 shadow-inner">
            {characterIcon}
          </div>
          
          <h4 className="font-serif text-gold text-xl mb-2">{event.title}</h4>
          <p className="text-text-main text-sm leading-relaxed mb-6 italic">
            "{event.body}"
          </p>

          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {event.choices.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className="w-full p-3 bg-black/40 border border-gold/20 text-text-main text-sm hover:border-gold hover:bg-gold/5 transition-all rounded-sm text-left flex items-center gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center text-[10px] group-hover:bg-gold group-hover:text-bg-dark transition-colors">
                      {idx + 1}
                    </div>
                    {opt.text}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-gold/5 border border-gold/20 rounded-sm">
                  <div className="flex items-center justify-center gap-2 text-gold mb-2">
                    <Sparkles size={16} />
                    <span className="text-xs uppercase tracking-widest font-bold">Kết quả</span>
                  </div>
                  <p className="text-text-main text-sm leading-relaxed">
                    {event.choices[selectedOption!].result}
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-3 bg-linear-to-r from-gold-dark to-gold text-bg-dark font-serif font-bold uppercase tracking-widest rounded-sm hover:scale-[1.02] transition-transform"
                >
                  Xác Nhận
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
