// Halaman Pemasukan & Pengeluaran (shared logic, dua tipe transaksi)

function txFiltered(type){
  const arr=DB[type]||[];
  const f=TXFILT[type];
  if(!f)return arr;
  return arr.filter(r=>{
    if(f.from&&r.date<f.from)return false;
    if(f.to&&r.date>f.to)return false;
    if(type==='inc'){
      if(f.source&&r.source!==f.source)return false;
      if(f.category&&r.category!==f.category)return false;
    } else if(f.category&&r.category!==f.category)return false;
    if(f.method&&r.method!==f.method)return false;
    return true;
  });
}
function rInc(){
  let data=txFiltered('inc').sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created_at||'').localeCompare(a.created_at||''));
  data=sortArr(data,'t-inc');
  mkTbl('t-inc',['#','Tanggal','Sumber','Kategori','Deskripsi','Metode','Amount','Catatan','Aksi'],
    data.map((r,i)=>`<tr>
      <td>${i+1}</td><td>${r.date}</td><td>${r.source||'—'}</td><td>${r.category||'—'}</td>
      <td>${r.description||''}</td><td>${r.method||'—'}</td><td><b style="color:var(--ok)">${fRp(r.amount)}</b></td>
      <td>${r.note||''}</td>
      <td><button class="btn-sm be" onclick="openE('inc','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('inc','${r.id}','${escQ(r.description||'')}')">Hapus</button></td>
    </tr>`));
}
function rExp(){
  let data=txFiltered('exp').sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created_at||'').localeCompare(a.created_at||''));
  data=sortArr(data,'t-exp');
  mkTbl('t-exp',['#','Tanggal','Kategori','Deskripsi','Metode Pembayaran','Amount','Catatan','Aksi'],
    data.map((r,i)=>`<tr>
      <td>${i+1}</td><td>${r.date}</td><td>${r.category||'—'}</td>
      <td>${r.description||''}</td><td>${r.method||'—'}</td><td><b style="color:var(--er)">${fRp(r.amount)}</b></td>
      <td>${r.note||''}</td>
      <td><button class="btn-sm be" onclick="openE('exp','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('exp','${r.id}','${escQ(r.description||'')}')">Hapus</button></td>
    </tr>`));
}
RENDER_MAP['t-inc']=()=>rInc();
RENDER_MAP['t-exp']=()=>rExp();
function refreshTxFilterOptions(){
  const srcSel=document.getElementById('inc-f-src');
  if(srcSel){const cur=srcSel.value;srcSel.innerHTML='<option value="">Semua Sumber</option>'+buildSelectOpts(getIncSources(),'');srcSel.value=cur;}
  const incCatSel=document.getElementById('inc-f-cat');
  if(incCatSel){const cur=incCatSel.value;const cats=[...new Set(DB.inc.map(x=>x.category).filter(Boolean))];incCatSel.innerHTML='<option value="">Semua Kategori</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('');incCatSel.value=cur;}
  const incMethodSel=document.getElementById('inc-f-method');
  if(incMethodSel){const cur=incMethodSel.value;incMethodSel.innerHTML='<option value="">Semua Metode</option>'+DB.ca.map(x=>`<option value="${x.name}">${x.name}</option>`).join('');incMethodSel.value=cur;}
  const expCatSel=document.getElementById('exp-f-cat');
  if(expCatSel){const cur=expCatSel.value;expCatSel.innerHTML='<option value="">Semua Kategori</option>'+buildSelectOpts(getExpCats(),'');expCatSel.value=cur;}
  const expMethodSel=document.getElementById('exp-f-method');
  if(expMethodSel){const cur=expMethodSel.value;expMethodSel.innerHTML='<option value="">Semua Metode</option>'+DB.ca.map(x=>`<option value="${x.name}">${x.name}</option>`).join('');expMethodSel.value=cur;}
}
function applyTxFilter(type){
  const period=document.getElementById(type+'-f-period')?.value||'all';
  let from=document.getElementById(type+'-f-from')?.value||null;
  let to=document.getElementById(type+'-f-to')?.value||null;
  const now=new Date();
  if(period==='bulan_ini'){const ym=td().slice(0,7);from=ym+'-01';to=td();}
  else if(period==='bulan_lalu'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);const ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const lastDay=new Date(now.getFullYear(),now.getMonth(),0).getDate();from=ym+'-01';to=ym+'-'+String(lastDay).padStart(2,'0');}
  else if(period==='all'){from=null;to=null;}
  const method=document.getElementById(type+'-f-method')?.value||'';
  if(type==='inc'){
    const source=document.getElementById('inc-f-src')?.value||'';
    const category=document.getElementById('inc-f-cat')?.value||'';
    TXFILT.inc={from,to,source,category,method};
  } else {
    const category=document.getElementById('exp-f-cat')?.value||'';
    TXFILT.exp={from,to,category,method};
  }
  if(PAGE_STATE['t-'+type])PAGE_STATE['t-'+type].page=1;
  if(type==='inc')rInc();else rExp();
  showToast('✅ Filter diterapkan');
}
function computeTxStats(type){
  const arr=DB[type]||[];
  const curYM=td().slice(0,7);
  const now=new Date();
  const prevD=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prevYM=prevD.getFullYear()+'-'+String(prevD.getMonth()+1).padStart(2,'0');
  const curArr=arr.filter(x=>ymOf(x.date)===curYM);
  const prevArr=arr.filter(x=>ymOf(x.date)===prevYM);
  const curTotal=curArr.reduce((a,x)=>a+(+x.amount||0),0);
  const prevTotal=prevArr.reduce((a,x)=>a+(+x.amount||0),0);
  const [cy,cm]=curYM.split('-').map(Number);
  const daysInCurM=new Date(cy,cm,0).getDate();
  const [py,pm]=prevYM.split('-').map(Number);
  const daysInPrevM=new Date(py,pm,0).getDate();
  const curAvg=curTotal/daysInCurM,prevAvg=prevTotal/daysInPrevM;
  const curCount=curArr.length,prevCount=prevArr.length;
  const todayTotal=arr.filter(x=>x.date===td()).reduce((a,x)=>a+(+x.amount||0),0);
  return{curTotal,prevTotal,curAvg,prevAvg,curCount,prevCount,todayTotal,prevLbl:mLbl(prevYM+'-01')};
}
function setTxChg(id,cur,prev,lbl){
  const el=document.getElementById(id);if(!el)return;
  const diff=cur-prev,up=diff>=0;
  el.className='sc-chg '+(up?'up':'dn');
  const pct=prev>0?((Math.abs(diff)/prev)*100).toFixed(1)+'%':'—';
  el.textContent=(up?'↑ +':'↓ -')+fRp(Math.abs(diff))+' ('+pct+') vs '+lbl;
}
function buildTxSeries(type,period){
  const arr=DB[type]||[];
  if(period==='7d'||period==='30d'){
    const n=period==='7d'?7:30;
    const days=[];
    for(let i=n-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
    const data=days.map(d=>arr.filter(x=>x.date===d).reduce((a,x)=>a+(+x.amount||0),0));
    const labels=days.map(d=>{const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('id-ID',{day:'2-digit',month:'short'});});
    return{labels,data};
  }
  let months;
  if(period==='1y'){
    months=[];const now=new Date();
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
  } else {
    const all=[...new Set(arr.map(x=>ymOf(x.date)))].sort();
    months=all.length?all:[td().slice(0,7)];
  }
  const data=months.map(ym=>arr.filter(x=>ymOf(x.date)===ym).reduce((a,x)=>a+(+x.amount||0),0));
  const labels=months.map(ym=>mLbl(ym+'-01'));
  return{labels,data};
}
function renderTxTrendChart(type){
  const{labels,data}=buildTxSeries(type,TXP[type]);
  const canvas=document.getElementById('c-'+type+'-trend');if(!canvas)return;
  const color=type==='inc'?'#22c55e':'#2563eb';
  const key=type+'Trend';
  if(CHS[key])CHS[key].destroy();
  CHS[key]=new Chart(canvas.getContext('2d'),{type:'line',data:{labels,datasets:[{data,borderColor:color,backgroundColor:color+'22',fill:true,tension:.35,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fRp(c.parsed.y)}}},scales:SC()}});
}
function periodRange(period){
  const today=td();
  if(period==='7d'||period==='30d'){
    const n=period==='7d'?7:30;const d=new Date();d.setDate(d.getDate()-(n-1));
    return{from:d.toISOString().slice(0,10),to:today};
  }
  if(period==='1y'){
    const now=new Date();const d=new Date(now.getFullYear(),now.getMonth()-11,1);
    return{from:d.toISOString().slice(0,10),to:today};
  }
  return{from:null,to:null};
}
function setTxPeriod(type,period,btn){
  TXP[type]=period;
  document.querySelectorAll('#'+type+'-per-btns .pb').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderTxTrendChart(type);renderTxDonut(type);
}
function renderTxDonut(type){
  const arr=DB[type]||[];
  const{from,to}=periodRange(TXP[type]);
  const curArr=arr.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
  const dim=type==='inc'?'source':'category';
  const byCat={};
  curArr.forEach(x=>{const k=x[dim]||'Lainnya';byCat[k]=(byCat[k]||0)+(+x.amount||0);});
  const labels=Object.keys(byCat);
  const values=labels.map(l=>byCat[l]);
  const total=values.reduce((a,b)=>a+b,0);
  const canvas=document.getElementById('c-'+type+'-donut');if(!canvas)return;
  const key=type+'Donut';
  if(CHS[key])CHS[key].destroy();
  if(!labels.length){
    const lg=document.getElementById(type+'-donut-legend');if(lg)lg.innerHTML='<span style="color:var(--mu)">📭 Belum ada data pada periode ini</span>';
    setText(type+'-donut-total',fRp(0));
    return;
  }
  CHS[key]=new Chart(canvas.getContext('2d'),{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:labels.map((_,i)=>CHART_COLORS[i%CHART_COLORS.length]),borderWidth:2,hoverOffset:4}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.parsed)}`}}}}});
  const legend=document.getElementById(type+'-donut-legend');
  if(legend)legend.innerHTML=labels.map((l,i)=>{
    const v=byCat[l];const pct=total>0?(v/total*100).toFixed(1):'0.0';
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0"><span style="display:flex;align-items:center;gap:6px;min-width:0"><span style="width:8px;height:8px;border-radius:50%;background:${CHART_COLORS[i%CHART_COLORS.length]};display:inline-block;flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span></span><span style="white-space:nowrap">${pct}% <b style="margin-left:4px">${fRp(v)}</b></span></div>`;
  }).join('');
  setText(type+'-donut-total',fRp(total));
}
function renderTxSummary(type){
  const arr=DB[type]||[];
  const curYM=td().slice(0,7);
  const curArr=arr.filter(x=>ymOf(x.date)===curYM);
  const dim=type==='inc'?'source':'category';
  const byCat={};
  curArr.forEach(x=>{const k=x[dim]||'Lainnya';byCat[k]=(byCat[k]||0)+(+x.amount||0);});
  const total=Object.values(byCat).reduce((a,b)=>a+b,0);
  const labels=Object.keys(byCat);
  const el=document.getElementById(type+'-rgk');if(!el)return;
  if(!labels.length){el.innerHTML='<span style="color:var(--mu);font-size:11.5px">📭 Belum ada data bulan ini</span>';return;}
  el.innerHTML=labels.map((l,i)=>{
    const v=byCat[l];const pct=total>0?(v/total*100).toFixed(1):'0.0';
    return`<div class="rgk-card" style="--ac:${CHART_COLORS[i%CHART_COLORS.length]}"><div class="rgk-nm"><span class="rgk-dot"></span>${l}</div><div class="rgk-val">${fRp(v)}</div><div class="rgk-pct">${pct}% dari total</div></div>`;
  }).join('');
}
function renderIncPage(){
  const s=computeTxStats('inc');
  setText('sc-inc-total',fRp(s.curTotal));
  setText('sc-inc-avg',fRp(s.curAvg));
  setText('sc-inc-count',String(s.curCount));
  setText('sc-inc-today',fRp(s.todayTotal));
  setTxChg('sc-inc-total-chg',s.curTotal,s.prevTotal,s.prevLbl);
  setTxChg('sc-inc-avg-chg',s.curAvg,s.prevAvg,s.prevLbl);
  setTxChg('sc-inc-count-chg',s.curCount,s.prevCount,s.prevLbl);
  const elToday=document.getElementById('sc-inc-today-chg');
  if(elToday){elToday.className='sc-chg neu';elToday.textContent='Update: '+new Date().toLocaleString('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',minute:'2-digit'})+' WITA';}
  renderTxTrendChart('inc');renderTxDonut('inc');rInc();renderTxSummary('inc');refreshTxFilterOptions();
}
function renderExpPage(){
  const s=computeTxStats('exp');
  setText('sc-exp-total',fRp(s.curTotal));
  setText('sc-exp-avg',fRp(s.curAvg));
  setText('sc-exp-count',String(s.curCount));
  setText('sc-exp-today',fRp(s.todayTotal));
  setTxChg('sc-exp-total-chg',s.curTotal,s.prevTotal,s.prevLbl);
  setTxChg('sc-exp-avg-chg',s.curAvg,s.prevAvg,s.prevLbl);
  setTxChg('sc-exp-count-chg',s.curCount,s.prevCount,s.prevLbl);
  const elToday=document.getElementById('sc-exp-today-chg');
  if(elToday){elToday.className='sc-chg neu';elToday.textContent='Update: '+new Date().toLocaleString('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',minute:'2-digit'})+' WITA';}
  renderTxTrendChart('exp');renderTxDonut('exp');rExp();renderTxSummary('exp');refreshTxFilterOptions();
}
