import React from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, XCircle, AlertCircle, Droplets, Sparkles, BookOpen } from 'lucide-react';
import { EarthMascot, PetBottleMascot, CanMascot } from './mascots/Mascots';
import { SoundEngine } from '../utils/audio';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  confirmText = 'เข้าใจแล้ว เริ่มต้นหยอดขวดเลย ➔',
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    SoundEngine.playBeep();
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        className="bg-white/95 backdrop-blur-md rounded-3xl p-5 md:p-6 border-2 border-emerald-200 shadow-2xl max-w-2xl w-full flex flex-col gap-4 relative overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                คำแนะนำการใช้งานและประเภทขยะรีไซเคิล
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                โรงเรียนสรรพวิทยาคม • Sappha Recycle Eco Guide
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Step Instructions */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-sky-50/80 rounded-2xl p-2.5 border border-sky-200/80 text-center flex flex-col items-center justify-between">
            <div className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center mb-1">1</div>
            <Droplets className="w-6 h-6 text-sky-600 my-0.5" />
            <h4 className="text-xs font-black text-sky-900">เทน้ำออกให้หมด</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">ขวดสะอาด ไม่เปื้อนเศษอาหาร</p>
          </div>

          <div className="bg-emerald-50/80 rounded-2xl p-2.5 border border-emerald-200/80 text-center flex flex-col items-center justify-between">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center mb-1">2</div>
            <Sparkles className="w-6 h-6 text-emerald-600 my-0.5" />
            <h4 className="text-xs font-black text-emerald-900">หยอดทีละ 1 ชิ้น</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">วางลงในช่องรับตรงกลาง</p>
          </div>

          <div className="bg-amber-50/80 rounded-2xl p-2.5 border border-amber-200/80 text-center flex flex-col items-center justify-between">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center mb-1">3</div>
            <CheckCircle2 className="w-6 h-6 text-amber-600 my-0.5" />
            <h4 className="text-xs font-black text-amber-900">รับแต้มสะสม</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">แต้มเข้าบัญชี LINE อัตโนมัติ</p>
          </div>
        </div>

        {/* Accepted vs Rejected Items Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {/* Accepted List */}
          <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-200 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 pb-1 border-b border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ประเภทขยะที่ตู้รับ (Accepted)</span>
            </div>
            <ul className="text-[11px] text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="text-sm">🧴</span>
                <span><strong>ขวดพลาสติกใส PET</strong> (+10 แต้ม)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sm">🥫</span>
                <span><strong>กระป๋องอะลูมิเนียม CAN</strong> (+20 แต้ม)</span>
              </li>
              <li className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg inline-block">
                ✓ มีฝาหรือไม่มีฝาก็หยอดได้
              </li>
            </ul>
          </div>

          {/* Rejected List */}
          <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-200 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 pb-1 border-b border-rose-200">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>ประเภทที่ไม่รองรับ (Reject)</span>
            </div>
            <ul className="text-[11px] text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center gap-1.5 text-rose-800">
                <span>🚫</span>
                <span><strong>ขวดแก้ว / กระเบื้อง</strong></span>
              </li>
              <li className="flex items-center gap-1.5 text-rose-800">
                <span>🚫</span>
                <span><strong>กล่องนม / กล่องน้ำผลไม้ UHT</strong></span>
              </li>
              <li className="flex items-center gap-1.5 text-rose-800">
                <span>🚫</span>
                <span><strong>แก้วพลาสติก / ถุงขยะ / ขยะเปียก</strong></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mascot Encouragement */}
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center gap-3">
          <EarthMascot size={46} action="happy" />
          <p className="text-xs text-slate-700 font-bold leading-tight">
            "ช่วยกันคัดแยกขยะให้ถูกประเภท เพื่อโรงเรียนสรรพวิทยาคมที่สะอาดและน่าอยู่ครับ! 🌿✨"
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-md btn-press transition-all cursor-pointer"
        >
          เข้าใจแล้ว เริ่มต้นใช้งานเลย ➔
        </button>
      </motion.div>
    </div>
  );
};
