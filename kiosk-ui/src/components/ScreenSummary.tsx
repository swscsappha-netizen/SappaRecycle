import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles, Award, ArrowRight, RotateCcw, CheckCircle2,
  QrCode, ExternalLink, ShieldCheck, Gift
} from 'lucide-react';
import { Student, SessionStats } from '../types';
import { SoundEngine } from '../utils/audio';
import { EarthMascot, PetBottleMascot, CanMascot } from './mascots/Mascots';

interface ScreenSummaryProps {
  student: Student;
  sessionStats: SessionStats;
  onResetToWelcome: () => void;
  onOpenLiffPreview: () => void;
}

export const ScreenSummary: React.FC<ScreenSummaryProps> = ({
  student,
  sessionStats,
  onResetToWelcome,
  onOpenLiffPreview,
}) => {
  const [countdown, setCountdown] = useState<number>(10);
  const totalNewBalance = student.pointsBalance + sessionStats.sessionPoints;

  // Trigger Victory Fanfare sound & Confetti on mount
  useEffect(() => {
    SoundEngine.playFanfare();

    // Fire celebratory confetti cannons
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    // 10-second countdown timer
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onResetToWelcome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onResetToWelcome]);

  const handleManualReset = () => {
    SoundEngine.playBeep();
    onResetToWelcome();
  };

  return (
    <div
      id="screen-summary"
      className="flex-1 flex flex-col justify-between p-3 md:p-5 relative overflow-hidden bg-gradient-to-b from-[#eaf7ee] via-[#e2f5e7] to-[#d3edd8] select-none"
    >
      {/* Background Soft Hills */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto min-h-[160px] object-cover"
        >
          <path
            d="M0,160 C420,90 920,220 1440,140 L1440,280 L0,280 Z"
            fill="#c4e6cc"
            fillOpacity="0.5"
          />
          <path
            d="M0,210 C380,160 980,240 1440,180 L1440,280 L0,280 Z"
            fill="#b4debd"
            fillOpacity="0.6"
          />
        </svg>
      </div>

      {/* Top Banner: Success Header */}
      <div className="relative z-10 text-center max-w-xl mx-auto pt-1">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shadow-xs border border-emerald-300 mb-1"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>บันทึกแต้มเข้าสู่ Cloud สภานักเรียนสำเร็จ 🎉</span>
        </motion.div>

        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          ยอดเยี่ยมมาก! คุณได้ช่วยโรงเรียนลดขยะ
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          {student.prefix}{student.firstName} {student.lastName} (ชั้น {student.grade}) • รหัส {student.id}
        </p>
      </div>

      {/* Main Grid: Breakdown & Mascot Trio & LINE Recommendation */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 max-w-5xl mx-auto w-full my-auto items-center">
        
        {/* Left Column: Breakdown Grid (md:col-span-7) */}
        <div className="md:col-span-7 space-y-2.5">
          
          <div className="grid grid-cols-2 gap-2.5">
            {/* PET Total */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-sky-200 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl shrink-0">
                🧴
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-500 font-semibold block">ขวดพลาสติก PET</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {sessionStats.petCount} <span className="text-xs font-normal text-slate-500">ขวด</span>
                </span>
              </div>
            </div>

            {/* CAN Total */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-orange-200 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-xl shrink-0">
                🥫
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-500 font-semibold block">กระป๋อง CAN</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {sessionStats.canCount} <span className="text-xs font-normal text-slate-500">ใบ</span>
                </span>
              </div>
            </div>
          </div>

          {/* Deposited Brands Pill List */}
          {sessionStats.items.filter(i => i.brand && i.type !== 'REJECT').length > 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-emerald-100 shadow-xs flex flex-wrap items-center gap-1.5 text-left">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide mr-1">
                🏷️ แบรนด์ที่ตรวจพบ:
              </span>
              {sessionStats.items
                .filter(i => i.brand && i.type !== 'REJECT')
                .slice(0, 5)
                .map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                      item.type === 'PET'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span>{item.brandIcon || '✨'}</span>
                    <span>{item.brand}</span>
                  </span>
                ))}
            </div>
          )}

          {/* Points Earned & Total Balance Highlight Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-3xl p-3.5 shadow-lg flex items-center justify-between border-2 border-emerald-300">
            <div className="text-left">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wide block">
                แต้มที่ได้รับเพิ่มในรอบนี้
              </span>
              <div className="text-2xl md:text-3xl font-black text-amber-300 font-mono flex items-center gap-1.5">
                <Award className="w-6 h-6 fill-amber-300" />
                +{sessionStats.sessionPoints} <span className="text-sm font-bold text-white">แต้ม</span>
              </div>
            </div>

            <div className="h-10 w-[1px] bg-emerald-400/50" />

            <div className="text-right">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wide block">
                ยอดแต้มสะสมรวมล่าสุด
              </span>
              <div className="text-2xl md:text-3xl font-black text-white font-mono">
                {totalNewBalance} <span className="text-sm font-bold text-emerald-200">แต้ม</span>
              </div>
            </div>
          </div>

          {/* LINE LIFF Recommendation Box */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-emerald-200 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#06C755] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                LINE
              </div>
              <div className="text-left leading-tight">
                <h4 className="text-xs font-extrabold text-slate-800">
                  เปิด LINE เพื่อเช็คแต้มและแลกของรางวัล
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  ที่ห้องสภานักเรียน โรงเรียนสรรพวิทยาคม
                </p>
              </div>
            </div>

            <button
              onClick={onOpenLiffPreview}
              className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>ดูตัวอย่าง LIFF</span>
            </button>
          </div>

        </div>

        {/* Right Column: Mascots Celebrating (md:col-span-5) */}
        <div className="relative z-10 md:col-span-5 flex flex-col items-center justify-center text-center">
          <div className="flex items-end justify-center gap-2">
            <EarthMascot size={85} action="celebrate" speechText="เก่งมากครับ!" />
            <PetBottleMascot size={70} action="celebrate" />
            <CanMascot size={70} action="celebrate" />
          </div>

          <div className="mt-2 text-xs font-bold text-emerald-800 bg-white/90 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
            🌱 ขยะถูกนำไปแปรรูปรักษ์โลกเรียบร้อยแล้ว
          </div>
        </div>

      </div>

      {/* Bottom Footer: Countdown auto reset & manual button */}
      <div className="relative z-10 flex items-center justify-between border-t border-emerald-200/80 pt-2.5 max-w-5xl mx-auto w-full">
        {/* Countdown Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono flex items-center justify-center text-xs">
            {countdown}
          </div>
          <span>กำลังรีเซ็ตกลับหน้าแรกใน {countdown} วินาที...</span>
        </div>

        {/* Return to Home Button */}
        <button
          onClick={handleManualReset}
          className="px-6 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs md:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>กลับหน้าแรกทันที</span>
        </button>
      </div>
    </div>
  );
};

