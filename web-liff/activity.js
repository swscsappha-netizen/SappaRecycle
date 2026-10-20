(function(root){
'use strict';
const labels={PENDING:'รอตรวจสอบ',REVIEWING:'กำลังตรวจสอบ',RESOLVED:'ตรวจสอบแล้ว'};
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function describeFreshness(item,label,offline,formatTime=value=>value){
 const at=item?.at?formatTime(item.at):null;
 if(offline)return {state:'offline',text:at?'ออฟไลน์ · '+label+'ที่โหลดไว้เมื่อ '+at:'ออฟไลน์ · ยังไม่มีข้อมูล'+label+'ที่ยืนยัน'};
 if(item?.state==='loading')return {state:'loading',text:'กำลังโหลด'+label+'ล่าสุด'+(at?' · แสดงข้อมูลเดิมจาก '+at:'')};
 if(item?.state==='error')return {state:'error',text:'อัปเดต'+label+'ไม่สำเร็จ'+(at?' · แสดงข้อมูลจาก '+at:' · กดอัปเดตเพื่อลองใหม่')};
 if(item?.state==='ready'&&at)return {state:'ready',text:label+'ล่าสุด · '+at};
 return {state:'idle',text:'ยังไม่มีข้อมูล'+label+'ที่ยืนยัน'};
}
function makeSender({rpc,online=()=>true,save=()=>{},uuid=()=>crypto.randomUUID()}){
 let pending=null,busy=false;
 return {restore(value){pending=value;},get pending(){return pending;},get busy(){return busy;},async send(values){
  if(busy)throw Error('กำลังส่งเรื่อง กรุณารอสักครู่');
  if(!online())throw Error('ออฟไลน์ ยังไม่ได้ส่งเรื่อง ข้อความยังอยู่ในแบบฟอร์ม');
  if(!pending){
   const description=values.description.trim(),time=new Date(values.used_at);
   if(!description||description.length>1000||!Number.isFinite(+time)||+time>Date.now()+300000)throw Error('กรุณาระบุเวลาใช้ตู้และรายละเอียดไม่เกิน 1,000 ตัวอักษร');
   pending={request_id:uuid(),used_at:time.toISOString(),description,log_id:values.log_id||null};save(pending);
  }
  busy=true;
  try{const result=await rpc('create_support_report',pending);if(result.error?.status>=400&&result.error.status<500&&![408,429].includes(result.error.status)){pending=null;save(null);}
  if(result.error||!result.data?.report_id)throw Error(result.error?.message||'ยังยืนยันการรับเรื่องไม่ได้ กรุณาลองส่งอีกครั้ง');const receipt=result.data;pending=null;save(null);return receipt;}finally{busy=false;}
 }};
}
if(typeof module!=='undefined'&&module.exports)module.exports={makeSender,escape,labels,describeFreshness};
if(!root.document)return;
const doc=root.document,$=id=>doc.getElementById(id),api=()=>root.StudentActivity;
const time=value=>value?new Date(value).toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'ยังไม่เคยอัปเดต';
const localTime=value=>{const d=new Date(value||Date.now());return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
let owner=null,sender=null,draft=null,list=[],council=false,filter='',listBusy=false,listRevision=0,listMore=false,selected=null;
function store(value){try{sessionStorage.setItem('eco-support:'+owner,JSON.stringify(value));}catch{/* The form remains usable when browser storage is unavailable. */}}
function draftChanged(){if(sender?.pending)return;draft={used_at:$('report-time').value,description:$('report-text').value,log_id:$('report-log').value};store({draft});}
function ensureOwner(){
 const next=api()?.student?.student_id;if(!next)return false;if(owner===next)return true;
 owner=next;draft=null;let restored=null;try{restored=JSON.parse(sessionStorage.getItem('eco-support:'+owner)||'null');}catch{}
 draft=restored?.draft||null;
 sender=makeSender({rpc:(name,args)=>api().rpc(name,args),online:()=>navigator.onLine!==false,save:pending=>store(pending?{pending}:{draft:null})});
 if(restored?.pending)sender.restore(restored.pending);return true;
}
function open(dialog,origin){if(!dialog.open)dialog.showModal();root.EcoMotion?.expand(dialog,origin);}
function sync(){
 if(!$('activity-status'))return;
 const state=api()?.freshness,offline=navigator.onLine===false;
 $('connection-status').textContent=offline?'ออฟไลน์ • ข้อมูลที่เห็นอาจยังไม่ใช่ข้อมูลล่าสุด':'แสดงข้อมูลล่าสุดที่โหลดได้';
 for(const key of ['balance','history']){const summary=describeFreshness(state?.[key],key==='balance'?'แต้ม':'ประวัติ',offline,time),node=$(key+'-freshness');if(node){node.textContent=summary.text;node.dataset.freshness=summary.state;}}
 const refresh=$('btn-refresh-history'),refreshText=refresh?.querySelector('[data-refresh-label]');if(refreshText)refreshText.textContent=state?.balance?.state==='loading'||state?.history?.state==='loading'?'กำลังอัปเดต…':'อัปเดต';
 $('history-more').hidden=!api()?.more;$('history-more').disabled=!!api()?.historyLoading||offline;
 $('history-more').textContent=api()?.historyLoading?'กำลังโหลด…':'โหลดประวัติเพิ่ม';
 $('open-council-reports').hidden=!api()?.student?.is_council_member;
 $('open-council-reports-profile').hidden=!api()?.student?.is_council_member;
 ensureOwner();
}
function openReport(log,origin){
 if(!ensureOwner())return;
 $('report-form').hidden=false;
 const values=sender.pending||(log?null:draft)||{used_at:log?.created_at||new Date().toISOString(),description:'',log_id:log?.log_id||''};
 $('report-time').value=localTime(values.used_at);$('report-text').value=values.description||'';$('report-log').value=values.log_id||'';
 $('report-reference').textContent=values.log_id?'อ้างอิงรายการ #'+values.log_id:'ไม่ได้อ้างอิงรายการ • ใช้แจ้งแต้มที่ยังไม่ปรากฏได้';
 $('report-submit-status').textContent=sender.pending?'ยังยืนยันผลครั้งก่อนไม่ได้ กดลองส่งอีกครั้งด้วยเลขคำขอเดิม':navigator.onLine===false?'ออฟไลน์ ยังไม่ได้ส่งเรื่อง':'';
 lockReport();open($('report-dialog'),origin);
}
function lockReport(){const locked=!!sender?.pending;$('report-time').readOnly=locked;$('report-text').readOnly=locked;$('report-send').disabled=!!sender?.busy;$('report-send').textContent=sender?.busy?'กำลังส่ง…':locked?'ลองส่งคำขอเดิมอีกครั้ง':'ส่งเรื่องให้สภาตรวจสอบ';}
function showHistory(id,origin){
 const log=api()?.logs.find(row=>String(row.log_id)===id);if(!log)return;
 const type=log.item_type==='PET'?'ขวดพลาสติก PET':log.item_type==='CAN'?'กระป๋องอะลูมิเนียม CAN':log.item_type==='REJECT'?'ส่งคืน / ไม่รับวัสดุ':'วัสดุประเภทอื่น';
 $('history-details').innerHTML='<section class="history-summary"><span class="material-symbols-rounded" aria-hidden="true">recycling</span><p>'+type+'</p><strong>'+(Number(log.points_earned)>0?'+':'')+escape(log.points_earned)+'<small> แต้ม</small></strong><span>รายการที่ระบบบันทึก</span></section><dl class="activity-facts"><dt>เลขอ้างอิง</dt><dd>#'+escape(log.log_id)+'</dd><dt>วันและเวลา</dt><dd>'+escape(time(log.created_at))+' (เวลาไทย)</dd><dt>ประเภท</dt><dd>'+type+'</dd><dt>แต้มที่บันทึก</dt><dd>'+escape(log.points_earned)+' แต้ม</dd></dl><p class="activity-note">หากแต้มรายการนี้ไม่ถูกต้อง แจ้งให้สภาตรวจสอบได้ โดยแนบเลขอ้างอิงและเวลาให้อัตโนมัติ</p>';
 $('history-report').dataset.log=id;open($('history-dialog'),origin);
}
function renderList(message=''){
 const container=$('report-list');container.setAttribute('aria-busy',String(listBusy));
 container.innerHTML=(message?'<p role="status" class="activity-notice">'+escape(message)+'</p>':'')+list.map(row=>'<button type="button" class="report-row" data-support-id="'+escape(row.report_id)+'"><span class="support-status status-'+row.status+'">'+labels[row.status]+'</span><strong>'+escape(council?row.full_name+' • '+row.student_id:'เรื่อง #'+row.report_id.slice(0,8))+'</strong><span>'+escape(row.description)+'</span><small>แจ้งเมื่อ '+escape(time(row.created_at))+'</small></button>').join('')+(!list.length&&!message?'<p class="activity-note">ยังไม่มีเรื่องในสถานะนี้</p>':'');
 $('reports-more').hidden=!listMore;$('reports-more').disabled=listBusy;$('reports-refresh').disabled=listBusy;
}
async function loadReports(append=false){
 const revision=++listRevision;listBusy=true;renderList('กำลังโหลดเรื่องแจ้งปัญหา…');
 try{
  const result=await api().rpc('list_support_reports',{council,status:filter,offset:append?list.length:0});
  if(revision!==listRevision)return;
  if(result.error||!Array.isArray(result.data))throw Error(result.error?.message||'โหลดเรื่องไม่สำเร็จ');
  listMore=result.data.length===20;list=append?[...new Map([...list,...result.data].map(row=>[row.report_id,row])).values()]:result.data;
  listBusy=false;renderList();
 }catch(error){if(revision!==listRevision)return;listBusy=false;renderList(error.message+' • กดรีเฟรชเพื่อลองใหม่');}
}
function openReports(staff,origin){
 if(!ensureOwner()||(staff&&!api().student.is_council_member))return;
 council=staff;filter='';list=[];listMore=false;listRevision++;$('reports-filter').value='';$('reports-title').textContent=staff?'เรื่องแจ้งปัญหาของนักเรียน':'ติดตามเรื่องของฉัน';open($('reports-dialog'),origin);void loadReports();
}
function reportDetail(id,origin){
 const row=list.find(item=>item.report_id===id);if(!row)return;selected=row;
 $('support-details').innerHTML='<dl class="activity-facts"><dt>เลขรับเรื่อง</dt><dd>'+escape(row.report_id)+'</dd><dt>นักเรียน</dt><dd>'+escape(row.full_name||row.student_id)+'</dd><dt>เวลาใช้ตู้โดยประมาณ</dt><dd>'+escape(time(row.used_at))+'</dd><dt>รายการอ้างอิง</dt><dd>'+escape(row.log_id?'#'+row.log_id:'ไม่ระบุ')+'</dd><dt>สถานะ</dt><dd>'+labels[row.status]+'</dd><dt>อัปเดตล่าสุด</dt><dd>'+escape(time(row.updated_at))+'</dd></dl><h3>รายละเอียดปัญหา</h3><p class="support-copy">'+escape(row.description)+'</p><h3>คำตอบจากสภา</h3><p class="support-copy">'+escape(row.response||'ยังไม่มีคำตอบ')+'</p>';
 $('support-editor').hidden=!council;$('support-status').value=row.status;$('support-response').value=row.response||'';$('support-save-status').textContent='';open($('support-dialog'),origin);
}
function boot(){
 const home=$('tab-home');if(!home)return;
 const status=doc.createElement('div');status.className='activity-card';status.id='activity-status';status.innerHTML='<div class="activity-status-heading"><div class="activity-status-title"><span class="material-symbols-rounded" aria-hidden="true">info</span><h3>ข้อมูลและความช่วยเหลือ</h3></div><button type="button" id="btn-refresh-history" data-refresh-activity aria-label="อัปเดตแต้มและประวัติ"><span class="material-symbols-rounded" aria-hidden="true">refresh</span><span data-refresh-label>อัปเดต</span></button></div><p id="connection-status" class="activity-note" role="status"></p><p id="balance-freshness" role="status"></p><p id="history-freshness" role="status"></p><p class="activity-status-tip">รายการจากตู้จะปรากฏเมื่อระบบบันทึกสำเร็จ</p><div class="activity-actions"><button type="button" id="open-report"><span class="material-symbols-rounded" aria-hidden="true">support_agent</span><span>แจ้งปัญหาแต้ม</span><span class="material-symbols-rounded action-arrow" aria-hidden="true">chevron_right</span></button><button type="button" id="open-my-reports"><span class="material-symbols-rounded" aria-hidden="true">inbox</span><span>ติดตามเรื่อง</span><span class="material-symbols-rounded action-arrow" aria-hidden="true">chevron_right</span></button></div>';
 home.querySelector('.balance-hero')?.after(status);
 const more=doc.createElement('button');more.type='button';more.id='history-more';more.className='activity-button';more.textContent='โหลดประวัติเพิ่ม';more.hidden=true;$('recent-history-list')?.after(more);
 const councilButton=doc.createElement('button');councilButton.type='button';councilButton.id='open-council-reports';councilButton.className='activity-button';councilButton.textContent='รับเรื่องแต้มไม่เข้า / ตรวจสอบปัญหา';councilButton.hidden=true;$('view-scanner')?.prepend(councilButton);
 const profileCouncil=councilButton.cloneNode(true);profileCouncil.id='open-council-reports-profile';$('tab-profile')?.append(profileCouncil);
 const holder=doc.createElement('div');holder.innerHTML=
 '<dialog class="friend-detail activity-dialog" id="history-dialog" aria-labelledby="history-title"><div class="detail-top"><h2 id="history-title">รายละเอียดแต้ม</h2><button type="button" data-close-activity aria-label="ปิด">✕</button></div><div id="history-details"></div><button type="button" id="history-report" class="activity-button">แจ้งปัญหารายการนี้</button></dialog>'+
 '<dialog class="friend-detail activity-dialog" id="report-dialog" aria-labelledby="report-title"><div class="detail-top"><h2 id="report-title">ให้สภาช่วยตรวจแต้ม</h2><button type="button" data-close-activity aria-label="ปิด">✕</button></div><p class="activity-note">แจ้งปัญหาเพื่อให้สภาตรวจสอบ การส่งเรื่องไม่เพิ่มแต้มอัตโนมัติ</p><form id="report-form"><label for="report-time">วันและเวลาใช้ตู้โดยประมาณ (เวลาตามเครื่อง)</label><input type="datetime-local" id="report-time" required><input type="hidden" id="report-log"><p id="report-reference" class="activity-note"></p><label for="report-text">รายละเอียดปัญหา</label><textarea id="report-text" maxlength="1000" rows="5" required placeholder="เช่น หยอดขวดช่วงพักกลางวัน แต่ยังไม่เห็นแต้ม"></textarea><p class="activity-note">ไม่เกิน 1,000 ตัวอักษร • ไม่ต้องระบุรหัสผ่าน</p><button type="submit" id="report-send" class="activity-button">ส่งเรื่องให้สภาตรวจสอบ</button></form><p id="report-submit-status" role="status" aria-live="polite"></p></dialog>'+
 '<dialog class="friend-detail activity-dialog" id="reports-dialog" aria-labelledby="reports-title"><div class="detail-top"><h2 id="reports-title">ติดตามเรื่อง</h2><button type="button" data-close-activity aria-label="ปิด">✕</button></div><div class="activity-actions"><label for="reports-filter">สถานะ</label><select id="reports-filter"><option value="">ทั้งหมด</option value="PENDING">รอตรวจสอบ</option><option value="REVIEWING">กำลังตรวจสอบ</option><option value="RESOLVED">ตรวจสอบแล้ว</option></select><button type="button" id="reports-refresh">รีเฟรช</button></div><div id="report-list"></div><button type="button" id="reports-more" class="activity-button" hidden>โหลดเรื่องเพิ่ม</button></dialog>'+
 '<dialog class="friend-detail activity-dialog" id="support-dialog" aria-labelledby="support-title"><div class="detail-top"><h2 id="support-title">รายละเอียดเรื่องแจ้ง</h2><button type="button" data-close-activity aria-label="ปิด">✕</button></div><div id="support-details"></div><form id="support-editor" hidden><label for="support-status">สถานะการตรวจสอบ</label><select id="support-status"><option value="PENDING">รอตรวจสอบ</option><option value="REVIEWING">กำลังตรวจสอบ</option><option value="RESOLVED">ตรวจสอบแล้ว</option></select><label for="support-response">คำตอบถึงนักเรียน</label><textarea id="support-response" rows="4" maxlength="1000"></textarea><p class="activity-note">ต้องมีคำตอบก่อนปิดเรื่อง • การปิดเรื่องไม่เพิ่มแต้ม</p><button type="submit" id="support-save" class="activity-button">บันทึกผลตรวจสอบ</button></form><p id="support-save-status" role="status" aria-live="polite"></p></dialog>';
 doc.body.append(holder);
 doc.addEventListener('click',event=>{
  const close=event.target.closest('[data-close-activity]');if(close){close.closest('dialog').close();return;}
  const history=event.target.closest('[data-history-id]');if(history)showHistory(history.dataset.historyId,history);
  const detail=event.target.closest('[data-support-id]');if(detail)reportDetail(detail.dataset.supportId,detail);

 });
 $('history-more').addEventListener('click',()=>api()?.history(true));
 $('open-report').addEventListener('click',event=>openReport(null,event.currentTarget));
 $('history-report').addEventListener('click',event=>{const log=api()?.logs.find(row=>String(row.log_id)===event.currentTarget.dataset.log);$('history-dialog').close();openReport(log,$('open-report'));});
 $('open-my-reports').addEventListener('click',event=>openReports(false,event.currentTarget));
 $('open-council-reports').addEventListener('click',event=>openReports(true,event.currentTarget));
 $('open-council-reports-profile').addEventListener('click',event=>openReports(true,event.currentTarget));
 $('reports-filter').addEventListener('change',event=>{filter=event.target.value;list=[];void loadReports();});
 $('reports-refresh').addEventListener('click',()=>loadReports());$('reports-more').addEventListener('click',()=>loadReports(true));
 for(const id of ['report-time','report-text'])$(id).addEventListener('input',draftChanged);
 $('report-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!sender||sender.busy)return;
  const promise=sender.send({used_at:$('report-time').value,description:$('report-text').value,log_id:$('report-log').value});lockReport();
  try{const receipt=await promise;draft=null;$('report-submit-status').textContent='รับเรื่องแล้ว เลขรับเรื่อง '+receipt.report_id+' • ตรวจสถานะได้ที่ “ติดตามเรื่องของฉัน”';$('report-form').reset();$('report-form').hidden=true;}
  catch(error){$('report-submit-status').textContent=error.message;if(!sender.pending)draftChanged();}
  finally{lockReport();}
 });
 $('support-editor').addEventListener('submit',async event=>{
  event.preventDefault();if($('support-save').disabled||!selected)return;
  const id=selected.report_id;$('support-save').disabled=true;$('support-save-status').textContent='กำลังบันทึก…';
  try{const result=await api().rpc('update_support_report',{report_id:id,status:$('support-status').value,response:$('support-response').value});if(result.error||!result.data?.report_id)throw Error(result.error?.message||'บันทึกไม่สำเร็จ');
   if(selected?.report_id===id){list=list.map(row=>row.report_id===id?{...row,...result.data}:row);reportDetail(id);$('support-save-status').textContent='บันทึกผลตรวจสอบแล้ว';}
   void loadReports();
  }catch(error){if(selected?.report_id===id)$('support-save-status').textContent=error.message;}
  finally{$('support-save').disabled=false;}
 });
 root.addEventListener('online',sync);root.addEventListener('offline',sync);sync();
}
root.PortalActivity={sync};doc.addEventListener('DOMContentLoaded',boot);
})(typeof window!=='undefined'?window:globalThis);
