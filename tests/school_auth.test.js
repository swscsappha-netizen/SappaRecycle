const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(session, result) {
  let oauth;
  let rpcArgs;
  const window = { APP_CONFIG: { SUPABASE_URL:'https://example.supabase.co', SUPABASE_ANON_KEY:'public' },
    sessionStorage: {}, location: { href:'https://example.org/web-liff/index.html?old=1' },
    supabase: { createClient: () => ({auth:{ getSession:async()=>({data:{session}}),
      signInWithOAuth:async(args)=>{oauth=args;return {error:null};} }}) },
    createSecureClient:()=>({rpc:async(name,args)=>{rpcArgs={name,args};return result;}}) };
  vm.runInNewContext(fs.readFileSync('web-liff/school-auth.js','utf8'),{window,URL});
  return {window, oauth:()=>oauth, rpcArgs:()=>rpcArgs};
}
test('Google login requests school domain and fixed callback',async()=>{
  const ctx=setup(null);await ctx.window.schoolAuth.login();
  assert.equal(ctx.oauth().provider,'google');
  assert.equal(ctx.oauth().options.queryParams.hd,'sappha.ac.th');
  assert.equal(ctx.oauth().options.redirectTo,'https://example.org/web-liff/index.html');
});
test('missing Google session cannot verify a student',async()=>{
  const ctx=setup(null);assert.equal(await ctx.window.schoolAuth.verify(),null);
  assert.equal(ctx.rpcArgs(),undefined);
});
test('identity is obtained from server verification, not client email',async()=>{
  const ctx=setup({access_token:'session-token',user:{email:'fake@sappha.ac.th'}},{data:{student_id:'12345'},error:null});
  assert.equal((await ctx.window.schoolAuth.verify()).student_id,'12345');
  assert.equal(ctx.rpcArgs().name,'verify_school_google');
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.rpcArgs().args)),{p_access_token:'session-token'});
});
test('server rejection prevents verification',async()=>{
  const ctx=setup({access_token:'bad'},{error:{message:'Wrong school account'}});
  await assert.rejects(ctx.window.schoolAuth.verify(),/Wrong school account/);
});
