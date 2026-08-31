import React from 'react';
import { motion } from 'motion/react';

interface MascotProps {
  className?: string;
  size?: number;
  animate?: boolean;
  speechText?: string;
  action?: 'idle' | 'happy' | 'wave' | 'celebrate' | 'drop';
}

// 🌍 น้องโลก (Earth Mascot)
export const EarthMascot: React.FC<MascotProps> = ({
  className = '',
  size = 140,
  animate = true,
  speechText,
  action = 'idle',
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-9 z-20 whitespace-nowrap rounded-2xl bg-white px-3 py-1 text-[11px] font-extrabold text-emerald-800 shadow-md ring-2 ring-emerald-200"
        >
          {speechText}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white ring-r-2 ring-b-2 ring-emerald-200" />
        </motion.div>
      )}

      <motion.div
        animate={
          animate
            ? action === 'celebrate'
              ? { y: [0, -16, 0, -10, 0], rotate: [0, -8, 8, -4, 0] }
              : { y: [0, -6, 0] }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: action === 'celebrate' ? 1.2 : 2.5,
          ease: 'easeInOut',
        }}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          <defs>
            {/* Soft Earth Gradient */}
            <linearGradient id="earthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="sproutGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Sprout on head */}
          <g className="origin-bottom transform">
            <motion.path
              d="M100 45 Q 100 25 100 15"
              stroke="#15803d"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left Leaf */}
            <motion.path
              d="M100 22 C 85 10, 75 22, 100 26 Z"
              fill="url(#sproutGrad)"
              stroke="#166534"
              strokeWidth="2.5"
              animate={animate ? { rotate: [-5, 5, -5] } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            {/* Right Leaf */}
            <motion.path
              d="M100 22 C 115 10, 125 22, 100 26 Z"
              fill="url(#sproutGrad)"
              stroke="#166534"
              strokeWidth="2.5"
              animate={animate ? { rotate: [5, -5, 5] } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
          </g>

          {/* Main Globe Body */}
          <circle cx="100" cy="110" r="62" fill="url(#earthGrad)" stroke="#0369a1" strokeWidth="4" />

          {/* Continents (Green Patches) */}
          {/* Top Left Continent */}
          <path
            d="M 68 85 C 60 75, 80 60, 95 65 C 105 70, 95 90, 85 92 C 75 94, 65 92, 68 85 Z"
            fill="#4ade80"
            stroke="#16a34a"
            strokeWidth="2"
          />
          {/* Right Continent */}
          <path
            d="M 125 78 C 145 75, 155 90, 148 105 C 140 115, 125 110, 130 95 Z"
            fill="#4ade80"
            stroke="#16a34a"
            strokeWidth="2"
          />
          {/* Bottom Left Continent */}
          <path
            d="M 55 125 C 65 110, 85 118, 90 135 C 95 150, 75 160, 60 152 C 50 145, 48 135, 55 125 Z"
            fill="#4ade80"
            stroke="#16a34a"
            strokeWidth="2"
          />
          {/* Bottom Right Continent */}
          <path
            d="M 115 130 C 130 120, 150 135, 142 150 C 130 162, 110 155, 115 130 Z"
            fill="#4ade80"
            stroke="#16a34a"
            strokeWidth="2"
          />

          {/* Cute Kawaii Face */}
          {/* Left Eye */}
          <circle cx="82" cy="106" r="5.5" fill="#0f172a" />
          <circle cx="80.5" cy="104" r="2" fill="#ffffff" />

          {/* Right Eye */}
          <circle cx="118" cy="106" r="5.5" fill="#0f172a" />
          <circle cx="116.5" cy="104" r="2" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <circle cx="72" cy="116" r="6" fill="#f87171" opacity="0.4" />
          <circle cx="128" cy="116" r="6" fill="#f87171" opacity="0.4" />

          {/* Happy Open Smile */}
          <path
            d="M 92 116 Q 100 128 108 116 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          {/* Cute Tongue */}
          <path
            d="M 96 120 Q 100 125 104 120"
            fill="#fca5a5"
          />

          {/* Left Arm (Waving) */}
          <motion.g
            animate={animate ? { rotate: [-10, 15, -10], originX: '45px', originY: '110px' } : {}}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <path
              d="M 45 105 Q 25 90 28 75"
              stroke="#22c55e"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left Hand Glove / Nub */}
            <circle cx="28" cy="74" r="7" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
          </motion.g>

          {/* Right Arm */}
          <path
            d="M 155 110 Q 175 120 172 135"
            stroke="#22c55e"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="172" cy="135" r="7" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />

          {/* Feet (Green cartoon shoes) */}
          {/* Left Foot */}
          <path
            d="M 75 165 Q 70 185 55 188 Q 78 190 85 170 Z"
            fill="#4ade80"
            stroke="#15803d"
            strokeWidth="3"
          />
          {/* Right Foot */}
          <path
            d="M 125 165 Q 130 185 145 188 Q 122 190 115 170 Z"
            fill="#4ade80"
            stroke="#15803d"
            strokeWidth="3"
          />
        </svg>
      </motion.div>
    </div>
  );
};

// 🧴 น้องขวดน้ำ PET (PET Plastic Bottle Mascot)
export const PetBottleMascot: React.FC<MascotProps> = ({
  className = '',
  size = 130,
  animate = true,
  speechText,
  action = 'idle',
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-12 z-20 whitespace-nowrap rounded-2xl bg-white px-3.5 py-1.5 text-xs font-bold text-sky-800 shadow-md ring-2 ring-sky-200"
        >
          {speechText}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white ring-r-2 ring-b-2 ring-sky-200" />
        </motion.div>
      )}

      <motion.div
        animate={
          animate
            ? action === 'celebrate'
              ? { y: [0, -18, 0, -12, 0], rotate: [0, 6, -6, 4, 0] }
              : { y: [0, -7, 0], rotate: [0, 2, 0, -2, 0] }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: action === 'celebrate' ? 1.3 : 2.8,
          ease: 'easeInOut',
        }}
        style={{ width: size, height: size * 1.3 }}
        className="relative"
      >
        <svg viewBox="0 0 160 220" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="petBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#f0f9ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="blueCap" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Blue Screw Cap with Grooves */}
          <rect x="62" y="15" width="36" height="24" rx="4" fill="url(#blueCap)" stroke="#0369a1" strokeWidth="2.5" />
          <line x1="68" y1="18" x2="68" y2="36" stroke="#0284c7" strokeWidth="2" />
          <line x1="74" y1="18" x2="74" y2="36" stroke="#0284c7" strokeWidth="2" />
          <line x1="80" y1="18" x2="80" y2="36" stroke="#0284c7" strokeWidth="2" />
          <line x1="86" y1="18" x2="86" y2="36" stroke="#0284c7" strokeWidth="2" />
          <line x1="92" y1="18" x2="92" y2="36" stroke="#0284c7" strokeWidth="2" />

          {/* Bottle Neck */}
          <path
            d="M 66 39 L 60 55 C 45 65 42 80 42 95 L 42 165 C 42 175 48 180 80 180 C 112 180 118 175 118 165 L 118 95 C 118 80 115 65 100 55 L 94 39 Z"
            fill="url(#petBody)"
            stroke="#0284c7"
            strokeWidth="3.5"
          />

          {/* Water Highlight Reflection */}
          <path
            d="M 48 90 Q 48 65 65 58"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 112 100 L 112 155"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />

          {/* Blue Label Banner (PET + Recycle Symbol) */}
          <rect x="42" y="120" width="76" height="42" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <path
            d="M 75 130 L 80 124 L 85 130 M 80 125 L 80 134 M 86 135 L 90 143 L 83 143 M 74 135 L 70 143 L 77 143"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text x="80" y="156" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">
            PET
          </text>

          {/* Kawaii Face */}
          {/* Eyes */}
          <circle cx="68" cy="88" r="4.5" fill="#0f172a" />
          <circle cx="66.5" cy="86.5" r="1.5" fill="#ffffff" />
          <circle cx="92" cy="88" r="4.5" fill="#0f172a" />
          <circle cx="90.5" cy="86.5" r="1.5" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <circle cx="60" cy="94" r="4.5" fill="#f43f5e" opacity="0.35" />
          <circle cx="100" cy="94" r="4.5" fill="#f43f5e" opacity="0.35" />

          {/* Happy Mouth */}
          <path
            d="M 74 94 Q 80 102 86 94"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2"
          />

          {/* Cartoon Arms with Gloves */}
          <motion.g
            animate={animate ? { rotate: [0, 20, 0], originX: '120px', originY: '110px' } : {}}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <path d="M 118 105 Q 138 95 142 80" stroke="#bae6fd" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="142" cy="78" r="6.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          </motion.g>
          <path d="M 42 105 Q 24 115 22 130" stroke="#bae6fd" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="22" cy="130" r="6.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />

          {/* Blue Sneakers */}
          {/* Left Shoe */}
          <path
            d="M 64 180 L 58 198 C 50 198 42 204 45 212 C 48 218 72 218 76 210 L 72 180 Z"
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="2"
          />
          <ellipse cx="58" cy="214" rx="14" ry="4" fill="#ffffff" />

          {/* Right Shoe */}
          <path
            d="M 96 180 L 90 198 C 84 198 80 204 84 212 C 88 218 114 218 118 210 L 104 180 Z"
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="2"
          />
          <ellipse cx="102" cy="214" rx="14" ry="4" fill="#ffffff" />
        </svg>
      </motion.div>
    </div>
  );
};

// 🥫 น้องกระป๋อง CAN (Aluminum CAN Mascot)
export const CanMascot: React.FC<MascotProps> = ({
  className = '',
  size = 130,
  animate = true,
  speechText,
  action = 'idle',
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-12 z-20 whitespace-nowrap rounded-2xl bg-white px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-md ring-2 ring-amber-200"
        >
          {speechText}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white ring-r-2 ring-b-2 ring-amber-200" />
        </motion.div>
      )}

      <motion.div
        animate={
          animate
            ? action === 'celebrate'
              ? { y: [0, -18, 0, -12, 0], rotate: [0, -6, 6, -4, 0] }
              : { y: [0, -6, 0], rotate: [0, -2, 0, 2, 0] }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: action === 'celebrate' ? 1.1 : 2.4,
          ease: 'easeInOut',
        }}
        style={{ width: size, height: size * 1.25 }}
        className="relative"
      >
        <svg viewBox="0 0 160 200" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="canBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="40%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="metalRim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Top Metal Rim & Lid */}
          <ellipse cx="80" cy="35" rx="42" ry="14" fill="url(#metalRim)" stroke="#64748b" strokeWidth="3" />
          <ellipse cx="80" cy="33" rx="34" ry="9" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
          {/* Pull Tab */}
          <ellipse cx="80" cy="32" rx="9" ry="5" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
          <circle cx="80" cy="32" r="2.5" fill="#64748b" />

          {/* Cylindrical Orange Body */}
          <path
            d="M 38 35 L 38 140 C 38 152 56 160 80 160 C 104 160 122 152 122 140 L 122 35 Z"
            fill="url(#canBody)"
            stroke="#c2410c"
            strokeWidth="3.5"
          />

          {/* Bottom Metal Rim */}
          <path
            d="M 40 140 C 40 152 58 158 80 158 C 102 158 120 152 120 140"
            fill="none"
            stroke="url(#metalRim)"
            strokeWidth="4"
          />

          {/* Glossy White Reflection Curve */}
          <path
            d="M 48 45 L 48 135"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* CAN Text & Eco Recycle Sign */}
          <text x="80" y="115" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="sans-serif">
            CAN
          </text>
          {/* Recycle Icon */}
          <path
            d="M 76 128 L 80 122 L 84 128 M 80 123 L 80 131 M 85 132 L 89 139 L 83 139 M 75 132 L 71 139 L 77 139"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Kawaii Face */}
          {/* Eyes */}
          <circle cx="68" cy="72" r="4.5" fill="#0f172a" />
          <circle cx="66.5" cy="70.5" r="1.5" fill="#ffffff" />
          <circle cx="94" cy="72" r="4.5" fill="#0f172a" />
          <circle cx="92.5" cy="70.5" r="1.5" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <circle cx="60" cy="78" r="4.5" fill="#ef4444" opacity="0.4" />
          <circle cx="102" cy="78" r="4.5" fill="#ef4444" opacity="0.4" />

          {/* Happy Open Mouth */}
          <path
            d="M 74 78 Q 81 87 88 78 Z"
            fill="#b91c1c"
            stroke="#0f172a"
            strokeWidth="2"
          />

          {/* Arms with Gloves */}
          <path d="M 38 75 Q 20 85 18 100" stroke="#f97316" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="18" cy="100" r="6.5" fill="#ffffff" stroke="#c2410c" strokeWidth="2" />

          <motion.g
            animate={animate ? { rotate: [-10, 15, -10], originX: '122px', originY: '75px' } : {}}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <path d="M 122 75 Q 142 65 145 48" stroke="#f97316" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="145" cy="46" r="6.5" fill="#ffffff" stroke="#c2410c" strokeWidth="2" />
          </motion.g>

          {/* Orange Cartoon Shoes */}
          {/* Left Foot */}
          <path
            d="M 64 160 L 58 178 C 50 178 40 184 44 192 C 48 198 72 198 76 190 L 72 160 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="2"
          />
          <ellipse cx="58" cy="194" rx="14" ry="4" fill="#ffffff" />

          {/* Right Foot */}
          <path
            d="M 96 160 L 90 178 C 84 178 78 184 82 192 C 86 198 112 198 116 190 L 104 160 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="2"
          />
          <ellipse cx="102" cy="194" rx="14" ry="4" fill="#ffffff" />
        </svg>
      </motion.div>
    </div>
  );
};

// Trio Mascot Banner Component
export const MascotsTrio: React.FC<{ size?: number; speech?: string }> = ({
  size = 110,
  speech = 'หยอดขวด-กระป๋อง แลกแต้มกันเถอะ!',
}) => {
  return (
    <div className="flex items-end justify-center gap-3 md:gap-5 relative">
      <EarthMascot size={size * 1.05} action="happy" />
      <PetBottleMascot size={size * 0.95} speechText={speech} action="wave" />
      <CanMascot size={size * 0.95} action="happy" />
    </div>
  );
};

// 🗑️ Animated Full Recycle Bin (ถังขยะเต็ม - ขวดล้นดุ๊กดิ๊ก)
export const AnimatedFullRecycleBin: React.FC<{ size?: number }> = ({ size = 160 }) => {
  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id="binBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="binLidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="petBottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="canGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        {/* Pulsing Warning Rings Behind Overflow */}
        <motion.circle
          cx="100"
          cy="70"
          r="45"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeDasharray="6 4"
          animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
        />

        {/* Overflowing Bottles & Cans inside Bin (Bouncing) */}
        {/* Bottle 1 (Left - Blue PET) */}
        <motion.g
          animate={{ y: [-4, 4, -4], rotate: [-16, -10, -16] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="origin-bottom"
        >
          <rect x="52" y="42" width="24" height="46" rx="8" fill="url(#petBottleGrad)" stroke="#1d4ed8" strokeWidth="2.5" />
          <rect x="58" y="32" width="12" height="12" rx="3" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />
          <rect x="59" y="26" width="10" height="7" rx="2" fill="#ffffff" stroke="#1d4ed8" strokeWidth="1.5" />
          <text x="64" y="68" fontSize="12" textAnchor="middle" fill="#ffffff">💧</text>
        </motion.g>

        {/* Can 1 (Center-Right - Orange CAN) */}
        <motion.g
          animate={{ y: [4, -4, 4], rotate: [18, 12, 18] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="origin-bottom"
        >
          <rect x="110" y="46" width="28" height="42" rx="6" fill="url(#canGrad)" stroke="#c2410c" strokeWidth="2.5" />
          <ellipse cx="124" cy="46" rx="14" ry="4" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
          <text x="124" y="72" fontSize="12" textAnchor="middle" fill="#ffffff">🥫</text>
        </motion.g>

        {/* Bottle 2 (Center - Pink Lotion / Extra Bottle) */}
        <motion.g
          animate={{ y: [-3, 3, -3], rotate: [2, -4, 2] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          <rect x="84" y="38" width="22" height="48" rx="7" fill="#f472b6" stroke="#db2777" strokeWidth="2.5" />
          <rect x="89" y="28" width="12" height="11" rx="2" fill="#fbcfe8" stroke="#db2777" strokeWidth="2" />
          <text x="95" y="64" fontSize="11" textAnchor="middle" fill="#ffffff">🧴</text>
        </motion.g>

        {/* Bin Main Body */}
        {/* Wheels */}
        <circle cx="58" cy="180" r="12" fill="#334155" stroke="#0f172a" strokeWidth="3" />
        <circle cx="58" cy="180" r="4" fill="#94a3b8" />
        <circle cx="142" cy="180" r="12" fill="#334155" stroke="#0f172a" strokeWidth="3" />
        <circle cx="142" cy="180" r="4" fill="#94a3b8" />

        {/* Tapered Bin Container */}
        <path
          d="M 48 88 L 58 175 C 58 180, 62 182, 68 182 L 132 182 C 138 182, 142 180, 142 175 L 152 88 Z"
          fill="url(#binBodyGrad)"
          stroke="#065f46"
          strokeWidth="4"
        />

        {/* Bin Decorative Ribs */}
        <path d="M 68 100 L 73 165" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        <path d="M 100 100 L 100 165" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        <path d="M 132 100 L 127 165" stroke="#047857" strokeWidth="3" strokeLinecap="round" />

        {/* White Recycle Arrows Emblem on Front */}
        <circle cx="100" cy="132" r="18" fill="#ffffff" stroke="#047857" strokeWidth="2.5" />
        <text x="100" y="139" fontSize="18" textAnchor="middle" fill="#059669" fontWeight="bold">♻️</text>

        {/* Cute Surprised Eyes & Sweat Droplet */}
        <circle cx="84" cy="108" r="4" fill="#0f172a" />
        <circle cx="83" cy="106" r="1.5" fill="#ffffff" />
        <circle cx="116" cy="108" r="4" fill="#0f172a" />
        <circle cx="115" cy="106" r="1.5" fill="#ffffff" />
        {/* Wobbly mouth */}
        <path d="M 94 116 Q 100 112 106 116" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Animated Open Lid (Tilted & Vibrating) */}
        <motion.g
          animate={{ rotate: [-24, -14, -24], originX: '40px', originY: '88px' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <path
            d="M 36 84 C 36 80, 42 78, 50 78 L 150 78 C 158 78, 164 80, 164 84 L 160 90 L 40 90 Z"
            fill="url(#binLidGrad)"
            stroke="#065f46"
            strokeWidth="3.5"
          />
          {/* Lid Handle */}
          <path d="M 88 78 L 88 70 C 88 68, 92 66, 100 66 C 108 66, 112 68, 112 70 L 112 78" stroke="#065f46" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </motion.g>

        {/* Warning Exclamation Pill on Top */}
        <motion.g
          animate={{ y: [-6, 2, -6], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
        >
          <rect x="144" y="24" width="28" height="28" rx="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
          <text x="158" y="44" fontSize="16" textAnchor="middle" fill="#ffffff" fontWeight="bold">!</text>
        </motion.g>
      </svg>
    </div>
  );
};

// ⚙️ Animated Jammed Conveyor Gears (สายพานติดขัด / เกิดข้อผิดพลาด)
export const AnimatedJammedGears: React.FC<{ size?: number }> = ({ size = 160 }) => {
  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id="gearAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="gearRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Sparks / Lightning */}
        <motion.path
          d="M 96 55 L 108 65 L 100 70 L 114 85"
          stroke="#facc15"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />

        <motion.path
          d="M 125 110 L 138 100 L 132 118 L 148 112"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />

        {/* Gear 1 (Large Amber Gear - Stalling & Shaking) */}
        <motion.g
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
          className="origin-[75px_105px]"
        >
          <circle cx="75" cy="105" r="42" fill="url(#gearAmberGrad)" stroke="#92400e" strokeWidth="4" />
          {/* Teeth */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <rect
              key={deg}
              x="67"
              y="53"
              width="16"
              height="16"
              rx="3"
              fill="url(#gearAmberGrad)"
              stroke="#92400e"
              strokeWidth="3"
              transform={`rotate(${deg} 75 105)`}
            />
          ))}
          <circle cx="75" cy="105" r="16" fill="#ffffff" stroke="#92400e" strokeWidth="3" />
          <circle cx="75" cy="105" r="6" fill="#92400e" />
        </motion.g>

        {/* Gear 2 (Medium Red Gear - Interlocking & Struggling) */}
        <motion.g
          animate={{ rotate: [20, -20, 20] }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
          className="origin-[132px_85px]"
        >
          <circle cx="132" cy="85" r="32" fill="url(#gearRedGrad)" stroke="#991b1b" strokeWidth="3.5" />
          {/* Teeth */}
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <rect
              key={deg}
              x="125"
              y="45"
              width="14"
              height="14"
              rx="2.5"
              fill="url(#gearRedGrad)"
              stroke="#991b1b"
              strokeWidth="2.5"
              transform={`rotate(${deg} 132 85)`}
            />
          ))}
          <circle cx="132" cy="85" r="12" fill="#ffffff" stroke="#991b1b" strokeWidth="2.5" />
          <circle cx="132" cy="85" r="5" fill="#991b1b" />
        </motion.g>

        {/* Mechanic Wrench Sticking Out */}
        <motion.g
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="origin-[100px_90px]"
        >
          <path
            d="M 90 95 L 45 45 C 40 40, 32 42, 28 48 C 24 54, 26 62, 32 66 L 78 108 Z"
            fill="#94a3b8"
            stroke="#475569"
            strokeWidth="3"
          />
          {/* Wrench Jaw */}
          <path d="M 28 48 C 22 42 20 32 25 25 C 32 20 42 22 48 28" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
        </motion.g>

        {/* Warning Indicator Plate at Bottom */}
        <rect x="35" y="165" width="130" height="22" rx="7" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
        <text x="100" y="180" fontSize="11" textAnchor="middle" fill="#facc15" fontWeight="black" fontFamily="monospace">
          ⚠️ CONVEYOR JAMMED
        </text>
      </svg>
    </div>
  );
};

