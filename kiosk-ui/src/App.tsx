import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, Student, SessionStats, HardwareState, DepositItem } from './types';
import { Header } from './components/Header';
import { ScreenWelcome } from './components/ScreenWelcome';
import { ScreenNumpad } from './components/ScreenNumpad';
import { ModalPhone } from './components/ModalPhone';
import { ScreenDeposit } from './components/ScreenDeposit';
import { ScreenSummary } from './components/ScreenSummary';
import { ScreenBinFull } from './components/ScreenBinFull';
import { GuideModal } from './components/GuideModal';
import { LiffPreviewModal } from './components/LiffPreviewModal';
import { SoundEngine } from './utils/audio';
import {
  updateStudentPhoneInSupabase,
  recordDepositSessionInSupabase,
  SerialHardwareManager,
} from './utils/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('welcome');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [showLiffModal, setShowLiffModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Session Deposit Statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    petCount: 0,
    canCount: 0,
    rejectCount: 0,
    sessionPoints: 0,
    items: [],
  });

  // Hardware Status
  const [hardwareState, setHardwareState] = useState<HardwareState>({
    isLaserActive: true,
    conveyorStatus: 'idle',
    cameraActive: true,
    petBinPercent: 34,
    canBinPercent: 28,
    sensorTriggered: false,
    lastDetectedType: 'NONE',
    audioMuted: false,
  });

  // Check bin full condition automatically
  useEffect(() => {
    if (hardwareState.petBinPercent >= 95 || hardwareState.canBinPercent >= 95) {
      setCurrentScreen('bin_full');
    } else if (currentScreen === 'bin_full') {
      setCurrentScreen('welcome');
    }
  }, [hardwareState.petBinPercent, hardwareState.canBinPercent]);

  // Global Hardware Sensor & Keyboard Listener (P = PET, C = CAN, R = REJECT)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen === 'deposit') {
        if (e.code === 'KeyP') {
          handleTriggerDeposit('PET', 'ขวดพลาสติกใส PET', '💧');
        } else if (e.code === 'KeyC') {
          handleTriggerDeposit('CAN', 'กระป๋องอะลูมิเนียม CAN', '🥫');
        } else if (e.code === 'KeyR') {
          handleTriggerDeposit('REJECT', 'ขยะแปลกปลอม', '🚫');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  // Handle flow start from welcome screen
  const handleStartFlow = () => {
    if (hardwareState.petBinPercent >= 95 || hardwareState.canBinPercent >= 95) {
      setCurrentScreen('bin_full');
      return;
    }
    // Reset session stats
    setSessionStats({
      petCount: 0,
      canCount: 0,
      rejectCount: 0,
      sessionPoints: 0,
      items: [],
    });
    setCurrentScreen('numpad');
  };

  // When student is verified in numpad
  const handleStudentVerified = (student: Student) => {
    setCurrentStudent(student);
    // If student has no phone, trigger modal per ADR-0001
    if (!student.phone || student.phone.trim() === '') {
      setShowPhoneModal(true);
    } else {
      setShowGuideModal(true);
    }
  };

  // Save phone number directly to Supabase Cloud
  const handleSavePhone = async (phone: string) => {
    if (currentStudent) {
      const updated = { ...currentStudent, phone };
      setCurrentStudent(updated);
      await updateStudentPhoneInSupabase(currentStudent.id, phone);
    }
    setShowPhoneModal(false);
    setShowGuideModal(true);
  };

  // Skip phone number
  const handleSkipPhone = () => {
    setShowPhoneModal(false);
    setShowGuideModal(true);
  };

  // Trigger deposit with realistic 5-stage sensor fusion sequence (ADR 0021)
  const handleTriggerDeposit = (
    type: 'PET' | 'CAN' | 'REJECT',
    brandName?: string,
    brandIcon?: string
  ) => {
    const points = type === 'PET' ? 10 : type === 'CAN' ? 20 : 0;
    const label = type === 'PET' ? 'ขวดพลาสติกใส PET' : type === 'CAN' ? 'กระป๋องอะลูมิเนียม CAN' : 'ขยะแปลกปลอม';
    const confidence = +(98.0 + Math.random() * 1.5).toFixed(1);

    // Stage 1: Object detected (t = 0ms)
    SoundEngine.playBeep();
    setHardwareState(prev => ({
      ...prev,
      sensorStage: 'OBJECT_DETECTED',
      sensorTriggered: true,
      conveyorStatus: 'idle',
    }));

    // Stage 2: Checking liquid & cleanliness (t = 650ms)
    setTimeout(() => {
      setHardwareState(prev => ({
        ...prev,
        sensorStage: 'CHECKING_LIQUID',
      }));
    }, 650);

    // Stage 3: Sorting decision & conveyor activation (t = 1300ms)
    setTimeout(() => {
      const stage = type === 'PET' ? 'SORTING_PET' : type === 'CAN' ? 'SORTING_CAN' : 'REJECTED';
      const conveyor = type === 'REJECT' ? 'reverse_reject' : 'forward';

      if (type === 'REJECT') {
        SoundEngine.playBuzz();
      } else {
        SoundEngine.playChime();
      }

      setHardwareState(prev => ({
        ...prev,
        sensorStage: stage,
        conveyorStatus: conveyor,
        petBinPercent: type === 'PET' ? Math.min(100, prev.petBinPercent + 2) : prev.petBinPercent,
        canBinPercent: type === 'CAN' ? Math.min(100, prev.canBinPercent + 3) : prev.canBinPercent,
      }));

      const newItem: DepositItem = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        label,
        brand: brandName || label,
        brandIcon: brandIcon || (type === 'PET' ? '💧' : type === 'CAN' ? '🥫' : '🚫'),
        points,
        confidence,
        timestamp: new Date(),
      };

      setSessionStats(prev => ({
        ...prev,
        petCount: type === 'PET' ? prev.petCount + 1 : prev.petCount,
        canCount: type === 'CAN' ? prev.canCount + 1 : prev.canCount,
        rejectCount: type === 'REJECT' ? prev.rejectCount + 1 : prev.rejectCount,
        sessionPoints: prev.sessionPoints + points,
        items: [newItem, ...prev.items],
      }));
    }, 1300);

    // Stage 4: Reset back to waiting for next object (t = 3400ms)
    setTimeout(() => {
      setHardwareState(prev => ({
        ...prev,
        sensorStage: 'WAITING_OBJECT',
        sensorTriggered: false,
        conveyorStatus: 'idle',
      }));
    }, 3400);
  };

  // Finish session and sync directly with Supabase Cloud
  const handleFinishDeposit = async () => {
    if (currentStudent) {
      const updated = {
        ...currentStudent,
        pointsBalance: currentStudent.pointsBalance + sessionStats.sessionPoints,
        bottlesDeposited: currentStudent.bottlesDeposited + sessionStats.petCount,
        cansDeposited: currentStudent.cansDeposited + sessionStats.canCount,
      };
      setCurrentStudent(updated);

      // Sync with Supabase Cloud
      await recordDepositSessionInSupabase(currentStudent, sessionStats);
    }
    setCurrentScreen('summary');
  };

  // Reset to welcome
  const handleResetToWelcome = () => {
    setCurrentStudent(null);
    setShowPhoneModal(false);
    setCurrentScreen('welcome');
  };

  // Reset bins after staff clearance
  const handleResetBins = () => {
    setHardwareState(prev => ({
      ...prev,
      petBinPercent: 0,
      canBinPercent: 0,
    }));
    handleResetToWelcome();
  };

  return (
    <div className="min-h-screen h-screen w-screen bg-slate-100 flex flex-col items-center justify-center font-['Prompt',sans-serif] text-slate-800 antialiased select-none overflow-hidden touch-manipulation">
      
      {/* Outer Kiosk Display Container */}
      <div className="w-full h-full flex flex-col justify-between overflow-hidden relative z-10 bg-white">
        
        {/* Top Kiosk Header */}
        <Header
          currentStudent={currentStudent}
          audioMuted={hardwareState.audioMuted}
          onToggleAudio={() => {
            setHardwareState(prev => ({ ...prev, audioMuted: !prev.audioMuted }));
            SoundEngine.setMuted(!hardwareState.audioMuted);
          }}
          onResetSession={currentScreen !== 'welcome' && currentScreen !== 'bin_full' ? handleResetToWelcome : undefined}
          showReset={currentScreen !== 'welcome' && currentScreen !== 'bin_full'}
          onOpenGuide={currentScreen !== 'bin_full' ? () => setShowGuideModal(true) : undefined}
        />

        {/* Dynamic Screen View with Motion Transitions */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentScreen === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <ScreenWelcome
                  onStartFlow={handleStartFlow}
                  onOpenGuide={() => setShowGuideModal(true)}
                />
              </motion.div>
            )}

            {currentScreen === 'numpad' && (
              <motion.div
                key="numpad"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <ScreenNumpad
                  onStudentVerified={handleStudentVerified}
                  onBack={() => setCurrentScreen('welcome')}
                />
              </motion.div>
            )}

            {currentScreen === 'deposit' && currentStudent && (
              <motion.div
                key="deposit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <ScreenDeposit
                  student={currentStudent}
                  sessionStats={sessionStats}
                  hardwareState={hardwareState}
                  onItemDeposited={item => {
                    handleTriggerDeposit(item.type, item.brand, item.brandIcon);
                  }}
                  onFinishDeposit={handleFinishDeposit}
                  onSimulateConveyorState={status =>
                    setHardwareState(prev => ({ ...prev, conveyorStatus: status }))
                  }
                />
              </motion.div>
            )}

            {currentScreen === 'summary' && currentStudent && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <ScreenSummary
                  student={currentStudent}
                  sessionStats={sessionStats}
                  onResetToWelcome={handleResetToWelcome}
                  onOpenLiffPreview={() => setShowLiffModal(true)}
                />
              </motion.div>
            )}

            {currentScreen === 'bin_full' && (
              <motion.div
                key="bin_full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                <ScreenBinFull
                  hardwareState={hardwareState}
                  onResetBins={handleResetBins}
                  onReturnWelcome={handleResetToWelcome}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Modal: Recycling Guide & Rules */}
        <AnimatePresence>
          {showGuideModal && (
            <GuideModal
              isOpen={showGuideModal}
              onClose={() => {
                setShowGuideModal(false);
                if (currentScreen === 'numpad' && currentStudent) {
                  setCurrentScreen('deposit');
                }
              }}
              onConfirm={() => {
                setShowGuideModal(false);
                if (currentStudent) {
                  setCurrentScreen('deposit');
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Modal: Request Phone for New Students (#modal-phone) */}
        <AnimatePresence>
          {showPhoneModal && currentStudent && (
            <ModalPhone
              student={currentStudent}
              onSavePhone={handleSavePhone}
              onSkip={handleSkipPhone}
            />
          )}
        </AnimatePresence>

        {/* Modal: LINE LIFF Mobile Preview */}
        <AnimatePresence>
          {showLiffModal && (
            <LiffPreviewModal
              student={currentStudent || {
                id: '32650',
                prefix: 'นาย',
                firstName: 'สุวรรณวัฒน์',
                lastName: 'ก้องเวหา',
                grade: 'ม.5/10',
                room: '5/10',
                seatNumber: 7,
                phone: '0648183467',
                pointsBalance: 1250,
                bottlesDeposited: 120,
                cansDeposited: 35,
                avatarColor: 'from-emerald-500 to-teal-700',
              }}
              onClose={() => setShowLiffModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
