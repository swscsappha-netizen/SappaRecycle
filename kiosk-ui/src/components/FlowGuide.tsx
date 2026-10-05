import { ArrowDown, Check, Fingerprint, Leaf, LoaderCircle, PackageCheck, Phone, ScanLine, TriangleAlert } from 'lucide-react';
import { HardwareState, ScreenType } from '../types';

interface Props { screen: ScreenType; stage?: HardwareState['sensorStage']; saving: boolean; error: string; phone?: boolean; guide?: boolean; }
export function FlowGuide({ screen, stage, saving, error, phone, guide }: Props) {
  const busy = screen === 'deposit' && stage && stage !== 'WAITING_OBJECT';
  const rejected = screen === 'deposit' && stage === 'REJECTED';
  const blocked = Boolean(error) || screen === 'bin_full' || rejected;
  const step = screen === 'welcome' ? 0 : screen === 'numpad' ? 1 : screen === 'summary' ? 3 : 2;
  let title = 'พร้อมเปลี่ยนขวดให้เป็นแต้ม';
  let hint = 'แตะเริ่มต้น แล้วทำตามคำแนะนำทีละขั้นตอน';
  let mode = 'welcome';
  let Icon = Leaf;
  if (screen === 'numpad') { title = 'กรอกเลขประจำตัว 5 หลัก'; hint = 'เมื่อพบข้อมูลนักเรียน จะเปิดหน้าหยอดให้อัตโนมัติ'; mode = 'typing'; Icon = Fingerprint; }
  if (phone) { title = 'เพิ่มเบอร์โทรศัพท์'; hint = 'กรอกเบอร์โทร หรือเลือกข้ามเพื่อทำขั้นตอนถัดไป'; mode = 'typing'; Icon = Phone; }
  if (guide) { title = 'เตรียมขวดก่อนหยอด'; hint = 'เทน้ำให้หมด แล้วหยอดขวดหรือกระป๋องทีละ 1 ชิ้น'; mode = 'deposit'; Icon = ArrowDown; }
  if (screen === 'deposit') {
    title = busy ? 'กำลังจัดการชิ้นนี้' : 'หยอดขวดหรือกระป๋องทีละ 1 ชิ้น';
    hint = busy ? 'รอให้ตู้พร้อม ก่อนหยอดชิ้นถัดไป' : 'เทน้ำออกให้หมด • หยอดแล้วรอผลบนหน้าจอ';
    mode = busy ? 'scan' : 'deposit'; Icon = busy ? ScanLine : ArrowDown;
  }
  if (saving) { title = 'กำลังบันทึกแต้ม'; hint = 'กรุณารอจนบันทึกสำเร็จ อย่าเพิ่งเริ่มรายการใหม่'; mode = 'saving'; Icon = LoaderCircle; }
  if (screen === 'summary') { title = 'บันทึกแต้มเรียบร้อยแล้ว'; hint = 'ตรวจยอดสรุป แล้วแตะจบรายการเพื่อให้คนถัดไปใช้งาน'; mode = 'done'; Icon = PackageCheck; }
  if (blocked) {
    title = rejected ? 'ชิ้นนี้รับไม่ได้' : screen === 'bin_full' ? 'พักใช้งานตู้ชั่วคราว' : 'ยังบันทึกแต้มไม่สำเร็จ';
    hint = rejected ? 'รับชิ้นที่ตู้ส่งคืน และรอให้ตู้พร้อมอีกครั้ง' : screen === 'bin_full' ? 'ถังใกล้เต็ม กรุณาแจ้งเจ้าหน้าที่' : 'กรุณาแจ้งเจ้าหน้าที่และตรวจข้อความผิดพลาดบนหน้าจอ';
    mode = 'blocked'; Icon = TriangleAlert;
  }
  return <aside className={`flow-guide flow-${mode}`} aria-label="คำแนะนำขั้นตอนใช้งานตู้">
    <div className="flow-picture" aria-hidden="true">
      <span className="flow-halo" />
      {(mode === 'deposit' || mode === 'scan') ? <><svg className="flow-bottle" viewBox="0 0 40 70" fill="none"><path d="M15 4h10v12l7 11v33q0 6-6 6H14q-6 0-6-6V27l7-11Z" fill="#d6edd0" stroke="#527d43" strokeWidth="2.5"/><path d="M15 4h10M8 35h24M8 49h24" stroke="#527d43" strokeWidth="3"/><path d="M18 27v30" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg><span className="flow-slot" /><span className="flow-scanline" /></> : <Icon className="flow-symbol" size={32} />}
      <span className="flow-spark">✦</span>
    </div>
    <div className="flow-copy" role="status" aria-live="polite" aria-atomic="true"><span className="flow-kicker">{blocked ? 'คำแนะนำ' : `ขั้นตอน ${step + 1} / 4`}</span><h2>{title}</h2><p>{hint}</p></div>
    <ol className="flow-steps" aria-label="ความคืบหน้า">{['เริ่มต้น', 'ยืนยันตัวตน', 'หยอดขวด', 'รับแต้ม'].map((label, i) => <li key={label} className={i === step ? 'is-current' : i < step ? 'is-complete' : ''} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check size={13} /> : i + 1}</span><small>{label}</small></li>)}</ol>
  </aside>;
}
