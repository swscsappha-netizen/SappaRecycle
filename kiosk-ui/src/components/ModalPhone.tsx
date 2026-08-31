import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Delete, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { SoundEngine } from '../utils/audio';
import { EarthMascot } from './mascots/Mascots';

interface ModalPhoneProps {
  student: Student;
  onSavePhone: (phone: string) => void;
  onSkip: () => void;
}

export const ModalPhone: React.FC<ModalPhoneProps> = ({
  student,
  onSavePhone,
  onSkip,
}) => {
  const [phone, setPhone] = useState<string>('');

  const handleKeyPress = (digit: string) => {
    if (phone.length < 10) {
      SoundEngine.playBeep();
      setPhone(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    if (phone.length > 0) {
      SoundEngine.playDelete();
      setPhone(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    SoundEngine.playDelete();
    setPhone('');
  };

  const handleSave = () => {
    if (phone.length === 10) {
      SoundEngine.playChime();
      onSavePhone(phone);
    }
  };

  const handleSkipClick = () => {
    SoundEngine.playBeep();
    onSkip();
  };

  // Format phone: 081-234-5678
  const formatPhone = (val: string) => {
    if (!val) return '';
    if (val.length <= 3) return val;
    if (val.length <= 6) return `${val.slice(0, 3)}-${val.slice(3)}`;
    return `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6, 10)}`;
  };

  return (
    <div
      id="modal-phone"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-2xl rounded-3xl p-4 md:p-5 shadow-2xl border-2 border-emerald-200 relative overflow-hidden"
      >
        {/* Header decoration */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-slate-800">
                ยินดีต้อนรับ! กรอกเบอร์มือถือเพื่อสะสมแต้มบน LINE
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {student.prefix}{student.firstName} {student.lastName} ({student.grade}) • กรอกเบอร์เพื่อรับแต้มบน LINE LIFF
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-3 items-center">
          {/* Left: Input display & Mascots */}
          <div className="md:col-span-6 flex flex-col items-center justify-center space-y-3 text-center">
            {/* Phone Display Box */}
            <div className="w-full bg-slate-50 border-2 border-emerald-400 rounded-2xl p-3 shadow-inner">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                หมายเลขโทรศัพท์ (10 หลัก)
              </label>
              <div className="font-mono text-2xl md:text-3xl font-black text-emerald-700 tracking-wider min-h-[40px] flex items-center justify-center">
                {formatPhone(phone) || (
                  <span className="text-slate-300 font-normal text-xl tracking-normal">
                    กรุณากดเบอร์มือถือ
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {phone.length}/10 หลัก {phone.length === 10 ? '✓ ครบถ้วน' : ''}
              </p>
            </div>

            {/* Mascot message */}
            <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl p-2.5 border border-emerald-200 w-full text-left">
              <EarthMascot size={55} action="happy" />
              <p className="text-[11px] text-emerald-900 leading-snug">
                <strong>เชื่อมต่อเพื่อแลกของรางวัล:</strong> รับแต้มเข้าบัญชี LINE อัตโนมัติ เช็คประวัติได้ทุกที่
              </p>
            </div>
          </div>

          {/* Right: Phone Numpad */}
          <div className="md:col-span-6 bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 rounded-xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 font-black text-lg shadow-sm border border-slate-200 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleClear}
                className="h-12 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold text-xs shadow-sm border border-rose-200 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                title="ล้างทั้งหมด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้าง</span>
              </button>

              <button
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-xl bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 font-black text-lg shadow-sm border border-slate-200 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                0
              </button>

              <button
                onClick={handleDelete}
                className="h-12 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 font-bold text-xs shadow-sm border border-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                title="ลบตัวเลขล่าสุด"
              >
                <Delete className="w-3.5 h-3.5" />
                <span>ลบ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={handleSkipClick}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer active:scale-95"
          >
            ข้าม (ไว้กรอกทีหลัง)
          </button>

          <button
            onClick={handleSave}
            disabled={phone.length !== 10}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer ${
              phone.length === 10
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>บันทึกเบอร์โทร</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
