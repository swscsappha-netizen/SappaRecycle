const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../kiosk-ui/node_modules/typescript');

function loadPersistence(client) {
  const file = path.join(__dirname, '../kiosk-ui/src/utils/supabase.ts');
  const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env', '{}');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, console, atob,
    window: { APP_CONFIG: { SUPABASE_ANON_KEY: 'sb_publishable_test' }, createSecureClient: () => client },
    require: () => ({ createClient: () => client }),
  });
  return exports;
}

const student = { id: '12345', pointsBalance: 140, bottlesDeposited: 3, cansDeposited: 1 };
const stats = { petCount: 1, canCount: 1, sessionPoints: 30, items: [] };

test('RPC failure never writes partial balances or reports success', async () => {
  let writes = 0;
  const api = loadPersistence({
    rpc: async () => ({ data: null, error: { message: 'database unavailable' } }),
    from: () => { writes++; throw new Error('Direct writes are forbidden'); },
  });
  await assert.rejects(api.recordDepositSessionInSupabase(student, stats, '00000000-0000-4000-8000-000000000001'), /could not be confirmed/);
  assert.equal(writes, 0);
  assert.equal(student.pointsBalance, 140);
});

test('summary receives the authoritative database balance', async () => {
  const result = { success: true, student_id: '12345', current_points: 230, total_bottles_recycled: 6 };
  const api = loadPersistence({ rpc: async () => ({ data: result, error: null }) });
  assert.equal((await api.recordDepositSessionInSupabase(student, stats, '00000000-0000-4000-8000-000000000001')).current_points, 230);
});

test('missing or malformed RPC confirmation is rejected', async () => {
  for (const data of [null, {}, { success: true, student_id: '54321', current_points: 170 }]) {
    const api = loadPersistence({ rpc: async () => ({ data, error: null }) });
    await assert.rejects(api.recordDepositSessionInSupabase(student, stats, '00000000-0000-4000-8000-000000000001'));
  }
});

test('negative deposit counts never reach the database', async () => {
  let calls = 0;
  const api = loadPersistence({ rpc: async () => { calls++; } });
  await assert.rejects(api.recordDepositSessionInSupabase(student, { ...stats, petCount: -1 }));
  assert.equal(calls, 0);
});

test('failed student lookup returns no fabricated balance', async () => {
  const api = loadPersistence({ from: () => ({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: null, error: { message: 'offline' } }),
  }) }) }) });
  assert.equal(await api.fetchStudentFromSupabase('12345'), null);
});
