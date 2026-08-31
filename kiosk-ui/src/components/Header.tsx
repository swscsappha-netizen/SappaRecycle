import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Wifi, Clock, Bell, Sparkles } from 'lucide-react';
import { SoundEngine } from '../utils/audio';
import { Student } from '../types';

interface HeaderProps {
  currentStudent?: Student | null;
  audioMuted: boolean;
  onToggleAudio: () => void;
  onResetSession?: () => void;
  showReset?: boolean;
  onOpenGuide?: () => void;
  showStudentBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  audioMuted,
  onToggleAudio,
  onResetSession,
  showReset = false,
  onOpenGuide,
  showStudentBadge = false,
}) => {
  const [timeStr, setTimeStr] = useState<string>('08:30 AM');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

      const dayName = thaiDays[now.getDay()];
      const dayNum = now.getDate();
      const monthName = thaiMonths[now.getMonth()];
      const thaiYear = now.getFullYear() + 543;

      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');

      setDateStr(`${dayName} ${dayNum} ${monthName} ${thaiYear}`);
      setTimeStr(`${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-transparent px-4 md:px-6 py-3 flex items-center justify-between z-30 shrink-0 h-16">
      {/* Brand Logo & Name (Sappha Recycle) */}
      <div className="flex items-center gap-2.5">
        {/* Modern Eco Flower / Recycle Hexagon Icon */}
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-md flex items-center justify-center text-white ring-2 ring-emerald-300/60 shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            {/* 3-leaf recycling loop */}
            <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
            <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
            <path d="m14 16-3 3 3 3" />
            <path d="M8.294 4.5h7.412a1.83 1.83 0 0 1 1.57.881 1.785 1.785 0 0 1 .004 1.784L13.32 13.5" />
            <path d="m3.5 12 3-5.196 3 5.196" />
            <path d="m20.5 12-3 5.196-3-5.196" />
          </svg>
        </div>

        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base md:text-lg text-slate-900 tracking-tight">
              Sappha Recycle
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full hidden sm:inline-block">
              สรรพวิทยาคม
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium hidden xs:block">
            Smart Recycling Kiosk • สภานักเรียน
          </p>
        </div>
      </div>

      {/* Center: Current Student Badge if enabled */}
      {showStudentBadge && currentStudent && (
        <div className="hidden md:flex items-center gap-2 bg-white/90 backdrop-blur-md border border-emerald-200 px-3.5 py-1 rounded-2xl shadow-xs">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
            {currentStudent.room}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-slate-800">
              {currentStudent.prefix}{currentStudent.firstName} {currentStudent.lastName}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold">
              รหัส {currentStudent.id} • {currentStudent.pointsBalance} แต้ม
            </p>
          </div>
        </div>
      )}

      {/* Right: Guide Button & Frosted Clock Pill */}
      <div className="flex items-center gap-2">
        {onOpenGuide && (
          <button
            onClick={() => {
              SoundEngine.playBeep();
              onOpenGuide();
            }}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="คู่มือการใช้งานและประเภทขยะ"
          >
            <span>💡 คู่มือ</span>
          </button>
        )}

        {/* Frosted Glass Time Pill (Exact match to reference mockup) */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-xs">
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-xs font-bold font-mono text-slate-800 tracking-tight">
            {timeStr}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            ({dateStr})
          </span>
        </div>



        {/* Reset button if in deposit/summary */}
        {showReset && onResetSession && (
          <button
            onClick={onResetSession}
            className="text-xs font-bold bg-white/90 hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            กลับหน้าแรก
          </button>
        )}
      </div>
    </header>
  );
};
