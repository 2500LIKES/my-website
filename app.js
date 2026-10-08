const SUPABASE_URL = 'https://xsjusojjwpzhbfsbmkax.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LC69PMvBvzkF6n6sMRFzEg_TIjTtkUZ';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const fallbackLogo = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#121722"/><circle cx="200" cy="200" r="150" fill="#242934" stroke="#d7aa69" stroke-width="8"/><text x="200" y="220" text-anchor="middle" fill="#edc486" font-size="44" font-family="Arial" font-weight="700">LOGO</text></svg>');

function setImg(id, src){ $(id).src = src || fallbackLogo; }

async function loadSite(){
  const [{data:settings},{data:links},{data:events},{data:codes}] = await Promise.all([
    sb.from('site_settings').select('*').eq('id',1).maybeSingle(),
    sb.from('links').select('*').eq('enabled',true).order('sort_order').order('created_at'),
    sb.from('activities').select('*').eq('enabled',true).order('sort_order').order('created_at'),
    sb.from('free_codes').select('*').eq('enabled',true).order('sort_order').order('created_at')
  ]);
  if(settings){
    const name=settings.site_name || 'MEKDIWA';
    $('brandName').textContent=name;$('drawerName').textContent=name;$('heroName').textContent=name;
    $('announcement').textContent=settings.announcement || '';
    setImg('brandLogo',settings.logo_url);setImg('drawerLogo',settings.logo_url);setImg('heroLogo',settings.logo_url);
    document.title=name;
  } else { setImg('brandLogo');setImg('drawerLogo');setImg('heroLogo'); }
  renderCards('linksGrid',links,'เว็บไซต์');
  renderCards('eventsGrid',events,'เปิดกิจกรรม');
  renderCodes(codes);
}
function renderCards(id,rows,button){
  const el=$(id);
  if(!rows?.length){el.innerHTML='<div class="empty">ยังไม่มีรายการ</div>';return}
  el.innerHTML=rows.map(x=>`<article class="link-card">
    ${x.image_url?`<div class="thumb"><img src="${esc(x.image_url)}" alt=""></div>`:''}
    <div class="card-body"><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p>
    <a class="open-btn" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.button_text||button)}</a></div>
  </article>`).join('');
}
function renderCodes(rows){
  const el=$('codesGrid');
  if(!rows?.length){el.innerHTML='<div class="empty">ยังไม่มีโค้ด</div>';return}
  el.innerHTML=rows.map(x=>`<article class="link-card">
    ${x.image_url?`<div class="thumb"><img src="${esc(x.image_url)}" alt=""></div>`:''}
    <div class="card-body"><h3>${esc(x.name)}</h3><p>โค้ด: <b>${esc(x.code)}</b></p>
    <a class="open-btn" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">เปิดลิงก์</a></div>
  </article>`).join('');
}

$('menuBtn').onclick=()=>{$('drawer').classList.add('open');$('drawerBackdrop').classList.add('open')};
$('drawerBackdrop').onclick=closeDrawer;
function closeDrawer(){$('drawer').classList.remove('open');$('drawerBackdrop').classList.remove('open')}
document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'});closeDrawer()});
$('settingsBtn').onclick=()=>{closeDrawer();$('loginModal').classList.add('show')};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove('show'));

$('loginBtn').onclick=async()=>{
  const email=$('adminEmail').value.trim(),password=$('adminPassword').value;
  $('loginMsg').textContent='กำลังเข้าสู่ระบบ...';
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){$('loginMsg').textContent='เข้าสู่ระบบไม่สำเร็จ: '+error.message;return}
  location.href='admin.html';
};

sb.channel('public-site-realtime')
 .on('postgres_changes',{event:'*',schema:'public',table:'site_settings'},loadSite)
 .on('postgres_changes',{event:'*',schema:'public',table:'links'},loadSite)
 .on('postgres_changes',{event:'*',schema:'public',table:'activities'},loadSite)
 .on('postgres_changes',{event:'*',schema:'public',table:'free_codes'},loadSite)
 .subscribe();

loadSite();
