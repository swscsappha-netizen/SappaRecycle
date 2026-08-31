import { Student } from '../types';
import rawRoster from './students_all_2906.json';

interface RawStudent {
  no: number;
  student_id: string;
  full_name: string;
  room: string;
}

const PASTEL_AVATAR_COLORS = [
  'from-emerald-500 to-teal-700',
  'from-sky-400 to-blue-600',
  'from-indigo-400 to-violet-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-teal-400 to-emerald-700',
];

// Special metadata overlay for known students (phones, admins, etc.)
const KNOWN_METADATA_OVERLAYS: Record<string, Partial<Student>> = {
  '32650': {
    phone: '0648183467',
    pointsBalance: 140,
    bottlesDeposited: 3,
    cansDeposited: 0,
    isLineLinked: true,
    lineUserId: 'U203ff66b7e535c901dfbfa86d93eef46',
  },
};

/**
 * Pre-build fast lookup Map of all 2,906 real Sapphawitthayakhom students
 */
const STUDENT_MAP = new Map<string, Student>();

(rawRoster as RawStudent[]).forEach((item) => {
  const id = String(item.student_id).trim();
  let fullName = (item.full_name || '').trim();
  let prefix = '';

  const prefixes = ['เด็กหญิง', 'เด็กชาย', 'นางสาว', 'นาย', 'ด.ญ.', 'ด.ช.', 'น.ส.'];
  for (const p of prefixes) {
    if (fullName.startsWith(p)) {
      prefix = p;
      fullName = fullName.slice(p.length).trim();
      break;
    }
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(' ') || '';

  const roomStr = item.room || '';
  const gradeStr = roomStr.startsWith('ม.') ? roomStr : `ม.${roomStr}`;
  const cleanRoom = roomStr.replace(/^ม\./, '');

  const num = parseInt(id, 10) || 1;
  const color = PASTEL_AVATAR_COLORS[num % PASTEL_AVATAR_COLORS.length];

  const overlay = KNOWN_METADATA_OVERLAYS[id] || {};

  const studentObj: Student = {
    id,
    prefix,
    firstName,
    lastName,
    grade: gradeStr,
    room: cleanRoom || roomStr,
    seatNumber: item.no || 1,
    phone: overlay.phone || '',
    pointsBalance: overlay.pointsBalance || 0,
    bottlesDeposited: overlay.bottlesDeposited || 0,
    cansDeposited: overlay.cansDeposited || 0,
    avatarColor: color,
    isLineLinked: overlay.isLineLinked || false,
    lineUserId: overlay.lineUserId || undefined,
  };

  STUDENT_MAP.set(id, studentObj);
});

/**
 * Lookup student from official 2,906 school roster by 5-digit student ID.
 * Returns official student record or null if ID does not exist.
 */
export function lookupStudentById(id: string): Student | null {
  if (!id || id.length !== 5 || !/^\d{5}$/.test(id)) {
    return null;
  }
  return STUDENT_MAP.get(id) || null;
}

/**
 * Return total student count in official roster
 */
export function getTotalStudentsCount(): number {
  return STUDENT_MAP.size;
}
