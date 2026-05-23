import { motion, AnimatePresence } from 'motion/react';

export type MascotExpression = 'default' | 'happy' | 'thinking' | 'celebrating' | 'encouraging';

interface MascotProps {
  expression?: MascotExpression;
  size?: number;
  className?: string;
}

export function MascotPinto({ expression = 'default', size = 80, className = '' }: MascotProps) {
  const mouth: Record<MascotExpression, string> = {
    default:     'M38,72 Q50,80 62,72',
    happy:       'M33,70 Q50,82 67,70',
    thinking:    'M38,74 Q50,72 62,74',
    celebrating: 'M30,68 Q50,84 70,68',
    encouraging: 'M36,71 Q50,79 64,71',
  };
  const showBlush = expression === 'happy' || expression === 'celebrating';
  const armsUp    = expression === 'celebrating';

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Camera body */}
      <rect x="6" y="28" width="88" height="66" rx="16" fill="#3B82F6" />

      {/* Viewfinder bump */}
      <rect x="20" y="13" width="30" height="18" rx="7" fill="#2563EB" />

      {/* Flash */}
      <rect x="62" y="18" width="22" height="13" rx="5" fill="#2563EB" />
      <circle cx="73" cy="24.5" r="3.5" fill="#93C5FD" />

      {/* Shutter button */}
      <circle cx="15" cy="40" r="4" fill="#60A5FA" />

      {/* Lens - outer white ring */}
      <circle cx="50" cy="58" r="26" fill="white" />
      {/* Lens - light blue ring */}
      <circle cx="50" cy="58" r="20" fill="#DBEAFE" />
      {/* Lens - iris */}
      <circle cx="50" cy="58" r="14" fill="#3B82F6" />
      {/* Lens - pupil */}
      <circle cx="50" cy="58" r="8"  fill="#1D4ED8" />
      {/* Lens - highlight */}
      <circle cx="59" cy="49" r="4"  fill="white" opacity="0.75" />

      {/* Mouth */}
      <path d={mouth[expression]} stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Blush */}
      {showBlush && (
        <>
          <circle cx="22" cy="73" r="7" fill="#FCA5A5" opacity="0.45" />
          <circle cx="78" cy="73" r="7" fill="#FCA5A5" opacity="0.45" />
        </>
      )}

      {/* Arms */}
      {armsUp ? (
        <>
          <path d="M7,52 Q0,38 10,30"  stroke="#2563EB" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M93,52 Q100,38 90,30" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <rect x="0"  y="46" width="8" height="10" rx="4" fill="#2563EB" />
          <rect x="92" y="46" width="8" height="10" rx="4" fill="#2563EB" />
        </>
      )}

      {/* Legs */}
      <rect x="26" y="92" width="18" height="16" rx="7" fill="#2563EB" />
      <rect x="56" y="92" width="18" height="16" rx="7" fill="#2563EB" />
    </svg>
  );
}

interface BubbleProps {
  message: string;
  visible: boolean;
  position?: 'top' | 'left';
}

export function SpeechBubble({ message, visible, position = 'top' }: BubbleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: position === 'top' ? 8 : 0, x: position === 'left' ? 8 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2 }}
          className="absolute z-20 bg-white border-2 border-blue-200 rounded-2xl px-4 py-2.5 shadow-lg text-sm font-bold text-blue-800 leading-snug whitespace-nowrap"
          style={
            position === 'top'
              ? { bottom: '110%', right: '50%', transform: 'translateX(50%)' }
              : { right: '110%', top: '50%', transform: 'translateY(-50%)' }
          }
        >
          {message}
          {/* Bubble tail */}
          <span
            className="absolute"
            style={
              position === 'top'
                ? { top: '100%', left: '50%', transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                    borderTop: '8px solid #BFDBFE' }
                : { top: '50%', left: '100%', transform: 'translateY(-50%)',
                    borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
                    borderLeft: '8px solid #BFDBFE' }
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
