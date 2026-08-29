const SUPABASE_URL = "https://socuwjwndvbfjxafnolx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3V3anduZHZiZmp4YWZub2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAwNjY2NSwiZXhwIjoyMTAzNTgyNjY1fQ.FNKtbWt7e5fPF0WEpeXywJ-GvFsmEv6LfmRU7rdXqe4";

async function main() {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  // 1. Set 32650 as is_council_member = true
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/students?student_id=eq.32650`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_council_member: true })
  });
  console.log("32650 update status:", res1.status, await res1.json());

  // 2. Set all other students as is_council_member = false
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/students?student_id=neq.32650`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_council_member: false })
  });
  console.log("All others update status:", res2.status);

  // 3. Query all council members
  const res3 = await fetch(`${SUPABASE_URL}/rest/v1/students?is_council_member=eq.true&select=student_id,full_name,room,no,is_council_member`, {
    headers
  });
  const list = await res3.json();
  console.log("Verified council members in database:", list);
}

main();
