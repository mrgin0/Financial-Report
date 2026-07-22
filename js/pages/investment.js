// Halaman Investment — 1 baris per NAMA investasi (gabungan semua transaksi/lot pembelian)

// ══════════════════════════════════════════════════════════════
// GROUPING — gabungin semua lot (transaksi beli) jadi 1 ringkasan per nama
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
  return Object.values(byName).map(g=>{
    const curPrice=+(g.latestLot.current_price||g.latestLot.buy_price||0);
    const avgBuyPrice=g.totalQty>0?g.totalBuy/g.totalQty:0;
    const nilaiSkrg=curPrice*g.totalQty;
    const unrealized=nilaiSkrg-g.totalBuy;
    const pct=g.totalBuy>0?((unrealized/g.totalBuy)*100):0;
    return{
      name:g.name,type:g.type,
      lots:g.lots.sort((a,b)=>(a.date||'').localeCompare(b.date||'')),
      totalQty:g.totalQty,totalBuy:g.totalBuy,avgBuyPrice,curPrice,nilaiSkrg,unrealized,pct,
      latestLot:g.latestLot,latestId:g.latestLot.id,
      updatedAt:g.latestLot.updated_at,note:g.latestLot.note||''
    };
  });
}

function rINV(){
  let groups=getInvGroups();
  groups=sortArr(groups,'t-inv');
  mkTbl('t-inv',
    ['#','Nama Investasi','Tipe','Nilai Beli','Rata-rata Harga Beli','Tgl Update','Unrealized Gain/Loss','Gain/Loss %','Note','Aksi'],
    groups.map((g,i)=>{
      const isUp=g.unrealized>=0;
      const updAt=g.updatedAt?new Date(g.updatedAt).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';
      return`<tr>
        <td>${i+1}</td><td><b>${esc(g.name)}</b></td>
        <td><span class="badge bp">${esc(g.type)}</span></td>
        <td>${fRp(g.totalBuy)}</td>
        <td style="font-variant-numeric:tabular-nums">${fRp(g.avgBuyPrice)}</td>
        <td>${updAt}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'↑ +':'↓ -'}${fRp(Math.abs(g.unrealized))}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'+':''}${g.pct.toFixed(2)}%</td>
        ${noteCell(g.note)}
        <td style="white-space:nowrap">
          <button class="btn-sm" style="background:#dbeafe;color:#2563eb" onclick="openAddLot('${escQ(g.name)}')">+ Tambah</button>
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
// EDIT INVESTASI (per nama/grup) — cuma ubah Tipe, Harga Sekarang, Tanggal Update, Note.
// Rata-rata Beli per Unit ditampilin READ-ONLY (dihitung dari semua lot), Tanggal Beli
// dihapus dari sini karena tiap lot punya tanggalnya masing-masing (lihat Detail).
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
<div class="fg"><label>Nama Investasi</label><input value="${esc(r.name||'')}" disabled style="opacity:.7"></div>
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
</div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${esc(r.note||'')}" placeholder="Catatan tambahan..."></div>`;
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
// TAMBAH INVESTASI (lot baru buat investasi yang UDAH ADA) — tombol "+ Tambah" per baris
// ══════════════════════════════════════════════════════════════
let addLotTarget=null;
function openAddLot(name){
  const group=getInvGroups().find(g=>g.name===name);
  if(!group){showToast('❌ Data tidak ditemukan');return;}
  addLotTarget={name:group.name,type:group.type};
  document.getElementById('lot-mo-title').textContent='+ Tambah Investasi: '+group.name;
  document.getElementById('lot-mo-body').innerHTML=buildAddLotForm(group.name,group.type);
  document.getElementById('inv-lot-mo').classList.add('open');
}
function closeAddLotModal(){
  document.getElementById('inv-lot-mo').classList.remove('open');
  addLotTarget=null;
}
function buildAddLotForm(name,type){
  return`
<div class="fg"><label>Nama Investasi</label><input value="${esc(name)}" disabled style="opacity:.7"></div>
<div class="fg"><label>Tipe</label><input value="${esc(type)}" disabled style="opacity:.7"></div>
<div class="fr">
  <div class="fg"><label>Harga Beli per Unit (Rp)</label><input id="lot-buy-price" type="number" min="0" value="0" oninput="syncLotTotalBuy()"></div>
  <div class="fg"><label>Jumlah / Qty</label><input id="lot-qty" type="number" min="0" step="any" value="0" oninput="syncLotTotalBuy()"></div>
</div>
<div class="fg">
  <label>Total Beli (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="lot-total-buy" type="number" min="0" value="0" style="font-weight:700;color:var(--pr)" oninput="markLotManualTotal()">
  <div id="lot-total-buy-note" style="font-size:10px;color:var(--mu);margin-top:2px">Dihitung otomatis dari Harga × Qty</div>
</div>
<div class="fg"><label>Tanggal Beli</label><input id="lot-dt" type="date" value="${td()}"></div>
<div class="fg"><label>Note (opsional)</label><input id="lot-note" value="" placeholder="Catatan tambahan..."></div>
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
  const {name,type}=addLotTarget;
  const buyPrice=parseFloat(document.getElementById('lot-buy-price')?.value)||0;
  const qty=parseFloat(document.getElementById('lot-qty')?.value)||0;
  const totalBuy=parseFloat(document.getElementById('lot-total-buy')?.value)||(buyPrice*qty);
  const date=document.getElementById('lot-dt')?.value||td();
  const note=(document.getElementById('lot-note')?.value||'').trim();
  if(qty<=0){showToast('⚠️ Isi jumlah/qty dulu');return;}
  try{
    const nowIso=new Date().toISOString();
    const res=await sbI('investments',{
      name,type,buy_price:buyPrice,qty,total_buy:totalBuy,current_price:buyPrice,
      unrealized_gain:0,amount:totalBuy,gain:0,date,updated_at:nowIso,note
    });
    const rec=Array.isArray(res)?res[0]:res;
    if(rec)DB.inv.push(rec);
    closeAddLotModal();
    doSnap().catch(()=>{});updateAll();reRender();
    showToast('✅ Investasi ditambahkan ke '+name);
  }catch(e){ showToast('❌ '+e.message); }
}

// ══════════════════════════════════════════════════════════════
// DETAIL — riwayat semua transaksi pembelian buat 1 nama investasi
// ══════════════════════════════════════════════════════════════
function openInvDetail(name){
  const group=getInvGroups().find(g=>g.name===name);
  if(!group){showToast('❌ Data tidak ditemukan');return;}
  document.getElementById('detail-mo-title').textContent='📜 Riwayat Pembelian: '+group.name;
  const rows=group.lots.map(l=>`
    <tr>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${l.date||'—'}</td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${fRp(l.buy_price||0)}</td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${l.qty||0}</td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)"><b>${fRp(l.total_buy||l.amount||0)}</b></td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)">${l.note?esc(l.note):'—'}</td>
      <td style="padding:6px 8px;border-top:1px solid var(--bd)"><button class="btn-sm bd" onclick="delInvLot('${l.id}')">Hapus</button></td>
    </tr>`).join('');
  document.getElementById('detail-mo-body').innerHTML=`
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11.5px">
      <thead><tr style="background:var(--bg)">
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Tanggal Beli</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Harga Beli/Unit</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Qty</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Total Beli</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Note</th>
        <th style="padding:6px 8px;text-align:left;font-size:9.5px;text-transform:uppercase;color:var(--mu)">Aksi</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
      <span>Total ${group.lots.length} transaksi</span>
      <span><b>Total Qty: ${group.totalQty}</b> · <b>Total Beli: ${fRp(group.totalBuy)}</b></span>
    </div>`;
  document.getElementById('inv-detail-mo').classList.add('open');
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
      closeInvDetailModal();
      doSnap().catch(()=>{});updateAll();reRender();
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
function delInvGroup(name){
  document.getElementById('cfm-tt').textContent='Hapus Investasi Ini?';
  document.getElementById('cfm-mg').textContent=`Semua transaksi pembelian "${name}" (semua lot) akan dihapus permanen.`;
  cfmCb=async()=>{
    try{
      const ids=DB.inv.filter(x=>x.name===name).map(x=>x.id);
      await Promise.all(ids.map(id=>sbD('investments',id)));
      DB.inv=DB.inv.filter(x=>x.name!==name);
      showToast('🗑️ '+name+' dihapus');
      doSnap().catch(()=>{});updateAll();reRender();
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}
