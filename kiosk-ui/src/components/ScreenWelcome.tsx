import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, QrCode, ArrowUpRight, Zap, Droplets, Coffee, Award, Check } from 'lucide-react';
import { EarthMascot, PetBottleMascot, CanMascot } from './mascots/Mascots';
import { SoundEngine } from '../utils/audio';

interface ScreenWelcomeProps {
  onStartFlow: () => void;
  onOpenGuide?: () => void;
}

export const ScreenWelcome: React.FC<ScreenWelcomeProps> = ({ onStartFlow, onOpenGuide }) => {
  const handleStart = () => {
    SoundEngine.playBeep();
    onStartFlow();
  };

  return (
    <div
      id="screen-welcome"
      className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-b from-[#eaf7ee] via-[#e2f5e7] to-[#d3edd8] px-4 md:px-8 py-2 md:py-4 select-none"
    >
      {/* Background Floating Eco Accents */}
      <div className="absolute top-4 left-8 w-10 h-10 rounded-full bg-emerald-300/30 flex items-center justify-center text-emerald-600/70 pointer-events-none">
        <Zap className="w-5 h-5 fill-emerald-500/40 text-emerald-600/60" />
      </div>

      <div className="absolute top-8 right-12 text-2xl opacity-40 pointer-events-none rotate-12 animate-pulse">
        🍃
      </div>

      <div className="absolute top-36 right-16 text-xl opacity-35 pointer-events-none -rotate-12">
        🌿
      </div>

      <div className="absolute bottom-24 left-20 text-3xl opacity-25 pointer-events-none rotate-45 text-emerald-800">
        ♻️
      </div>

      {/* Decorative Rolling Lush Green Hills (SVG Curved Layers) */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto min-h-[180px] object-cover"
        >
          {/* Back Soft Hill */}
          <path
            d="M0,192 C320,120 720,260 1440,160 L1440,380 L0,380 Z"
            fill="#c4e6cc"
            fillOpacity="0.6"
          />
          {/* Middle Hill */}
          <path
            d="M0,240 C480,180 960,290 1440,210 L1440,380 L0,380 Z"
            fill="#b4debd"
            fillOpacity="0.75"
          />
          {/* Front Hill */}
          <path
            d="M0,280 C360,230 1080,240 1440,260 L1440,380 L0,380 Z"
            fill="#a4d7af"
            fillOpacity="0.5"
          />
        </svg>
      </div>

      {/* Unified Compact Center Stack (No huge gap, no clipping) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-2.5 md:gap-3.5 my-auto pb-4">
        
        {/* Animated Earth Mascot Cheering at Top */}
        <div className="flex items-center justify-center -mb-1 pt-1">
          <EarthMascot
            size={76}
            action="wave"
            speechText="ยินดีต้อนรับสู่ Sappha Recycle! 🌱"
          />
        </div>

        {/* Big Bold Headline: Turn Trash into Treasure */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.08] drop-shadow-xs"
          >
            Turn Trash<br />into Treasure
          </motion.h1>
        </div>

        {/* Subtitle Pill Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl px-5 py-2 shadow-sm border border-emerald-200/80 max-w-lg mx-auto text-center"
        >
          <p className="text-xs md:text-sm font-bold text-slate-700 tracking-tight leading-snug">
            Scan your student ID to start recycling and earn points for rewards.
          </p>
          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5 leading-tight">
            กรอกรหัสนักเรียน 5 หลักเพื่อเริ่มสะสมแต้มแลกของรางวัล
          </p>
        </motion.div>

        {/* Vibrant Green CTA Button: [ ⛶ TAP TO START 👆 ] */}
        <div className="pt-0.5">
          <motion.button
            id="btn-start-flow"
            onClick={handleStart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={{
              boxShadow: [
                '0 6px 16px -4px rgba(16, 185, 129, 0.45)',
                '0 12px 24px -4px rgba(16, 185, 129, 0.75)',
                '0 6px 16px -4px rgba(16, 185, 129, 0.45)',
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
            className="px-8 md:px-12 py-2.5 md:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base md:text-lg tracking-wider uppercase shadow-xl flex items-center justify-center gap-3 border-2 border-emerald-300/60 mx-auto cursor-pointer active:brightness-95 transition-all"
          >
            {/* QR / Scanner icon */}
            <div className="w-5 h-5 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>

            <span>TAP TO START</span>

            {/* Hand Tap icon */}
            <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74a4.5 4.5 0 0 0-9 0c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26a1.5 1.5 0 0 0-1.46.06L11.5 14.5v-7a1.5 1.5 0 0 0-3 0v9.55l-2.42-.51a1.5 1.5 0 0 0-1.57.69l-.75 1.25 5.6 5.6A4.5 4.5 0 0 0 12.54 25h4.92a4.5 4.5 0 0 0 4.41-3.62l.8-4.2a1.5 1.5 0 0 0-.83-1.31z" />
              </svg>
            </div>
          </motion.button>
        </div>

        {/* Bottom Cards: Plastic Bottles & Aluminum Cans with Mascots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-3xl w-full mt-1">
          
          {/* Card 1: Plastic Bottles (PET) */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={onOpenGuide || handleStart}
            className="bg-[#f0f8ff]/95 backdrop-blur-md rounded-2xl p-3 md:p-3.5 border border-sky-200/90 shadow-sm flex items-center justify-between relative overflow-hidden group cursor-pointer"
          >
            {/* Subtle Watermark Bottle silhouette */}
            <div className="absolute right-2 -bottom-3 text-sky-200/35 pointer-events-none font-black text-6xl select-none">
              🧴
            </div>

            <div className="flex items-center gap-3 relative z-10">
              {/* Blue Glossy Squircle Icon */}
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-500/25 shrink-0 ring-2 ring-sky-300/60">
                <Droplets className="w-6 h-6 fill-white text-white" />
              </div>

              {/* Text & Points Pill */}
              <div className="text-left">
                <h3 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                  Plastic Bottles
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Clear, clean bottles (PET)
                </p>

                {/* Gold Points Pill */}
                <div className="mt-1 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[11px] font-black text-amber-700">
                    10 Points / item
                  </span>
                </div>
              </div>
            </div>

            {/* Peeking Mini PET Bottle Mascot */}
            <div className="relative z-10 shrink-0 ml-1">
              <PetBottleMascot size={48} action="happy" />
            </div>
          </motion.div>

          {/* Card 2: Aluminum Cans (CAN) */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={onOpenGuide || handleStart}
            className="bg-[#fff8f0]/95 backdrop-blur-md rounded-2xl p-3 md:p-3.5 border border-orange-200/90 shadow-sm flex items-center justify-between relative overflow-hidden group cursor-pointer"
          >
            {/* Subtle Watermark Can silhouette */}
            <div className="absolute right-2 -bottom-3 text-orange-200/35 pointer-events-none font-black text-6xl select-none">
              🥫
            </div>

            <div className="flex items-center gap-3 relative z-10">
              {/* Orange Glossy Squircle Icon */}
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-sm shadow-orange-500/25 shrink-0 ring-2 ring-orange-300/60">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M5 4h14a1 1 0 0 1 1 1v2H4V5a1 1 0 0 1 1-1zm15 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8h16zM9 11v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0zm4 0v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0z" />
                </svg>
              </div>

              {/* Text & Points Pill */}
              <div className="text-left">
                <h3 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                  Aluminum Cans
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Empty, uncrushed cans
                </p>

                {/* Gold Points Pill */}
                <div className="mt-1 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[11px] font-black text-amber-700">
                    20 Points / item
                  </span>
                </div>
              </div>
            </div>

            {/* Peeking Mini CAN Mascot */}
            <div className="relative z-10 shrink-0 ml-1">
              <CanMascot size={48} action="happy" />
            </div>
          </motion.div>

        </div>

      </div>

    </div>
  );
};
