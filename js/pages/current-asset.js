// Halaman Current Asset

function rCA(){
  const data=sortArr(DB.ca,'t-ca');
  mkTbl('t-ca',['#','Nama','Kategori','Jumlah','Tanggal Update','Note','Aksi'],
    data.map((r,i)=>`<tr>
      <td>${i+1}</td><td>${r.name}</td>
      <td><span class="badge bb">${r.category}</span></td>
      <td><b>${fRp(r.amount)}</b></td>
      <td>${r.date}</td>
      ${noteCell(r.note)}
      <td style="white-space:nowrap">
        <button class="btn-sm" style="background:#ede9fe;color:#7c3aed" onclick="openCADetail('${escQ(r.name)}')">📋 Detail</button>
        <button class="btn-sm be" onclick="openE('ca','${r.id}')">Edit</button>
        <button class="btn-sm bd" onclick="delR('ca','${r.id}','${escQ(r.name)}')">Hapus</button>
      </td>
    </tr>`));
}

// ══════════════════════════════════════════════════════════════
// POIN 2: Detail Current Asset — riwayat gabungan uang masuk/keluar
// dari semua sumber: Pemasukan, Pengeluaran, bayar Piutang diterima,
// bayar Hutang, dana masuk dari Hutang baru, jual Investasi, jual aset
// (Inventory/PPE/Intangible).
// ══════════════════════════════════════════════════════════════
let caDetailTarget=null;
let ASSET_SALES=[];
let assetSalesLoaded=false;
async function loadAssetSales(force){
  if(assetSalesLoaded&&!force)return;
  try{ ASSET_SALES=await sbG('asset_sales'); assetSalesLoaded=true; }
  catch(e){ console.warn('Gagal load asset_sales:',e.message); }
}

function buildCATransactions(caName){
  const items=[];

  // 1) Pemasukan yang metodenya CA ini
  DB.inc.filter(x=>x.method===caName).forEach(x=>{
    const label=x.description||x.source||'Pemasukan';
    items.push({date:x.date,desc:'Pemasukan: '+label,type:'masuk',amount:+(x.amount||0),source:'inc',id:x.id,delName:label});
  });

  // 2) Pengeluaran yang metodenya CA ini
  DB.exp.filter(x=>x.method===caName).forEach(x=>{
    const label=x.description||x.category||'Pengeluaran';
    items.push({date:x.date,desc:'Pengeluaran: '+label,type:'keluar',amount:+(x.amount||0),source:'exp',id:x.id,delName:label});
  });

  // 3) Pembayaran Piutang yang diterima lewat CA ini
  (DB.payHist||[]).filter(p=>p.via===caName).forEach(p=>{
    const ar=DB.ar.find(a=>a.id===p.ar_id);
    items.push({date:p.paid_date,desc:'Piutang dibayar: '+(ar?ar.name:'—'),type:'masuk',amount:+(p.amount||0),source:'arpay',id:p.id,arId:p.ar_id});
  });

  // 4) Pembayaran Hutang yang keluar lewat CA ini
  (DB.debtPay||[]).filter(p=>p.via===caName).forEach(p=>{
    const d=DB.debt.find(dd=>dd.id===p.debt_id);
    items.push({date:p.paid_date,desc:'Bayar hutang: '+(d?d.name:'—'),type:'keluar',amount:+(p.amount||0),source:'debtpay',id:p.id,debtId:p.debt_id});
  });

  // 5) Dana masuk dari Hutang baru yang diarahkan ke CA ini
  (DB.debt||[]).filter(d=>d.fund_to===caName).forEach(d=>{
    items.push({date:d.date,desc:'Dana hutang baru: '+d.name,type:'masuk',amount:+(d.amount||0),source:'debtnew',id:d.id});
  });

  // 6) Hasil jual Investasi yang masuk ke CA ini
  (typeof INV_SALES!=='undefined'?INV_SALES:[]).filter(s=>s.fund_to===caName).forEach(s=>{
    items.push({date:s.date,desc:'Jual investasi: '+s.name,type:'masuk',amount:+(s.total_sell||0),source:'invsale',id:s.id});
  });

  // 7) Hasil jual Inventory/PPE/Intangible yang masuk ke CA ini
  ASSET_SALES.filter(s=>s.fund_to===caName).forEach(s=>{
    const lbl={ii:'Inventory',ppe:'PPE',intg:'Intangible'}[s.source_type]||s.source_type;
    items.push({date:s.date,desc:'Jual '+lbl+': '+s.name,type:'masuk',amount:+(s.total_sell||0),source:'assetsale',id:s.id});
  });

  return items.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
}

function caDetailDelBtn(it){
  if(it.source==='inc')return`<button class="btn-sm bd" onclick="delCAIncome('${it.id}','${escQ(it.delName)}')">Hapus</button>`;
  if(it.source==='exp')return`<button class="btn-sm bd" onclick="delCAExpense('${it.id}','${escQ(it.delName)}')">Hapus</button>`;
  if(it.source==='arpay')return`<button class="btn-sm bd" onclick="delCAArPay('${it.id}','${it.arId}')">Hapus</button>`;
  if(it.source==='debtpay')return`<button class="btn-sm bd" onclick="delCADebtPay('${it.id}','${it.debtId}')">Hapus</button>`;
  if(it.source==='invsale')return`<button class="btn-sm bd" onclick="delCAInvSale('${it.id}')">Hapus</button>`;
  if(it.source==='debtnew')return`<span style="font-size:10px;color:var(--mu)">kelola di Hutang</span>`;
  if(it.source==='assetsale')return`<span style="font-size:10px;color:var(--mu)">belum bisa dihapus</span>`;
  return'';
}

async function openCADetail(caName){
  await loadInvSales();
  await loadAssetSales();
  caDetailTarget=caName;
  const items=buildCATransactions(caName);
  const totalMasuk=items.filter(x=>x.type==='masuk').reduce((a,x)=>a+x.amount,0);
  const totalKeluar=items.filter(x=>x.type==='keluar').reduce((a,x)=>a+x.amount,0);
  document.getElementById('ca-detail-title').textContent='📋 Riwayat: '+caName;
  const rows=items.map(it=>`<tr>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${it.date||'—'}</td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${esc(it.desc)}</td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)"><span class="dbadge ${it.type==='masuk'?'aman':'jt'}">${it.type==='masuk'?'Masuk':'Keluar'}</span></td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd);text-align:right"><b style="color:${it.type==='masuk'?'var(--ok)':'var(--er)'}">${it.type==='masuk'?'+':'-'}${fRp(it.amount)}</b></td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${caDetailDelBtn(it)}</td>
    </tr>`).join('');
  document.getElementById('ca-detail-body').innerHTML=`
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11.5px">
      <thead><tr style="background:var(--bg)">
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Tanggal</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Keterangan</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Tipe</th>
        <th style="padding:6px 8px;text-align:right;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Nominal</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Aksi</th>
      </tr></thead>
      <tbody>${rows||`<tr><td colspan="5" style="padding:14px;text-align:center;color:var(--mu)">Belum ada riwayat transaksi</td></tr>`}</tbody>
    </table>
    </div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
      <span style="color:var(--ok)">Total Masuk: <b>${fRp(totalMasuk)}</b></span>
      <span style="color:var(--er)">Total Keluar: <b>${fRp(totalKeluar)}</b></span>
    </div>
    <div style="font-size:10px;color:var(--mu);margin-top:6px">Catatan: penyesuaian saldo manual (edit langsung nominal di Current Asset) & riwayat jual Inventory/PPE/Intangible belum bisa dihapus dari sini.</div>`;
  document.getElementById('ca-detail-mo').classList.add('open');
}
function closeCADetailModal(){
  document.getElementById('ca-detail-mo').classList.remove('open');
  caDetailTarget=null;
}

// ── Aksi hapus per jenis transaksi (masing-masing balikin saldo CA yang bener) ──
function delCAIncome(id,name){
  document.getElementById('cfm-tt').textContent='Hapus Pemasukan Ini?';
  document.getElementById('cfm-mg').textContent=`"${name}" akan dihapus permanen.`;
  cfmCb=async()=>{
    try{
      const rec=DB.inc.find(x=>x.id===id);
      if(rec)await applyAssetDelta(rec.method,-(+rec.amount||0));
      await sbD('income',id);
      DB.inc=await sbG('income');
      DB.ca=await sbG('current_assets');
      showToast('🗑️ Pemasukan dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(caDetailTarget)openCADetail(caDetailTarget);
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
function delCAExpense(id,name){
  document.getElementById('cfm-tt').textContent='Hapus Pengeluaran Ini?';
  document.getElementById('cfm-mg').textContent=`"${name}" akan dihapus permanen.`;
  cfmCb=async()=>{
    try{
      const rec=DB.exp.find(x=>x.id===id);
      if(rec)await applyAssetDelta(rec.method,+(rec.amount||0)); // pengeluaran dihapus -> saldo balik nambah
      await sbD('expenses',id);
      DB.exp=await sbG('expenses');
      DB.ca=await sbG('current_assets');
      showToast('🗑️ Pengeluaran dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(caDetailTarget)openCADetail(caDetailTarget);
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
function delCAInvSale(id){
  document.getElementById('cfm-tt').textContent='Hapus Riwayat Penjualan Investasi Ini?';
  document.getElementById('cfm-mg').textContent='Satu transaksi penjualan akan dihapus permanen. Saldo Current Asset terkait otomatis disesuaikan lagi.';
  cfmCb=async()=>{
    try{
      const sale=(typeof INV_SALES!=='undefined'?INV_SALES:[]).find(x=>x.id===id);
      await sbD('investment_sales',id);
      if(typeof INV_SALES!=='undefined')INV_SALES=INV_SALES.filter(x=>x.id!==id);
      if(sale&&sale.fund_to){await applyAssetDelta(sale.fund_to,-(+(sale.total_sell||0)));DB.ca=await sbG('current_assets');}
      showToast('🗑️ Riwayat penjualan dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(caDetailTarget)openCADetail(caDetailTarget);
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
function delCAArPay(payId,arId){
  document.getElementById('cfm-tt').textContent='Hapus Riwayat Pembayaran Piutang Ini?';
  document.getElementById('cfm-mg').textContent='Satu transaksi pembayaran akan dihapus permanen. Saldo piutang & Current Asset terkait otomatis disesuaikan lagi.';
  cfmCb=async()=>{
    try{
      const pay=DB.payHist.find(p=>p.id===payId);
      if(!pay){showToast('❌ Data tidak ditemukan');return;}
      const ar=DB.ar.find(a=>a.id===arId);
      if(ar){
        const newPaid=Math.max(0,(+(ar.paid||0))-(+(pay.amount||0)));
        const total=+(ar.amount||0);
        let newStatus=ar.status;
        if(newPaid<=0)newStatus='Outstanding';
        else if(newPaid<total)newStatus='Partial';
        await sbU('accounts_receivable',arId,{paid:newPaid,status:newStatus});
        DB.ar=await sbG('accounts_receivable');
      }
      if(pay.via){await applyAssetDelta(pay.via,-(+(pay.amount||0)));DB.ca=await sbG('current_assets');}
      await sbD('payment_history',payId);
      DB.payHist=await sbG('payment_history','&order=paid_date.asc');
      showToast('🗑️ Riwayat pembayaran dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(caDetailTarget)openCADetail(caDetailTarget);
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
function delCADebtPay(payId,debtId){
  document.getElementById('cfm-tt').textContent='Hapus Riwayat Pembayaran Hutang Ini?';
  document.getElementById('cfm-mg').textContent='Satu transaksi pembayaran akan dihapus permanen. Saldo hutang & Current Asset terkait otomatis disesuaikan lagi.';
  cfmCb=async()=>{
    try{
      const pay=DB.debtPay.find(p=>p.id===payId);
      if(!pay){showToast('❌ Data tidak ditemukan');return;}
      const debt=DB.debt.find(d=>d.id===debtId);
      if(debt){
        const newPaid=Math.max(0,(+(debt.paid||0))-(+(pay.amount||0)));
        const total=+(debt.amount||0);
        const newStatus=newPaid<total?((debt.due_date&&debt.due_date<td())?'Jatuh Tempo':'Aman'):debt.status;
        await sbU('debts',debtId,{paid:newPaid,status:newStatus});
        DB.debt=await sbG('debts');
      }
      if(pay.via){await applyAssetDelta(pay.via,+(+(pay.amount||0)));DB.ca=await sbG('current_assets');} // bayar hutang dihapus -> saldo balik nambah
      await sbD('debt_payments',payId);
      DB.debtPay=await sbG('debt_payments','&order=paid_date.asc');
      showToast('🗑️ Riwayat pembayaran dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(typeof renderHutangPage==='function'&&document.getElementById('page-hutang')?.classList.contains('active'))renderHutangPage();
      if(caDetailTarget)openCADetail(caDetailTarget);
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
