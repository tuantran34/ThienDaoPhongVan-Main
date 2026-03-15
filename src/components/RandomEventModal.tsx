import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RandomEvent, GameState } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';

interface RandomEventModalProps {
  event: RandomEvent;
  onSelect: (optionIndex: number) => void;
}

export function RandomEventModal({ event, onSelect }: RandomEventModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg-dark border border-gold/30 w-full max-w-lg overflow-hidden shadow-2xl shadow-gold/10"
      >
        <div className="bg-linear-to-r from-gold/20 to-transparent p-4 border-b border-gold/20 flex items-center gap-3">
          <Sparkles className="text-gold" size={20} />
          <h3 className="font-serif text-gold text-lg uppercase tracking-widest">{event.title}</h3>
        </div>

        <div className="p-6">
          {event.image && (
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-48 object-cover mb-6 border border-gold/10"
              referrerPolicy="no-referrer"
            />
          )}
          
          <p className="text-text-main leading-relaxed mb-8 text-sm italic">
            {event.desc}
          </p>

          <div className="space-y-3">
            {event.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => onSelect(index)}
                className="w-full text-left p-4 bg-gold/5 border border-gold/20 hover:bg-gold/10 hover:border-gold/40 transition-all group"
              >
                <div className="text-gold group-hover:text-gold-light font-medium text-sm">
                  {choice.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
