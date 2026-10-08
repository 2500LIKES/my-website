const SUPABASE_URL = 'https://xsjusojjwpzhbfsbmkax.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LC69PMvBvzkF6n6sMRFzEg_TIjTtkUZ';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const tableNames=['links','events','codes'];
async function ensureAdmin(){
 const {data:{user}}=await sb.auth.getUser();
 if(!user){location.href='index.html';return null}
 return user;
}
async function initAdmin(){
 const user=await ensureAdmin(); if(!user)return;
 const {data:s}=await sb.from('site_settings').select('*').eq('id',1).maybeSingle();
 if(s){$('siteName').value=s.site_name||'';$('logoUrl').value=s.logo_url||'';$('announcement').value=s.announcement||''}
 await loadAdminTables();
}
$('saveSettings').onclick=async()=>{
 const {error}=await sb.from('site_settings').upsert({id:1,site_name:$('siteName').value.trim(),logo_url:$('logoUrl').value.trim(),announcement:$('announcement').value.trim()});
 $('settingsMsg').textContent=error?'บันทึกไม่สำเร็จ: '+error.message:'บันทึกแล้ว';
};
async function loadAdminTables(){
 for(const t of tableNames){
  const {data}=await sb.from(t).select('*').order('sort_order').order('created_at');
  renderAdmin(t,data||[]);
 }
}
function renderAdmin(t,rows){
 const el=$(t+'Admin');
 el.innerHTML=rows.length?rows.map(r=>`<div class="row"><div class="row-title"><b>${esc(r.title)}</b><small>${esc(r.url||'')} · <span class="status">${r.enabled?'เปิด':'ปิด'}</span></small></div><button class="open-btn" onclick='editRow(${JSON.stringify(r)}, "${t}")'>แก้ไข</button><button class="open-btn danger" onclick='deleteRow("${r.id}","${t}")'>ลบ</button></div>`).join(''):'<div class="empty">ยังไม่มีรายการ</div>';
}
function openEditor(t,row=null){
 $('editor').classList.add('show');$('editTable').value=t;$('editId').value=row?.id||'';
 $('editorTitle').textContent=row?'แก้ไขรายการ':'เพิ่มรายการ';
 $('fTitle').value=row?.title||'';$('fUrl').value=row?.url||'';$('fImage').value=row?.image_url||'';$('fButton').value=row?.button_text||'เปิดเว็บไซต์';$('fDesc').value=row?.description||'';$('fCode').value=row?.code||'';$('fEnabled').value=String(row?.enabled ?? true);
 $('codeLabel').style.display=t==='codes'?'block':'none';
}
function closeEditor(){$('editor').classList.remove('show')}
window.openEditor=openEditor;window.closeEditor=closeEditor;
window.editRow=(r,t)=>openEditor(t,r);
window.deleteRow=async(id,t)=>{
 if(!confirm('ลบรายการนี้หรือไม่?'))return;
 const {error}=await sb.from(t).delete().eq('id',id); if(error)alert(error.message); else loadAdminTables();
};
$('saveItem').onclick=async()=>{
 const t=$('editTable').value,id=$('editId').value;
 const payload={title:$('fTitle').value.trim(),url:$('fUrl').value.trim(),image_url:$('fImage').value.trim()||null,button_text:$('fButton').value.trim()||'เปิดเว็บไซต์',description:$('fDesc').value.trim()||null,enabled:$('fEnabled').value==='true'};
 if(t==='codes')payload.code=$('fCode').value.trim();
 let q=id?sb.from(t).update(payload).eq('id',id):sb.from(t).insert(payload);
 const {error}=await q;
 $('itemMsg').textContent=error?'บันทึกไม่สำเร็จ: '+error.message:'บันทึกแล้ว';
 if(!error){setTimeout(()=>{closeEditor();loadAdminTables()},300)}
};
$('logoutBtn').onclick=async()=>{await sb.auth.signOut();location.href='index.html'};
sb.channel('admin-realtime').on('postgres_changes',{event:'*',schema:'public'},loadAdminTables).subscribe();
initAdmin();
