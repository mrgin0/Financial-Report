// Laporan Posisi Keuangan, Laba Rugi, Arus Kas + export PDF

function calcT(ym){
  const f=(arr)=>arr.filter(x=>!ym||ymOf(x.date)===ym).reduce((a,x)=>a+(+x.amount),0);
  const farr=(arr)=>!ym?arr:arr.filter(x=>ymOf(x.date)===ym);
  const ca=f(DB.ca),ar=DB.ar.filter(x=>!ym||ymOf(x.date)===ym).reduce((a,x)=>a+(+(x.amount||0))-(+(x.paid||0)),0),ii=f(DB.ii),ppe=f(DB.ppe),intg=f(DB.intg),inv=f(DB.inv);
  const debtI=farr(DB.debt);const liab=debtI.reduce((a,x)=>a+debtSisa(x),0);
  const tot=ca+ar+ii+ppe+intg+inv;
  return{ca,ar,ii,ppe,intg,inv,cur:ca+ar+ii,nc:ppe+intg+inv,tot,liab,debtI,equity:tot-liab,caI:farr(DB.ca),arI:farr(DB.ar),iiI:farr(DB.ii),ppeI:farr(DB.ppe),intgI:farr(DB.intg),invI:farr(DB.inv)};
}
function calcRange(fym,tym){
  const f=(arr)=>arr.filter(x=>x.date&&(!fym||ymOf(x.date)>=fym)&&(!tym||ymOf(x.date)<=tym));
  const s=(a)=>a.reduce((t,x)=>t+(+x.amount),0);
  const fca=f(DB.ca),far=f(DB.ar),fii=f(DB.ii),fppe=f(DB.ppe),fintg=f(DB.intg),finv=f(DB.inv);
  const ca=s(fca),ar=far.reduce((a,x)=>a+(+(x.amount||0))-(+(x.paid||0)),0),ii=s(fii),ppe=s(fppe),intg=s(fintg),inv=s(finv);
  const debtI=f(DB.debt);const liab=debtI.reduce((a,x)=>a+debtSisa(x),0);
  const tot=ca+ar+ii+ppe+intg+inv;
  return{ca,ar,ii,ppe,intg,inv,cur:ca+ar+ii,nc:ppe+intg+inv,tot,liab,debtI,equity:tot-liab,caI:fca,arI:far,iiI:fii,ppeI:fppe,intgI:fintg,invI:finv};
}
function buildFin(T,lbl,det){
  const d=(arr,fn)=>det&&arr.length?arr.map(fn).join(''):'';
  return`<div class="fin">
<div class="fin-sec">A. Current Asset</div>
<div class="fin-row"><span class="fn">1.</span><span class="fl">Cash and cash equivalents</span><span class="fv">${fRp(T.ca)}</span></div>
${d(T.caI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">— ${r.name} <span class="badge bk" style="font-size:8.5px">${r.category}</span></span><span class="fv">${fRp(r.amount)}</span></div>`)}
<div class="fin-row sub"><span class="fn"><b>2.</b></span><span class="fl"><b>Total Cash & Equivalent</b></span><span class="fv">${fRp(T.ca)}</span></div>
<div class="fin-row"><span class="fn">3.</span><span class="fl">Accounts Receivable</span><span class="fv">${fRp(T.ar)}</span></div>
${d(T.arI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">${r.name}${r.paid>0?' <span class="badge by" style="font-size:8.5px">Partial</span>':''} <span class="badge ${r.status==='Paid'?'bg_':r.status==='Overdue'?'br':'bb'}" style="font-size:8.5px">${r.status}</span></span><span class="fv">${fRp((+(r.amount||0))-(+(r.paid||0)))}</span></div>`)}
<div class="fin-row"><span class="fn">4.</span><span class="fl">Inventory</span><span class="fv">${fRp(T.ii)}</span></div>
${d(T.iiI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">${r.name}${r.qty?' ('+r.qty+' unit)':''}</span><span class="fv">${fRp(r.amount)}</span></div>`)}
<div class="fin-row sub"><span class="fn"><b>5.</b></span><span class="fl"><b>Total Current Asset</b></span><span class="fv">${fRp(T.cur)}</span></div>
<div class="fin-sec">B. Non Current Asset</div>
<div class="fin-row"><span class="fn">6.</span><span class="fl">Property, Plant & Equipment</span><span class="fv">${fRp(T.ppe)}</span></div>
${d(T.ppeI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">${r.name}</span><span class="fv">${fRp(r.amount)}</span></div>`)}
<div class="fin-row"><span class="fn">7.</span><span class="fl">Investment</span><span class="fv">${fRp(T.inv)}</span></div>
${d(T.invI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">${r.name} <span class="badge bp" style="font-size:8.5px">${r.type}</span></span><span class="fv">${fRp(r.amount)}</span></div>`)}
<div class="fin-row"><span class="fn">8.</span><span class="fl">Intangible Assets</span><span class="fv">${fRp(T.intg)}</span></div>
${d(T.intgI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">${r.name}</span><span class="fv">${fRp(r.amount)}</span></div>`)}
<div class="fin-row sub"><span class="fn"><b>9.</b></span><span class="fl"><b>Total Non-current Asset</b></span><span class="fv">${fRp(T.nc)}</span></div>
<div class="fin-row tot"><span class="fn">10.</span><span class="fl"><b>TOTAL ASSET — ${lbl}</b></span><span class="fv"><b>${fRp(T.tot)}</b></span></div>
<div class="fin-sec">C. Liabilities (Hutang)</div>
${d(T.debtI,r=>`<div class="fin-det"><span class="fn"></span><span class="fl">— ${r.name}${r.purpose?' ('+r.purpose+')':''}</span><span class="fv">${fRp(debtSisa(r))}</span></div>`)}
<div class="fin-row sub"><span class="fn"><b>11.</b></span><span class="fl"><b>Total Liabilities</b></span><span class="fv">${fRp(T.liab)}</span></div>
<div class="fin-sec">D. Equity</div>
<div class="fin-row"><span class="fn">12.</span><span class="fl">Modal / Retained Earnings (Aset − Liabilities)</span><span class="fv">${fRp(T.equity)}</span></div>
<div class="fin-row tot"><span class="fn">13.</span><span class="fl"><b>TOTAL LIABILITIES + EQUITY — ${lbl}</b></span><span class="fv"><b>${fRp(T.liab+T.equity)}</b></span></div>
</div>`;
}
function onDashMonth(ym,mode){
  if(mode!=='init')document.querySelectorAll('#page-dashboard .pbtns .pb').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('dash-month');if(el)el.textContent=mLbl(ym+'-01');
  const f=document.getElementById('fin-dash');if(f)f.innerHTML=buildFin(calcT(ym),mLbl(ym+'-01'),false);
  dashCtx={mode:'month',ym,fromYM:'',toYM:'',label:mLbl(ym+'-01')};
}
function dashRange(r,btn){
  document.querySelectorAll('#page-dashboard .pbtns .pb').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');document.getElementById('dash-pick').value='';
  const {fym,tym,lbl}=rangeCalc(r);
  const el=document.getElementById('dash-month');if(el)el.textContent=lbl;
  const T=calcRange(fym,tym);
  const f=document.getElementById('fin-dash');if(f)f.innerHTML=buildFin(T,lbl,false);
  dashCtx={mode:'range',ym:'',fromYM:fym,toYM:tym,label:lbl};
}
// ══════════════════════════════════════════════════════════════
// LAPORAN KEUANGAN (gabungan: Posisi + Laba Rugi + Arus Kas, 1 filter)
// ══════════════════════════════════════════════════════════════
function computeLapRange(){
  const period=document.getElementById('lap-period')?.value||'bulan_ini';
  const now=new Date();
  let fym=null,tym=null,lbl='';
  if(period==='bulan_ini'){fym=td().slice(0,7);tym=fym;lbl=(LANG==='id'?'Bulan ':'Month ')+mLbl(fym+'-01');}
  else if(period==='bulan_lalu'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);fym=d.toISOString().slice(0,7);tym=fym;lbl=(LANG==='id'?'Bulan ':'Month ')+mLbl(fym+'-01');}
  else if(period==='1y'){const d=new Date(now.getFullYear()-1,now.getMonth(),1);fym=d.toISOString().slice(0,7);tym=td().slice(0,7);lbl=LANG==='id'?'1 Tahun Terakhir':'Last 1 Year';}
  else if(period==='all'){fym=null;tym=null;lbl=LANG==='id'?'Semua Periode':'All Periods';}
  else if(period==='custom'){
    const from=document.getElementById('lap-from')?.value;
    const to=document.getElementById('lap-to')?.value;
    if(!from||!to){showToast('⚠️ Isi Dari Tanggal dan Sampai Tanggal');return null;}
    fym=from.slice(0,7);tym=to.slice(0,7);lbl=from+' s/d '+to;
  }
  return{fym,tym,lbl};
}
function onLapPeriodChange(){
  const period=document.getElementById('lap-period')?.value;
  const dis=period!=='custom';
  const f=document.getElementById('lap-from'),t=document.getElementById('lap-to');
  if(f)f.disabled=dis;if(t)t.disabled=dis;
}
function applyLapFilter(){
  const r=computeLapRange();if(!r)return;
  lapCtx={fym:r.fym,tym:r.tym,label:r.lbl};
  renderLaporanAll();
  showToast('✅ Filter diterapkan');
}
function renderLaporanAll(){
  if(!lapCtx.label)return;
  const{fym,tym,label}=lapCtx;
  const elP=document.getElementById('lap-month');if(elP)elP.textContent=label;
  const fP=document.getElementById('fin-lap');if(fP)fP.innerHTML=buildFin(calcRange(fym,tym),label,true);
  const elR=document.getElementById('lr-month');if(elR)elR.textContent=label;
  const fR=document.getElementById('fin-lr');if(fR)fR.innerHTML=buildLabaRugiHTML(calcLabaRugi(fym,tym),label);
  const elK=document.getElementById('ak-month');if(elK)elK.textContent=label;
  const fK=document.getElementById('fin-ak');if(fK)fK.innerHTML=buildArusKasHTML(calcArusKas(fym,tym),label);
}
function initLapPage(){
  if(!lapCtx.label){const r=computeLapRange();if(r)lapCtx={fym:r.fym,tym:r.tym,label:r.lbl};}
  renderLaporanAll();
}
function rangeCalc(r){
  const now=new Date();const tym=td().slice(0,7);
  let fym=null,lbl='';
  if(r==='1m'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);fym=d.toISOString().slice(0,7);lbl=LANG==='id'?'1 Bulan Terakhir':'Last 1 Month';}
  else if(r==='6m'){const d=new Date(now.getFullYear(),now.getMonth()-6,1);fym=d.toISOString().slice(0,7);lbl=LANG==='id'?'6 Bulan Terakhir':'Last 6 Months';}
  else if(r==='1y'){const d=new Date(now.getFullYear()-1,now.getMonth(),1);fym=d.toISOString().slice(0,7);lbl=LANG==='id'?'1 Tahun Terakhir':'Last 1 Year';}
  else if(r==='5y'){const d=new Date(now.getFullYear()-5,now.getMonth(),1);fym=d.toISOString().slice(0,7);lbl=LANG==='id'?'5 Tahun Terakhir':'Last 5 Years';}
  else{lbl=LANG==='id'?'Semua Periode':'All Periods';}
  return{fym,tym,lbl};
}
function calcLabaRugi(fym,tym){
  const inRange=(d)=>{if(!d)return false;const ym=ymOf(d);return(!fym||ym>=fym)&&(!tym||ym<=tym);};
  const incArr=DB.inc.filter(x=>inRange(x.date));
  const expArr=DB.exp.filter(x=>inRange(x.date));
  const bySrc={};incArr.forEach(x=>{const k=x.source||'Lainnya';bySrc[k]=(bySrc[k]||0)+(+x.amount||0);});
  const byCat={};expArr.forEach(x=>{const k=x.category||'Lainnya';byCat[k]=(byCat[k]||0)+(+x.amount||0);});
  const totalPendapatan=Object.values(bySrc).reduce((a,b)=>a+b,0);
  const totalBeban=Object.values(byCat).reduce((a,b)=>a+b,0);
  return{bySrc,byCat,totalPendapatan,totalBeban,laba:totalPendapatan-totalBeban};
}
function buildLabaRugiHTML(T,lbl){
  const srcRows=Object.keys(T.bySrc).map((k,i)=>`<div class="fin-det"><span class="fn"></span><span class="fl">— ${k}</span><span class="fv">${fRp(T.bySrc[k])}</span></div>`).join('');
  const catRows=Object.keys(T.byCat).map((k,i)=>`<div class="fin-det"><span class="fn"></span><span class="fl">— ${k}</span><span class="fv">${fRp(T.byCat[k])}</span></div>`).join('');
  const isProfit=T.laba>=0;
  return`<div class="fin">
<div class="fin-sec">A. Pendapatan</div>
${srcRows||'<div class="fin-det"><span class="fn"></span><span class="fl">— Tidak ada data</span><span class="fv">Rp 0</span></div>'}
<div class="fin-row sub"><span class="fn"><b>1.</b></span><span class="fl"><b>Total Pendapatan</b></span><span class="fv">${fRp(T.totalPendapatan)}</span></div>
<div class="fin-sec">B. Beban</div>
${catRows||'<div class="fin-det"><span class="fn"></span><span class="fl">— Tidak ada data</span><span class="fv">Rp 0</span></div>'}
<div class="fin-row sub"><span class="fn"><b>2.</b></span><span class="fl"><b>Total Beban</b></span><span class="fv">${fRp(T.totalBeban)}</span></div>
<div class="fin-row tot"><span class="fn">3.</span><span class="fl"><b>${isProfit?'LABA':'RUGI'} BERSIH — ${lbl}</b></span><span class="fv"><b style="color:${isProfit?'var(--ok)':'var(--er)'}">${isProfit?'':'-'}${fRp(Math.abs(T.laba))}</b></span></div>
</div>`;
}
function calcArusKas(fym,tym){
  const inRange=(d)=>{if(!d)return false;const ym=ymOf(d);return(!fym||ym>=fym)&&(!tym||ym<=tym);};
  const pemasukan=DB.inc.filter(x=>inRange(x.date)).reduce((a,x)=>a+(+x.amount||0),0);
  const pengeluaran=DB.exp.filter(x=>inRange(x.date)).reduce((a,x)=>a+(+x.amount||0),0);
  const danaHutangBaru=DB.debt.filter(x=>inRange(x.date)&&x.fund_to).reduce((a,x)=>a+(+x.amount||0),0);
  const bayarHutang=DB.debtPay.filter(p=>inRange(p.paid_date)).reduce((a,p)=>a+(+p.amount||0),0);
  const terimaPiutang=DB.payHist.filter(p=>inRange(p.paid_date)).reduce((a,p)=>a+(+p.amount||0),0);
  const kasMasuk=pemasukan+danaHutangBaru+terimaPiutang;
  const kasKeluar=pengeluaran+bayarHutang;
  const kasBersih=kasMasuk-kasKeluar;
  const saldoAkhir=sCA();
  const saldoAwal=saldoAkhir-kasBersih;
  return{pemasukan,pengeluaran,danaHutangBaru,bayarHutang,terimaPiutang,kasMasuk,kasKeluar,kasBersih,saldoAwal,saldoAkhir};
}
function buildArusKasHTML(T,lbl){
  const isUp=T.kasBersih>=0;
  return`<div class="fin">
<div class="fin-sec">A. Arus Kas Masuk</div>
<div class="fin-det"><span class="fn"></span><span class="fl">— Pemasukan</span><span class="fv">${fRp(T.pemasukan)}</span></div>
<div class="fin-det"><span class="fn"></span><span class="fl">— Dana Masuk dari Hutang Baru</span><span class="fv">${fRp(T.danaHutangBaru)}</span></div>
<div class="fin-det"><span class="fn"></span><span class="fl">— Penerimaan Pembayaran Piutang</span><span class="fv">${fRp(T.terimaPiutang)}</span></div>
<div class="fin-row sub"><span class="fn"><b>1.</b></span><span class="fl"><b>Total Kas Masuk</b></span><span class="fv">${fRp(T.kasMasuk)}</span></div>
<div class="fin-sec">B. Arus Kas Keluar</div>
<div class="fin-det"><span class="fn"></span><span class="fl">— Pengeluaran</span><span class="fv">${fRp(T.pengeluaran)}</span></div>
<div class="fin-det"><span class="fn"></span><span class="fl">— Pembayaran Hutang</span><span class="fv">${fRp(T.bayarHutang)}</span></div>
<div class="fin-row sub"><span class="fn"><b>2.</b></span><span class="fl"><b>Total Kas Keluar</b></span><span class="fv">${fRp(T.kasKeluar)}</span></div>
<div class="fin-row tot"><span class="fn">3.</span><span class="fl"><b>Kenaikan/(Penurunan) Kas Bersih — ${lbl}</b></span><span class="fv"><b style="color:${isUp?'var(--ok)':'var(--er)'}">${isUp?'+':'-'}${fRp(Math.abs(T.kasBersih))}</b></span></div>
<div class="fin-row"><span class="fn">4.</span><span class="fl">Saldo Kas Awal (estimasi)</span><span class="fv">${fRp(T.saldoAwal)}</span></div>
<div class="fin-row tot"><span class="fn">5.</span><span class="fl"><b>Saldo Kas Akhir (Current Asset saat ini)</b></span><span class="fv"><b>${fRp(T.saldoAkhir)}</b></span></div>
</div>`;
}

// ══════════════════════════════════════════════════════════════
// EXPORT PDF
// src==='dash'  -> 1 laporan (Posisi Keuangan) dari widget Dashboard, seperti sebelumnya
// src==='all'   -> 3 laporan sekaligus (Posisi + Laba Rugi + Arus Kas), tiap laporan mulai halaman baru
// ══════════════════════════════════════════════════════════════
function pdfRw(n,l,v,b){return`<tr style="${b?'font-weight:700;background:#f8fafc':''}"><td style="padding:5px 10px 5px ${n?10:22}px">${n?n+'. ':'— '}${l}</td><td style="text-align:right;padding:5px 10px">${fRp(v)}</td></tr>`;}
function pdfDr(l,v){return`<tr><td style="padding:3px 10px 3px 28px;color:#555;font-size:12px">— ${l}</td><td style="text-align:right;padding:3px 10px;font-size:12px">${fRp(v)}</td></tr>`;}
function pdfPosisiSection(T,lbl){
  const rw=pdfRw,dr=pdfDr;
  return`<h1>📊 Laporan Posisi Keuangan</h1><h2>Periode: <b>${lbl}</b></h2><h2>Mata Uang: ${curSym()}</h2><h2>Dicetak: ${new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</h2><hr>
<table><tr class="sh"><td colspan="2">A. CURRENT ASSET</td></tr>${rw('1','Cash and cash equivalents',T.ca)}${T.caI.map(r=>dr(r.name+' ('+r.category+')',r.amount)).join('')}${rw('2','Total Cash & Equivalent',T.ca,true)}${rw('3','Accounts Receivable',T.ar)}${T.arI.map(r=>dr(r.name+' — '+r.status+((+(r.paid||0))>0?' [Partial: '+fRp(r.paid)+']':''),Math.max(0,(+(r.amount||0))-(+(r.paid||0))))).join('')}${rw('4','Inventory',T.ii)}${T.iiI.map(r=>dr(r.name+(r.qty?' ('+r.qty+' unit)':''),r.amount)).join('')}
<tr style="font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0"><td style="padding:7px 10px"><b>5. Total Current Asset</b></td><td style="text-align:right;padding:7px 10px"><b>${fRp(T.cur)}</b></td></tr>
<tr class="sh"><td colspan="2">B. NON CURRENT ASSET</td></tr>${rw('6','Property, Plant & Equipment',T.ppe)}${T.ppeI.map(r=>dr(r.name,r.amount)).join('')}${rw('7','Investment',T.inv)}${T.invI.map(r=>dr(r.name+' ('+r.type+')',r.amount)).join('')}${rw('8','Intangible Assets',T.intg)}${T.intgI.map(r=>dr(r.name,r.amount)).join('')}
<tr style="font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0"><td style="padding:7px 10px"><b>9. Total Non-current Asset</b></td><td style="text-align:right;padding:7px 10px"><b>${fRp(T.nc)}</b></td></tr>
<tr class="tot"><td>10. TOTAL ASSET — ${lbl}</td><td style="text-align:right">${fRp(T.tot)}</td></tr>
<tr class="sh"><td colspan="2">C. LIABILITIES (HUTANG)</td></tr>${(T.debtI||[]).map(r=>dr(r.name+(r.purpose?' ('+r.purpose+')':''),debtSisa(r))).join('')}
<tr style="font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0"><td style="padding:7px 10px"><b>11. Total Liabilities</b></td><td style="text-align:right;padding:7px 10px"><b>${fRp(T.liab||0)}</b></td></tr>
<tr class="sh"><td colspan="2">D. EQUITY</td></tr>${rw('12','Modal / Retained Earnings',T.equity||0)}
<tr class="tot"><td>13. TOTAL LIABILITIES + EQUITY — ${lbl}</td><td style="text-align:right">${fRp((T.liab||0)+(T.equity||0))}</td></tr></table>`;
}
function pdfLabaRugiSection(T,lbl){
  const rw=pdfRw,dr=pdfDr;
  const srcRows=Object.keys(T.bySrc).map(k=>dr(k,T.bySrc[k])).join('')||dr('Tidak ada data',0);
  const catRows=Object.keys(T.byCat).map(k=>dr(k,T.byCat[k])).join('')||dr('Tidak ada data',0);
  const isProfit=T.laba>=0;
  return`<h1>📈 Laporan Laba Rugi</h1><h2>Periode: <b>${lbl}</b></h2><h2>Mata Uang: ${curSym()}</h2><hr>
<table><tr class="sh"><td colspan="2">A. PENDAPATAN</td></tr>${srcRows}${rw('1','Total Pendapatan',T.totalPendapatan,true)}
<tr class="sh"><td colspan="2">B. BEBAN</td></tr>${catRows}${rw('2','Total Beban',T.totalBeban,true)}
<tr class="tot"><td>3. ${isProfit?'LABA':'RUGI'} BERSIH — ${lbl}</td><td style="text-align:right">${isProfit?'':'-'}${fRp(Math.abs(T.laba))}</td></tr></table>`;
}
function pdfArusKasSection(T,lbl){
  const rw=pdfRw,dr=pdfDr;
  const isUp=T.kasBersih>=0;
  return`<h1>💵 Laporan Arus Kas</h1><h2>Periode: <b>${lbl}</b></h2><h2>Mata Uang: ${curSym()}</h2><hr>
<table><tr class="sh"><td colspan="2">A. ARUS KAS MASUK</td></tr>${dr('Pemasukan',T.pemasukan)}${dr('Dana Masuk dari Hutang Baru',T.danaHutangBaru)}${dr('Penerimaan Pembayaran Piutang',T.terimaPiutang)}${rw('1','Total Kas Masuk',T.kasMasuk,true)}
<tr class="sh"><td colspan="2">B. ARUS KAS KELUAR</td></tr>${dr('Pengeluaran',T.pengeluaran)}${dr('Pembayaran Hutang',T.bayarHutang)}${rw('2','Total Kas Keluar',T.kasKeluar,true)}
<tr class="tot"><td>3. Kenaikan/(Penurunan) Kas Bersih — ${lbl}</td><td style="text-align:right">${isUp?'+':'-'}${fRp(Math.abs(T.kasBersih))}</td></tr>
<tr><td style="padding:5px 10px 5px 22px">— Saldo Kas Awal (estimasi)</td><td style="text-align:right;padding:5px 10px">${fRp(T.saldoAwal)}</td></tr>
<tr class="tot"><td>5. Saldo Kas Akhir (Current Asset saat ini)</td><td style="text-align:right">${fRp(T.saldoAkhir)}</td></tr></table>`;
}
function downloadPDF(src){
  const printStyle=`body{font-family:Arial,sans-serif;color:#1a1a2e;padding:36px;font-size:13px}h1{font-size:20px;color:#2563eb;margin-bottom:4px}h2{font-size:12px;color:#64748b;font-weight:normal;margin-bottom:4px}hr{border:none;border-top:2px solid #2563eb;margin:14px 0}table{width:100%;border-collapse:collapse}tr{border-bottom:1px solid #f1f5f9}.sh td{font-size:9.5px;font-weight:800;text-transform:uppercase;color:#64748b;padding:11px 10px 3px;background:#f0f4ff}.tot td{font-weight:800;color:#2563eb;background:#eff6ff;font-size:14px;padding:11px 10px}.ft{margin-top:36px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center}.rpt-sec{padding-top:1px}.rpt-sec+.rpt-sec{page-break-before:always;break-before:page;padding-top:36px}`;
  const footer=`<div class="ft">© 2026 Laporan Keuangan Pribadi — raihan.nor.falah@mhs.politala.ac.id | Kurs: 1 USD = Rp ${FX_RATE.toLocaleString('id-ID')}</div>`;

  let bodyHTML='',lblForTitle='';
  if(src==='dash'){
    const ctx=dashCtx;
    let T,lbl;
    if(ctx.mode==='range'){T=calcRange(ctx.fromYM,ctx.toYM);lbl=ctx.label;}
    else if(ctx.mode==='month'&&ctx.ym){T=calcT(ctx.ym);lbl=ctx.label||mLbl(ctx.ym+'-01');}
    else{const ym=document.getElementById('dash-pick')?.value||td().slice(0,7);T=calcT(ym);lbl=mLbl(ym+'-01');}
    lblForTitle=lbl;
    bodyHTML=`<div class="rpt-sec">${pdfPosisiSection(T,lbl)}</div>`;
  } else {
    if(!lapCtx.label){showToast('⚠️ Terapkan filter laporan dulu');return;}
    const{fym,tym,label}=lapCtx;
    lblForTitle=label;
    const Tpos=calcRange(fym,tym);
    const Tlr=calcLabaRugi(fym,tym);
    const Tak=calcArusKas(fym,tym);
    bodyHTML=`<div class="rpt-sec">${pdfPosisiSection(Tpos,label)}</div>
<div class="rpt-sec">${pdfLabaRugiSection(Tlr,label)}</div>
<div class="rpt-sec">${pdfArusKasSection(Tak,label)}</div>`;
  }

  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan ${lblForTitle}</title>
<style>${printStyle}</style>
</head><body>
${bodyHTML}
${footer}
<script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script></body></html>`;
  const w=window.open('','_blank','width=760,height=960');if(!w){showToast('❌ Aktifkan popup browser');return;}w.document.write(html);w.document.close();
}
