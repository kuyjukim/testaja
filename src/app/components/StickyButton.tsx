import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface StickyButtonProps {
  onClick: () => void;
}

export function StickyButton({ onClick }: StickyButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-[#D4AF37] text-[#0F2A44] px-6 py-4 rounded-full font-bold shadow-2xl hover:bg-[#C5A028] transition-all duration-200 z-50 flex items-center gap-3"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline">상담 요청</span>
    </motion.button>
  );
}
