import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
mkdirSync(new URL('./data/',import.meta.url),{recursive:true,mode:0o700});
const file=new URL('./data/device.json',import.meta.url);
if(existsSync(file)) throw Error('Device configuration already exists; preserve it to keep pending records.');
const token=randomBytes(32).toString('hex');
writeFileSync(file,JSON.stringify({token,url:'https://socuwjwndvbfjxafnolx.supabase.co',key:'sb_publishable_QiQcTPtswW_T3TrnSVWxeQ_mFF5-5Iw'}),{mode:0o600});
writeFileSync(new URL('./data/register-device.sql',import.meta.url),`INSERT INTO recycle_private.kiosk_devices(token_hash,operator_student_id) VALUES ('${createHash('sha256').update(token).digest('hex')}','32650');\n`,{mode:0o600});
console.log('Device configuration saved privately. Register data/register-device.sql in Supabase. Do not share device.json.');
