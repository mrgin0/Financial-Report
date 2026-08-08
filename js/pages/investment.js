// Halaman Investment — 1 baris per NAMA investasi (gabungan semua transaksi/lot pembelian)

let INV_SALES=[];
let invSalesLoaded=false;
let detailTargetName=null;
let detailActiveTab='buy';

async function loadInvSales(force){
  if(invSalesLoaded&&!force)return;
  try{ INV_SALES=await sbG('investment_sales'); invSalesLoaded=true; }
  catch(e){ console.warn('Gagal load investment_sales:',e.message); }
}

// ══════════════════════════════════════════════════════════════
// GROUPING — gabungin semua lot (transaksi beli) jadi 1 ringkasan per nama,
// dikurangi qty yang udah dijual (investment_sales)
// ══════════════════════════════════════════════════════════════
function getInvGroups(){
  const byName={};
  DB.inv.forEach(r=>{
    const k=r.name;
    if(!byName[k])byName[k]={name:k,type:r.type,lots:[],totalQty:0,totalBuy:0,latestLot:r};
    const g=byName[k];
    g.lots.push(r);
    g.totalQty+=(+(r.qty||0));
    g.totalBuy+=(+(r.total_buy||r.amount||0));
    const curUpdated=g.latestLot.updated_at||g.latestLot.date||'';
    const thisUpdated=r.updated_at||r.date||'';
    if(thisUpdated>curUpdated){g.latestLot=r;g.type=r.type;}
  });
  const soldByName={};
  INV_SALES.forEach(s=>{soldByName[s.name]=(soldByName[s.name]||0)+(+(s.qty||0));});

  return Object.values(byName).map(g=>{
    const soldQty=soldByName[g.name]||0;
    const remainingQty=Math.max(0,g.totalQty-soldQty);
    const curPrice=+(g.latestLot.current_price||g.latestLot.buy_price||0);
    const avgBuyPrice=g.totalQty>0?g.totalBuy/g.totalQty:0; // rata-rata beli dihitung dari SEMUA yg pernah dibeli
    const costBasisRemaining=avgBuyPrice*remainingQty;       // "Nilai Beli" yg ditampilkan = modal dari sisa yg masih dipegang
    const nilaiSkrg=curPrice*remainingQty;
    const unrealized=nilaiSkrg-costBasisRemaining;
    const pct=costBasisRemaining>0?((unrealized/costBasisRemaining)*100):0;
    const sales=INV_SALES.filter(s=>s.name===g.name).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const totalSellRevenue=sales.reduce((a,s)=>a+(+(s.total_sell||0)),0);
    const realizedGain=totalSellRevenue-(avgBuyPrice*soldQty);
    return{
      name:g.name,type:g.type,
      lots:g.lots.sort((a,b)=>(a.date||'').localeCompare(b.date||'')),
      sales,
      totalQty:remainingQty,totalBoughtQty:g.totalQty,soldQty,
      totalBuy:costBasisRemaining,avgBuyPrice,curPrice,nilaiSkrg,unrealized,pct,
      realizedGain,totalSellRevenue,
      latestLot:g.latestLot,latestId:g.latestLot.id,
      updatedAt:g.latestLot.updated_at,note:g.latestLot.note||''
    };
  });
}

async function rINV(){
  await loadInvSales();
  let groups=getInvGroups();
  groups=sortArr(groups,'t-inv');
  mkTbl('t-inv',
    ['#','Nama Investasi','Tipe','Nilai Beli','Rata-rata Harga Beli','Total Harga Sekarang','Tgl Update','Unrealized Gain/Loss','Gain/Loss %','Aksi'],
    groups.map((g,i)=>{
      const isUp=g.unrealized>=0;
      const updAt=g.updatedAt?new Date(g.updatedAt).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';
      return`<tr>
        <td>${i+1}</td><td><b>${esc(g.name)}</b>${g.soldQty>0?`<div style="font-size:9.5px;color:var(--mu);font-weight:400">sisa ${g.totalQty} dari ${g.totalBoughtQty}</div>`:''}</td>
        <td><span class="badge bp">${esc(g.type)}</span></td>
        <td>${fRp(g.totalBuy)}</td>
        <td style="font-variant-numeric:tabular-nums">${fRp(g.avgBuyPrice)}</td>
        <td style="font-variant-numeric:tabular-nums">${g.curPrice>0?fRp(g.nilaiSkrg):'—'}</td>
        <td>${updAt}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'↑ +':'↓ -'}${fRp(Math.abs(g.unrealized))}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'+':''}${g.pct.toFixed(2)}%</td>
        <td style="white-space:nowrap">
          <button class="btn-sm" style="background:#dbeafe;color:#2563eb" onclick="openAddLot('${escQ(g.name)}')">+ Tambah</button>
          <button class="btn-sm" style="background:#dcfce7;color:#15803d" onclick="openSellModal('${escQ(g.name)}')">💰 Jual</button>
          <button class="btn-sm" style="background:#ede9fe;color:#7c3aed" onclick="openInvDetail('${escQ(g.name)}')">📋 Detail</button>
          <button class="btn-sm be" onclick="openEditInvGroup('${escQ(g.name)}')">Edit</button>
          <button class="btn-sm bd" onclick="delInvGroup('${escQ(g.name)}')">Hapus</button>
        </td>
      </tr>`;
    }));
}

// ══════════════════════════════════════════════════════════════
// Tipe investasi (dipakai form Tambah baru & Edit)
// ══════════════════════════════════════════════════════════════
function getInvTypes(){
  const base=['Saham','Reksa Dana','Crypto','Emas','Obligasi'];
  const custom=[...new Set(DB.inv.map(x=>x.type).filter(t=>t&&!base.includes(t)&&t!=='Lainnya'))];
  return[...base,...custom,'Lainnya'];
}
function buildInvTypeSelect(cur){
  const types=getInvTypes();
  const isCustom=cur&&!types.slice(0,-1).includes(cur);
  return`<select id="f-typ" onchange="handleInvTypChange(this)">
    ${types.map(t=>`<option value="${t}" ${cur===t?'selected':''}>${t}</option>`).join('')}
    ${isCustom?`<option value="${cur}" selected>${cur}</option>`:''}
  </select>
  <div id="f-typ-custom" style="display:${isCustom?'block':'none'};margin-top:5px">
    <input id="f-typ-input" placeholder="Tulis tipe investasi…" value="${isCustom?cur:''}" style="width:100%;border:1.5px solid var(--bd);border-radius:7px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--txt);outline:none">
  </div>`;
}
function handleInvTypChange(el){
  const d=document.getElementById('f-typ-custom');
  if(d)d.style.display=el.value==='Lainnya'?'block':'none';
}
function getInvTypValue(){
  const sel=document.getElementById('f-typ');if(!sel)return'Saham';
  if(sel.value==='Lainnya'){const inp=document.getElementById('f-typ-input');return inp&&inp.value.trim()?inp.value.trim():'Lainnya';}
  return sel.value;
}

// ══════════════════════════════════════════════════════════════
// TAMBAH INVESTASI BARU (nama baru, lot pertama) — tombol "+ Tambah" di atas tabel
// ══════════════════════════════════════════════════════════════
function buildInvFormAdd(){
  return`
<div class="fg"><label>Nama Investasi (misal: BBCA, BTC, QQQ)</label><input id="f-nm" value=""></div>
<div class="fg"><label>Tipe</label>${buildInvTypeSelect('')}</div>
<div class="fr">
  <div class="fg"><label>Harga Saat Beli per Unit (Rp)</label><input id="f-buy-price" type="number" min="0" value="0" oninput="syncTotalBuy()"></div>
  <div class="fg"><label>Jumlah / Qty</label><input id="f-qty" type="number" min="0" step="any" value="0" oninput="syncTotalBuy()"></div>
</div>
<div class="fg">
  <label>Total Beli (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="f-total-buy" type="number" min="0" value="0" style="font-weight:700;color:var(--pr)" oninput="markManualTotalBuy()">
  <div id="total-buy-note" style="font-size:10px;color:var(--mu);margin-top:2px">Dihitung otomatis dari Harga × Qty</div>
</div>
<div class="fg"><label>Tanggal Beli</label><input id="f-dt" type="date" value="${td()}"></div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="" placeholder="Catatan tambahan..."></div>
<input type="hidden" id="f-manual-total" value="0">`;
}
function syncTotalBuy(){
  if(document.getElementById('f-manual-total')?.value==='1')return;
  const p=parseFloat(document.getElementById('f-buy-price')?.value)||0;
  const q=parseFloat(document.getElementById('f-qty')?.value)||0;
  const el=document.getElementById('f-total-buy');
  if(el)el.value=(p*q).toFixed(0);
}
function markManualTotalBuy(){
  const el=document.getElementById('f-manual-total');
  if(el)el.value='1';
  const note=document.getElementById('total-buy-note');
  if(note)note.textContent='✏️ Nilai manual';
}
function calcTotalBuy(){syncTotalBuy();}

// ══════════════════════════════════════════════════════════════
// EDIT INVESTASI (per nama/grup) — cuma ubah Tipe, Harga Sekarang, Tanggal Update.
// Rata-rata Beli per Unit ditampilin READ-ONLY (dihitung dari semua lot), Tanggal Beli
// dan Note dihapus dari sini karena keduanya milik tiap lot masing-masing (lihat Detail).
// ══════════════════════════════════════════════════════════════
function openEditInvGroup(name){
  const group=getInvGroups().find(g=>g.name===name);
  if(!group){showToast('❌ Data tidak ditemukan');return;}
  mType='inv';mId=group.latestId;
  document.getElementById('m-title').textContent='✏️ Edit '+group.name;
  document.getElementById('m-body').innerHTML=buildInvFormEdit(group.latestLot,group);
  document.getElementById('mo').classList.add('open');
}
function buildInvFormEdit(r,group){
  const curPrice=+(r.current_price??group.curPrice??r.buy_price??0);
  const updDate=r.updated_at?new Date(r.updated_at).toISOString().slice(0,10):td();
  const totalQty=group.totalQty||0;
  const totalBuy=group.totalBuy||0;
  const nilaiSkrg=curPrice*totalQty;
  const unrealized=nilaiSkrg-totalBuy;
  const pct=totalBuy>0?((unrealized/totalBuy)*100).toFixed(2):'0.00';

  return`
<div class="fg"><label>Nama Investasi</label><input id="f-nm" value="${esc(r.name||'')}"></div>
<div class="fg"><label>Tipe</label>${buildInvTypeSelect(r.type||'')}</div>
<div class="fg" style="background:var(--bg);border-radius:8px;padding:10px 12px;margin-top:2px">
  <label style="margin-bottom:6px">Rata-rata Beli per Unit <span style="font-weight:400;font-size:9px;color:var(--mu)">— otomatis dari ${group.lots.length} transaksi</span></label>
  <div style="font-size:15px;font-weight:800;color:var(--pr)">${fRp(group.avgBuyPrice)}</div>
  <div style="font-size:10.5px;color:var(--mu);margin-top:4px">Total Qty: ${totalQty} · Total Beli: ${fRp(totalBuy)}</div>
</div>
<div class="fg" style="margin-top:4px">
  <label>Harga Sekarang per Unit (Rp)</label>
  <input id="f-cur-price" type="number" min="0" value="${curPrice}" oninput="calcUnrealizedGroup(${totalQty},${totalBuy})">
</div>
<div class="fg"><label>Tanggal Update Harga</label><input id="f-price-dt" type="date" value="${updDate}"></div>
<div class="fg">
  <label>Total Unrealized Gain/Loss (Rp) <span style="font-size:9px;color:var(--mu)">— otomatis</span></label>
  <input id="f-unrealized" type="number" value="${unrealized.toFixed(0)}" readonly
    style="font-weight:700;background:var(--bg);color:${unrealized>=0?'var(--ok)':'var(--er)'}">
</div>
<div style="font-size:10.5px;margin-top:-5px;margin-bottom:5px;padding:6px 10px;background:var(--bg);border-radius:6px">
  <span id="gain-formula-txt">Nilai Skrg ${fRp(nilaiSkrg)} − Beli ${fRp(totalBuy)} = <b style="color:${unrealized>=0?'var(--ok)':'var(--er)'}">${unrealized>=0?'+':''}${fRp(unrealized)} (${unrealized>=0?'+':''}${pct}%)</b></span>
</div>`;
}
function calcUnrealizedGroup(totalQty,totalBuy){
  const curPrice=parseFloat(document.getElementById('f-cur-price')?.value)||0;
  const unrealized=(curPrice*totalQty)-totalBuy;
  const pct=totalBuy>0?((unrealized/totalBuy)*100).toFixed(2):'0.00';
  const el=document.getElementById('f-unrealized');
  if(el){el.value=unrealized.toFixed(0);el.style.color=unrealized>=0?'var(--ok)':'var(--er)';}
  const txt=document.getElementById('gain-formula-txt');
  if(txt)txt.innerHTML=`Nilai Skrg ${fRp(curPrice*totalQty)} − Beli ${fRp(totalBuy)} = <b style="color:${unrealized>=0?'var(--ok)':'var(--er)'}">${unrealized>=0?'+':''}${fRp(unrealized)} (${unrealized>=0?'+':''}${pct}%)</b>`;
}

// ══════════════════════════════════════════════════════════════
// TAMBAH / EDIT LOT PEMBELIAN
// ══════════════════════════════════════════════════════════════
let addLotTarget=null;
function openAddLot(name){
  const group=getInvGroups().find(g=>g.name===name);
  if(!group){showToast('❌ Data tidak ditemukan');return;}
  addLotTarget={name:group.name,type:group.type,editId:null};
  document.getElementById('lot-mo-title').textContent='+ Tambah Investasi: '+group.name;
  document.getElementById('lot-mo-body').innerHTML=buildAddLotForm(group.name,group.type);
  document.getElementById('inv-lot-mo').classList.add('open');
}
function openEditLot(id){
  const lot=DB.inv.find(x=>x.id===id);
  if(!lot){showToast('❌ Data tidak ditemukan');return;}
  addLotTarget={name:lot.name,type:lot.type,editId:id};
  document.getElementById('lot-mo-title').textContent='✏️ Edit Transaksi: '+lot.name;
  document.getElementById('lot-mo-body').innerHTML=buildAddLotForm(lot.name,lot.type,lot);
  document.getElementById('inv-lot-mo').classList.add('open');
}
function closeAddLotModal(){
  document.getElementById('inv-lot-mo').classList.remove('open');
  addLotTarget=null;
}
function buildAddLotForm(name,type,lot){
  const buyPrice=lot?+(lot.buy_price||0):0;
  const qty=lot?+(lot.qty||0):0;
  const totalBuy=lot?+(lot.total_buy||lot.amount||0):0;
  const dateVal=lot?(lot.date||td()):td();
  const noteVal2=lot?(lot.note||''):'';
  return`
<div class="fg"><label>Nama Investasi</label><input value="${esc(name)}" disabled style="opacity:.7"></div>
<div class="fg"><label>Tipe</label><input value="${esc(type)}" disabled style="opacity:.7"></div>
<div class="fr">
  <div class="fg"><label>Harga Beli per Unit (Rp)</label><input id="lot-buy-price" type="number" min="0" value="${buyPrice}" oninput="syncLotTotalBuy()"></div>
  <div class="fg"><label>Jumlah / Qty</label><input id="lot-qty" type="number" min="0" step="any" value="${qty}" oninput="syncLotTotalBuy()"></div>
</div>
<div class="fg">
  <label>Total Beli (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="lot-total-buy" type="number" min="0" value="${totalBuy}" style="font-weight:700;color:var(--pr)" oninput="markLotManualTotal()">
  <div id="lot-total-buy-note" style="font-size:10px;color:var(--mu);margin-top:2px">Dihitung otomatis dari Harga × Qty</div>
</div>
<div class="fg"><label>Tanggal Beli</label><input id="lot-dt" type="date" value="${dateVal}"></div>
<div class="fg"><label>Note (opsional)</label><input id="lot-note" value="${esc(noteVal2)}" placeholder="Catatan tambahan..."></div>
<input type="hidden" id="lot-manual-total" value="0">`;
}
function syncLotTotalBuy(){
  if(document.getElementById('lot-manual-total')?.value==='1')return;
  const p=parseFloat(document.getElementById('lot-buy-price')?.value)||0;
  const q=parseFloat(document.getElementById('lot-qty')?.value)||0;
  const el=document.getElementById('lot-total-buy');
  if(el)el.value=(p*q).toFixed(0);
}
function markLotManualTotal(){
  const el=document.getElementById('lot-manual-total');
  if(el)el.value='1';
  const note=document.getElementById('lot-total-buy-note');
  if(note)note.textContent='✏️ Nilai manual';
}
async function saveAddLot(){
  if(!addLotTarget)return;
  const {name,type,editId}=addLotTarget;
  const buyPrice=parseFloat(document.getElementById('lot-buy-price')?.value)||0;
  const qty=parseFloat(document.getElementById('lot-qty')?.value)||0;
  const totalBuy=parseFloat(document.getElementById('lot-total-buy')?.value)||(buyPrice*qty);
  const date=document.getElementById('lot-dt')?.value||td();
  const note=(document.getElementById('lot-note')?.value||'').trim();
  if(qty<=0){showToast('⚠️ Isi jumlah/qty dulu');return;}
  try{
    if(editId){
      await sbU('investments',editId,{buy_price:buyPrice,qty,total_buy:totalBuy,date,note});
      const idx=DB.inv.findIndex(x=>x.id===editId);
      if(idx>-1)Object.assign(DB.inv[idx],{buy_price:buyPrice,qty,total_buy:totalBuy,date,note});
      showToast('✅ Transaksi diupdate');
    } else {
      const nowIso=new Date().toISOString();
      const res=await sbI('investments',{
        name,type,buy_price:buyPrice,qty,total_buy:totalBuy,current_price:buyPrice,
        unrealized_gain:0,amount:totalBuy,gain:0,date,updated_at:nowIso,note
      });
      const rec=Array.isArray(res)?res[0]:res;
      if(rec)DB.inv.push(rec);
      showToast('✅ Investasi ditambahkan ke '+name);
    }
    closeAddLotModal();
    doSnap().catch(()=>{});updateAll();reRender();
    if(document.getElementById('inv-detail-mo')?.classList.contains('open'))openInvDetail(name);
  }catch(e){ showToast('❌ '+e.message); }
}

// ══════════════════════════════════════════════════════════════
// JUAL INVESTASI
// ══════════════════════════════════════════════════════════════
let sellTarget=null;
function openSellModal(name){
  const group=getInvGroups().find(g=>g.name===name);
  if(!group){showToast('❌ Data tidak ditemukan');return;}
  if(group.totalQty<=0){showToast('⚠️ Sisa qty investasi ini 0, gak ada yang bisa dijual');return;}
  sellTarget={name:group.name,availableQty:group.totalQty};
  document.getElementById('sell-mo-title').textContent='💰 Jual: '+group.name;
  document.getElementById('sell-mo-body').innerHTML=buildSellForm(group);
  document.getElementById('inv-sell-mo').classList.add('open');
}
function closeSellModal(){
  document.getElementById('inv-sell-mo').classList.remove('open');
  sellTarget=null;
}
function buildSellForm(group){
  return`
<div class="fg"><label>Nama Investasi</label><input value="${esc(group.name)}" disabled style="opacity:.7"></div>
<div class="fg" style="font-size:11px;color:var(--mu);margin-top:-6px">Sisa dipegang saat ini: <b style="color:var(--txt)">${group.totalQty}</b> unit</div>
<div class="fr">
  <div class="fg"><label>Jumlah Dijual (Qty)</label><input id="sell-qty" type="number" min="0" max="${group.totalQty}" step="any" value="0" oninput="syncSellTotal()"></div>
  <div class="fg"><label>Harga Jual per Unit (Rp)</label><input id="sell-price" type="number" min="0" value="${group.curPrice||0}" oninput="syncSellTotal()"></div>
</div>
<div class="fg">
  <label>Total Harga Dijual (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="sell-total" type="number" min="0" value="0" style="font-weight:700;color:var(--ok)" oninput="markSellManualTotal()">
  <div id="sell-total-note" style="font-size:10px;color:var(--mu);margin-top:2px">Dihitung otomatis dari Harga × Qty</div>
</div>
<div class="fg"><label>Tanggal Jual</label><input id="sell-dt" type="date" value="${td()}"></div>
<div class="fg"><label>Uang Hasil Jual Masuk Ke</label>${buildMethodSelect('','sell-fund-to')}</div>
<div class="fg"><label>Note (opsional)</label><input id="sell-note" value="" placeholder="Catatan tambahan..."></div>
<input type="hidden" id="sell-manual-total" value="0">`;
}
function syncSellTotal(){
  if(document.getElementById('sell-manual-total')?.value==='1')return;
  const p=parseFloat(document.getElementById('sell-price')?.value)||0;
  const q=parseFloat(document.getElementById('sell-qty')?.value)||0;
  const el=document.getElementById('sell-total');
  if(el)el.value=(p*q).toFixed(0);
}
function markSellManualTotal(){
  const el=document.getElementById('sell-manual-total');
  if(el)el.value='1';
  const note=document.getElementById('sell-total-note');
  if(note)note.textContent='✏️ Nilai manual';
}
async function saveSell(){
  if(!sellTarget)return;
  const {name,availableQty}=sellTarget;
  const qty=parseFloat(document.getElementById('sell-qty')?.value)||0;
  const sellPrice=parseFloat(document.getElementById('sell-price')?.value)||0;
  const totalSell=parseFloat(document.getElementById('sell-total')?.value)||(sellPrice*qty);
  const date=document.getElementById('sell-dt')?.value||td();
  const note=(document.getElementById('sell-note')?.value||'').trim();
  const fundTo=document.getElementById('sell-fund-to')?.value||'';
  if(qty<=0){showToast('⚠️ Isi jumlah yang dijual');return;}
  if(qty>availableQty){showToast('⚠️ Jumlah dijual melebihi sisa yang dipegang ('+availableQty+' unit)');return;}
  try{
    const res=await sbI('investment_sales',{name,qty,sell_price:sellPrice,total_sell:totalSell,date,note,fund_to:fundTo||null});
    const rec=Array.isArray(res)?res[0]:res;
    if(rec)INV_SALES.push(rec);
    if(fundTo){
      await applyAssetDelta(fundTo,totalSell);
      DB.ca=await sbG('current_assets');
    }
    closeSellModal();
    doSnap().catch(()=>{});updateAll();reRender();
    showToast('✅ Penjualan '+name+' dicatat'+(fundTo?' & saldo '+fundTo+' bertambah '+fRp(totalSell):''));
    if(document.getElementById('inv-detail-mo')?.classList.contains('open')){
      detailActiveTab='sell';detailTargetName=name;
      const group=getInvGroups().find(g=>g.name===name);
      if(group)renderDetailTabs(group);
    }
  }catch(e){ showToast('❌ '+e.message); }
}
function delInvSale(id){
  document.getElementById('cfm-tt').textContent='Hapus Riwayat Penjualan Ini?';
  document.getElementById('cfm-mg').textContent='Satu transaksi penjualan akan dihapus permanen dari riwayat. Kalau hasil jualnya udah masuk ke Current Asset, saldo itu otomatis dikurangi lagi.';
  cfmCb=async()=>{
    try{
      const sale=INV_SALES.find(x=>x.id===id);
      await sbD('investment_sales',id);
      INV_SALES=INV_SALES.filter(x=>x.id!==id);
      if(sale&&sale.fund_to){
        await applyAssetDelta(sale.fund_to,-(+(sale.total_sell||0)));
        DB.ca=await sbG('current_assets');
      }
      showToast('🗑️ Riwayat penjualan dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(document.getElementById('inv-detail-mo')?.classList.contains('open')){
        const group=getInvGroups().find(g=>g.name===detailTargetName);
        if(group)renderDetailTabs(group);
      }
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}

// ══════════════════════════════════════════════════════════════
// DETAIL — 2 tab: Riwayat Pembelian & Riwayat Penjualan
// ══════════════════════════════════════════════════════════════
function openInvDetail(name,tab){
  const group=getInvGroups().find(g=>g.name===name);
  if(!group){showToast('❌ Data tidak ditemukan');return;}
  detailActiveTab=tab||'buy';
  detailTargetName=name;
  invDetailPageState={buy:{size:10,page:1},sell:{size:10,page:1}};
  document.getElementById('detail-mo-title').textContent='📜 Riwayat: '+group.name;
  renderDetailTabs(group);
  document.getElementById('inv-detail-mo').classList.add('open');
}
function switchDetailTab(tab){
  detailActiveTab=tab;
  const group=getInvGroups().find(g=>g.name===detailTargetName);
  if(group)renderDetailTabs(group);
}
let invDetailPageState={buy:{size:10,page:1},sell:{size:10,page:1}};
function renderInvDetailPager(tab,totalItems){
  const pager=document.getElementById('inv-detail-pager');
  if(!pager)return;
  const ps=invDetailPageState[tab];
  if(totalItems===0){pager.innerHTML='';return;}
  const size=ps.size==='all'?totalItems||1:ps.size;
  const totalPages=Math.max(1,Math.ceil(totalItems/size));
  const sizes=[10,50,'all'];
  pager.innerHTML=`
    <div class="pager-info">Menampilkan ${ps.size==='all'?totalItems:Math.min(ps.size,totalItems-(ps.page-1)*ps.size)} dari ${totalItems} data</div>
    <div class="pager-controls">
      <select class="pager-size" onchange="changeInvDetailPageSize('${tab}',this.value)">
        ${sizes.map(s=>`<option value="${s}" ${ps.size==s?'selected':''}>${s==='all'?'Semua':s+' baris'}</option>`).join('')}
      </select>
      ${ps.size!=='all'?`
      <button class="pager-btn" onclick="changeInvDetailPage('${tab}',${ps.page-1})" ${ps.page<=1?'disabled':''}>‹</button>
      <span class="pager-num">${ps.page} / ${totalPages}</span>
      <button class="pager-btn" onclick="changeInvDetailPage('${tab}',${ps.page+1})" ${ps.page>=totalPages?'disabled':''}>›</button>`:''}
    </div>`;
}
function changeInvDetailPageSize(tab,val){
  invDetailPageState[tab].size=val==='all'?'all':parseInt(val);
  invDetailPageState[tab].page=1;
  const group=getInvGroups().find(g=>g.name===detailTargetName);
  if(group)renderDetailTabs(group);
}
function changeInvDetailPage(tab,page){
  invDetailPageState[tab].page=Math.max(1,page);
  const group=getInvGroups().find(g=>g.name===detailTargetName);
  if(group)renderDetailTabs(group);
}
function renderDetailTabs(group){
  const isBuy=detailActiveTab==='buy';
  const tabBtn=(label,tab,active)=>`<button class="btn-sm" style="${active?'background:var(--pr);color:#fff':'background:var(--bg);color:var(--txt);border:1px solid var(--bd)'}" onclick="switchDetailTab('${tab}')">${label}</button>`;
  const tabsHtml=`<div style="display:flex;gap:6px;margin-bottom:12px">${tabBtn('Riwayat Pembelian','buy',isBuy)}${tabBtn('Riwayat Penjualan','sell',!isBuy)}</div>`;
  const body=document.getElementById('detail-mo-body');
  const th=(t)=>`<th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">${t}</th>`;

  if(isBuy){
    const ps=invDetailPageState.buy;
    const allLots=group.lots;
    const totalItems=allLots.length;
    const size=ps.size==='all'?totalItems||1:ps.size;
    const totalPages=Math.max(1,Math.ceil(totalItems/size));
    if(ps.page>totalPages)ps.page=totalPages||1;
    const start=(ps.page-1)*size;
    const pageLots=ps.size==='all'?allLots:allLots.slice(start,start+size);
    const rows=pageLots.map(l=>`
      <tr>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${l.date||'—'}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${fRp(l.buy_price||0)}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${l.qty||0}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)"><b>${fRp(l.total_buy||l.amount||0)}</b></td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${l.note?esc(l.note):'—'}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd);white-space:nowrap"><button class="btn-sm be" onclick="openEditLot('${l.id}')">Edit</button> <button class="btn-sm bd" onclick="delInvLot('${l.id}')">Hapus</button></td>
      </tr>`).join('');
    body.innerHTML=tabsHtml+`
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <thead><tr style="background:var(--bg)">${th('Tanggal Beli')}${th('Harga Beli/Unit')}${th('Qty')}${th('Total Beli')}${th('Note')}${th('Aksi')}</tr></thead>
        <tbody>${rows||`<tr><td colspan="6" style="padding:14px;text-align:center;color:var(--mu)">Belum ada transaksi pembelian</td></tr>`}</tbody>
      </table>
      </div>
      <div id="inv-detail-pager" class="tbl-pager"></div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
        <span>Total ${group.lots.length} transaksi beli</span>
        <span><b>Total Dibeli: ${group.totalBoughtQty}</b> · <b>Sisa Sekarang: ${group.totalQty}</b></span>
      </div>`;
    renderInvDetailPager('buy',totalItems);
  } else {
    const ps=invDetailPageState.sell;
    const allSales=group.sales||[];
    const totalItems=allSales.length;
    const size=ps.size==='all'?totalItems||1:ps.size;
    const totalPages=Math.max(1,Math.ceil(totalItems/size));
    if(ps.page>totalPages)ps.page=totalPages||1;
    const start=(ps.page-1)*size;
    const pageSales=ps.size==='all'?allSales:allSales.slice(start,start+size);
    const rows=pageSales.map(s=>`
      <tr>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${s.date||'—'}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${fRp(s.sell_price||0)}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${s.qty||0}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)"><b style="color:var(--ok)">${fRp(s.total_sell||0)}</b></td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${s.fund_to?esc(s.fund_to):'—'}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)">${s.note?esc(s.note):'—'}</td>
        <td style="padding:6px 8px;border-top:1px solid var(--bd)"><button class="btn-sm bd" onclick="delInvSale('${s.id}')">Hapus</button></td>
      </tr>`).join('');
    body.innerHTML=tabsHtml+`
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <thead><tr style="background:var(--bg)">${th('Tanggal Jual')}${th('Harga Jual/Unit')}${th('Qty')}${th('Total Dijual')}${th('Uang Masuk Ke')}${th('Note')}${th('Aksi')}</tr></thead>
        <tbody>${rows||`<tr><td colspan="7" style="padding:14px;text-align:center;color:var(--mu)">Belum ada transaksi penjualan</td></tr>`}</tbody>
      </table>
      </div>
      <div id="inv-detail-pager" class="tbl-pager"></div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
        <span>Total ${(group.sales||[]).length} transaksi jual</span>
        <span><b>Total Terjual: ${group.soldQty}</b> unit · <b style="color:var(--ok)">Hasil Jual: ${fRp(group.totalSellRevenue||0)}</b></span>
      </div>`;
    renderInvDetailPager('sell',totalItems);
  }
}
function closeInvDetailModal(){
  document.getElementById('inv-detail-mo').classList.remove('open');
}
function delInvLot(id){
  document.getElementById('cfm-tt').textContent='Hapus Transaksi Ini?';
  document.getElementById('cfm-mg').textContent='Satu transaksi pembelian akan dihapus permanen dari riwayat.';
  cfmCb=async()=>{
    try{
      await sbD('investments',id);
      DB.inv=DB.inv.filter(x=>x.id!==id);
      showToast('🗑️ Transaksi dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
      if(document.getElementById('inv-detail-mo')?.classList.contains('open')){
        const group=getInvGroups().find(g=>g.name===detailTargetName);
        if(group)renderDetailTabs(group);else closeInvDetailModal();
      }
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
function delInvGroup(name){
  document.getElementById('cfm-tt').textContent='Hapus Investasi Ini?';
  document.getElementById('cfm-mg').textContent=`Semua transaksi pembelian & penjualan "${name}" akan dihapus permanen.`;
  cfmCb=async()=>{
    try{
      const buyIds=DB.inv.filter(x=>x.name===name).map(x=>x.id);
      const sales=INV_SALES.filter(x=>x.name===name);
      await Promise.all([...buyIds.map(id=>sbD('investments',id)),...sales.map(s=>sbD('investment_sales',s.id))]);
      for(const s of sales){
        if(s.fund_to)await applyAssetDelta(s.fund_to,-(+(s.total_sell||0)));
      }
      if(sales.some(s=>s.fund_to))DB.ca=await sbG('current_assets');
      DB.inv=DB.inv.filter(x=>x.name!==name);
      INV_SALES=INV_SALES.filter(x=>x.name!==name);
      showToast('🗑️ '+name+' dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
