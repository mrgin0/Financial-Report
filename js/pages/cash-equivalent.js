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
        <td><button class="btn-sm be" onclick="openE('ii','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('ii','${r.id}','${escQ(r.name)}')">Hapus</button></td>
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
function buildARFormEdit(r){
  const paid=+(r.paid||0);
  const total=+(r.amount||0);
  const sisa=Math.max(0,total-paid);
  const caNames=DB.ca.map(x=>x.name);
  const logs=getPayHistFor(r.id);
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
        <td style="padding:5px 8px;text-align:right;color:var(--ok);font-weight:700">${fRp(l.amount)}</td>
        <td style="padding:5px 8px;text-align:right">${fRp(l.paid_total)}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--er)">${fRp(l.sisa)}</td>
        <td style="padding:5px 8px">${l.via||'—'}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>
</div>`:'';

  return`
<div class="fg"><label>Nama Penghutang</label><input id="f-nm" value="${r.name||''}"></div>
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
  <div class="fg"><label>Via Pembayaran</label>
    <select id="f-via">
      <option value="">— Tidak ada —</option>
      ${caNames.map(n=>`<option value="${n}">${n}</option>`).join('')}
    </select>
  </div>
  <div id="paid-preview" style="font-size:10.5px;color:var(--mu);margin-top:4px;padding:5px 8px;background:var(--card);border-radius:6px;min-height:24px"></div>
  <input type="hidden" id="f-paid-total" value="${paid}">
  ${historyHTML}
</div>
<div class="fg" style="margin-top:9px"><label>Note (opsional)</label><input id="f-note" value="${esc(r.note||'')}" placeholder="Catatan tambahan..."></div>`;
}
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
function showPayHistory(arId){
  const r=DB.ar.find(x=>x.id===arId);
  if(!r)return;
  const logs=getPayHistFor(arId);
  const total=+(r.amount||0);
  const rows=logs.map((l,i)=>`<tr style="border-bottom:1px solid var(--bd)">
    <td style="padding:8px 10px">${i+1}</td>
    <td style="padding:8px 10px;font-weight:700">${fRp(total)}</td>
    <td style="padding:8px 10px;color:var(--ok);font-weight:700">${fRp(l.amount)}</td>
    <td style="padding:8px 10px">${l.paid_date||'—'}</td>
    <td style="padding:8px 10px;color:var(--er);font-weight:700">${fRp(l.sisa)}</td>
    <td style="padding:8px 10px">${l.via||'—'}</td>
  </tr>`).join('');

  document.getElementById('phist-title').textContent=r.name;
  document.getElementById('phist-meta').innerHTML=`<span class="badge bb">Hutang Awal: ${fRp(total)}</span> &nbsp; <span class="badge bk">Tgl Hutang: ${r.date||'—'}</span> &nbsp; <span class="badge ${+(r.paid||0)>0?'by':'bb'}">Terbayar: ${fRp(r.paid||0)}</span> &nbsp; <span class="badge br">Sisa: ${fRp(Math.max(0,total-(+(r.paid||0))))}</span>`;
  document.getElementById('phist-body').innerHTML=rows||`<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--mu);font-style:italic">Belum ada riwayat pembayaran</td></tr>`;
  document.getElementById('phist-mo').classList.add('open');
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
