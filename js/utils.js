// Fungsi utilitas umum: format angka, tanggal, i18n, toast, dll

function applyI18n(){
  const d=I18[LANG];
  document.querySelectorAll('[data-i]').forEach(el=>{const k=el.getAttribute('data-i');if(d[k])el.textContent=d[k];});
}
function toggleLang(){LANG=LANG==='id'?'en':'id';document.getElementById('lang-lbl').textContent=LANG.toUpperCase();applyI18n();}
async function fetchFX(){
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/USD');
    const data=await r.json();
    if(data&&data.rates&&data.rates.IDR){
      FX_RATE=data.rates.IDR;
      const now=new Date();
      FX_UPDATED=now.toLocaleString('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'short',year:'numeric'});
      document.getElementById('fx-rate').textContent='1 USD = Rp '+FX_RATE.toLocaleString('id-ID',{maximumFractionDigits:0});
      document.getElementById('fx-note').textContent='Update: '+FX_UPDATED+' WITA';
    }
  }catch(e){document.getElementById('fx-rate').textContent='1 USD = Rp '+FX_RATE.toLocaleString('id-ID');document.getElementById('fx-note').textContent='Kurs default (offline)';}
}

function toggleCurrency(){
  CUR=CUR==='IDR'?'USD':'IDR';
  document.getElementById('cur-lbl').textContent=CUR;
  document.getElementById('btn-cur').classList.toggle('active-toggle',CUR==='USD');
  updateAll();
  reRender();
  if(document.getElementById('page-laporan'))applyLaporanFilter();
}

function fRp(v){
  const n=Math.abs(+v);
  if(CUR==='USD'){return'$'+(n/FX_RATE).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
  return'Rp '+n.toLocaleString('id-ID',{maximumFractionDigits:0});
}
function curSym(){return CUR==='USD'?'USD':'IDR';}
const sCA=()=>DB.ca.reduce((a,x)=>a+(+x.amount),0);
const sAR=()=>DB.ar.reduce((a,x)=>a+(+(x.amount||0))-(+(x.paid||0)),0);
const sII=()=>DB.ii.reduce((a,x)=>a+(+x.amount),0);
const sPPE=()=>DB.ppe.reduce((a,x)=>a+(+x.amount),0);
const sINT=()=>DB.intg.reduce((a,x)=>a+(+x.amount),0);
const sINV=()=>DB.inv.reduce((a,x)=>a+(+x.amount),0);
const tCur=()=>sCA()+sAR()+sII();
const tNC=()=>sPPE()+sINT()+sINV();
const tAst=()=>tCur()+tNC();
const MN_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MN_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MN=()=>LANG==='id'?MN_ID:MN_EN;
const mLbl=s=>{if(!s)return'—';const[y,m]=s.split('-');return MN()[+m-1]+' '+y;};
const td=()=>new Date().toISOString().slice(0,10);
const ymOf=d=>d?d.slice(0,7):'';
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
const CHART_COLORS=['#2563eb','#22c55e','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7'];
const TT={backgroundColor:'rgba(15,23,42,.92)',titleFont:{size:11},bodyFont:{size:11},padding:9,cornerRadius:7};
const zoomPlugin={zoom:{wheel:{enabled:true},pinch:{enabled:true},mode:'x'},pan:{enabled:true,mode:'x'}};
const SC=(ycb)=>({x:{ticks:{maxTicksLimit:7,font:{size:9},color:'#94a3b8'},grid:{display:false}},y:{ticks:{font:{size:9},color:'#94a3b8',callback:ycb||((v)=>fRp(v))},grid:{color:'rgba(0,0,0,.04)'}}});
function noteCell(n){return`<td style="max-width:130px"><span title="${esc(n||'')}" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mu);font-size:11px">${n?esc(n):'—'}</span></td>`;}
function escQ(s){return(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');}
let _tt;
function showToast(m){const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),3200);}
