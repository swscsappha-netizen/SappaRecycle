import { createClient } from '@supabase/supabase-js';
import { Student, SessionStats } from '../types';
import { lookupStudentById as localLookup } from '../data/students';

const SUPABASE_URL = "https://socuwjwndvbfjxafnolx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3V3anduZHZiZmp4YWZub2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAwNjY2NSwiZXhwIjoyMTAzNTgyNjY1fQ.FNKtbWt7e5fPF0WEpeXywJ-GvFsmEv6LfmRU7rdXqe4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch student profile directly from Supabase Cloud (schema: student_id, full_name, room, no, phone_number, current_points)
 */
export async function fetchStudentFromSupabase(studentId: string): Promise<Student | null> {
  if (!studentId || studentId.length !== 5) return null;

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Fetch student error, using fallback:', error.message);
      return localLookup(studentId);
    }

    if (data) {
      const colors = [
        'from-emerald-500 to-teal-700',
        'from-sky-400 to-blue-600',
        'from-indigo-400 to-violet-600',
        'from-amber-400 to-orange-600',
        'from-rose-400 to-pink-600',
      ];
      const num = parseInt(studentId, 10);
      const color = colors[num % colors.length];

      // Parse Thai name prefix: "นายสุวรรณวัฒน์ ก้องเวหา", "เด็กชาย...", "เด็กหญิง..."
      let prefix = '';
      let fullName = (data.full_name || '').trim();
      const prefixes = ['เด็กหญิง', 'เด็กชาย', 'นางสาว', 'นาย'];
      for (const p of prefixes) {
        if (fullName.startsWith(p)) {
          prefix = p;
          fullName = fullName.slice(p.length).trim();
          break;
        }
      }

      const nameParts = fullName.split(' ').filter(Boolean);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const roomStr = data.room || '';
      const gradeStr = roomStr.startsWith('ม.') ? roomStr : `ม.${roomStr}`;
      const cleanRoom = roomStr.replace(/^ม\./, '');

      const hasLine = !!data.line_user_id;

      return {
        id: data.student_id,
        prefix,
        firstName,
        lastName,
        grade: gradeStr,
        room: cleanRoom || roomStr,
        seatNumber: data.no || 1,
        phone: data.phone_number || '',
        pointsBalance: data.current_points ?? 0,
        bottlesDeposited: data.total_bottles_recycled ?? 0,
        cansDeposited: 0,
        avatarColor: color,
        isLineLinked: hasLine,
        lineUserId: data.line_user_id || undefined,
      };
    }

    return localLookup(studentId);
  } catch (err) {
    console.error('[Supabase] Network exception:', err);
    return localLookup(studentId);
  }
}

/**
 * Update student phone number directly in Supabase table `students` (column: phone_number)
 */
export async function updateStudentPhoneInSupabase(studentId: string, phone: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('students')
      .update({ phone_number: phone, updated_at: new Date().toISOString() })
      .eq('student_id', studentId);

    if (error) {
      console.warn('[Supabase] Update phone error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Update phone exception:', err);
    return false;
  }
}

/**
 * Record completed deposit session & increment student points in Supabase
 */
export async function recordDepositSessionInSupabase(
  student: Student,
  sessionStats: SessionStats
): Promise<boolean> {
  try {
    // 1. Try atomic PostgreSQL RPC function credit_recycle_batch
    const { data: rpcData, error: rpcError } = await supabase.rpc('credit_recycle_batch', {
      p_student_id: student.id,
      p_pet_count: sessionStats.petCount,
      p_can_count: sessionStats.canCount,
    });

    if (!rpcError) {
      console.log('[Supabase] Credited points successfully via RPC:', rpcData);
      return true;
    }

    console.warn('[Supabase] RPC not available, updating table directly:', rpcError.message);

    const newTotalPoints = student.pointsBalance + sessionStats.sessionPoints;
    const newTotalItems = student.bottlesDeposited + sessionStats.petCount + sessionStats.canCount;

    // 2. Direct Student Update
    await supabase
      .from('students')
      .update({
        current_points: newTotalPoints,
        total_bottles_recycled: newTotalItems,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', student.id);

    // 3. Insert into recycle_logs
    if (sessionStats.items.length > 0) {
      const logs = sessionStats.items.map(item => ({
        student_id: student.id,
        item_type: item.type,
        points_earned: item.points,
      }));
      await supabase.from('recycle_logs').insert(logs);
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Record session exception:', err);
    return false;
  }
}

/**
 * WebSerial API Manager for real Raspberry Pi 4 USB serial connection
 */
export class SerialHardwareManager {
  private static port: any = null;
  private static reader: any = null;
  private static isConnected: boolean = false;

  public static async connect(
    onDataReceived: (data: { type: 'PET' | 'CAN' | 'REJECT'; brand?: string; confidence?: number }) => void
  ): Promise<boolean> {
    if (!('serial' in navigator)) {
      console.warn('[WebSerial] WebSerial API not supported in this browser');
      return false;
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      this.isConnected = true;
      this.readLoop(onDataReceived);
      return true;
    } catch (err) {
      console.error('[WebSerial] Connection failed:', err);
      return false;
    }
  }

  private static async readLoop(
    onDataReceived: (data: { type: 'PET' | 'CAN' | 'REJECT'; brand?: string; confidence?: number }) => void
  ) {
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';
    while (this.isConnected) {
      try {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (parsed.type === 'PET' || parsed.type === 'CAN' || parsed.type === 'REJECT') {
                  onDataReceived(parsed);
                }
              } catch (e) {}
            } else if (trimmed === 'DROP_PET' || trimmed === 'PET') {
              onDataReceived({ type: 'PET', brand: 'ขวดพลาสติกใส PET', confidence: 98.5 });
            } else if (trimmed === 'DROP_CAN' || trimmed === 'CAN') {
              onDataReceived({ type: 'CAN', brand: 'กระป๋อง CAN', confidence: 99.0 });
            } else if (trimmed === 'REJECT') {
              onDataReceived({ type: 'REJECT', brand: 'ขยะแปลกปลอม', confidence: 95.0 });
            }
          }
        }
      } catch (err) {
        console.error('[WebSerial] Read error:', err);
        break;
      }
    }
  }

  public static getStatus(): boolean {
    return this.isConnected;
  }
}
