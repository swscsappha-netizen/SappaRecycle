import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Award, QrCode, Gift, History, ChevronRight, Check } from 'lucide-react';
import { Student } from '../types';
import { EarthMascot, PetBottleMascot, CanMascot } from './mascots/Mascots';

interface LiffPreviewModalProps {
  student: Student | null;
  onClose: () => void;
}

export const LiffPreviewModal: React.FC<LiffPreviewModalProps> = ({
  student,
  onClose,
}) => {
  if (!student) return null;

  const rewards = [
    { title: 'ปากกาหมึกเจลรักษ์โลก', points: 50, icon: '🖊️', stock: 'มีของ' },
    { title: 'สมุดโน้ตกระดาษรีไซเคิล', points: 100, icon: '📓', stock: 'มีของ' },
    { title: 'คูปองสหกรณ์โรงเรียน 20 บาท', points: 150, icon: '🏷️', stock: 'ยอดฮิต' },
    { title: 'กระบอกน้ำเก็บความเย็น Mascot', points: 350, icon: '🥤', stock: 'เหลือน้อย' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 flex flex-col max-h-[92vh]"
      >
        {/* LINE Mini-App Top Bar */}
        <div className="bg-[#06C755] text-white px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs bg-white text-[#06C755] px-1.5 py-0.5 rounded">LIFF</span>
            <span className="text-xs font-bold">ธนาคารขยะ สภานักเรียน ส.ว.ค.</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LIFF Scrollable Content */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
          {/* Student Green Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-xl -mr-6 -mt-6" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">
                  บัตรสมาชิกรักษ์โลก
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  {student.prefix}{student.firstName} {student.lastName}
                </h3>
                <p className="text-xs text-emerald-100">
                  ชั้น {student.grade} • รหัส {student.id}
                </p>
              </div>
              <EarthMascot size={45} action="happy" />
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-200 block">แต้มสะสมทั้งหมด</span>
                <span className="text-2xl font-black font-mono text-amber-300">
                  {student.pointsBalance} <span className="text-xs text-white">แต้ม</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 block">เบอร์ที่ผูกไว้</span>
                <span className="text-xs font-mono font-bold text-white">
                  {student.phone || 'ยังไม่ระบุเบอร์'}
                </span>
              </div>
            </div>
          </div>

          {/* Mascot cheer */}
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
            <PetBottleMascot size={35} action="happy" />
            <p className="text-[11px] text-emerald-900 leading-tight">
              หยอดขวดทุกครั้ง แต้มจะอัปเดตบน LINE นี้แบบเรียลไทม์ทันที!
            </p>
          </div>

          {/* Reward Catalog */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                ของรางวัลที่แลกได้ (ห้องสภานักเรียน)
              </span>
            </div>

            <div className="space-y-1.5">
              {rewards.map((reward, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{reward.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{reward.title}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">สต็อก: {reward.stock}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 block">
                      {reward.points} แต้ม
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LIFF Footer */}
        <div className="bg-white border-t border-slate-200 p-2.5 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
          >
            ปิดหน้าต่าง LINE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
