import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, RotateCcw, ArrowRight, UserCheck, Search, ChevronLeft, Check, Sparkles, Database } from 'lucide-react';
import { Student } from '../types';
import { lookupStudentById } from '../data/students';
import { fetchStudentFromSupabase } from '../utils/supabase';
import { SoundEngine } from '../utils/audio';
import { EarthMascot, PetBottleMascot, CanMascot } from './mascots/Mascots';

interface ScreenNumpadProps {
  onStudentVerified: (student: Student) => void;
  onBack: () => void;
}

export const ScreenNumpad: React.FC<ScreenNumpadProps> = ({
  onStudentVerified,
  onBack,
}) => {
  const [pin, setPin] = useState<string>('');
  const [liveData, setLiveData] = useState<Student | null>(null);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState<boolean>(false);

  // 1. Instant 0ms synchronous lookup from 2,906 student roster (zero frame delay)
  const localStudent = useMemo(() => {
    if (pin.length === 5) {
      return lookupStudentById(pin);
    }
    return null;
  }, [pin]);

  // Combined student: Live Supabase data if matches current PIN, otherwise local record
  const student = liveData && liveData.id === pin ? liveData : localStudent;

  // Sound effect & background Supabase live points sync
  useEffect(() => {
    let isCancelled = false;

    if (pin.length === 5) {
      if (localStudent) {
        SoundEngine.playChime();
      } else {
        SoundEngine.playBuzz();
      }

      // Background Supabase fetch for live points & LINE binding
      setIsSearchingSupabase(!localStudent);
      fetchStudentFromSupabase(pin)
        .then(res => {
          if (!isCancelled && res) {
            setLiveData(res);
          }
          if (!isCancelled) {
            setIsSearchingSupabase(false);
          }
        })
        .catch(err => {
          console.warn('[ScreenNumpad] Supabase fetch error:', err);
          if (!isCancelled) {
            setIsSearchingSupabase(false);
          }
        });
    } else {
      setLiveData(null);
      setIsSearchingSupabase(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [pin, localStudent]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 5) {
      SoundEngine.playBeep();
      setPin(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      SoundEngine.playDelete();
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (pin.length > 0) {
      SoundEngine.playDelete();
      setPin('');
    }
  };

  const handleNext = () => {
    if (student) {
      SoundEngine.playBeep();
      onStudentVerified(student);
    }
  };

  return (
    <div
      id="screen-numpad"
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

      {/* Top action row */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={() => {
            SoundEngine.playBeep();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white border border-emerald-200 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-700" />
          <span>ย้อนกลับหน้าแรก</span>
        </button>

        {/* Real Live Database Status Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>ฐานข้อมูล Cloud โรงเรียนสรรพวิทยาคม (2,906 คน)</span>
        </div>
      </div>

      {/* Main Grid: Left is PIN + Student Info, Right is Large Touch Numpad */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 items-center max-w-5xl mx-auto w-full my-auto">
        
        {/* Left Column: PIN Box & Live Student Lookup Card (md:col-span-6) */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-2.5">
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              กรอกรหัสประจำตัวนักเรียน 5 หลัก
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              เพื่อบันทึกแต้มสะสมเข้าบัญชีของคุณ (เชื่อมต่อฐานข้อมูล 2,906 คน)
            </p>
          </div>

          {/* 5-Digit PIN Boxes */}
          <div className="flex items-center gap-2 md:gap-2.5 py-1">
            {[0, 1, 2, 3, 4].map(index => {
              const char = pin[index];
              const isCurrent = pin.length === index;
              return (
                <motion.div
                  key={index}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className={`flex-1 h-13 md:h-15 rounded-2xl flex items-center justify-center font-mono text-2xl md:text-3xl font-black transition-all shadow-xs ${
                    char
                      ? 'bg-emerald-600 text-white border-2 border-emerald-500 shadow-md shadow-emerald-600/20'
                      : isCurrent
                      ? 'bg-white text-emerald-600 border-2 border-emerald-500 ring-4 ring-emerald-200/80'
                      : 'bg-white/80 text-slate-300 border-2 border-dashed border-emerald-300/80'
                  }`}
                >
                  {char || (isCurrent ? '|' : '•')}
                </motion.div>
              );
            })}
          </div>

          {/* Live Student Profile Card upon 5 Digits */}
          <div className="min-h-[100px] flex items-center">
            <AnimatePresence mode="wait">
              {student ? (
                <motion.div
                  key={`found-${student.id}`}
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="w-full bg-white/95 rounded-2xl p-3 md:p-3.5 border-2 border-emerald-400 shadow-md flex items-center justify-between gap-3 text-left relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${student.avatarColor} text-white flex items-center justify-center font-black text-sm shadow-md ring-2 ring-emerald-300/60 shrink-0`}>
                      {student.room}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight">
                          {student.prefix}{student.firstName} {student.lastName}
                        </h3>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                          {student.grade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        เลขที่ {student.seatNumber} • แต้มสะสม: <strong className="text-emerald-700 font-bold">{student.pointsBalance}</strong> แต้ม
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 shrink-0">
                    <PetBottleMascot size={45} action="happy" />
                  </div>
                </motion.div>
              ) : isSearchingSupabase ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="w-full bg-white/90 rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center justify-center gap-2 text-slate-500 text-xs font-bold"
                >
                  <Search className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>กำลังค้นหาข้อมูลนักเรียนจากฐานข้อมูล...</span>
                </motion.div>
              ) : pin.length === 5 ? (
                <motion.div
                  key="not-found"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full bg-rose-50/90 rounded-2xl p-3.5 border border-rose-200 text-rose-700 text-xs font-bold text-center"
                >
                  ไม่พบรหัสนักเรียนในระบบ กรุณาตรวจสอบรหัส 5 หลักอีกครั้ง
                </motion.div>
              ) : (
                <div className="w-full bg-white/60 rounded-2xl p-3 border border-emerald-100 text-slate-400 text-xs font-medium text-center flex items-center justify-center gap-2">
                  <EarthMascot size={36} action="idle" />
                  <span>กดรหัสประจำตัว 5 หลักบนแป้นพิมพ์ด้านขวา</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Tactile Numpad Grid (md:col-span-6) */}
        <div className="md:col-span-6 bg-white/90 backdrop-blur-md rounded-3xl p-3.5 md:p-4 border border-emerald-200/90 shadow-xl flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-2 md:gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleKeyPress(key)}
                className="h-12 md:h-14 rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 hover:text-emerald-800 font-mono text-xl md:text-2xl font-black shadow-xs border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer"
              >
                {key}
              </motion.button>
            ))}

            {/* Clear Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="h-12 md:h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs md:text-sm shadow-xs border border-rose-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ล้าง</span>
            </motion.button>

            {/* Zero Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleKeyPress('0')}
              className="h-12 md:h-14 rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 hover:text-emerald-800 font-mono text-xl md:text-2xl font-black shadow-xs border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer"
            >
              0
            </motion.button>

            {/* Delete / Backspace Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="h-12 md:h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm shadow-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Submit / Confirm Button */}
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <motion.button
              onClick={handleNext}
              disabled={!student}
              whileHover={student ? { scale: 1.02 } : {}}
              whileTap={student ? { scale: 0.98 } : {}}
              className={`w-full py-3 md:py-3.5 rounded-2xl font-black text-sm md:text-base tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                student
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-3d btn-press'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span>ยืนยันข้อมูลและไปขั้นตอนถัดไป</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
};
