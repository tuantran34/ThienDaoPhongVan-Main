import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MiniGame, GameState } from '../types';
import { Dices, Trophy, X } from 'lucide-react';

interface MiniGameModalProps {
  game: MiniGame;
  onClose: (won: boolean) => void;
}

export function MiniGameModal({ game, onClose }: MiniGameModalProps) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number[] | null>(null);
  const [choice, setChoice] = useState<'big' | 'small' | null>(null);
  const [message, setMessage] = useState<string>('Chọn Tài hoặc Xỉu để bắt đầu!');

  const rollDice = () => {
    if (!choice) return;
    setRolling(true);
    setResult(null);
    setMessage('Đang lắc xúc xắc...');

    setTimeout(() => {
      const newResult = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      const sum = newResult.reduce((a, b) => a + b, 0);
      const isBig = sum >= 11;
      const won = (choice === 'big' && isBig) || (choice === 'small' && !isBig);

      setResult(newResult);
      setRolling(false);
      
      if (won) {
        setMessage(`Tổng là ${sum} (${isBig ? 'Tài' : 'Xỉu'}). Bạn đã thắng!`);
        setTimeout(() => onClose(true), 2000);
      } else {
        setMessage(`Tổng là ${sum} (${isBig ? 'Tài' : 'Xỉu'}). Bạn đã thua...`);
        setTimeout(() => onClose(false), 2000);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-dark border border-gold/30 w-full max-w-md p-8 text-center relative"
      >
        <button onClick={() => onClose(false)} className="absolute top-4 right-4 text-text-dim hover:text-gold">
          <X size={24} />
        </button>

        <Dices className="mx-auto text-gold mb-4" size={48} />
        <h3 className="font-serif text-gold text-xl uppercase tracking-widest mb-2">{game.name}</h3>
        <p className="text-text-dim text-sm mb-8">Dự đoán tổng 3 xúc xắc là Tài (11-18) hoặc Xỉu (3-10)</p>

        <div className="flex justify-center gap-8 mb-12">
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl font-bold text-gold mb-4">
              {result ? result.map((d, i) => (
                <span key={i} className="mx-1 bg-gold/10 border border-gold/30 w-12 h-12 inline-flex items-center justify-center rounded-sm">
                  {d}
                </span>
              )) : (
                <div className="flex gap-2">
                  <div className={`w-12 h-12 bg-gold/5 border border-gold/20 rounded-sm ${rolling ? 'animate-bounce' : ''}`} />
                  <div className={`w-12 h-12 bg-gold/5 border border-gold/20 rounded-sm ${rolling ? 'animate-bounce delay-100' : ''}`} />
                  <div className={`w-12 h-12 bg-gold/5 border border-gold/20 rounded-sm ${rolling ? 'animate-bounce delay-200' : ''}`} />
                </div>
              )}
            </div>
            <p className="text-gold-light font-medium">{message}</p>
          </div>
        </div>

        {!result && !rolling && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setChoice('small')}
              className={`py-3 border ${choice === 'small' ? 'bg-gold text-bg-dark border-gold' : 'border-gold/30 text-gold hover:bg-gold/10'}`}
            >
              XỈU (3-10)
            </button>
            <button
              onClick={() => setChoice('big')}
              className={`py-3 border ${choice === 'big' ? 'bg-gold text-bg-dark border-gold' : 'border-gold/30 text-gold hover:bg-gold/10'}`}
            >
              TÀI (11-18)
            </button>
          </div>
        )}

        {choice && !result && !rolling && (
          <button
            onClick={rollDice}
            className="mt-8 w-full bg-linear-to-r from-gold-dark to-gold text-bg-dark py-3 font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            LẮC XÚC XẮC
          </button>
        )}
      </motion.div>
    </div>
  );
}
