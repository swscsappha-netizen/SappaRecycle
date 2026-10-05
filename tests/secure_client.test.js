const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../web-liff/secure-client.js'),'utf8');
function load(token, fetch){const window={liff:{getIDToken:()=>token}};vm.runInNewContext(source,{window,fetch});return window.createSecureClient('https://example.supabase.co','sb_publishable_test');}
test('missing LINE identity cannot query the database',async()=>{let calls=0;const client=load(null,async()=>{calls++;});const result=await client.from('students').select('*');assert.ok(result.error);assert.equal(calls,0);});
test('queries use the verified gateway and preserve server errors',async()=>{let request;const client=load('fixture',async(url,options)=>{request={url,body:JSON.parse(options.body)};return {ok:false,json:async()=>({message:'Not authorized'})};});const result=await client.from('students').select('*').eq('student_id','12345').single();assert.equal(request.url,'https://example.supabase.co/rest/v1/rpc/secure_api');assert.equal(request.body.p_id_token,'fixture');assert.equal(request.body.p_request.filters[0].value,'12345');assert.equal(result.error.message,'Not authorized');assert.equal(result.data,null);});
test('network failure cannot produce a successful write',async()=>{const client=load('fixture',async()=>{throw new Error('offline');});const result=await client.rpc('credit_recycle_batch',{});assert.ok(result.error);assert.equal(result.data,null);});
