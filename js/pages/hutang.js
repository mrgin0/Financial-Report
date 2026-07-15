// Halaman Hutang (Accounts Payable)

function debtSisa(r){return Math.max(0,(+(r.amount||0))-(+(r.paid||0)));}
function debtStatus(r){
  if(debtSisa(r)<=0&&(+(r.amount||0))>0)return'Lunas';
  if(r.due_date&&r.due_date<td())return'Jatuh Tempo';
  return'Aman';
}
function debtBadge(s){
  const cls=s==='Lunas'?'lunas':s==='Jatuh Tempo'?'jt':'aman';
  return`<span class="dbadge ${cls}">${s}</span>`;
}
function debtFiltered(){
  const f=DEBTFILT;
  if(!f)return DB.debt;
  return DB.debt.filter(r=>{
    if(f.from&&r.date<f.from)return false;
    if(f.to&&r.date>f.to)return false;
    if(f.creditor&&r.name!==f.creditor)return false;
    if(f.status&&debtStatus(r)!==f.status)return false;
    return true;
  });
}
function rHutang(){
  let data=debtFiltered().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created_at||'').localeCompare(a.created_at||''));
  data=sortArr(data,'t-debt');
  mkTbl('t-debt',['Tanggal','Kreditur','Tujuan','Total Hutang','Terbayar','Sisa Hutang','Jatuh Tempo','Status','Aksi'],
    data.map(r=>`<tr>
      <td>${r.date}</td><td>${esc(r.name)}</td><td>${esc(r.purpose||'—')}</td>
      <td>${fRp(r.amount)}</td><td style="color:var(--ok)">${fRp(r.paid)}</td>
      <td><b style="color:var(--er)">${fRp(debtSisa(r))}</b></td><td>${r.due_date||'—'}</td>
      <td>${debtBadge(debtStatus(r))}</td>
      <td><button class="btn-sm be" onclick="openE('debt','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('debt','${r.id}','${escQ(r.name)}')">Hapus</button></td>
    </tr>`));
}
RENDER_MAP['t-debt']=()=>rHutang();
function refreshDebtFilterOptions(){
  const credSel=document.getElementById('debt-f-cred');
  if(credSel){const cur=credSel.value;const names=[...new Set(DB.debt.map(x=>x.name).filter(Boolean))];credSel.innerHTML='<option value="">Semua Kreditur</option>'+names.map(n=>`<option value="${n}">${n}</option>`).join('');credSel.value=cur;}
}
function applyDebtFilter(){
  const period=document.getElementById('debt-f-period')?.value||'all';
  let from=document.getElementById('debt-f-from')?.value||null;
  let to=document.getElementById('debt-f-to')?.value||null;
  const now=new Date();
  if(period==='bulan_ini'){const ym=td().slice(0,7);from=ym+'-01';to=td();}
  else if(period==='bulan_lalu'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);const ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const lastDay=new Date(now.getFullYear(),now.getMonth(),0).getDate();from=ym+'-01';to=ym+'-'+String(lastDay).padStart(2,'0');}
  else if(period==='all'){from=null;to=null;}
  const creditor=document.getElementById('debt-f-cred')?.value||'';
  const status=document.getElementById('debt-f-status')?.value||'';
  DEBTFILT={from,to,creditor,status};
  if(PAGE_STATE['t-debt'])PAGE_STATE['t-debt'].page=1;
  renderHutangPage();
  showToast('✅ Filter diterapkan');
}
function debtStatsCompare(){
  const data = DEBTFILT ? debtFiltered() : DB.debt;   // ← BARIS BARU: pilih data sesuai filter aktif
  const curTotal=data.reduce((a,x)=>a+(+x.amount||0),0);   // ganti DB.debt → data
  const curPaid=data.reduce((a,x)=>a+(+x.paid||0),0);       // ganti DB.debt → data
  const curSisa=curTotal-curPaid;
  const now=new Date();
  const prevD=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prevYM=prevD.getFullYear()+'-'+String(prevD.getMonth()+1).padStart(2,'0');
  const prevLastDay=new Date(prevD.getFullYear(),prevD.getMonth()+1,0).toISOString().slice(0,10);
  const prevTotal=DB.debt.filter(x=>x.date&&x.date<=prevLastDay).reduce((a,x)=>a+(+x.amount||0),0);
  const prevPaid=DB.debtPay.filter(p=>p.paid_date&&p.paid_date<=prevLastDay).reduce((a,p)=>a+(+p.amount||0),0);
  const prevSisa=Math.max(0,prevTotal-prevPaid);
  return{curTotal,curPaid,curSisa,prevTotal,prevPaid,prevSisa,prevLbl:mLbl(prevYM+'-01')};
}
function sisaAsOf(dateStr){
  return DB.debt.filter(x=>x.date&&x.date<=dateStr).reduce((a,x)=>{
    const paidAsOf=DB.debtPay.filter(p=>p.debt_id===x.id&&p.paid_date&&p.paid_date<=dateStr).reduce((s,p)=>s+(+p.amount||0),0);
    return a+Math.max(0,(+x.amount||0)-paidAsOf);
  },0);
}
function buildDebtSeries(period){
  if(period==='7d'||period==='30d'){
    const n=period==='7d'?7:30;
    const days=[];
    for(let i=n-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
    const data=days.map(d=>sisaAsOf(d));
    const labels=days.map(d=>{const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('id-ID',{day:'2-digit',month:'short'});});
    return{labels,data};
  }
  let months;
  if(period==='1y'){
    months=[];const now=new Date();
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
  } else {
    const all=[...new Set(DB.debt.map(x=>ymOf(x.date)))].sort();
    months=all.length?all:[td().slice(0,7)];
  }
  const data=months.map(ym=>{const lastDay=new Date(+ym.slice(0,4),+ym.slice(5,7),0).toISOString().slice(0,10);return sisaAsOf(lastDay);});
  const labels=months.map(ym=>mLbl(ym+'-01'));
  return{labels,data};
}
function renderDebtTrendChart(){
  const{labels,data}=buildDebtSeries(DEBT_PERIOD);
  const canvas=document.getElementById('c-debt-trend');if(!canvas)return;
  if(CHS.debtTrend)CHS.debtTrend.destroy();
  CHS.debtTrend=new Chart(canvas.getContext('2d'),{type:'line',data:{labels,datasets:[{data,borderColor:'#8b5cf6',backgroundColor:'#8b5cf622',fill:true,tension:.35,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fRp(c.parsed.y)}}},scales:SC()}});
}
function setDebtPeriod(period,btn){
  DEBT_PERIOD=period;
  document.querySelectorAll('#debt-per-btns .pb').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderDebtTrendChart();renderDebtDonut();
}
function renderDebtDonut(){
  const{to}=periodRange(DEBT_PERIOD);
  const asOf=to||td();
  const byCred={};
  DB.debt.forEach(x=>{
    if(x.date&&x.date>asOf)return;
    const paidAsOf=DB.debtPay.filter(p=>p.debt_id===x.id&&p.paid_date&&p.paid_date<=asOf).reduce((s,p)=>s+(+p.amount||0),0);
    const sisa=Math.max(0,(+(x.amount||0))-paidAsOf);
    if(sisa<=0)return;
    const k=x.name||'Lainnya';byCred[k]=(byCred[k]||0)+sisa;
  });
  const labels=Object.keys(byCred);
  const values=labels.map(l=>byCred[l]);
  const total=values.reduce((a,b)=>a+b,0);
  const canvas=document.getElementById('c-debt-donut');if(!canvas)return;
  if(CHS.debtDonut)CHS.debtDonut.destroy();
  if(!labels.length){
    const lg=document.getElementById('debt-donut-legend');if(lg)lg.innerHTML='<span style="color:var(--mu)">📭 Belum ada data</span>';
    setText('debt-donut-total',fRp(0));
    return;
  }
  CHS.debtDonut=new Chart(canvas.getContext('2d'),{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:labels.map((_,i)=>CHART_COLORS[i%CHART_COLORS.length]),borderWidth:2,hoverOffset:4}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.parsed)}`}}}}});
  const legend=document.getElementById('debt-donut-legend');
  if(legend)legend.innerHTML=labels.map((l,i)=>{
    const v=byCred[l];const pct=total>0?(v/total*100).toFixed(1):'0.0';
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0"><span style="display:flex;align-items:center;gap:6px;min-width:0"><span style="width:8px;height:8px;border-radius:50%;background:${CHART_COLORS[i%CHART_COLORS.length]};display:inline-block;flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span></span><span style="white-space:nowrap">${pct}% <b style="margin-left:4px">${fRp(v)}</b></span></div>`;
  }).join('');
  setText('debt-donut-total',fRp(total));
}
function renderDebtSummary(){
  const today=td();
  let belum=0,d1_30=0,dOver60=0,total=0;
  DB.debt.forEach(x=>{
    const sisa=debtSisa(x);
    if(sisa<=0)return;
    total+=sisa;
    if(!x.due_date){belum+=sisa;return;}
    const diffDays=Math.floor((new Date(x.due_date)-new Date(today))/86400000);
    if(diffDays>=0)belum+=sisa;
    else if(diffDays>=-30)d1_30+=sisa;
    else if(diffDays<-60)dOver60+=sisa;
  });
  const pct=(v)=>total>0?(v/total*100).toFixed(1):'0.0';
  const el=document.getElementById('debt-rgk');if(!el)return;
  el.innerHTML=`
    <div class="rgk-card" style="--ac:#22c55e"><div class="rgk-nm"><span class="rgk-dot"></span>Belum Jatuh Tempo</div><div class="rgk-val">${fRp(belum)}</div><div class="rgk-pct">${pct(belum)}% dari total</div></div>
    <div class="rgk-card" style="--ac:#f59e0b"><div class="rgk-nm"><span class="rgk-dot"></span>Jatuh Tempo 1 - 30 Hari</div><div class="rgk-val">${fRp(d1_30)}</div><div class="rgk-pct">${pct(d1_30)}% dari total</div></div>
    <div class="rgk-card" style="--ac:#ef4444"><div class="rgk-nm"><span class="rgk-dot"></span>Jatuh Tempo &gt; 60 Hari</div><div class="rgk-val">${fRp(dOver60)}</div><div class="rgk-pct">${pct(dOver60)}% dari total</div></div>
    <div class="rgk-card" style="--ac:#8b5cf6"><div class="rgk-nm"><span class="rgk-dot"></span>Total Sisa Hutang</div><div class="rgk-val">${fRp(total)}</div><div class="rgk-pct">100% dari total</div></div>`;
}
function renderHutangPage(){
  const s=debtStatsCompare();
  setText('sc-debt-total',fRp(s.curTotal));
  setText('sc-debt-paid',fRp(s.curPaid));
  setText('sc-debt-sisa',fRp(s.curSisa));
  setTxChg('sc-debt-total-chg',s.curTotal,s.prevTotal,s.prevLbl);
  setTxChg('sc-debt-paid-chg',s.curPaid,s.prevPaid,s.prevLbl);
  setTxChg('sc-debt-sisa-chg',s.curSisa,s.prevSisa,s.prevLbl);
  const today=td();
  const in30=new Date();in30.setDate(in30.getDate()+30);
  const in30Str=in30.toISOString().slice(0,10);
  const jtCount=DB.debt.filter(x=>debtSisa(x)>0&&x.due_date&&x.due_date>=today&&x.due_date<=in30Str).length;
  setText('sc-debt-jt',String(jtCount));
  const jtEl=document.getElementById('sc-debt-jt-chg');
  if(jtEl){jtEl.className='sc-chg neu';jtEl.textContent=jtCount+' hutang jatuh tempo dalam 30 hari';}
  renderDebtTrendChart();renderDebtDonut();rHutang();renderDebtSummary();refreshDebtFilterOptions();
}
function buildDebtFormAdd(){
  return`
<div class="fg"><label>Kreditur</label><input id="f-nm" value=""></div>
<div class="fg"><label>Tujuan</label><input id="f-tujuan" value="" placeholder="cth: Kredit Modal Usaha"></div>
<div class="fr">
  <div class="fg"><label>Total Hutang (Rp)</label><input id="f-amt" type="number" min="0" value="0"></div>
  <div class="fg"><label>Status</label><select id="f-sts"><option>Aman</option><option>Jatuh Tempo</option></select></div>
</div>
<div class="fr">
  <div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${td()}"></div>
  <div class="fg"><label>Jatuh Tempo</label><input id="f-due" type="date" value=""></div>
</div>
<div class="fg"><label>Dana Masuk Ke (Current Asset)</label>${buildMethodSelect('','f-fund')}</div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="" placeholder="Catatan tambahan..."></div>`;
}
function getDebtPayHistFor(debtId){
  return DB.debtPay.filter(p=>p.debt_id===debtId).sort((a,b)=>(a.paid_date||'').localeCompare(b.paid_date||''));
}
function buildDebtFormEdit(r){
  const paid=+(r.paid||0);
  const total=+(r.amount||0);
  const sisa=Math.max(0,total-paid);
  const caNames=DB.ca.map(x=>x.name);
  const logs=getDebtPayHistFor(r.id);
  const historyHTML=logs.length?`
<div style="margin-top:8px">
  <div style="font-size:9.5px;font-weight:800;color:var(--mu);letter-spacing:.5px;text-transform:uppercase;margin-bottom:5px">📜 Riwayat Pembayaran</div>
  <div style="overflow-x:auto;border-radius:7px;border:1px solid var(--bd)">
    <table style="width:100%;border-collapse:collapse;font-size:10.5px">
      <thead><tr style="background:var(--bg)">
        <th style="padding:5px 8px;text-align:left;color:var(--mu);font-weight:700">Tgl Bayar</th>
        <th style="padding:5px 8px;text-align:right;color:var(--mu);font-weight:700">Bayar</th>
        <th style="padding:5px 8px;text-align:right;color:var(--mu);font-weight:700">Total Bayar</th>
        <th style="padding:5px 8px;text-align:right;color:var(--mu);font-weight:700">Sisa</th>
        <th style="padding:5px 8px;text-align:left;color:var(--mu);font-weight:700">Via</th>
      </tr></thead>
      <tbody>${logs.map(l=>`<tr style="border-top:1px solid var(--bd)">
        <td style="padding:5px 8px">${l.paid_date}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--er);font-weight:700">${fRp(l.amount)}</td>
        <td style="padding:5px 8px;text-align:right">${fRp(l.paid_total)}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--er)">${fRp(l.sisa)}</td>
        <td style="padding:5px 8px">${l.via||'—'}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>
</div>`:'';

  return`
<div class="fg"><label>Kreditur</label><input id="f-nm" value="${esc(r.name||'')}"></div>
<div class="fg"><label>Tujuan</label><input id="f-tujuan" value="${esc(r.purpose||'')}" placeholder="cth: Kredit Modal Usaha"></div>
<div class="fr">
  <div class="fg"><label>Total Hutang (Rp)</label><input id="f-amt" type="number" min="0" value="${total}"></div>
  <div class="fg"><label>Status</label><select id="f-sts">
    ${['Aman','Jatuh Tempo','Lunas'].map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}
  </select></div>
</div>
<div class="fr">
  <div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${r.date||td()}"></div>
  <div class="fg"><label>Jatuh Tempo</label><input id="f-due" type="date" value="${r.due_date||''}"></div>
</div>
<div class="fg"><label>Dana Masuk Ke</label><input value="${esc(r.fund_to||'—')}" disabled style="opacity:.65;cursor:not-allowed"></div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${esc(r.note||'')}" placeholder="Catatan tambahan..."></div>
<div style="background:var(--bg);border-radius:9px;padding:12px;margin-top:4px">
  <div style="font-size:10px;font-weight:800;color:var(--mu);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px">💳 Tambah Pembayaran</div>
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:11.5px;flex-wrap:wrap">
    <span style="color:var(--mu)">Sudah bayar:</span>
    <b style="color:var(--ok)">${fRp(paid)}</b>
    <span style="color:var(--mu)">Sisa:</span>
    <b style="color:var(--er)">${fRp(sisa)}</b>
  </div>
  <div class="fr">
    <div class="fg"><label>Jumlah Pembayaran (Rp)</label>
      <input id="f-paid-add" type="number" min="0" placeholder="0" value="0" oninput="calcNewPaid()">
    </div>
    <div class="fg"><label>Tanggal Pembayaran</label>
      <input id="f-pay-date" type="date" value="${td()}">
    </div>
  </div>
  <div class="fg"><label>Bayar Dari (Current Asset)</label>
    <select id="f-via">
      <option value="">— Tidak ada —</option>
      ${caNames.map(n=>`<option value="${n}">${n}</option>`).join('')}
    </select>
  </div>
  <div id="paid-preview" style="font-size:10.5px;color:var(--mu);margin-top:4px;padding:5px 8px;background:var(--card);border-radius:6px;min-height:24px"></div>
  <input type="hidden" id="f-paid-total" value="${paid}">
  ${historyHTML}
</div>`;
}
