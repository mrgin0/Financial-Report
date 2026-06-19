/*
  1) Buat project Supabase
  2) Jalankan isi file supabase.sql di SQL Editor
  3) Isi URL dan ANON KEY di bawah ini
  4) Upload folder ini ke GitHub Pages
*/
const SUPABASE_URL = 'https://prybtaghmbajrahijrjt.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWJ0YWdobWJhanJhaGlqcmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTc0NDMsImV4cCI6MjA5NzIzMzQ0M30.kALEkLvw4a4aQYEgnYvdajUP4YG1yvjKfhPqBaakAnM';
const db = SUPABASE_URL && SUPABASE_ANON_KEY ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = id => document.getElementById(id);
const money = n => '$' + Number(n || 0).toFixed(2);
const colors = ['#2563eb','#34a853','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#64748b','#ec4899'];
let accounts = [];
let reports = [];
let charts = {};
let confirmAction = null;

const seedAccounts = [
  {name:'Cash', type:'current', group_name:'cash'},
  {name:'Bank', type:'current', group_name:'cash'},
  {name:'Penghasilan dari akun @miftahatuljannah', type:'current', group_name:'cash'},
  {name:'Accounts Receivable', type:'current', group_name:'receivable'},
  {name:'Inventory', type:'current', group_name:'inventory'},
  {name:'Property, Plant and Equipment', type:'noncurrent', group_name:'ppe'},
  {name:'Investment', type:'noncurrent', group_name:'investment'},
  {name:'Intangible Assets', type:'noncurrent', group_name:'intangible'}
];
const today = new Date().toISOString().slice(0,10);
const seedReports = [
  {date:today, account_name:'Cash', account_type:'current', group_name:'cash', description:'Cash', amount:23.50},
  {date:today, account_name:'Bank', account_type:'current', group_name:'cash', description:'Bank', amount:50.00},
  {date:today, account_name:'Penghasilan dari akun @miftahatuljannah', account_type:'current', group_name:'cash', description:'Penghasilan affiliate', amount:10.00},
  {date:today, account_name:'Accounts Receivable', account_type:'current', group_name:'receivable', description:'Piutang', amount:8.25},
  {date:today, account_name:'Inventory', account_type:'current', group_name:'inventory', description:'Inventory', amount:6.46},
  {date:today, account_name:'Property, Plant and Equipment', account_type:'noncurrent', group_name:'ppe', description:'Aset tetap', amount:18.75},
  {date:today, account_name:'Investment', account_type:'noncurrent', group_name:'investment', description:'Investasi', amount:13.58},
  {date:today, account_name:'Intangible Assets', account_type:'noncurrent', group_name:'intangible', description:'Aset tak berwujud', amount:1.00}
];

function uid(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()); }
function saveLocal(){ localStorage.setItem('lkp-accounts', JSON.stringify(accounts)); localStorage.setItem('lkp-reports', JSON.stringify(reports)); }
function loadLocal(){
  accounts = JSON.parse(localStorage.getItem('lkp-accounts') || 'null') || seedAccounts.map(a=>({id:uid(),...a}));
  reports = JSON.parse(localStorage.getItem('lkp-reports') || 'null') || seedReports.map(r=>({id:uid(),...r}));
  saveLocal();
}
async function loadData(){
  loadLocal();
  if(!db){ renderAll(); return; }
  const [aRes, rRes] = await Promise.all([
    db.from('accounts').select('*').order('created_at'),
    db.from('financial_reports').select('*').order('date', {ascending:false})
  ]);
  if(!aRes.error && aRes.data?.length) accounts = aRes.data;
  if(!rRes.error && rRes.data?.length) reports = rRes.data;
  if(!aRes.data?.length){ await db.from('accounts').insert(seedAccounts); }
  if(!rRes.data?.length){ await db.from('financial_reports').insert(seedReports); }
  saveLocal(); renderAll();
}
async function insertRow(table, row){
  if(db){ const {data,error}=await db.from(table).insert(row).select().single(); if(error) throw error; return data; }
  return {id:uid(), ...row};
}
async function updateRow(table, id, row){
  if(db){ const {data,error}=await db.from(table).update(row).eq('id',id).select().single(); if(error) throw error; return data; }
  return {id, ...row};
}
async function deleteRow(table, id){ if(db){ const {error}=await db.from(table).delete().eq('id',id); if(error) throw error; } }
function totals(type){ return reports.filter(r=>!type || r.account_type===type).reduce((s,r)=>s+Number(r.amount),0); }
function byGroup(group){ return reports.filter(r=>r.group_name===group); }
function groupSum(rows){ return rows.reduce((s,r)=>s+Number(r.amount),0); }
function reportData(type){
  const map = new Map();
  reports.filter(r=>r.account_type===type).forEach(r=>{
    const key = r.account_name || 'Tanpa Akun';
    const old = map.get(key) || {name:key, amount:0}; old.amount += Number(r.amount); map.set(key, old);
  });
  return [...map.values()];
}
function renderStats(){ $('totalAsset').textContent=money(totals()); $('todayAsset').textContent=money(totals()); $('currentAsset').textContent=money(totals('current')); $('nonCurrentAsset').textContent=money(totals('noncurrent')); }
function renderReportBox(){
  $('reportDate').value = today;
  const cur = reportData('current'), non = reportData('noncurrent'); let n=1, html='<div class="section-title">A. CURRENT ASSET</div>';
  cur.forEach(a=> html+=`<div class="row"><span>${n++}.</span><span>${a.name}</span><span>${money(a.amount)}</span></div>`);
  html+=`<div class="row total"><span>${n++}.</span><span>Total Current Asset</span><span>${money(totals('current'))}</span></div><div class="section-title">B. NON CURRENT ASSET</div>`;
  non.forEach(a=> html+=`<div class="row"><span>${n++}.</span><span>${a.name}</span><span>${money(a.amount)}</span></div>`);
  html+=`<div class="row total"><span>${n++}.</span><span>Total Non-current Asset</span><span>${money(totals('noncurrent'))}</span></div><div class="row grand"><span>${n++}.</span><span>TOTAL ASSET</span><span>${money(totals())}</span></div>`;
  $('reportTable').innerHTML = html;
}
function legend(el, data){ const sum=data.reduce((s,x)=>s+x.amount,0)||1; el.innerHTML=data.map((x,i)=>`<div class="item"><i class="dot" style="background:${colors[i%colors.length]}"></i><span>${x.name}</span><span>${(x.amount/sum*100).toFixed(1)}%</span><span>${money(x.amount)}</span></div>`).join('')+`<div class="item total"><span></span><span>Total</span><span>100%</span><span>${money(sum)}</span></div>`; }
function makeChart(id,type,data,opts={}){ if(charts[id]) charts[id].destroy(); charts[id]=new Chart($(id),{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:opts.legend??false}},scales:opts.scales??{}}}); }
function renderCharts(){
  const labels=['19 Mei','24 Mei','29 Mei','03 Jun','08 Jun','13 Jun','17 Jun'], base=totals()||1;
  makeChart('growthChart','line',{labels,datasets:[{label:'Total Asset',data:[base*.5,base*.56,base*.65,base*.75,base*.9,base*.96,base],borderColor:'#2563eb',backgroundColor:'#2563eb',tension:.35}]},{scales:{y:{beginAtZero:true}}});
  const current=reportData('current'); legend($('moneyLegend'), current); makeChart('moneyChart','doughnut',{labels:current.map(a=>a.name),datasets:[{data:current.map(a=>a.amount),backgroundColor:colors,borderWidth:0}]});
  const rec=groupSum(byGroup('receivable')); makeChart('receivableChart','line',{labels,datasets:[{label:'Total Receivable',data:[rec*.65,rec*.7,rec*.72,rec*.76,rec*.85,rec*.95,rec],borderColor:'#34a853',backgroundColor:'#34a853',tension:.35}]},{scales:{y:{beginAtZero:true}}});
  const invRows=reportData('noncurrent').filter(x=>x.name.toLowerCase().includes('investment') || x.name.toLowerCase().includes('crypto') || x.name.toLowerCase().includes('emas') || x.name.toLowerCase().includes('saham'));
  const inv=invRows.length?invRows:[{name:'Investment',amount:groupSum(byGroup('investment'))}]; legend($('investmentLegend'), inv); makeChart('investmentChart','doughnut',{labels:inv.map(a=>a.name),datasets:[{data:inv.map(a=>a.amount),backgroundColor:colors,borderWidth:0}]});
  makeChart('gainChart','bar',{labels,datasets:[{label:'Gain / Loss',data:[-3,-5,-2,.6,2.2,-1.7,.8,1.4,-1.2,5,4,2.8,2,1.8,3,4],backgroundColor:ctx=>ctx.raw>=0?'#34a853':'#ef4444'}]},{scales:{y:{beginAtZero:false}}});
}
function renderAccountOptions(){ $('fAccount').innerHTML = accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join(''); }
function actionButtons(id, type){ return `<div class="actions"><button class="action-btn edit" data-edit-${type}="${id}">Edit</button><button class="action-btn delete" data-del-${type}="${id}">Hapus</button></div>`; }
function renderRows(){
  const q=($('searchReport').value||'').toLowerCase();
  const filtered=reports.filter(r=>(r.account_name+r.description+r.date).toLowerCase().includes(q));
  $('reportRows').innerHTML=filtered.map(r=>`<tr><td>${r.date}</td><td>${r.account_name}</td><td>${r.account_type}</td><td>${r.description||'-'}</td><td>${money(r.amount)}</td><td>${actionButtons(r.id,'report')}</td></tr>`).join('');
  $('accountRows').innerHTML=accounts.map(a=>`<tr><td>${a.name}</td><td>${a.type}</td><td>${a.group_name}</td><td>${actionButtons(a.id,'account')}</td></tr>`).join('');
  ['receivable','ppe','investment'].forEach(g=>{$(g+'Rows').innerHTML=byGroup(g).map(r=>`<tr><td>${r.date}</td><td>${r.account_name}</td><td>${r.description||'-'}</td><td>${money(r.amount)}</td><td>${actionButtons(r.id,'report')}</td></tr>`).join('') || '<tr><td colspan="5">Belum ada data</td></tr>';});
}
function renderAll(){ renderStats(); renderReportBox(); renderAccountOptions(); renderRows(); renderCharts(); saveLocal(); }
function showToast(t){ $('toast').textContent=t; $('toast').classList.add('show'); setTimeout(()=>$('toast').classList.remove('show'),1500); }
function openPage(page){ document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); $(page).classList.add('active'); document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active', b.dataset.page===page)); setTimeout(renderCharts,50); }
function fillReport(r){ $('reportId').value=r?.id||''; $('fDate').value=r?.date||today; $('fDesc').value=r?.description||''; $('fAmount').value=r?.amount||''; if(r){ const a=accounts.find(x=>x.name===r.account_name && x.group_name===r.group_name); if(a) $('fAccount').value=a.id; } openPage('laporan'); window.scrollTo({top:0,behavior:'smooth'}); }
function fillAccount(a){ $('accountId').value=a?.id||''; $('aName').value=a?.name||''; $('aType').value=a?.type||'current'; $('aGroup').value=a?.group_name||'cash'; openPage('accounts'); }
function askConfirm(text, fn){ $('modalText').textContent=text; $('modal').classList.add('show'); confirmAction=fn; }

$('reportForm').onsubmit=async e=>{ e.preventDefault(); const acc=accounts.find(a=>a.id===$('fAccount').value); const row={date:$('fDate').value, account_name:acc.name, account_type:acc.type, group_name:acc.group_name, description:$('fDesc').value, amount:Number($('fAmount').value)}; try{ if($('reportId').value){ const data=await updateRow('financial_reports',$('reportId').value,row); reports=reports.map(r=>r.id===$('reportId').value?data:r); } else reports.unshift(await insertRow('financial_reports',row)); fillReport(null); renderAll(); showToast('Laporan tersimpan'); }catch(err){showToast(err.message)} };
$('accountForm').onsubmit=async e=>{ e.preventDefault(); const row={name:$('aName').value, type:$('aType').value, group_name:$('aGroup').value}; try{ if($('accountId').value){ const data=await updateRow('accounts',$('accountId').value,row); accounts=accounts.map(a=>a.id===$('accountId').value?data:a); } else accounts.push(await insertRow('accounts',row)); fillAccount(null); renderAll(); showToast('Master akun tersimpan'); }catch(err){showToast(err.message)} };

document.addEventListener('click', async e=>{
  const nav=e.target.closest('.nav-link'); if(nav) openPage(nav.dataset.page);
  const er=e.target.dataset.editReport; if(er) fillReport(reports.find(r=>r.id===er));
  const ea=e.target.dataset.editAccount; if(ea) fillAccount(accounts.find(a=>a.id===ea));
  const dr=e.target.dataset.delReport; if(dr) askConfirm('Hapus data laporan ini?', async()=>{ await deleteRow('financial_reports',dr); reports=reports.filter(r=>r.id!==dr); renderAll(); showToast('Data laporan dihapus'); });
  const da=e.target.dataset.delAccount; if(da) askConfirm('Hapus master akun ini? Data laporan lama tidak ikut terhapus.', async()=>{ await deleteRow('accounts',da); accounts=accounts.filter(a=>a.id!==da); renderAll(); showToast('Master akun dihapus'); });
  const quick=e.target.closest('.quick-add'); if(quick){ const a=accounts.find(x=>x.group_name===quick.dataset.group) || accounts[0]; fillReport(null); $('fAccount').value=a.id; }
});
$('newReportBtn').onclick=()=>fillReport(null); $('newAccountBtn').onclick=()=>fillAccount(null); $('searchReport').oninput=renderRows;
$('cancelModal').onclick=()=> $('modal').classList.remove('show'); $('okModal').onclick=async()=>{ $('modal').classList.remove('show'); if(confirmAction) await confirmAction(); confirmAction=null; };
$('saveSnapshot').onclick=()=>showToast('Snapshot mengikuti total data laporan saat ini');
$('exportJson').onclick=()=>{ const blob=new Blob([JSON.stringify({accounts,reports},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='laporan-keuangan.json'; a.click(); };
$('darkBtn').onclick=()=>{ document.body.classList.toggle('dark'); localStorage.setItem('lkp-dark', document.body.classList.contains('dark')); };
if(localStorage.getItem('lkp-dark')==='true') document.body.classList.add('dark');
loadData();
