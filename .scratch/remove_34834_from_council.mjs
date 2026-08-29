const SUPABASE_URL = "https://socuwjwndvbfjxafnolx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3V3anduZHZiZmp4YWZub2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAwNjY2NSwiZXhwIjoyMTAzNTgyNjY1fQ.FNKtbWt7e5fPF0WEpeXywJ-GvFsmEv6LfmRU7rdXqe4";

async function main() {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  // 1. Remove 34834 from council members
  console.log("Setting 34834 is_council_member = false...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/students?student_id=eq.34834`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_council_member: false })
  });
  console.log("34834 update status:", res.status, await res.json());

  // 2. Query all active council members
  const resVerify = await fetch(`${SUPABASE_URL}/rest/v1/students?is_council_member=eq.true&select=student_id,full_name,room,phone_number,is_council_member`, {
    headers
  });
  const list = await resVerify.json();
  console.log(`\nVerified total council members in Supabase: ${list.length}`);
  console.table(list);
}

main();
