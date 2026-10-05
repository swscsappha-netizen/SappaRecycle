import http from 'node:http';
import { readFileSync, existsSync, realpathSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './store.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const config=JSON.parse(readFileSync(path.join(here,'data/device.json'),'utf8'));
mkdirSync(path.join(here,'data'),{recursive:true,mode:0o700});
const store=new Store(path.join(here,'data/kiosk.sqlite'));
async function cloud(request) {
  const response=await fetch(config.url+'/rest/v1/rpc/kiosk_device_api',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p_device_token:config.token,p_request:request}),signal:AbortSignal.timeout(6000)});
  const body=await response.json();
  if(!response.ok||body.error)throw Error(body.message||body.error?.message||'Cloud rejected request');
  return body;
}
let running=false;
async function sync() {
  if(running)return;running=true;
  try { for(const row of store.pending()) {
    try {
      const result=await cloud({operation:'rpc',name:'credit_recycle_batch',args:JSON.parse(row.payload)});
      if(result.data?.success!==true)throw Error('Unconfirmed credit');
      store.complete(row.id,result.data);
      const student=store.student(result.data.student_id);
      if(student)store.cache({...student,current_points:result.data.current_points,total_bottles_recycled:result.data.total_bottles_recycled});
    } catch(error){store.fail(row.id,error.message);break;}
  }}finally{running=false;}
}
const origin='http://127.0.0.1:5056';
function json(res,body,status=200){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
http.createServer(async(req,res)=>{
  if(req.headers.host!=='127.0.0.1:5056'){res.writeHead(403);return res.end();}
  try {
    const url=new URL(req.url,origin);
    if(url.pathname==='/api/request'&&req.method==='POST'){
      if(req.headers.origin!==origin||req.headers['content-type']!=='application/json')return json(res,{error:{message:'Local origin required'}},403);
      let body='';for await(const chunk of req){body+=chunk;if(body.length>32768)return json(res,{},413);}
      const request=JSON.parse(body);
      if(request.operation==='select'&&request.table==='students'){
        const id=request.filters?.[0]?.value;if(!/^[0-9]{5}$/.test(id))throw Error('Invalid student ID');
        try {const result=await cloud({table:'students',operation:'select',filters:[{column:'student_id',value:id,op:'eq'}],single:true,optional:true});if(result.data)store.cache(result.data);return json(res,result);}
        catch {const data=store.student(id);if(!data)throw Error('ยังไม่มีข้อมูลนักเรียนในเครื่อง กรุณาเชื่อมต่ออินเทอร์เน็ต');return json(res,{data,error:null});}
      }
      if(request.operation==='rpc'&&request.name==='credit_recycle_batch'){
        const student=store.student(request.args.p_student_id);if(!student)throw Error('Student must be looked up first');
        store.enqueue(request.args);await sync();
        const row=store.enqueue(request.args);
        if(row.state==='synced')return json(res,{data:JSON.parse(row.result),error:null});
        return json(res,{data:{success:true,pending_sync:true,student_id:student.student_id,current_points:student.current_points,total_bottles_recycled:student.total_bottles_recycled||0},error:null});
      }
      throw Error('Unsupported local request');
    }
    if(req.method!=='GET'){res.writeHead(405);return res.end();}
    let relative=decodeURIComponent(url.pathname);if(relative==='/')relative='/kiosk/index.html';
    if(!relative.startsWith('/kiosk/')&&!relative.startsWith('/web-liff/')){res.writeHead(404);return res.end();}
    const file=path.resolve(root,'.'+relative);
    if(!existsSync(file)||!realpathSync(file).startsWith(root+path.sep)
      ||(relative.startsWith('/kiosk/')&&!realpathSync(file).startsWith(path.join(root,'kiosk')+path.sep))){res.writeHead(404);return res.end();}
    if(relative.startsWith('/web-liff/')&&!['/web-liff/config.js','/web-liff/secure-client.js'].includes(relative)){res.writeHead(404);return res.end();}
    let content=readFileSync(file);
    if(relative==='/kiosk/index.html')content=Buffer.from(content.toString().replace('<head>','<head><script>window.LOCAL_KIOSK=true;</script>').replace(/<script src="https:\/\/static.line-scdn.net[^>]*><\/script>/,''));
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(content);
  }catch(error){json(res,{data:null,error:{message:error.message}},400);}
}).listen(5056,'127.0.0.1',()=>console.log('Local kiosk: '+origin));
setInterval(()=>void sync(),15000);void sync();
