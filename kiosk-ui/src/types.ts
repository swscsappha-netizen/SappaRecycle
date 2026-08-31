export type ScreenType = 'welcome' | 'numpad' | 'deposit' | 'summary' | 'bin_full';

export interface Student {
  id: string; // 5-digit student ID e.g. "54321"
  prefix: string;
  firstName: string;
  lastName: string;
  grade: string; // e.g. "ม.3/2"
  room: string;
  seatNumber: number;
  phone?: string; // Optional phone
  pointsBalance: number;
  bottlesDeposited: number;
  cansDeposited: number;
  avatarColor: string;
  lineUserId?: string;
  linePictureUrl?: string;
  lineDisplayName?: string;
  isLineLinked?: boolean;
}

export interface DepositItem {
  id: string;
  type: 'PET' | 'CAN' | 'REJECT';
  label: string;
  brand?: string;
  brandIcon?: string;
  points: number;
  confidence: number;
  timestamp: Date;
}

export interface SessionStats {
  petCount: number;
  canCount: number;
  rejectCount: number;
  sessionPoints: number;
  items: DepositItem[];
}

export interface HardwareState {
  isLaserActive: boolean;
  conveyorStatus: 'idle' | 'forward' | 'reverse_reject' | 'jammed';
  cameraActive: boolean;
  petBinPercent: number;
  canBinPercent: number;
  sensorTriggered: boolean;
  sensorStage?: 'WAITING_OBJECT' | 'OBJECT_DETECTED' | 'CHECKING_LIQUID' | 'SORTING_PET' | 'SORTING_CAN' | 'REJECTED';
  lastDetectedType: 'PET' | 'CAN' | 'REJECT' | 'NONE';
  audioMuted: boolean;
}
