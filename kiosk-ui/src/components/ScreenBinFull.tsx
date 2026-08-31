import React from 'react';
import { motion } from 'motion/react';
import { HardwareState } from '../types';
import { AnimatedFullRecycleBin, AnimatedJammedGears } from './mascots/Mascots';

interface ScreenBinFullProps {
  hardwareState: HardwareState;
  onResetBins: () => void;
  onReturnWelcome: () => void;
}

export const ScreenBinFull: React.FC<ScreenBinFullProps> = ({
  hardwareState,
}) => {
  const isJamError = hardwareState.conveyorStatus === 'error' || hardwareState.sensorStage === 'REJECTED';

  return (
    <div
      id="screen-bin-full"
      className="flex-1 w-full h-full flex flex-col justify-center items-center p-3 md:p-5 bg-gradient-to-b from-amber-50 via-rose-50 to-orange-50 text-slate-800 relative overflow-hidden select-none"
    >
      {/* Background Warning Soft Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lockout Card (No interactive buttons - Full Physical Lockout) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 border-2 border-amber-300 shadow-2xl max-w-lg w-full flex flex-col items-center text-center gap-4 relative z-10"
      >
        {/* Centered Hero Animated Visual (Full Bin or Jammed Gears) */}
        <div className="flex items-center justify-center pt-2">
          {isJamError ? (
            <AnimatedJammedGears size={170} />
          ) : (
            <AnimatedFullRecycleBin size={170} />
          )}
        </div>

        {/* Clean Student-Facing Lockout Message */}
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
            {isJamError ? 'เกิดข้อผิดพลาด' : 'ถังขยะเต็ม'}
          </h2>
          
          <p className="text-lg md:text-xl text-rose-600 font-black">
            โปรดติดต่อคณะกรรมการสภานักเรียน
          </p>

          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5 max-w-sm leading-relaxed">
            ตู้ระงับการรับขวดและกระป๋องชั่วคราว ขออภัยในความไม่สะดวกครับ 🌿
          </p>
        </div>
      </motion.div>
    </div>
  );
};
