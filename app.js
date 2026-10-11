/*
 SZ DEMO — Supabase-backed prototype.
 Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY below.
 Do not put a service_role/secret key in browser code.
*/
const SUPABASE_URL = "https://xsjusojjwpzhbfsbmkax.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LC69PMvBvzkF6n6sMRFzEg_TIjTtkUZ";
const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
let currentUser = null, currentProfile = null, realtimeChannel = null, isSpinning = false;
const money = n => (Number(n || 0)).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function message(id, text, type="") { const el=$(id); el.textContent=text; el.className="message"+(type?" "+type:""); }
function setConnected(text, ok=false){$("connection").textContent=(ok?"● ":"● ")+text;$("connection").style.color=ok?"#57e6b1":"#ffcb6b";}
function setTab(tab){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));$("loginForm").classList.toggle("hidden",tab!=="login");$("registerForm").classList.toggle("hidden",tab!=="register");message("authMessage","");}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));

async function sha256(str){const data=new TextEncoder().encode(str);const digest=await crypto.subtle.digest("SHA-256",data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function register(){
  const username=$("regUsername").value.trim(), phone=$("regPhone").value.replace(/\D/g,""), password=$("regPassword").value;
  if(username.length<3) return message("authMessage","ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร","error");
  if(!/^0\d{9}$/.test(phone)) return message("authMessage","กรุณากรอกเบอร์โทรศัพท์ 10 หลัก","error");
  if(password.length<8) return message("authMessage","รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร","error");
  if(!sb) return message("authMessage","ยังโหลด Supabase ไม่สำเร็จ","error");
  $("registerBtn").disabled=true;
  try{
    // Auth account created by Supabase Auth; phone uniqueness is also enforced in profiles table.
    const email=`u${phone}@sz-demo.invalid`;
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{username,phone}}});
    if(error) throw error;
    if(!data.user) throw new Error("สมัครไม่สำเร็จ กรุณาลองอีกครั้ง");
    // Profile insert is handled by the SQL trigger. If email confirmation is enabled, user may need to confirm.
    message("authMessage","สมัครสำเร็จ หากเปิดยืนยันอีเมล ให้ตรวจสอบการตั้งค่า Supabase Auth ก่อนเข้าสู่ระบบ","success");
    setTab("login"); $("loginUsername").value=username;
  }catch(e){message("authMessage",friendlyError(e),"error");}
  finally{$("registerBtn").disabled=false;}
}
async function login(){
  const username=$("loginUsername").value.trim(), password=$("loginPassword").value;
  if(!username||!password) return message("authMessage","กรอกชื่อผู้ใช้และรหัสผ่านก่อน","error");
  $("loginBtn").disabled=true;
  try{
    // Look up username to obtain the synthetic auth email; RLS must allow this lookup only as designed.
    const {data:profile,error}=await sb.from("profiles").select("phone,username").eq("username",username).maybeSingle();
    if(error) throw error;
    if(!profile) throw new Error("ไม่พบชื่อผู้ใช้นี้");
    const {data,error:authError}=await sb.auth.signInWithPassword({email:`u${profile.phone}@sz-demo.invalid`,password});
    if(authError) throw authError;
    currentUser=data.user;
    await loadApp();
  }catch(e){message("authMessage",friendlyError(e),"error");}
  finally{$("loginBtn").disabled=false;}
}
function friendlyError(e){
  const s=String(e?.message||e||"เกิดข้อผิดพลาด");
  if(/duplicate key|profiles_phone_key|phone.*unique/i.test(s)) return "เบอร์โทรศัพท์นี้ถูกใช้สมัครแล้ว";
  if(/Invalid login credentials/i.test(s)) return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  if(/Email not confirmed/i.test(s)) return "บัญชียังไม่ยืนยันอีเมล ให้ตรวจ Auth settings ใน Supabase";
  if(/Failed to fetch/i.test(s)) return "เชื่อมต่อไม่สำเร็จ ตรวจอินเทอร์เน็ตและค่า Supabase";
  return s;
}
async function logout(){if(sb) await sb.auth.signOut();currentUser=null;currentProfile=null;if(realtimeChannel) await sb.removeChannel(realtimeChannel);$("appView").classList.add("hidden");$("authView").classList.remove("hidden");$("logoutBtn").classList.add("hidden");setConnected("เชื่อมต่อแล้ว",true);}
async function loadApp(){
  const {data:userWrap}=await sb.auth.getUser(); if(!userWrap?.user){return;}
  currentUser=userWrap.user;
  const {data:profile,error}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
  if(error) throw error;
  currentProfile=profile;
  if(profile.banned) {await sb.auth.signOut();throw new Error("บัญชีนี้ถูกระงับการใช้งาน");}
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  $("memberName").textContent=profile.username;
  const isAdmin=profile.is_admin===true;
  $("adminPanel").classList.toggle("hidden",!isAdmin);$("adminBadge").classList.toggle("hidden",!isAdmin);
  setConnected("เชื่อมต่อฐานข้อมูลแล้ว",true);
  await refreshAll();
  if(realtimeChannel) await sb.removeChannel(realtimeChannel);
  realtimeChannel=sb.channel("sz-live-"+currentUser.id)
    .on("postgres_changes",{event:"*",schema:"public",table:"profiles"},()=>refreshAll())
    .on("postgres_changes",{event:"*",schema:"public",table:"transactions"},()=>refreshAll())
    .on("postgres_changes",{event:"*",schema:"public",table:"withdrawals"},()=>refreshAll())
    .subscribe();
}
async function refreshAll(){if(!currentUser)return;try{const {data:p,error}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();if(error)throw error;currentProfile=p;if(p.banned){await logout();return;}renderProfile(p);await loadHistory();if(p.is_admin)await loadAdmin();}catch(e){console.error(e);}}
function renderProfile(p){$("balance").textContent=money(p.balance);$("spins").textContent=Number(p.spins_left||0);$("earned").textContent=money(p.total_earned);$("withdrawn").textContent=money(p.total_withdrawn);$("spinBtn").disabled=Number(p.spins_left||0)<=0||isSpinning;}
async function loadHistory(){
  const [tx,wd]=await Promise.all([
    sb.from("transactions").select("id,created_at,type,amount,status,description").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(30),
    sb.from("withdrawals").select("id,created_at,amount,status,phone").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(30)
  ]);
  if(tx.error) console.warn(tx.error);if(wd.error) console.warn(wd.error);
  const rows=[...(tx.data||[]).map(x=>({...x,kind:x.description||x.type})),...(wd.data||[]).map(x=>({...x,kind:"ถอนทดลอง",amount:-Number(x.amount),status:x.status}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  $("historyBody").innerHTML=rows.length?rows.map(x=>`<tr><td>${new Date(x.created_at).toLocaleString("th-TH")}</td><td>${esc(x.kind)}</td><td>${x.amount<0?"−":"+"}${money(Math.abs(x.amount))} บาท</td><td>${statusPill(x.status)}</td></tr>`).join(""):'<tr><td colspan="4" class="empty">ยังไม่มีรายการ</td></tr>';
  $("pendingAmount").textContent=money((wd.data||[]).filter(x=>x.status==="pending").reduce((s,x)=>s+Number(x.amount),0))+" บาท";
}
function statusPill(s){const map={pending:["รอตรวจสอบ","pending"],success:["สำเร็จ","success"],failed:["ไม่สำเร็จ","failed"],spin:["สำเร็จ","success"],banned:["ถูกแบน","banned"]};const v=map[s]||[s||"—",""];return `<span class="status ${v[1]}">${esc(v[0])}</span>`;}
const prizes=[{label:"5 บาท",amount:5},{label:"เกลือ",amount:0},{label:"10 บาท",amount:10},{label:"20 บาท",amount:20},{label:"เกลือ",amount:0},{label:"15 บาท",amount:15}];
async function spin(){
  if(isSpinning||!currentProfile||Number(currentProfile.spins_left)<=0)return;
  isSpinning=true;$("spinBtn").disabled=true;message("spinMessage","กำลังหมุนวงล้อ…");
  try{
    // Atomic RPC prevents two devices from consuming the same last spin.
    const {data,error}=await sb.rpc("spin_demo_wheel");
    if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;
    const idx=Number(result?.prize_index??0), prize=prizes[idx]||prizes[0];
    $("wheel").style.transform=`rotate(${1440+idx*60+Math.floor(Math.random()*40)}deg)`;
    await new Promise(r=>setTimeout(r,3200));
    message("spinMessage",prize.amount?`ยินดีด้วย! ได้รับ ${prize.label} ทดลอง`:"เกลือ! รอบนี้ไม่ได้รับรางวัลทดลอง", "success");
    await refreshAll();
  }catch(e){message("spinMessage",friendlyError(e),"error");}
  finally{isSpinning=false;$("spinBtn").disabled=Number(currentProfile?.spins_left||0)<=0;}
}
async function requestWithdraw(){
  const phone=$("withdrawPhone").value.replace(/\D/g,""),amount=Number($("withdrawAmount").value);
  if(!/^0\d{9}$/.test(phone))return message("withdrawMessage","กรุณากรอกเบอร์โทรศัพท์ 10 หลัก","error");
  if(!Number.isFinite(amount)||amount<3)return message("withdrawMessage","จำนวนขั้นต่ำคือ 3 บาททดลอง","error");
  $("withdrawBtn").disabled=true;
  try{const {error}=await sb.rpc("request_demo_withdrawal",{p_phone:phone,p_amount:amount});if(error)throw error;message("withdrawMessage","ส่งคำขอถอนทดลองแล้ว รอแอดมินตรวจสอบ","success");$("withdrawAmount").value="";await refreshAll();}
  catch(e){message("withdrawMessage",friendlyError(e),"error");}
  finally{$("withdrawBtn").disabled=false;}
}
async function loadAdmin(){
  const [members,withdrawals]=await Promise.all([
    sb.from("profiles").select("id,username,phone,balance,spins_left,banned,is_admin,created_at").order("created_at",{ascending:false}),
    sb.from("withdrawals").select("id,user_id,phone,amount,status,created_at,profiles(username)").order("created_at",{ascending:false}).limit(100)
  ]);
  if(members.error||withdrawals.error){console.warn(members.error||withdrawals.error);return;}
  const ms=members.data||[], ws=withdrawals.data||[];
  $("totalMembers").textContent=ms.length;
  $("totalBalance").textContent=money(ms.reduce((s,m)=>s+Number(m.balance||0),0))+" บาท";
  $("totalPending").textContent=ws.filter(w=>w.status==="pending").length;
  $("membersBody").innerHTML=ms.map(m=>`<tr><td>${esc(m.username)}${m.is_admin?' <span class="tag">ADMIN</span>':''}</td><td>${esc(m.phone)}</td><td>${money(m.balance)}</td><td>${m.spins_left}</td><td>${m.banned?statusPill("banned"):'<span class="status success">ปกติ</span>'}</td><td>${m.is_admin?'<span class="muted">—</span>':`<button class="btn table-btn blue" data-action="spins" data-id="${m.id}">+ สิทธิ์</button><button class="btn table-btn ${m.banned?'good':'bad'}" data-action="ban" data-banned="${m.banned}" data-id="${m.id}">${m.banned?'ปลดแบน':'แบน'}</button>`}</td></tr>`).join("")||'<tr><td colspan="6" class="empty">ไม่มีสมาชิก</td></tr>';
  $("withdrawalsBody").innerHTML=ws.map(w=>`<tr><td>${new Date(w.created_at).toLocaleString("th-TH")}</td><td>${esc(w.profiles?.username||"สมาชิก")}</td><td>${esc(w.phone)}</td><td>${money(w.amount)} บาท</td><td>${statusPill(w.status)}</td><td>${w.status==="pending"?`<button class="btn table-btn good" data-wd="success" data-id="${w.id}">อนุมัติสำเร็จ</button><button class="btn table-btn bad" data-wd="failed" data-id="${w.id}">ไม่สำเร็จ</button>`:'—'}</td></tr>`).join("")||'<tr><td colspan="6" class="empty">ไม่มีคำขอถอน</td></tr>';
}
document.addEventListener("click",async e=>{
  const a=e.target.closest("[data-action]");if(a){const id=a.dataset.id;
    try{
      if(a.dataset.action==="spins"){const n=Number(prompt("เพิ่มสิทธิ์หมุนกี่ครั้ง?", "5"));if(!Number.isInteger(n)||n<1||n>1000)return;const {error}=await sb.rpc("admin_adjust_member",{p_user_id:id,p_balance_delta:0,p_spins_delta:n,p_banned:null});if(error)throw error;}
      if(a.dataset.action==="ban"){const banned=a.dataset.banned==="true";if(!confirm(banned?"ปลดแบนสมาชิกนี้?":"แบนสมาชิกนี้?"))return;const {error}=await sb.rpc("admin_adjust_member",{p_user_id:id,p_balance_delta:0,p_spins_delta:0,p_banned:!banned});if(error)throw error;}
      await refreshAll();
    }catch(err){alert("ดำเนินการไม่สำเร็จ: "+friendlyError(err));}
  }
  const wd=e.target.closest("[data-wd]");if(wd){if(!confirm("ยืนยันเปลี่ยนสถานะรายการถอนทดลอง?"))return;try{const {error}=await sb.rpc("admin_review_demo_withdrawal",{p_withdrawal_id:wd.dataset.id,p_new_status:wd.dataset.wd});if(error)throw error;await refreshAll();}catch(err){alert("อัปเดตไม่สำเร็จ: "+friendlyError(err));}}
});
$("registerBtn").addEventListener("click",register);$("loginBtn").addEventListener("click",login);$("logoutBtn").addEventListener("click",logout);$("spinBtn").addEventListener("click",spin);$("withdrawBtn").addEventListener("click",requestWithdraw);$("refreshBtn").addEventListener("click",refreshAll);
for(const id of ["loginUsername","loginPassword"])$(id).addEventListener("keydown",e=>{if(e.key==="Enter")login();});
for(const id of ["regUsername","regPhone","regPassword"])$(id).addEventListener("keydown",e=>{if(e.key==="Enter")register();});
(async function init(){
  if(!sb){setConnected("โหลดไลบรารีไม่สำเร็จ");return;}
  setConnected("กำลังเชื่อมต่อ…");
  try{const {data}=await sb.auth.getSession();if(data.session){currentUser=data.session.user;await loadApp();}else setConnected("พร้อมเชื่อมต่อ",true);}
  catch(e){setConnected("ตั้งค่า Supabase ไม่ครบ");console.error(e);}
})();
