// Halaman Cash Equivalent (Piutang + Inventory)

function rAR(){
  const data=sortArr(DB.ar,'t-ar');
  mkTbl('t-ar',['#','Penghutang','Tagihan','Terbayar','Sisa','Tanggal Update','Jatuh Tempo','Status','Detail','Note','Aksi'],
    data.map((r,i)=>{
      const sisa=Math.max(0,(+(r.amount||0))-(+(r.paid||0)));
      return`<tr>
        <td>${i+1}</td><td>${r.name}</td>
        <td>${fRp(r.amount)}</td>
        <td style="color:var(--ok)">${fRp(r.paid||0)}</td>
        <td><b>${fRp(sisa)}</b></td>
        <td>${r.date}</td><td>${r.due_date||'-'}</td>
        <td><span class="badge ${r.status==='Paid'?'bg_':r.status==='Overdue'?'br':r.status==='Partial'?'by':'bb'}">${r.status}</span></td>
        <td><button class="btn-sm" style="background:#ede9fe;color:#7c3aed" onclick="showPayHistory('${r.id}')">📋 Detail</button></td>
        ${noteCell(r.note)}
        <td style="white-space:nowrap">
          <button class="btn-sm" style="background:#dcfce7;color:#15803d" onclick="openPayAR('${r.id}')" ${sisa<=0?'disabled':''}>💰 Bayar</button>
          <button class="btn-sm be" onclick="openE('ar','${r.id}')">Edit</button>
          <button class="btn-sm bd" onclick="delR('ar','${r.id}','${escQ(r.name)}')">Hapus</button>
        </td>
      </tr>`;
    }));
}
function rII(){
  const data=sortArr(DB.ii,'t-ii');
  mkTbl('t-ii',['#','Nama','Qty','Harga Beli','Harga Sekarang','Tgl Beli','Pertumbuhan (Rp)','Pertumbuhan (%)','Tanggal Update','Note','Aksi'],
    data.map((r,i)=>{
      const bp=+(r.buy_price||r.amount||0);
      const sp=+(r.current_price||bp);
      const qty=+(r.qty||0);
      const tumbuhRp=(sp-bp)*qty;
      const tumbuhPct=bp>0?((sp-bp)/bp*100).toFixed(2):0;
      const isUp=tumbuhRp>=0;
      const updAt=r.updated_at?new Date(r.updated_at).toLocaleDateString('id-ID'):'—';
      return`<tr>
        <td>${i+1}</td><td>${r.name}</td><td>${qty||'—'}</td>
        <td>${fRp(bp)}</td>
        <td style="color:${sp>=bp?'var(--ok)':'var(--er)'}"><b>${fRp(sp)}</b></td>
        <td>${r.date}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'↑ +':'↓ -'}${fRp(Math.abs(tumbuhRp))}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'+':''}${tumbuhPct}%</td>
        <td>${updAt}</td>
        ${noteCell(r.note)}
        <td style="white-space:nowrap">
          <button class="btn-sm" style="background:#dcfce7;color:#15803d" onclick="openSellII('${r.id}')" ${qty<=0?'disabled':''}>💰 Jual</button>
          <button class="btn-sm be" onclick="openE('ii','${r.id}')">Edit</button>
          <button class="btn-sm bd" onclick="delR('ii','${r.id}','${escQ(r.name)}')">Hapus</button>
        </td>
      </tr>`;
    }));
}
function buildARFormAdd(){
  return`
<div class="fg"><label>Nama Penghutang</label><input id="f-nm" value=""></div>
<div class="fr">
  <div class="fg"><label>Total Tagihan (Rp)</label><input id="f-amt" type="number" min="0" value="0"></div>
  <div class="fg"><label>Status</label><select id="f-sts"><option>Outstanding</option><option>Overdue</option></select></div>
</div>
<div class="fr">
  <div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${td()}"></div>
  <div class="fg"><label>Jatuh Tempo</label><input id="f-due" type="date" value=""></div>
</div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="" placeholder="Catatan tambahan..."></div>`;
}
// Poin 3: form Edit sekarang cuma data inti Piutang. Bagian "Tambah Pembayaran"
// (dulu nempel di sini) udah dipindah ke modal terpisah lewat tombol "💰 Bayar" di tabel.
function buildARFormEdit(r){
  const paid=+(r.paid||0);
  const total=+(r.amount||0);
  const sisa=Math.max(0,total-paid);
  return`
<div class="fg"><label>Nama Penghutang</label><input id="f-nm" value="${esc(r.name||'')}"></div>
<div class="fr">
  <div class="fg"><label>Total Tagihan (Rp)</label><input id="f-amt" type="number" min="0" value="${total}"></div>
  <div class="fg"><label>Status</label><select id="f-sts">
    ${['Outstanding','Paid','Overdue','Partial'].map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}
  </select></div>
</div>
<div class="fr">
  <div class="fg"><label>Tanggal Awal Hutang</label><input id="f-dt" type="date" value="${r.date||td()}"></div>
  <div class="fg"><label>Jatuh Tempo</label><input id="f-due" type="date" value="${r.due_date||''}"></div>
</div>
<div class="fg" style="background:var(--bg);border-radius:8px;padding:10px 12px;font-size:11.5px;color:var(--mu)">
  Sudah Bayar: <b style="color:var(--ok)">${fRp(paid)}</b> &nbsp;·&nbsp; Sisa: <b style="color:var(--er)">${fRp(sisa)}</b>
  <div style="font-size:10px;margin-top:4px">Buat nambah pembayaran, tutup form ini terus klik tombol <b>💰 Bayar</b> di tabel.</div>
</div>
<div class="fg" style="margin-top:9px"><label>Note (opsional)</label><input id="f-note" value="${esc(r.note||'')}" placeholder="Catatan tambahan..."></div>`;
}
// (dipertahankan apa adanya — masih dipakai form Edit Hutang di hutang.js)
function calcNewPaid(){
  const add=parseFloat(document.getElementById('f-paid-add')?.value)||0;
  const existing=parseFloat(document.getElementById('f-paid-total')?.value)||0;
  const total=parseFloat(document.getElementById('f-amt')?.value)||0;
  const payDate=document.getElementById('f-pay-date')?.value||td();
  const newTotal=Math.min(existing+add,total);
  const el=document.getElementById('paid-preview');
  if(el){
    if(add>0){
      el.innerHTML=`✅ Akan terbayar <b style="color:var(--ok)">${fRp(add)}</b> pada <b>${payDate}</b> → Total: <b>${fRp(newTotal)}</b> | Sisa: <b style="color:var(--er)">${fRp(Math.max(0,total-newTotal))}</b>`;
      const stsEl=document.getElementById('f-sts');
      if(stsEl){
        if(mType==='debt'){if(newTotal>=total)stsEl.value='Lunas';else stsEl.value='Aman';}
        else{if(newTotal>=total)stsEl.value='Paid';else if(newTotal>0)stsEl.value='Partial';}
      }
    } else {
      el.innerHTML='';
    }
  }
}
function getPayHistFor(arId){
  return DB.payHist.filter(p=>p.ar_id===arId).sort((a,b)=>(a.paid_date||'').localeCompare(b.paid_date||''));
}
let currentPhistArId=null;
let phistPageState={size:10,page:1};
function showPayHistory(arId){
  currentPhistArId=arId;
  phistPageState={size:10,page:1};
  renderPayHistoryTable();
  document.getElementById('phist-mo').classList.add('open');
}
function renderPayHistoryTable(){
  const arId=currentPhistArId;
  const r=DB.ar.find(x=>x.id===arId);
  if(!r)return;
  const logs=getPayHistFor(arId);
  const total=+(r.amount||0);
  const ps=phistPageState;
  const totalItems=logs.length;
  const size=ps.size==='all'?totalItems||1:ps.size;
  const totalPages=Math.max(1,Math.ceil(totalItems/size));
  if(ps.page>totalPages)ps.page=totalPages||1;
  const start=(ps.page-1)*size;
  const pageLogs=ps.size==='all'?logs:logs.slice(start,start+size);
  const rows=pageLogs.map((l,i)=>`<tr style="border-bottom:1px solid var(--bd)">
    <td style="padding:8px 10px">${start+i+1}</td>
    <td style="padding:8px 10px;font-weight:700">${fRp(total)}</td>
    <td style="padding:8px 10px;color:var(--ok);font-weight:700">${fRp(l.amount)}</td>
    <td style="padding:8px 10px">${l.paid_date||'—'}</td>
    <td style="padding:8px 10px;color:var(--er);font-weight:700">${fRp(l.sisa)}</td>
    <td style="padding:8px 10px">${l.via||'—'}</td>
  </tr>`).join('');

  document.getElementById('phist-title').textContent=r.name;
  document.getElementById('phist-meta').innerHTML=`<span class="badge bb">Hutang Awal: ${fRp(total)}</span> &nbsp; <span class="badge bk">Tgl Hutang: ${r.date||'—'}</span> &nbsp; <span class="badge ${+(r.paid||0)>0?'by':'bb'}">Terbayar: ${fRp(r.paid||0)}</span> &nbsp; <span class="badge br">Sisa: ${fRp(Math.max(0,total-(+(r.paid||0))))}</span>`;
  document.getElementById('phist-body').innerHTML=rows||`<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--mu);font-style:italic">Belum ada riwayat pembayaran</td></tr>`;
  renderPhistPager(totalItems);
}
// Nyisipin div pager tepat setelah <table> yang isinya #phist-body, sekali doang
// (idempotent) — gak perlu tau/ubah struktur modal di index.html sama sekali.
function ensurePhistPagerEl(){
  let pager=document.getElementById('phist-pager');
  if(!pager){
    const tbody=document.getElementById('phist-body');
    const table=tbody?.closest('table');
    if(!table)return null;
    pager=document.createElement('div');
    pager.id='phist-pager';
    pager.className='tbl-pager';
    table.insertAdjacentElement('afterend',pager);
  }
  return pager;
}
function renderPhistPager(totalItems){
  const pager=ensurePhistPagerEl();
  if(!pager)return;
  const ps=phistPageState;
  if(totalItems===0){pager.innerHTML='';return;}
  const size=ps.size==='all'?totalItems||1:ps.size;
  const totalPages=Math.max(1,Math.ceil(totalItems/size));
  const sizes=[10,50,'all'];
  pager.innerHTML=`
    <div class="pager-info">Menampilkan ${ps.size==='all'?totalItems:Math.min(ps.size,totalItems-(ps.page-1)*ps.size)} dari ${totalItems} data</div>
    <div class="pager-controls">
      <select class="pager-size" onchange="changePhistPageSize(this.value)">
        ${sizes.map(s=>`<option value="${s}" ${ps.size==s?'selected':''}>${s==='all'?'Semua':s+' baris'}</option>`).join('')}
      </select>
      ${ps.size!=='all'?`
      <button class="pager-btn" onclick="changePhistPage(${ps.page-1})" ${ps.page<=1?'disabled':''}>‹</button>
      <span class="pager-num">${ps.page} / ${totalPages}</span>
      <button class="pager-btn" onclick="changePhistPage(${ps.page+1})" ${ps.page>=totalPages?'disabled':''}>›</button>`:''}
    </div>`;
}
function changePhistPageSize(val){
  phistPageState.size=val==='all'?'all':parseInt(val);
  phistPageState.page=1;
  renderPayHistoryTable();
}
function changePhistPage(page){
  phistPageState.page=Math.max(1,page);
  renderPayHistoryTable();
}

// ══════════════════════════════════════════════════════════════
// POIN 3: modal "Bayar" berdiri sendiri (terpisah dari Edit Piutang)
// ══════════════════════════════════════════════════════════════
let payARTarget=null;
function openPayAR(id){
  const r=DB.ar.find(x=>x.id===id);
  if(!r){showToast('❌ Data tidak ditemukan');return;}
  const sisa=Math.max(0,(+(r.amount||0))-(+(r.paid||0)));
  if(sisa<=0){showToast('✅ Piutang ini udah lunas');return;}
  payARTarget=id;
  document.getElementById('ar-pay-title').textContent='💰 Bayar: '+r.name;
  document.getElementById('ar-pay-body').innerHTML=buildPayARForm(r);
  document.getElementById('ar-pay-mo').classList.add('open');
}
function closePayARModal(){
  document.getElementById('ar-pay-mo').classList.remove('open');
  payARTarget=null;
}
function buildPayARForm(r){
  const paid=+(r.paid||0);
  const total=+(r.amount||0);
  const sisa=Math.max(0,total-paid);
  return`
<div class="fg" style="font-size:12px;color:var(--mu)">
  <b style="color:var(--txt)">${esc(r.name)}</b><br>
  Total Tagihan: <b>${fRp(total)}</b> · Sudah Bayar: <b style="color:var(--ok)">${fRp(paid)}</b> · Sisa: <b style="color:var(--er)">${fRp(sisa)}</b>
</div>
<div class="fr" style="margin-top:8px">
  <div class="fg"><label>Jumlah Pembayaran (Rp)</label><input id="pay-add" type="number" min="0" max="${sisa}" value="0" oninput="calcPayARPreview(${total},${paid})"></div>
  <div class="fg"><label>Tanggal Pembayaran</label><input id="pay-date" type="date" value="${td()}"></div>
</div>
<div class="fg"><label>Via Pembayaran (Current Asset)</label>${buildMethodSelect('','pay-via')}</div>
<div id="pay-preview" style="font-size:10.5px;color:var(--mu);margin-top:4px;padding:5px 8px;background:var(--bg);border-radius:6px;min-height:24px"></div>`;
}
function calcPayARPreview(total,paid){
  const add=parseFloat(document.getElementById('pay-add')?.value)||0;
  const payDate=document.getElementById('pay-date')?.value||td();
  const newTotal=Math.min(paid+add,total);
  const el=document.getElementById('pay-preview');
  if(!el)return;
  if(add>0)el.innerHTML=`✅ Akan terbayar <b style="color:var(--ok)">${fRp(add)}</b> pada <b>${payDate}</b> → Total: <b>${fRp(newTotal)}</b> | Sisa: <b style="color:var(--er)">${fRp(Math.max(0,total-newTotal))}</b>`;
  else el.innerHTML='';
}
async function savePayAR(){
  if(!payARTarget)return;
  const r=DB.ar.find(x=>x.id===payARTarget);
  if(!r){showToast('❌ Data tidak ditemukan');return;}
  const total=+(r.amount||0);
  const existingPaid=+(r.paid||0);
  const addPayment=parseFloat(document.getElementById('pay-add')?.value)||0;
  const via=document.getElementById('pay-via')?.value||'';
  const payDate=document.getElementById('pay-date')?.value||td();
  if(addPayment<=0){showToast('⚠️ Isi jumlah pembayaran');return;}
  if(addPayment>(total-existingPaid)){showToast('⚠️ Jumlah melebihi sisa tagihan');return;}
  const newPaid=Math.min(existingPaid+addPayment,total);
  let newStatus=r.status;
  if(newPaid>=total&&total>0)newStatus='Paid';
  else if(newPaid>0&&newPaid<total)newStatus='Partial';
  try{
    await sbU('accounts_receivable',payARTarget,{paid:newPaid,status:newStatus});
    await sbI('payment_history',{ar_id:payARTarget,amount:addPayment,paid_date:payDate,via:via||null,paid_total:newPaid,sisa:Math.max(0,total-newPaid)});
    DB.payHist=await sbG('payment_history','&order=paid_date.asc');
    if(via){
      await applyAssetDelta(via,addPayment);
      DB.ca=await sbG('current_assets');
    }
    DB.ar=await sbG('accounts_receivable');
    closePayARModal();
    doSnap().catch(()=>{});updateAll();reRender();
    showToast('✅ Pembayaran tercatat'+(via?' & saldo '+via+' bertambah':''));
  }catch(e){ showToast('❌ '+e.message); }
}

function buildIIForm(r,isEdit){
  const buyPrice  = r ? (+(r.buy_price||r.amount||0)) : 0;
  const curPrice  = r ? (+(r.current_price||buyPrice)) : 0;
  const qty       = r ? (+(r.qty||0))                  : 0;
  return`
<div class="fg"><label>Nama Item</label><input id="f-nm" value="${r?esc(r.name):''}"></div>
<div class="fr">
  <div class="fg"><label>Qty</label><input id="f-qty" type="number" min="0" value="${qty}"></div>
  <div class="fg"><label>Harga Beli per Unit (Rp)</label><input id="f-buy-price" type="number" min="0" value="${buyPrice}"></div>
</div>
<div class="fg"><label>Tanggal Beli</label><input id="f-dt" type="date" value="${r?r.date:td()}"></div>
${isEdit?`<div class="fg"><label>Harga Sekarang per Unit (Rp)</label><input id="f-cur-price" type="number" min="0" value="${curPrice}"></div>`:''}
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${r?esc(r.note||''):''}" placeholder="Catatan tambahan..."></div>`;
}

// ══════════════════════════════════════════════════════════════
// POIN 1: Jual Inventory — kurangin qty, kalau abis baris ikut kehapus,
// hasil jual (opsional) otomatis masuk ke saldo Current Asset yang dipilih.
// ══════════════════════════════════════════════════════════════
let sellIITarget=null;
function openSellII(id){
  const item=DB.ii.find(x=>x.id===id);
  if(!item){showToast('❌ Data tidak ditemukan');return;}
  const qty=+(item.qty||0);
  if(qty<=0){showToast('⚠️ Qty item ini 0, gak ada yang bisa dijual');return;}
  sellIITarget={id,name:item.name,availableQty:qty,curPrice:+(item.current_price||item.buy_price||0)};
  document.getElementById('ii-sell-title').textContent='💰 Jual: '+item.name;
  document.getElementById('ii-sell-body').innerHTML=buildSellIIForm(sellIITarget);
  document.getElementById('ii-sell-mo').classList.add('open');
}
function closeSellIIModal(){document.getElementById('ii-sell-mo').classList.remove('open');sellIITarget=null;}
function buildSellIIForm(t){
  return`
<div class="fg"><label>Nama Item</label><input value="${esc(t.name)}" disabled style="opacity:.7"></div>
<div class="fg" style="font-size:11px;color:var(--mu);margin-top:-6px">Sisa qty: <b style="color:var(--txt)">${t.availableQty}</b></div>
<div class="fr">
  <div class="fg"><label>Jumlah Dijual</label><input id="ii-sell-qty" type="number" min="0" max="${t.availableQty}" step="any" value="0" oninput="syncIISellTotal()"></div>
  <div class="fg"><label>Harga Jual per Unit (Rp)</label><input id="ii-sell-price" type="number" min="0" value="${t.curPrice}" oninput="syncIISellTotal()"></div>
</div>
<div class="fg">
  <label>Total Harga Dijual (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="ii-sell-total" type="number" min="0" value="0" style="font-weight:700;color:var(--ok)" oninput="markIISellManualTotal()">
  <div id="ii-sell-total-note" style="font-size:10px;color:var(--mu);margin-top:2px">Dihitung otomatis dari Harga × Qty</div>
</div>
<div class="fg"><label>Tanggal Jual</label><input id="ii-sell-dt" type="date" value="${td()}"></div>
<div class="fg"><label>Uang Hasil Jual Masuk Ke</label>${buildMethodSelect('','ii-sell-fund-to')}</div>
<div class="fg"><label>Note (opsional)</label><input id="ii-sell-note" value="" placeholder="Catatan tambahan..."></div>
<input type="hidden" id="ii-sell-manual-total" value="0">`;
}
function syncIISellTotal(){
  if(document.getElementById('ii-sell-manual-total')?.value==='1')return;
  const p=parseFloat(document.getElementById('ii-sell-price')?.value)||0;
  const q=parseFloat(document.getElementById('ii-sell-qty')?.value)||0;
  const el=document.getElementById('ii-sell-total');
  if(el)el.value=(p*q).toFixed(0);
}
function markIISellManualTotal(){
  const el=document.getElementById('ii-sell-manual-total');if(el)el.value='1';
  const note=document.getElementById('ii-sell-total-note');if(note)note.textContent='✏️ Nilai manual';
}
async function saveSellII(){
  if(!sellIITarget)return;
  const {id,name,availableQty}=sellIITarget;
  const qty=parseFloat(document.getElementById('ii-sell-qty')?.value)||0;
  const sellPrice=parseFloat(document.getElementById('ii-sell-price')?.value)||0;
  const totalSell=parseFloat(document.getElementById('ii-sell-total')?.value)||(sellPrice*qty);
  const date=document.getElementById('ii-sell-dt')?.value||td();
  const note=(document.getElementById('ii-sell-note')?.value||'').trim();
  const fundTo=document.getElementById('ii-sell-fund-to')?.value||'';
  if(qty<=0){showToast('⚠️ Isi jumlah yang dijual');return;}
  if(qty>availableQty){showToast('⚠️ Jumlah dijual melebihi sisa qty ('+availableQty+')');return;}
  try{
    await sbI('asset_sales',{source_type:'ii',source_id:id,name,qty,sell_price:sellPrice,total_sell:totalSell,date,note,fund_to:fundTo||null});
    const item=DB.ii.find(x=>x.id===id);
    const remainingQty=availableQty-qty;
    if(remainingQty<=0){
      await sbD('inventory',id);
      DB.ii=DB.ii.filter(x=>x.id!==id);
    } else {
      const buyPrice=+(item.buy_price||item.amount||0);
      const newAmount=buyPrice*remainingQty;
      await sbU('inventory',id,{qty:remainingQty,amount:newAmount});
      DB.ii=await sbG('inventory');
    }
    if(fundTo){await applyAssetDelta(fundTo,totalSell);DB.ca=await sbG('current_assets');}
    closeSellIIModal();
    doSnap().catch(()=>{});updateAll();reRender();
    showToast('✅ Penjualan '+name+' dicatat'+(fundTo?' & saldo '+fundTo+' bertambah':''));
  }catch(e){ showToast('❌ '+e.message); }
}
