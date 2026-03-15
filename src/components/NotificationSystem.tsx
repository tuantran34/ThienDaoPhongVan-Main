import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  body: string;
  reward?: string;
}

interface NotificationSystemProps {
  notifications: Notification[];
}

export function NotificationSystem({ notifications }: NotificationSystemProps) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-bg-card2 border border-gold/60 rounded-sm p-4 min-w-[280px] max-w-[320px] shadow-2xl shadow-black/60 pointer-events-auto"
          >
            <div className="font-serif text-gold text-sm mb-1">{n.title}</div>
            <div className="text-text-dim text-xs leading-relaxed">{n.body}</div>
            {n.reward && (
              <div className="text-jade-light text-xs mt-2 font-medium">
                ⟶ {n.reward}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
