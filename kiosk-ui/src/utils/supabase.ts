import { Student, SessionStats } from '../types';


const browserConfig = (window as any).APP_CONFIG;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || browserConfig?.SUPABASE_ANON_KEY || '';
const url = import.meta.env.VITE_SUPABASE_URL || browserConfig?.SUPABASE_URL || 'https://socuwjwndvbfjxafnolx.supabase.co';
if (publicKey.startsWith('sb_secret_')) throw new Error('Secret keys cannot be used in a browser');
if (publicKey.startsWith('eyJ')) {
  const payload = JSON.parse(atob(publicKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.role !== 'anon') throw new Error('Only anon keys may be used in a browser');
}
const localDevice = (window as any).LOCAL_KIOSK === true;
export const kioskDemo = /(?:^|[?&])demo=1(?:&|$)/.test(window.location?.search || '');
let demoPoints = 0;
let demoBottles = 0;
const demoReceipts = new Map<string, unknown>();
function createDemoClient() {
  return { from() {
    let id = '';
    const query: any = { select() { return query; }, eq(_column: string, value: string) { id = value; return query; },
      async maybeSingle() { return {data: id === '00000' ? {student_id:'00000',full_name:'นักเรียน ทดลองระบบ',room:'ทดสอบ',no:1,current_points:demoPoints,total_bottles_recycled:demoBottles} : null,error:null}; } };
    return query;
  }, async rpc(name: string, args: any) {
    if (name !== 'credit_recycle_batch' || args.p_student_id !== '00000') return {data:null,error:{message:'โหมดทดลองใช้รหัส 00000 เท่านั้น'}};
    if (demoReceipts.has(args.p_request_id)) return {data:demoReceipts.get(args.p_request_id),error:null};
    demoPoints += args.p_pet_count * 10 + args.p_can_count * 20;
    demoBottles += args.p_pet_count;
    const data = {success:true,student_id:'00000',current_points:demoPoints,total_bottles_recycled:demoBottles};
    demoReceipts.set(args.p_request_id,data); return {data,error:null};
  } };
}
function createLocalClient() {
  async function call(request: unknown) {
    const response = await fetch('/api/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    return response.json();
  }
  return { from(table: string) {
    const request: any = { table, operation: 'select', filters: [] };
    const query: any = { select() { return query; }, eq(column: string, value: string) { request.filters.push({column,value,op:'eq'}); return query; },
      maybeSingle() { request.single = true; request.optional = true; return call(request); } };
    return query;
  }, rpc(name: string, args: unknown) { return call({operation:'rpc', name, args}); } };
}
export const supabase = kioskDemo ? createDemoClient() : localDevice ? createLocalClient() : publicKey ? (window as any).createSecureClient(url, publicKey) : null;

/**
 * Fetch student profile directly from Supabase Cloud (schema: student_id, full_name, room, no, phone_number, current_points)
 */
export async function fetchStudentFromSupabase(studentId: string): Promise<Student | null> {
  if (!studentId || studentId.length !== 5 || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Fetch student failed:', error.message);
      return null;
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

    return null;
  } catch (err) {
    console.error('[Supabase] Network exception:', err);
    return null;
  }
}

/**
 * Update student phone number directly in Supabase table `students` (column: phone_number)
 */
export async function updateStudentPhoneInSupabase(studentId: string, phone: string): Promise<boolean> {
  if (!supabase) return false;
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
  student: Student, sessionStats: SessionStats, requestId: string
): Promise<{ current_points: number; total_bottles_recycled: number; pending_sync?: boolean }> {
  if (!supabase) throw new Error('Database connection is not configured');
  if (!Number.isSafeInteger(sessionStats.petCount) || !Number.isSafeInteger(sessionStats.canCount) ||
      sessionStats.petCount < 0 || sessionStats.canCount < 0) throw new Error('Invalid deposit counts');
  if (sessionStats.petCount + sessionStats.canCount === 0) {
    return { current_points: student.pointsBalance, total_bottles_recycled: student.bottlesDeposited + student.cansDeposited };
  }
  const { data, error } = await supabase.rpc('credit_recycle_batch', {
    p_student_id: student.id,
    p_request_id: requestId,
    p_pet_count: sessionStats.petCount,
    p_can_count: sessionStats.canCount,
  });
  if (error || data?.success !== true || data.student_id !== student.id ||
      !Number.isSafeInteger(data.current_points) || data.current_points < 0 ||
      !Number.isSafeInteger(data.total_bottles_recycled) || data.total_bottles_recycled < 0) {
    throw new Error('Deposit could not be confirmed');
  }
  return data;
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
