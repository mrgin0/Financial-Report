// Isi kalau mau pakai Supabase. Kalau kosong, app tetap jalan pakai localStorage.
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';
const supabaseClient = SUPABASE_URL ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const colors = ['#2563eb','#34a853','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#64748b'];
let state = JSON.parse(localStorage.getItem('finance-state')) || {
  date: new Date().toISOString().slice(0,10),
  assets:[
    {name:'Cash', amount:23.50, category:'current'}, {name:'Bank', amount:50.00, category:'current'},
    {name:'Penghasilan dari akun @miftahatuljannah', amount:10.00, category:'current'},
    {name:'Accounts receivable', amount:8.25, category:'current'}, {name:'Inventory', amount:6.46, category:'current'},
    {name:'Property, plant and equipment', amount:18.75, category:'noncurrent'}, {name:'Investment', amount:13.58, category:'noncurrent'},
    {name:'Intangible assets', amount:1.00, category:'noncurrent'}
  ]
};
let charts = {};
const $ = id => document.getElementById(id);
const money = n => '$' + Number(n || 0).toFixed(2);
function saveLocal(){ localStorage.setItem('finance-state', JSON.stringify(state)); }
async function saveSupabase(){
  if(!supabaseClient) return;
  await supabaseClient.from('financial_reports').upsert({id:1, data:state, updated_at:new Date().toISOString()});
}
async function loadSupabase(){
  if(!supabaseClient) return render();
  const {data} = await supabaseClient.from('financial_reports').select('data').eq('id',1).maybeSingle();
  if(data?.data){ state = data.data; saveLocal(); }
}
function total(cat){ return state.assets.filter(a=>!cat || a.category===cat).reduce((s,a)=>s+Number(a.amount),0); }
function renderReport(){
  const cur = state.assets.filter(a=>a.category==='current'), non = state.assets.filter(a=>a.category==='noncurrent');
  let n=1, html = '<div class="section-title">A. CURRENT ASSET</div>';
  cur.forEach(a=> html += `<div class="row"><span>${n++}.</span><span>${a.name}</span><span>${money(a.amount)}</span></div>`);
  html += `<div class="row total"><span>${n++}.</span><span>Total Current Asset</span><span>${money(total('current'))}</span></div>`;
  html += '<div class="section-title">B. NON CURRENT ASSET</div>';
  non.forEach(a=> html += `<div class="row"><span>${n++}.</span><span>${a.name}</span><span>${money(a.amount)}</span></div>`);
  html += `<div class="row total"><span>${n++}.</span><span>Total Non-current Asset</span><span>${money(total('noncurrent'))}</span></div>`;
  html += `<div class="row grand"><span>${n++}.</span><span>TOTAL ASSET</span><span>${money(total())}</span></div>`;
  $('reportTable').innerHTML = html;
}
function legend(el, data){
  const sum = data.reduce((s,x)=>s+x.amount,0) || 1;
  el.innerHTML = data.map((x,i)=>`<div class="item"><i class="dot" style="background:${colors[i%colors.length]}"></i><span>${x.name}</span><span>${(x.amount/sum*100).toFixed(1)}%</span><span>${money(x.amount)}</span></div>`).join('') + `<div class="item total"><span></span><span>Total</span><span>100%</span><span>${money(sum)}</span></div>`;
}
function chart(id,type,data,opts={}){ if(charts[id]) charts[id].destroy(); charts[id]=new Chart($(id),{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:opts.legend??false}},scales: opts.scales ?? {}}}); }
function renderCharts(){
  const labels = ['19 Mei','24 Mei','29 Mei','03 Jun','08 Jun','13 Jun','17 Jun'];
  const base = total();
  chart('growthChart','line',{labels,datasets:[{label:'Total Asset',data:[base*.5,base*.56,base*.65,base*.75,base*.9,base*.96,base],borderColor:'#2563eb',backgroundColor:'#2563eb',tension:.35}]},{scales:{y:{beginAtZero:true}}});
  const current = state.assets.filter(a=>a.category==='current'); legend($('moneyLegend'), current); chart('moneyChart','doughnut',{labels:current.map(a=>a.name),datasets:[{data:current.map(a=>a.amount),backgroundColor:colors,borderWidth:0}]});
  chart('receivableChart','line',{labels,datasets:[{label:'Total Receivable',data:[6.8,7,6.9,7.4,8.8,9.9,10.5],borderColor:'#34a853',backgroundColor:'#34a853',tension:.35}]},{scales:{y:{beginAtZero:true}}});
  const inv = [{name:'Saham',amount:6},{name:'Reksa Dana',amount:4},{name:'Crypto',amount:2.4},{name:'Emas',amount:1.18}]; legend($('investmentLegend'), inv); chart('investmentChart','doughnut',{labels:inv.map(a=>a.name),datasets:[{data:inv.map(a=>a.amount),backgroundColor:colors,borderWidth:0}]});
  chart('gainChart','bar',{labels,datasets:[{label:'Gain / Loss',data:[-3,-5,-2,.6,2.2,-1.7,.8,1.4,-1.2,5,4,2.8,2,1.8,3,4],backgroundColor:ctx=>ctx.raw>=0?'#34a853':'#ef4444'}]},{scales:{y:{beginAtZero:false}}});
}
function render(){
  $('reportDate').value = state.date; $('totalAsset').textContent = money(total()); $('todayAsset').textContent = money(total());
  $('currentAsset').textContent = money(total('current')); $('nonCurrentAsset').textContent = money(total('noncurrent'));
  renderReport(); renderCharts();
}
$('addAsset').onclick = ()=>{ const name=$('assetName').value.trim(); const amount=Number($('assetAmount').value); if(!name || !amount) return showToast('Nama / nominal belum diisi'); state.assets.push({name,amount,category:$('category').value}); $('assetName').value=''; $('assetAmount').value=''; saveLocal(); render(); };
$('saveReport').onclick = async()=>{ state.date=$('reportDate').value; saveLocal(); await saveSupabase(); showToast('Laporan berhasil disimpan'); };
$('darkBtn').onclick = ()=>{ document.body.classList.toggle('dark'); localStorage.setItem('finance-dark', document.body.classList.contains('dark')); };
function showToast(t){ $('toast').textContent=t; $('toast').classList.add('show'); setTimeout(()=>$('toast').classList.remove('show'),1500); }
if(localStorage.getItem('finance-dark')==='true') document.body.classList.add('dark');
loadSupabase().then(render);
