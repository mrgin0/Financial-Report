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

function applyLaporanFilter(){
  const period=document.getElementById('lap-pick')?.value;
  const from=document.getElementById('lap-f-from')?.value;
  const to=document.getElementById('lap-f-to')?.value;
  let fym,tym,lbl;
  if(from&&to){fym=from.slice(0,7);tym=to.slice(0,7);lbl=from+' s/d '+to;}
  else{const ym=period||td().slice(0,7);fym=tym=ym;lbl=mLbl(ym+'-01');}
  document.getElementById('lap-month').textContent=lbl;
  document.getElementById('fin-lap').innerHTML=buildFin(calcRange(fym,tym),lbl,true);
  document.getElementById('fin-lr').innerHTML=buildLabaRugiHTML(calcLabaRugi(fym,tym),lbl);
  document.getElementById('fin-ak').innerHTML=buildArusKasHTML(calcArusKas(fym,tym),lbl);
  lapCtx={mode:'range',fromYM:fym,toYM:tym,label:lbl};
}



function downloadAllPDF(){
  const T=calcRange(lapCtx.fromYM,lapCtx.toYM), lbl=lapCtx.label;
  const LR=calcLabaRugi(lapCtx.fromYM,lapCtx.toYM);
  const AK=calcArusKas(lapCtx.fromYM,lapCtx.toYM);
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;padding:30px;font-size:13px;color:#1a1a2e}
    .sect{page-break-after:auto}
    .sect + .sect{page-break-before:always}
    h1{color:#2563eb;font-size:19px}
  </style></head><body>
    <div class="sect"><h1>Laporan Posisi Keuangan — ${lbl}</h1>${buildFin(T,lbl,true)}</div>
    <div class="sect"><h1>Laporan Laba Rugi — ${lbl}</h1>${buildLabaRugiHTML(LR,lbl)}</div>
    <div class="sect"><h1>Laporan Arus Kas — ${lbl}</h1>${buildArusKasHTML(AK,lbl)}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
  </body></html>`;
  const w=window.open('','_blank');w.document.write(html);w.document.close();
}
