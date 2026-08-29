const SUPABASE_URL = "https://socuwjwndvbfjxafnolx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3V3anduZHZiZmp4YWZub2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAwNjY2NSwiZXhwIjoyMTAzNTgyNjY1fQ.FNKtbWt7e5fPF0WEpeXywJ-GvFsmEv6LfmRU7rdXqe4";

const councilMembers = [
  { id: '33583', name: 'นายวชิรวิชญ์ บุญนพไท', room: 'ม.5/12', phone: '0988975848', role: 'ประธานคณะกรรมการสภานักเรียน' },
  { id: '34834', name: 'นายวธัญญู ทอวัฒนสกุล', room: 'ม.5/11', phone: '0611950831', role: 'รองประธานฝ่ายอำนวยการ' },
  { id: '32740', name: 'นางสาวศุภกานต์ เทมียะโก', room: 'ม.5/9', phone: '0849896943', role: 'รองประธานฝ่ายวิชาการ' },
  { id: '32445', name: 'นายพีรพัฒน์ เอี่ยมละ', room: 'ม.5/3', phone: '0991952171', role: 'รองประธานฝ่ายบริหารจัดการ' },
  { id: '32392', name: 'นายกรวิชญ์ กันทะถ้ำ', room: 'ม.5/12', phone: '0931982186', role: 'รองประธานฝ่ายบริหารงานทั่วไป' },
  { id: '32699', name: 'นางสาวจันทมณี จันทร์แก้วปง', room: 'ม.5/5', phone: '0957082917', role: 'ฝ่ายการเงินและพัสดุ' },
  { id: '32705', name: 'นางสาวทิตติกรณ์ แสงหงษ์', room: 'ม.5/8', phone: '0979806551', role: 'ฝ่ายการเงินและพัสดุ' },
  { id: '32743', name: 'นางสาวสุพิชฌาย์ ชุมภูเทพ', room: 'ม.5/1', phone: '0829088994', role: 'ฝ่ายปกครอง' },
  { id: '32702', name: 'นางสาวณัชชา วิชนภัทรสมุทร', room: 'ม.5/5', phone: '0927712559', role: 'ฝ่ายวิชาการ' },
  { id: '32700', name: 'นางสาวจิณัฐตา กิมวานนท์', room: 'ม.5/8', phone: '0855496301', role: 'ฝ่ายวิชาการ' },
  { id: '32795', name: 'นางสาวโนโน -', room: 'ม.5/12', phone: '0918389691', role: 'ฝ่ายวิชาการ' },
  { id: '34742', name: 'นางสาวสิริกร ธิติวราพร', room: 'ม.5/1', phone: '0956196815', role: 'ฝ่ายสำนักงาน' },
  { id: '32529', name: 'นางสาวกมลพรรณ เมธาวิจิตร', room: 'ม.5/7', phone: '0926899734', role: 'ฝ่ายประชาสัมพันธ์' },
  { id: '32577', name: 'นางสาวนันทิชา หล้าป่า', room: 'ม.5/7', phone: '0652917532', role: 'ฝ่ายประชาสัมพันธ์' },
  { id: '32467', name: 'นางสาวพรพัสนันท์ เกิดแก้ว', room: 'ม.5/2', phone: '0929078737', role: 'ฝ่ายสันทนาการ' },
  { id: '32550', name: 'นางสาวศิรภัสสร ต๊ะศิริ', room: 'ม.5/5', phone: '0654930315', role: 'ฝ่ายสันทนาการ' },
  { id: '32695', name: 'นายศิรชัช ต๊ะสมัย', room: 'ม.5/10', phone: '0648788083', role: 'ฝ่ายสันทนาการ' },
  { id: '32567', name: 'นางสาวกาญจนา หลอมทอง', room: 'ม.5/2', phone: '0612326168', role: 'ฝ่ายโสตทัศนศึกษา' },
  { id: '32650', name: 'นายสุวรรณวัฒน์ ก้องเวหา', room: 'ม.5/10', phone: '0648183467', role: 'ฝ่ายโสตทัศนศึกษา (Super Admin)' },
  { id: '32681', name: 'นายณตะวัน สุวรรณจักร์', room: 'ม.5/10', phone: '0946403500', role: 'ฝ่ายโสตทัศนศึกษา' },
  { id: '32552', name: 'นางสาวสุทธญาณ์ กวินวาณิช', room: 'ม.5/3', phone: '0956837324', role: 'ฝ่ายปฎิคม' },
  { id: '34841', name: 'นายวัชรพล ภางาม', room: 'ม.5/12', phone: '0818784717', role: 'ฝ่ายปฎิคม' },
  { id: '32839', name: 'นายพีรพล ทวีทรัพย์ล้ำเลิศ', room: 'ม.5/12', phone: '0612672452', role: 'ฝ่ายอาคารสถานที่' },
  { id: '32696', name: 'นายศุภวิชญ์ กล่อมยิ้ม', room: 'ม.5/3', phone: '0928175823', role: 'ฝ่ายอาคารสถานที่' },
  { id: '32800', name: 'นายสมชาย -', room: 'ม.5/7', phone: '0946103792', role: 'ฝ่ายอาคารสถานที่' },
  { id: '32525', name: 'นายสุรจักษ์ ธรรมใจ', room: 'ม.5/10', phone: '0951379191', role: 'ฝ่ายอาคารสถานที่' },
  { id: '32575', name: 'นางสาวธัญญรัตน์ จาบสันต์เทียะ', room: 'ม.5/1', phone: '0990138706', role: 'เลขานุการ' },
  { id: '32585', name: 'นางสาวภัททิยา ฉิมสนิท', room: 'ม.5/10', phone: '0614685371', role: 'รองเลขานุการ' }
];

async function main() {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  const councilIds = councilMembers.map(m => m.id);

  // 1. Reset everyone to is_council_member = false first
  console.log("Resetting all students is_council_member to false...");
  const resetRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_council_member: false })
  });
  console.log("Reset status:", resetRes.status);

  // 2. Update each of the 28 council members with is_council_member = true and their phone numbers
  console.log("Updating 28 council members in Supabase...");
  for (const member of councilMembers) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?student_id=eq.${member.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        is_council_member: true,
        phone_number: member.phone
      })
    });
    console.log(`Updated ${member.id} (${member.name}) -> ${res.status}`);
  }

  // 3. Verify in database
  const resVerify = await fetch(`${SUPABASE_URL}/rest/v1/students?is_council_member=eq.true&select=student_id,full_name,room,phone_number,is_council_member`, {
    headers
  });
  const list = await resVerify.json();
  console.log(`\nVerified total council members in Supabase: ${list.length}`);
  console.table(list);
}

main();
