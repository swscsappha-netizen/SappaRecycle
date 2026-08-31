import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, CheckCircle, AlertTriangle, ArrowRight,
  Zap, Award, Droplets, ArrowDown, Check, X, ShieldAlert,
  Search, Scan, Radio, RefreshCw, ChevronDown
} from 'lucide-react';
import { Student, DepositItem, SessionStats, HardwareState } from '../types';
import { SoundEngine } from '../utils/audio';
import { EarthMascot, PetBottleMascot, CanMascot } from './mascots/Mascots';

interface ScreenDepositProps {
  student: Student;
  sessionStats: SessionStats;
  hardwareState: HardwareState;
  onItemDeposited: (item: DepositItem) => void;
  onFinishDeposit: () => void;
  onSimulateConveyorState: (status: HardwareState['conveyorStatus']) => void;
}

export const ScreenDeposit: React.FC<ScreenDepositProps> = ({
  student,
  sessionStats,
  hardwareState,
  onItemDeposited,
  onFinishDeposit,
  onSimulateConveyorState,
}) => {
  const currentStage = hardwareState.sensorStage || 'WAITING_OBJECT';
  const lastItem = sessionStats.items[0];

  const handleFinish = () => {
    SoundEngine.playBeep();
    onFinishDeposit();
  };

  return (
    <div
      id="screen-deposit"
      className="flex-1 w-full h-full flex flex-col justify-between p-2 md:p-3 bg-gradient-to-b from-[#eaf7ee] via-[#e2f5e7] to-[#d3edd8] text-slate-800 relative overflow-hidden select-none"
    >
      {/* Decorative Rolling Lush Green Hills Background */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto min-h-[160px] object-cover"
        >
          <path
            d="M0,192 C320,120 720,260 1440,160 L1440,380 L0,380 Z"
            fill="#c4e6cc"
            fillOpacity="0.45"
          />
          <path
            d="M0,240 C480,180 960,290 1440,210 L1440,380 L0,380 Z"
            fill="#b4debd"
            fillOpacity="0.6"
          />
        </svg>
      </div>

      {/* Main Expansive Grid: Fill 100% Height & Width Perfectly Fitted in Safe Area */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-3 items-stretch relative z-10 overflow-hidden">
        
        {/* Left Column: Full-Height Sensor-Driven Interactive Visual Stage (md:col-span-7) */}
        <div className="md:col-span-7 flex flex-col h-full">
          
          {/* Animated Interactive Stage */}
          <div className="flex-1 w-full h-full bg-gradient-to-b from-white/95 via-emerald-50/50 to-teal-50/70 rounded-3xl border-2 border-emerald-300 shadow-lg overflow-hidden flex flex-col justify-between p-3.5 md:p-4">
            
            {/* Top Stage Sub-Banner */}
            <div className="flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs text-xs font-black text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ช่องรับขวดรีไซเคิลอัตโนมัติ (Intake Slot)</span>
              </div>

              {/* Sensor Status Pill */}
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 shadow-xs">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>เซนเซอร์อินฟราเรด: พร้อมใช้งาน 🟢</span>
              </div>
            </div>

            {/* Center Dynamic Animation Area: VERTICAL STACK (Animation Top, Clean Headline Bottom) */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-auto py-1">
              <AnimatePresence mode="wait">
                
                {/* Stage 1: WAITING_OBJECT (นำขวดมาหยอดลงช่อง) */}
                {currentStage === 'WAITING_OBJECT' && (
                  <motion.div
                    key="stage-waiting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-3 text-center w-full"
                  >
                    {/* Visual: Hand Dropping Bottle into Glowing Funnel Slot */}
                    <div className="relative flex flex-col items-center justify-center pt-2">
                      {/* Bottle Dropping Animation */}
                      <motion.div
                        animate={{ y: [-18, 6, -18], rotate: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                        className="relative z-10 flex flex-col items-center"
                      >
                        {/* Cartoon Hand & Bottle Illustration */}
                        <div className="text-8xl md:text-9xl filter drop-shadow-xl select-none relative">
                          🧴
                          {/* Animated Action Arrow pointing down into slot */}
                          <motion.div
                            animate={{ y: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white p-1 rounded-full shadow-md border border-white"
                          >
                            <ArrowDown className="w-5 h-5" />
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Wide Glowing Intake Portal Slot with Single-Line Text */}
                      <motion.div
                        animate={{ scale: [0.97, 1.05, 0.97] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="px-5 py-1.5 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 rounded-full border-3 border-emerald-600 flex items-center justify-center shadow-lg mt-3 z-0"
                      >
                        <div className="flex items-center gap-2 text-emerald-950 font-black text-xs md:text-sm tracking-wide whitespace-nowrap">
                          <ArrowDown className="w-4 h-4 text-emerald-900 animate-bounce shrink-0" />
                          <span>ช่องรับขวดด้านหน้า</span>
                          <ArrowDown className="w-4 h-4 text-emerald-900 animate-bounce shrink-0" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Headline & Clean Subtitle */}
                    <div className="flex flex-col items-center max-w-md mt-1">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                        กรุณานำขวดหรือกระป๋องมาวาง
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        วางลงในช่องรับด้านหน้าทีละ 1 ชิ้น เพื่อเริ่มการคัดแยกอัตโนมัติ 🌿
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Stage 2: OBJECT_DETECTED (กล้อง AI สแกนประเภทขวด) */}
                {currentStage === 'OBJECT_DETECTED' && (
                  <motion.div
                    key="stage-scanning"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-3 text-center w-full"
                  >
                    {/* Visual: AI Camera Scanning Frame with Laser Grid */}
                    <div className="relative p-6 bg-gradient-to-b from-amber-50 to-amber-100/90 border-3 border-amber-400 rounded-3xl shadow-xl flex flex-col items-center justify-center">
                      {/* AI Reticle Corner Markers */}
                      <div className="absolute top-2 left-2 text-amber-600 font-mono text-xs font-black">┌ AI CAMERA</div>
                      <div className="absolute top-2 right-2 text-amber-600 font-mono text-xs font-black">┐</div>
                      <div className="absolute bottom-2 left-2 text-amber-600 font-mono text-xs font-black">└ SCAN: 99.4%</div>
                      <div className="absolute bottom-2 right-2 text-amber-600 font-mono text-xs font-black">┘</div>

                      <div className="relative text-8xl md:text-9xl filter drop-shadow-md overflow-hidden p-2">
                        🧴
                        {/* Bright Glowing Laser Beam */}
                        <motion.div
                          animate={{ y: [-50, 50, -50] }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                          className="absolute inset-x-0 h-2.5 bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,1)]"
                        />
                      </div>

                      {/* AI Detection Pill Badge */}
                      <div className="mt-2 bg-amber-500 text-white font-mono text-xs font-black px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                        <Scan className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังจำแนกประเภท: ขวดพลาสติกใส PET</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="flex flex-col items-center max-w-md mt-1">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                        กำลังสแกนและวิเคราะห์ประเภท...
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        กล้อง AI Vision กำลังจำแนกประเภทและแบรนด์เครื่องดื่ม
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Stage 3: CHECKING_LIQUID (ตรวจสอบน้ำตกค้างในขวด) */}
                {currentStage === 'CHECKING_LIQUID' && (
                  <motion.div
                    key="stage-liquid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-3 text-center w-full"
                  >
                    {/* Visual: Bottle Moisture & Liquid Level Inspection */}
                    <div className="relative p-6 bg-gradient-to-b from-sky-50 to-sky-100 border-3 border-sky-400 rounded-3xl shadow-xl flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-8xl md:text-9xl filter drop-shadow-md">
                          🧴
                        </div>
                        <motion.div
                          animate={{ y: [-6, 6, -6], scale: [0.95, 1.1, 0.95] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                          className="w-16 h-16 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg border-2 border-sky-300"
                        >
                          <Droplets className="w-10 h-10 fill-white animate-pulse" />
                        </motion.div>
                      </div>

                      {/* Cleanliness Status Pill */}
                      <div className="mt-2 bg-sky-600 text-white font-black text-xs px-4 py-1 rounded-full flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>เซนเซอร์ตรวจความชื้น: ขยะสะอาด ไม่มีน้ำตกค้าง ✓</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="flex flex-col items-center max-w-md mt-1">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                        กำลังตรวจเช็คของเหลวตกค้าง...
                      </h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        ตรวจสอบว่าไม่มีน้ำหรือเศษอาหารปนเปื้อนภายในขวด
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Stage 4A: SORTING_PET (คัดแยกขวด PET ลงถังสำเร็จ + รับแต้ม) */}
                {currentStage === 'SORTING_PET' && (
                  <motion.div
                    key="stage-sorting-pet"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 text-center w-full"
                  >
                    {/* Visual: Bottle Entering Recycle Bin with Points Burst */}
                    <div className="relative flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, -8, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      >
                        <PetBottleMascot size={135} action="celebrate" />
                      </motion.div>
                    </div>

                    {/* Points Banner Fanfare */}
                    <div className="bg-gradient-to-r from-sky-500 to-teal-600 text-white font-black px-7 py-3 rounded-3xl shadow-2xl border-3 border-sky-300 flex flex-col items-center max-w-md">
                      <div className="flex items-center gap-1.5 text-xs bg-sky-700/80 px-3 py-0.5 rounded-full mb-1">
                        <span>{lastItem?.brandIcon || '💧'}</span>
                        <span>{lastItem?.brand || 'ขวดพลาสติกใส PET'}</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-black text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-7 h-7 fill-amber-300 animate-spin" />
                        <span>คัดแยกสำเร็จ! +10 แต้ม 🎉</span>
                      </div>
                      <span className="text-xs text-sky-100 mt-1 font-medium">
                        🟢 สายพานกำลังลำเลียงขวดเข้าถังพลาสติกรีไซเคิล
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Stage 4B: SORTING_CAN (คัดแยกกระป๋อง CAN ลงถังสำเร็จ + รับแต้ม) */}
                {currentStage === 'SORTING_CAN' && (
                  <motion.div
                    key="stage-sorting-can"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 text-center w-full"
                  >
                    {/* Visual: Can Entering Recycle Bin with Points Burst */}
                    <div className="relative flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, -8, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      >
                        <CanMascot size={135} action="celebrate" />
                      </motion.div>
                    </div>

                    {/* Points Banner Fanfare */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black px-7 py-3 rounded-3xl shadow-2xl border-3 border-amber-300 flex flex-col items-center max-w-md">
                      <div className="flex items-center gap-1.5 text-xs bg-amber-700/80 px-3 py-0.5 rounded-full mb-1">
                        <span>{lastItem?.brandIcon || '🥫'}</span>
                        <span>{lastItem?.brand || 'กระป๋องอะลูมิเนียม CAN'}</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                        <Sparkles className="w-7 h-7 fill-white animate-spin" />
                        <span>คัดแยกสำเร็จ! +20 แต้ม 🎉</span>
                      </div>
                      <span className="text-xs text-amber-100 mt-1 font-medium">
                        🟠 สายพานกำลังลำเลียงกระป๋องเข้าถังโลหะรีไซเคิล
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Stage 5: REJECTED (ส่งคืนขวด: มีน้ำหรือขยะแปลกปลอม) */}
                {currentStage === 'REJECTED' && (
                  <motion.div
                    key="stage-rejected"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 text-center w-full"
                  >
                    {/* Visual: Bottle Pouring Out Water / Reject Sign */}
                    <div className="p-5 bg-rose-100 border-3 border-rose-400 rounded-3xl shadow-xl flex items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-3xl shadow-md">
                        <AlertTriangle className="w-10 h-10 animate-bounce" />
                      </div>
                      <div className="text-6xl md:text-7xl filter drop-shadow-md">
                        🫗
                      </div>
                    </div>

                    {/* Warning Card */}
                    <div className="bg-rose-50 border-3 border-rose-400 p-4 rounded-3xl shadow-md max-w-md text-center">
                      <h3 className="text-lg md:text-xl font-black text-rose-900">
                        ⚠️ ตรวจพบน้ำตกค้าง หรือขยะไม่รองรับ
                      </h3>
                      <p className="text-xs text-rose-600 font-medium mt-1">
                        กรุณานำขวดออกจากช่องรับ และเทน้ำออกให้หมดก่อนหยอดใหม่อีกครั้งครับ 🌿
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Bottom Animated Mechanical Conveyor Belt with Rollers */}
            <div className="z-20 flex items-center justify-between bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-200 shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-slate-700">
                <span className="text-slate-500">สถานะสายพาน:</span>
                {hardwareState.conveyorStatus === 'forward' ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    กำลังเดินหน้า 🟢 [FORWARD]
                  </span>
                ) : hardwareState.conveyorStatus === 'reverse_reject' ? (
                  <span className="flex items-center gap-1.5 text-rose-700 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    กำลังส่งคืน 🔴 [REVERSE]
                  </span>
                ) : (
                  <span className="text-emerald-700 font-mono font-bold">พร้อมรับขยะ [STANDBY]</span>
                )}
              </div>

              {/* Animated conveyor rollers */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                  <motion.div
                    key={i}
                    animate={
                      hardwareState.conveyorStatus === 'forward'
                        ? { rotate: 360 }
                        : hardwareState.conveyorStatus === 'reverse_reject'
                        ? { rotate: -360 }
                        : {}
                    }
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-emerald-400 bg-emerald-100 flex items-center justify-center shadow-xs"
                  >
                    <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Student Profile & Expansive Live Counters & Finish Button (md:col-span-5) */}
        <div className="md:col-span-5 flex flex-col justify-between h-full gap-1.5 md:gap-2">
          
          {/* Top of Right Column: Student Profile Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 md:p-3 border-2 border-emerald-200 shadow-xs flex items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${student.avatarColor} text-white flex items-center justify-center font-black text-xs shadow-xs`}>
                  {student.room}
                </div>
                {student.isLineLinked && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06C755] text-white rounded-full flex items-center justify-center shadow-xs border border-white text-[9px] font-black">
                    💬
                  </div>
                )}
              </div>

              <div className="text-left leading-tight">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs md:text-sm font-black text-slate-900">
                    {student.prefix}{student.firstName} {student.lastName}
                  </h3>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-full">
                    {student.grade}
                  </span>
                  {student.isLineLinked && (
                    <span className="text-[9px] font-black bg-[#06C755]/15 text-[#008f37] border border-[#06C755]/40 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06C755] animate-pulse" />
                      LINE ผูกแล้ว
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  รหัส {student.id} • เลขที่ {student.seatNumber} • สะสมเดิม: <strong className="text-emerald-700 font-bold">{student.pointsBalance}</strong> แต้ม
                </p>
              </div>
            </div>
          </div>

          {/* Live Counters Grid */}
          <div className="flex-1 flex flex-col justify-between gap-1.5 md:gap-2">
            
            {/* PET Counter Card */}
            <div className="flex-1 bg-white/95 rounded-2xl p-2.5 md:p-3 border-2 border-sky-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                  <Droplets className="w-5 h-5 fill-white text-white" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-black text-slate-800">ขวดพลาสติกใส PET</h4>
                  <p className="text-[11px] text-sky-700 font-bold">+10 แต้ม / ขวด</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl md:text-3xl font-black text-sky-600 font-mono leading-none">
                  {sessionStats.petCount} <span className="text-xs font-normal text-slate-500">ขวด</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  +{sessionStats.petCount * 10} แต้ม
                </div>
              </div>
            </div>

            {/* CAN Counter Card */}
            <div className="flex-1 bg-white/95 rounded-2xl p-2.5 md:p-3 border-2 border-amber-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M5 4h14a1 1 0 0 1 1 1v2H4V5a1 1 0 0 1 1-1zm15 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8h16zM9 11v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0zm4 0v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-black text-slate-800">กระป๋องอะลูมิเนียม CAN</h4>
                  <p className="text-[11px] text-amber-700 font-bold">+20 แต้ม / ใบ</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl md:text-3xl font-black text-amber-600 font-mono leading-none">
                  {sessionStats.canCount} <span className="text-xs font-normal text-slate-500">ใบ</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  +{sessionStats.canCount * 20} แต้ม
                </div>
              </div>
            </div>

            {/* Total Summary Box */}
            <div className="flex-1 bg-emerald-50/90 rounded-2xl p-2.5 md:p-3 border-2 border-emerald-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wide block">รวมที่หยอดรอบนี้</span>
                <div className="text-xs md:text-sm text-slate-700 font-bold">
                  {sessionStats.petCount + sessionStats.canCount} ชิ้นสำเร็จ
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wide block">แต้มที่ได้รับ</span>
                <div className="text-2xl md:text-3xl font-black text-emerald-700 font-mono leading-none">
                  +{sessionStats.sessionPoints} <span className="text-xs font-bold text-emerald-800">แต้ม</span>
                </div>
              </div>
            </div>

          </div>

          {/* Earth Mascot Encouraging Speech */}
          <div className="bg-white/95 rounded-2xl p-2 border border-emerald-200 shadow-xs flex items-center gap-2.5 shrink-0">
            <EarthMascot size={36} action="happy" />
            <p className="text-[11px] text-slate-700 leading-tight font-medium">
              เมื่อหยอดขวดครบแล้ว แตะปุ่ม <strong>"เสร็จสิ้นและรับแต้ม"</strong> ด้านล่างเพื่อบันทึกแต้มได้เลยครับ!
            </p>
          </div>

          {/* Finish Button (#btn-finish-deposit) - Perfectly Unclipped with Safe Margins */}
          <button
            id="btn-finish-deposit"
            onClick={handleFinish}
            className="w-full py-3 md:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm md:text-base shadow-3d btn-press flex items-center justify-center gap-2 border border-emerald-400/40 active:scale-98 transition-all cursor-pointer shrink-0"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <span>เสร็จสิ้นและรับแต้ม (+{sessionStats.sessionPoints} แต้ม)</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>

        </div>

      </div>
    </div>
  );
};
