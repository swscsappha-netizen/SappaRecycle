import React, { useState } from 'react';
import {
  Cpu, Monitor, Play, RotateCcw, Volume2, VolumeX,
  Layers, Maximize2, Minimize2, ChevronUp, ChevronDown,
  Sparkles, Radio, CheckSquare, Zap, Camera, Shield
} from 'lucide-react';
import { ScreenType, HardwareState } from '../types';
import { SoundEngine } from '../utils/audio';

interface HardwareControllerDockProps {
  currentScreen: ScreenType;
  showPhoneModal: boolean;
  onSetScreen: (screen: ScreenType) => void;
  onTogglePhoneModal: (show: boolean) => void;
  hardwareState: HardwareState;
  onUpdateHardwareState: (updater: (prev: HardwareState) => HardwareState) => void;
  isKioskFixedFrame: boolean;
  onToggleKioskFixedFrame: () => void;
  onTriggerDrop: (type: 'PET' | 'CAN' | 'REJECT') => void;
}

export const HardwareControllerDock: React.FC<HardwareControllerDockProps> = ({
  currentScreen,
  showPhoneModal,
  onSetScreen,
  onTogglePhoneModal,
  hardwareState,
  onUpdateHardwareState,
  isKioskFixedFrame,
  onToggleKioskFixedFrame,
  onTriggerDrop,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleSound = () => {
    SoundEngine.playBeep();
    onUpdateHardwareState(prev => ({
      ...prev,
      audioMuted: !prev.audioMuted,
    }));
    SoundEngine.setMuted(!hardwareState.audioMuted);
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-3 transition-all duration-300 pointer-events-auto">
      {/* Collapsed Pill Trigger */}
      {!isOpen && (
        <div className="flex justify-center">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-slate-900/90 hover:bg-slate-900 text-slate-200 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-2 hover:text-white transition-all cursor-pointer group active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span>Raspberry Pi 4 • Hardware Controller Dock (1024x600 px)</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* Expanded Control Panel */}
      {isOpen && (
        <div className="bg-slate-900/95 text-slate-200 border border-slate-700 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                RPi4 GPIO & Screen Navigation Controller
              </h4>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                1024x600 Native
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Kiosk Frame */}
              <button
                onClick={onToggleKioskFixedFrame}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-colors ${
                  isKioskFixedFrame
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="สลับโหมดกรอบสัมผัส 1024x600 px"
              >
                {isKioskFixedFrame ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span>{isKioskFixedFrame ? 'กรอบ 1024x600 (เปิดอยู่)' : 'กรอบ Responsive'}</span>
              </button>

              {/* Mute toggle */}
              <button
                onClick={toggleSound}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                {hardwareState.audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Close / Collapse button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Controller Body: 3 Sections */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            
            {/* 1. Quick Screen Switcher (md:col-span-5) */}
            <div className="md:col-span-5 bg-slate-950/70 p-2 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                สลับหน้าจอ (4 Screens + 1 Modal)
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    onSetScreen('welcome');
                    onTogglePhoneModal(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-left font-bold transition-all text-[11px] ${
                    currentScreen === 'welcome' && !showPhoneModal
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  1️⃣ #screen-welcome
                </button>

                <button
                  onClick={() => {
                    onSetScreen('numpad');
                    onTogglePhoneModal(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-left font-bold transition-all text-[11px] ${
                    currentScreen === 'numpad' && !showPhoneModal
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  2️⃣ #screen-numpad
                </button>

                <button
                  onClick={() => {
                    onSetScreen('numpad');
                    onTogglePhoneModal(true);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-left font-bold transition-all text-[11px] ${
                    showPhoneModal
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                  }`}
                >
                  💬 #modal-phone (ADR)
                </button>

                <button
                  onClick={() => {
                    onSetScreen('deposit');
                    onTogglePhoneModal(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-left font-bold transition-all text-[11px] ${
                    currentScreen === 'deposit' && !showPhoneModal
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  3️⃣ #screen-deposit
                </button>

                <button
                  onClick={() => {
                    onSetScreen('summary');
                    onTogglePhoneModal(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-center font-bold transition-all text-[11px] ${
                    currentScreen === 'summary' && !showPhoneModal
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  4️⃣ #summary
                </button>

                <button
                  onClick={() => {
                    onUpdateHardwareState(prev => ({
                      ...prev,
                      petBinPercent: 95,
                      canBinPercent: 88,
                    }));
                    onSetScreen('bin_full');
                    onTogglePhoneModal(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-center font-bold transition-all text-[11px] ${
                    currentScreen === 'bin_full' && !showPhoneModal
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                  }`}
                >
                  5️⃣ 🚨 #bin-full
                </button>
              </div>
            </div>

            {/* 2. Simulated Hardware Sensors / Drops (md:col-span-4) */}
            <div className="md:col-span-4 bg-slate-950/70 p-2 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-sky-400" />
                จำลองสัญญาณเซนเซอร์ GPIO
              </span>

              <div className="space-y-1">
                <button
                  onClick={() => onTriggerDrop('PET')}
                  className="w-full px-2 py-1.5 bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-700 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🧴 ยิงสัญญาณ Optical PET (+10)</span>
                  <span className="text-[9px] bg-sky-800 px-1.5 py-0.5 rounded">GPIO 17</span>
                </button>

                <button
                  onClick={() => onTriggerDrop('CAN')}
                  className="w-full px-2 py-1.5 bg-orange-900/60 hover:bg-orange-800 text-orange-200 border border-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🥫 ยิงสัญญาณ Inductive CAN (+20)</span>
                  <span className="text-[9px] bg-orange-800 px-1.5 py-0.5 rounded">GPIO 27</span>
                </button>

                <button
                  onClick={() => onTriggerDrop('REJECT')}
                  className="w-full px-2 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🚫 ส่งวัตถุแปลกปลอม (Reject)</span>
                  <span className="text-[9px] bg-rose-800 px-1.5 py-0.5 rounded">GPIO 22</span>
                </button>
              </div>
            </div>

            {/* 3. Bin Levels & Conveyor Status (md:col-span-3) */}
            <div className="md:col-span-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                สถานะถัง & ระบบแจ้งเตือน
              </span>

              <div className="space-y-1 text-[10px]">
                {/* Simulation Shortcut Buttons */}
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <button
                    onClick={() => {
                      onUpdateHardwareState(prev => ({
                        ...prev,
                        petBinPercent: 95,
                        canBinPercent: 88,
                      }));
                      onSetScreen('bin_full');
                    }}
                    className="px-1.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold text-[9px] text-center border border-rose-700 cursor-pointer"
                  >
                    🚨 ถังเต็ม 95%
                  </button>

                  <button
                    onClick={() => {
                      onUpdateHardwareState(prev => ({
                        ...prev,
                        conveyorStatus: 'error',
                        sensorStage: 'REJECTED',
                      }));
                      onSetScreen('bin_full');
                    }}
                    className="px-1.5 py-1 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-200 font-bold text-[9px] text-center border border-amber-700 cursor-pointer"
                  >
                    ⚠️ สายพานติดขัด
                  </button>
                </div>

                <button
                  onClick={() => {
                    onUpdateHardwareState(prev => ({
                      ...prev,
                      petBinPercent: 0,
                      canBinPercent: 0,
                      conveyorStatus: 'stopped',
                      sensorStage: 'WAITING_OBJECT',
                    }));
                    onSetScreen('welcome');
                  }}
                  className="w-full py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-bold text-[9px] text-center border border-emerald-700 cursor-pointer"
                >
                  🟢 รีเซ็ตฮาร์ดแวร์ปกติ (0%)
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
