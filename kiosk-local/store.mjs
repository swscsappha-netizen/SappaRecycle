import { DatabaseSync } from 'node:sqlite';
export class Store {
  constructor(file) {
    this.db=new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS students(id TEXT PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,payload TEXT NOT NULL,state TEXT NOT NULL DEFAULT \'pending\',result TEXT,error TEXT);');
  }
  student(id) { const row=this.db.prepare('SELECT data FROM students WHERE id=?').get(id); return row?JSON.parse(row.data):null; }
  cache(student) { this.db.prepare('INSERT INTO students VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(student.student_id,JSON.stringify(student)); }
  enqueue(args) {
    if(!/^[0-9]{5}$/.test(args.p_student_id)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.p_request_id)||!Number.isSafeInteger(args.p_pet_count)||!Number.isSafeInteger(args.p_can_count)||args.p_pet_count<0||args.p_can_count<0||args.p_pet_count+args.p_can_count<1||args.p_pet_count+args.p_can_count>500) throw Error('Invalid deposit');
    const payload=JSON.stringify({p_student_id:args.p_student_id,p_request_id:args.p_request_id,p_pet_count:args.p_pet_count,p_can_count:args.p_can_count});
    const existing=this.db.prepare('SELECT * FROM outbox WHERE id=?').get(args.p_request_id);
    if(existing&&existing.payload!==payload)throw Error('Receipt mismatch');
    if(!existing)this.db.prepare('INSERT INTO outbox(id,payload) VALUES (?,?)').run(args.p_request_id,payload);
    return this.db.prepare('SELECT * FROM outbox WHERE id=?').get(args.p_request_id);
  }
  pending() { return this.db.prepare("SELECT * FROM outbox WHERE state='pending' ORDER BY rowid").all(); }
  complete(id,result) { this.db.prepare("UPDATE outbox SET state='synced',result=?,error=NULL WHERE id=?").run(JSON.stringify(result),id); }
  fail(id,message) { this.db.prepare('UPDATE outbox SET error=? WHERE id=?').run(message,id); }
}
