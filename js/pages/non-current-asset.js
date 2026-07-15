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
        <td><button class="btn-sm be" onclick="openE('ppe','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('ppe','${r.id}','${escQ(r.name)}')">Hapus</button></td>
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
      <td><button class="btn-sm be" onclick="openE('intg','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('intg','${r.id}','${escQ(r.name)}')">Hapus</button></td>
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
