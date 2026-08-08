// Halaman Non Current Asset (PPE + Intangible)

function rPPE(){
  const data=sortArr(DB.ppe,'t-ppe');
  mkTbl('t-ppe',['#','Nama Aset','Qty','Harga Beli','Harga Sekarang','Tgl Beli','Tgl Update Depresiasi','Pertumbuhan (Rp)','Pertumbuhan (%)','Note','Aksi'],
    data.map((r,i)=>{
      const bp=+(r.buy_price||r.amount||0);
      const sp=+(r.current_price||bp);
      const qty=+(r.qty||1);
      const tumbuhRp=(sp-bp)*qty;
      const tumbuhPct=bp>0?((sp-bp)/bp*100).toFixed(2):0;
      const isUp=tumbuhRp>=0;
      return`<tr>
        <td>${i+1}</td><td>${r.name}</td><td>${qty}</td>
        <td>${fRp(bp)}</td>
        <td style="color:${sp<=bp?'var(--mu)':'var(--ok)'}"><b>${fRp(sp)}</b></td>
        <td>${r.date}</td><td>${r.depreciation_date||'—'}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'↑ +':'↓ -'}${fRp(Math.abs(tumbuhRp))}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'+':''}${tumbuhPct}%</td>
        ${noteCell(r.note)}
        <td style="white-space:nowrap">
          <button class="btn-sm" style="background:#dcfce7;color:#15803d" onclick="openSellPPE('${r.id}')" ${qty<=0?'disabled':''}>💰 Jual</button>
          <button class="btn-sm be" onclick="openE('ppe','${r.id}')">Edit</button>
          <button class="btn-sm bd" onclick="delR('ppe','${r.id}','${escQ(r.name)}')">Hapus</button>
        </td>
      </tr>`;
    }));
}
function rINTG(){
  const data=sortArr(DB.intg,'t-intg');
  mkTbl('t-intg',['#','Nama Aset','Nilai','Tanggal','Note','Aksi'],
    data.map((r,i)=>`<tr>
      <td>${i+1}</td><td>${r.name}</td>
      <td><b>${fRp(r.amount)}</b></td><td>${r.date}</td>
      ${noteCell(r.note)}
      <td style="white-space:nowrap">
        <button class="btn-sm" style="background:#dcfce7;color:#15803d" onclick="openSellIntg('${r.id}')">💰 Jual</button>
        <button class="btn-sm be" onclick="openE('intg','${r.id}')">Edit</button>
        <button class="btn-sm bd" onclick="delR('intg','${r.id}','${escQ(r.name)}')">Hapus</button>
      </td>
    </tr>`));
}
function buildPPEForm(r,isEdit){
  const buyPrice  = r ? (+(r.buy_price||r.amount||0)) : 0;
  const curPrice  = r ? (+(r.current_price||buyPrice)) : 0;
  const qty       = r ? (+(r.qty||1))                 : 1;
  return`
<div class="fg"><label>Nama Aset</label><input id="f-nm" value="${r?esc(r.name):''}"></div>
<div class="fr">
  <div class="fg"><label>Qty / Jumlah Unit</label><input id="f-qty" type="number" min="0" value="${qty}"></div>
  <div class="fg"><label>Harga Beli per Unit (Rp)</label><input id="f-buy-price" type="number" min="0" value="${buyPrice}" oninput="syncPPEAmount()"></div>
</div>
<div class="fg"><label>Tanggal Beli</label><input id="f-dt" type="date" value="${r?r.date:td()}"></div>
${isEdit?`
<div class="fg"><label>Harga Sekarang per Unit (Rp)</label><input id="f-cur-price" type="number" min="0" value="${curPrice}"></div>
<div class="fg"><label>Tanggal Update Depresiasi</label><input id="f-dep-dt" type="date" value="${r&&r.depreciation_date?r.depreciation_date:''}"></div>`:''}
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${r?esc(r.note||''):''}" placeholder="Catatan tambahan..."></div>`;
}
function syncPPEAmount(){
  const p=parseFloat(document.getElementById('f-buy-price')?.value)||0;
  const q=parseFloat(document.getElementById('f-qty')?.value)||1;
  const el=document.getElementById('f-amt-ppe');
  if(el)el.value=(p*q).toFixed(0);
}

// ══════════════════════════════════════════════════════════════
// POIN 1: Jual PPE — mirip Inventory (ada qty, bisa jual sebagian)
// ══════════════════════════════════════════════════════════════
let sellPPETarget=null;
function openSellPPE(id){
  const item=DB.ppe.find(x=>x.id===id);
  if(!item){showToast('❌ Data tidak ditemukan');return;}
  const qty=+(item.qty||1);
  if(qty<=0){showToast('⚠️ Qty aset ini 0, gak ada yang bisa dijual');return;}
  sellPPETarget={id,name:item.name,availableQty:qty,curPrice:+(item.current_price||item.buy_price||0)};
  document.getElementById('ppe-sell-title').textContent='💰 Jual: '+item.name;
  document.getElementById('ppe-sell-body').innerHTML=buildSellPPEForm(sellPPETarget);
  document.getElementById('ppe-sell-mo').classList.add('open');
}
function closeSellPPEModal(){document.getElementById('ppe-sell-mo').classList.remove('open');sellPPETarget=null;}
function buildSellPPEForm(t){
  return`
<div class="fg"><label>Nama Aset</label><input value="${esc(t.name)}" disabled style="opacity:.7"></div>
<div class="fg" style="font-size:11px;color:var(--mu);margin-top:-6px">Sisa qty: <b style="color:var(--txt)">${t.availableQty}</b></div>
<div class="fr">
  <div class="fg"><label>Jumlah Dijual</label><input id="ppe-sell-qty" type="number" min="0" max="${t.availableQty}" step="any" value="0" oninput="syncPPESellTotal()"></div>
  <div class="fg"><label>Harga Jual per Unit (Rp)</label><input id="ppe-sell-price" type="number" min="0" value="${t.curPrice}" oninput="syncPPESellTotal()"></div>
</div>
<div class="fg">
  <label>Total Harga Dijual (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="ppe-sell-total" type="number" min="0" value="0" style="font-weight:700;color:var(--ok)" oninput="markPPESellManualTotal()">
  <div id="ppe-sell-total-note" style="font-size:10px;color:var(--mu);margin-top:2px">Dihitung otomatis dari Harga × Qty</div>
</div>
<div class="fg"><label>Tanggal Jual</label><input id="ppe-sell-dt" type="date" value="${td()}"></div>
<div class="fg"><label>Uang Hasil Jual Masuk Ke</label>${buildMethodSelect('','ppe-sell-fund-to')}</div>
<div class="fg"><label>Note (opsional)</label><input id="ppe-sell-note" value="" placeholder="Catatan tambahan..."></div>
<input type="hidden" id="ppe-sell-manual-total" value="0">`;
}
function syncPPESellTotal(){
  if(document.getElementById('ppe-sell-manual-total')?.value==='1')return;
  const p=parseFloat(document.getElementById('ppe-sell-price')?.value)||0;
  const q=parseFloat(document.getElementById('ppe-sell-qty')?.value)||0;
  const el=document.getElementById('ppe-sell-total');
  if(el)el.value=(p*q).toFixed(0);
}
function markPPESellManualTotal(){
  const el=document.getElementById('ppe-sell-manual-total');if(el)el.value='1';
  const note=document.getElementById('ppe-sell-total-note');if(note)note.textContent='✏️ Nilai manual';
}
async function saveSellPPE(){
  if(!sellPPETarget)return;
  const {id,name,availableQty}=sellPPETarget;
  const qty=parseFloat(document.getElementById('ppe-sell-qty')?.value)||0;
  const sellPrice=parseFloat(document.getElementById('ppe-sell-price')?.value)||0;
  const totalSell=parseFloat(document.getElementById('ppe-sell-total')?.value)||(sellPrice*qty);
  const date=document.getElementById('ppe-sell-dt')?.value||td();
  const note=(document.getElementById('ppe-sell-note')?.value||'').trim();
  const fundTo=document.getElementById('ppe-sell-fund-to')?.value||'';
  if(qty<=0){showToast('⚠️ Isi jumlah yang dijual');return;}
  if(qty>availableQty){showToast('⚠️ Jumlah dijual melebihi sisa qty ('+availableQty+')');return;}
  try{
    await sbI('asset_sales',{source_type:'ppe',source_id:id,name,qty,sell_price:sellPrice,total_sell:totalSell,date,note,fund_to:fundTo||null});
    const item=DB.ppe.find(x=>x.id===id);
    const remainingQty=availableQty-qty;
    if(remainingQty<=0){
      await sbD('property_plant_equipment',id);
      DB.ppe=DB.ppe.filter(x=>x.id!==id);
    } else {
      const buyPrice=+(item.buy_price||item.amount||0);
      const newAmount=buyPrice*remainingQty;
      await sbU('property_plant_equipment',id,{qty:remainingQty,amount:newAmount});
      DB.ppe=await sbG('property_plant_equipment');
    }
    if(fundTo){await applyAssetDelta(fundTo,totalSell);DB.ca=await sbG('current_assets');}
    closeSellPPEModal();
    doSnap().catch(()=>{});updateAll();reRender();
    showToast('✅ Penjualan '+name+' dicatat'+(fundTo?' & saldo '+fundTo+' bertambah':''));
  }catch(e){ showToast('❌ '+e.message); }
}

// ══════════════════════════════════════════════════════════════
// POIN 1: Jual Intangible Asset — gak ada qty, jadi jual SEKALIGUS
// (baris langsung kehapus abis disimpan, bukan dikurangi sebagian).
// ══════════════════════════════════════════════════════════════
let sellIntgTarget=null;
function openSellIntg(id){
  const item=DB.intg.find(x=>x.id===id);
  if(!item){showToast('❌ Data tidak ditemukan');return;}
  sellIntgTarget={id,name:item.name,amount:+(item.amount||0)};
  document.getElementById('intg-sell-title').textContent='💰 Jual: '+item.name;
  document.getElementById('intg-sell-body').innerHTML=buildSellIntgForm(sellIntgTarget);
  document.getElementById('intg-sell-mo').classList.add('open');
}
function closeSellIntgModal(){document.getElementById('intg-sell-mo').classList.remove('open');sellIntgTarget=null;}
function buildSellIntgForm(t){
  return`
<div class="fg"><label>Nama Aset</label><input value="${esc(t.name)}" disabled style="opacity:.7"></div>
<div class="fg" style="font-size:11px;color:var(--mu);margin-top:-6px">Nilai buku saat ini: <b style="color:var(--txt)">${fRp(t.amount)}</b></div>
<div class="fg"><label>Harga Jual (Rp)</label><input id="intg-sell-total" type="number" min="0" value="${t.amount}"></div>
<div class="fg"><label>Tanggal Jual</label><input id="intg-sell-dt" type="date" value="${td()}"></div>
<div class="fg"><label>Uang Hasil Jual Masuk Ke</label>${buildMethodSelect('','intg-sell-fund-to')}</div>
<div class="fg"><label>Note (opsional)</label><input id="intg-sell-note" value="" placeholder="Catatan tambahan..."></div>
<div style="font-size:10px;color:var(--mu);margin-top:-4px">⚠️ Aset tak berwujud dijual sekaligus (bukan sebagian) — setelah disimpan, baris ini akan hilang dari tabel.</div>`;
}
async function saveSellIntg(){
  if(!sellIntgTarget)return;
  const {id,name}=sellIntgTarget;
  const totalSell=parseFloat(document.getElementById('intg-sell-total')?.value)||0;
  const date=document.getElementById('intg-sell-dt')?.value||td();
  const note=(document.getElementById('intg-sell-note')?.value||'').trim();
  const fundTo=document.getElementById('intg-sell-fund-to')?.value||'';
  if(totalSell<=0){showToast('⚠️ Isi harga jual');return;}
  try{
    await sbI('asset_sales',{source_type:'intg',source_id:id,name,qty:null,sell_price:null,total_sell:totalSell,date,note,fund_to:fundTo||null});
    await sbD('intangible_assets',id);
    DB.intg=DB.intg.filter(x=>x.id!==id);
    if(fundTo){await applyAssetDelta(fundTo,totalSell);DB.ca=await sbG('current_assets');}
    closeSellIntgModal();
    doSnap().catch(()=>{});updateAll();reRender();
    showToast('✅ Penjualan '+name+' dicatat'+(fundTo?' & saldo '+fundTo+' bertambah':''));
  }catch(e){ showToast('❌ '+e.message); }
}
