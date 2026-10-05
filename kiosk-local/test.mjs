import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from './store.mjs';
const args={p_request_id:'12345678-1234-1234-1234-123456789012',p_student_id:'12345',p_pet_count:1,p_can_count:2};
test('outbox persists across process restart and deduplicates retries',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'sappa-'));const file=path.join(dir,'queue.sqlite');
  try {let store=new Store(file);store.enqueue(args);store.enqueue(args);assert.equal(store.pending().length,1);store.db.close();store=new Store(file);assert.equal(store.pending().length,1);store.complete(args.p_request_id,{success:true,current_points:50});assert.equal(store.pending().length,0);assert.equal(JSON.parse(store.enqueue(args).result).current_points,50);store.db.close();} finally {rmSync(dir,{recursive:true,force:true});}
});
test('reused receipt with different counts is rejected',()=>{
  const store=new Store(':memory:');store.enqueue(args);assert.throws(()=>store.enqueue({...args,p_pet_count:4}),/Receipt mismatch/);store.db.close();
});
test('invalid counts never enter the queue',()=>{
  const store=new Store(':memory:');for(const value of [-1,1.5,501])assert.throws(()=>store.enqueue({...args,p_pet_count:value}),/Invalid deposit/);assert.equal(store.pending().length,0);store.db.close();
});
