// Boot aplikasi: init data, router nav() (fetch fragment HTML), sidebar, dark mode, jam dunia

// Peta id halaman -> nama file di folder /pages
const PAGE_FILES = {
  dashboard:'dashboard', laporan:'laporan',
  ca:'current-asset', ce:'cash-equivalent', nc:'non-current-asset', inv:'investment',
  hutang:'hutang', exp:'pengeluaran', inc:'pemasukan'
};

async function init(){
  const load=async(t,q='')=>{try{return await sbG(t,q);}catch(e){console.warn(e);return[];}};
  const [ca,ar,ii,ppe,intg,inv,snaps,payHist,inc,exp,debt,debtPay]=await Promise.all([
    load('current_assets'),load('accounts_receivable'),load('inventory'),
    load('property_plant_equipment'),load('intangible_assets'),load('investments'),
    load('laporan_snapshots','&order=snapshot_date.asc'),
    load('payment_history','&order=paid_date.asc'),
    load('income'),load('expenses'),
    load('debts'),load('debt_payments','&order=paid_date.asc'),
  ]);
  DB={ca,ar,ii,ppe,intg,inv,snaps,payHist,inc,exp,debt,debtPay};

  // Fetch FX in background
  fetchFX().catch(()=>{});

  // Halaman default (Dashboard) sudah di-load duluan oleh boot sequence di bawah,
  // jadi elemen dash-pick dkk sudah ada di DOM saat baris ini jalan.
  const curYM=td().slice(0,7);
  try{document.getElementById('dash-pick').value=curYM;}catch(e){}
  onDashMonth(curYM,'init');
  updateStats();
  initCharts();
  applyI18n();
  hideLS();
  doSnap().catch(()=>{});
}
function hideLS(){const e=document.getElementById('ls');if(e){e.classList.add('hide');setTimeout(()=>{e.style.display='none';},500);}}
async function doSnap(){
  const day=td();
  const pay={total_current:tCur(),total_non_current:tNC(),total_asset:tAst(),total_receivable:sAR(),total_investment:sINV()};
  const ex=DB.snaps.find(s=>s.snapshot_date===day);
  if(ex){await sbU('laporan_snapshots',ex.id,pay);Object.assign(ex,pay);}
  else{const r=await sbI('laporan_snapshots',{snapshot_date:day,...pay});const rec=Array.isArray(r)?r[0]:r;if(rec&&rec.id)DB.snaps.push(rec);}
  DB.snaps.sort((a,b)=>a.snapshot_date.localeCompare(b.snapshot_date));
  refreshCharts();
}
function reRender(){const p=document.querySelector('.page.active')?.id;if(p==='page-ca')rCA();if(p==='page-ce'){rAR();rII();}if(p==='page-nc'){rPPE();rINTG();}if(p==='page-inv')rINV();if(p==='page-inc')renderIncPage();if(p==='page-exp')renderExpPage();if(p==='page-hutang')renderHutangPage();}

// ══════════════════════════════════════════════════════════════
// ROUTER — fetch fragment HTML dari /pages lalu render kontennya
// ══════════════════════════════════════════════════════════════
let currentPage='dashboard';
async function nav(id,el){
  const file=PAGE_FILES[id];
  if(!file){console.warn('Halaman tidak dikenal:',id);return;}
  try{
    const res=await fetch(`pages/${file}.html`);
    if(!res.ok)throw new Error('HTTP '+res.status);
    document.getElementById('app').innerHTML=await res.text();
  }catch(e){
    document.getElementById('app').innerHTML='<div class="card">❌ Gagal memuat halaman ini. Pastikan situs diakses via server (http/https), bukan dibuka langsung sebagai file.</div>';
    console.error('Gagal fetch halaman',id,e);
    return;
  }
  currentPage=id;
  document.querySelectorAll('.sb-it').forEach(i=>i.classList.remove('active'));
  if(el)el.classList.add('active');
  else{const navEl=document.getElementById('nav-'+id);if(navEl)navEl.classList.add('active');}
  if(window.innerWidth<=768)closeSidebar();

  if(id==='ca')rCA();
  if(id==='ce'){rAR();rII();}
  if(id==='nc'){rPPE();rINTG();}
  if(id==='inv')rINV();
  if(id==='inc')renderIncPage();
  if(id==='exp')renderExpPage();
  if(id==='hutang')renderHutangPage();
  if(id==='settings')fillSettingsForm();
  if(id==='laporan'){const lym=document.getElementById('lap-pick')?.value||td().slice(0,7);onLapMonth(lym,'nav');}
  if(id==='labarugi'){const lym=document.getElementById('lr-pick')?.value||td().slice(0,7);onLRMonth(lym,'nav');}
  if(id==='aruskas'){const lym=document.getElementById('ak-pick')?.value||td().slice(0,7);onAKMonth(lym,'nav');}
  if(id==='dashboard'){
    const ym=td().slice(0,7);
    const dp=document.getElementById('dash-pick');if(dp)dp.value=ym;
    onDashMonth(ym,'nav');updateStats();initCharts();updateAlokasiChart();updateInvDChart();updateRecvPieChart();refreshCharts();
  }
  applyAppSettings(); // logo/avatar/nama akun ikut dipasang ulang kalau ada elemen baru di fragment
  window.scrollTo({top:0,behavior:'smooth'});
}

function toggleSidebar(){
  if(window.innerWidth<=768){document.getElementById('sidebar').classList.toggle('mob-open');document.getElementById('sb-ov').classList.toggle('show');}
  else{sbOpen=!sbOpen;const sb=document.getElementById('sidebar'),mn=document.getElementById('main');sb.style.transform=sbOpen?'':'translateX(-100%)';sb.style.width=sbOpen?'':'0';mn.style.marginLeft=sbOpen?'var(--sw)':'0';}
}
function closeSidebar(){document.getElementById('sidebar').classList.remove('mob-open');document.getElementById('sb-ov').classList.remove('show');}
window.addEventListener('resize',()=>{if(window.innerWidth>768){document.getElementById('sidebar').classList.remove('mob-open');document.getElementById('sb-ov').classList.remove('show');}});
function toggleDark(){document.body.classList.toggle('dark');const d=document.body.classList.contains('dark');document.getElementById('dk-lbl').textContent=d?'Light':'Dark';localStorage.setItem('dk',d?'1':'0');}
if(localStorage.getItem('dk')==='1'){document.body.classList.add('dark');document.getElementById('dk-lbl').textContent='Light';}
function tickClocks(){
  const now=new Date();
  [['wc-id','Asia/Makassar'],['wc-uk','Europe/London'],['wc-us','America/New_York']].forEach(([id,tz])=>{
    const el=document.getElementById(id);if(!el)return;
    el.textContent=now.toLocaleTimeString('id-ID',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · '+now.toLocaleDateString('id-ID',{timeZone:tz,day:'2-digit',month:'short',year:'numeric'});
  });
}

// ══════════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',async()=>{
  if(window.innerWidth<=768){const m=document.getElementById('main');if(m)m.classList.add('full');}
  loadAppSettings();
  tickClocks();setInterval(tickClocks,1000);
  setInterval(fetchFX,5*60*1000);

  // load fragment Dashboard duluan (halaman default), baru fetch data Supabase
  try{
    const res=await fetch('pages/dashboard.html');
    document.getElementById('app').innerHTML=await res.text();
    const navEl=document.getElementById('nav-dashboard');if(navEl)navEl.classList.add('active');
  }catch(e){
    document.getElementById('app').innerHTML='<div class="card">❌ Gagal memuat halaman. Jalankan lewat server (contoh: <code>npx serve</code>), jangan buka file langsung.</div>';
    hideLS();
    return;
  }
  init().catch(e=>{console.error(e);hideLS();showToast('❌ Error: '+e.message);});
});
