// Halaman Investment

function rINV(){
  const data=sortArr(DB.inv,'t-inv');
  mkTbl('t-inv',
    ['#','Nama Investasi','Tipe','Nilai Beli','Tgl Beli','Harga Sekarang','Tgl Update','Unrealized Gain/Loss','Gain/Loss %','Note','Aksi'],
    data.map((r,i)=>{
      const totalBuy=+(r.total_buy||r.amount||0);
      const curPrice=+(r.current_price||0);
      const qty=+(r.qty||0);
      const nilaiSkrg=curPrice*qty;
      const unrealized=nilaiSkrg-totalBuy;
      const pct=totalBuy>0?((unrealized/totalBuy)*100).toFixed(2):0;
      const isUp=unrealized>=0;
      const updAt=r.updated_at?new Date(r.updated_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';
      return`<tr>
        <td>${i+1}</td><td><b>${r.name}</b></td>
        <td><span class="badge bp">${r.type}</span></td>
        <td>${fRp(totalBuy)}</td>
        <td>${r.date||'—'}</td>
        <td style="font-variant-numeric:tabular-nums">${curPrice>0?fRp(nilaiSkrg):'—'}</td>
        <td>${updAt}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'↑ +':'↓ -'}${fRp(Math.abs(unrealized))}</td>
        <td style="font-weight:700;color:${isUp?'#059669':'#dc2626'}">${isUp?'+':''}${pct}%</td>
        ${noteCell(r.note)}
        <td><button class="btn-sm be" onclick="openE('inv','${r.id}')">Edit</button><button class="btn-sm bd" onclick="delR('inv','${r.id}','${escQ(r.name)}')">Hapus</button></td>
      </tr>`;
    }));
}
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
  if(document.getElementById('f-manual-total')?.value==='1')return; // user edited manually
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
function buildInvFormEdit(r){
  // Safely extract all values from DB record — never default to 0 if field exists
  const buyPrice   = r.buy_price    != null ? +(r.buy_price)    : (r.amount && r.qty ? +(r.amount)/+(r.qty||1) : 0);
  const qty        = r.qty          != null ? +(r.qty)          : 0;
  const totalBuy   = r.total_buy    != null ? +(r.total_buy)    : (r.amount != null ? +(r.amount) : buyPrice*qty);
  const curPrice   = r.current_price!= null ? +(r.current_price): buyPrice;
  const nilaiSkrg  = curPrice * qty;
  const unrealized = nilaiSkrg - totalBuy;
  const pct        = totalBuy > 0 ? ((unrealized/totalBuy)*100).toFixed(2) : '0.00';
  const updDate    = r.updated_at   ? new Date(r.updated_at).toISOString().slice(0,10) : td();

  return`
<div class="fg"><label>Nama Investasi</label><input id="f-nm" value="${esc(r.name||'')}"></div>
<div class="fg"><label>Tipe</label>${buildInvTypeSelect(r.type||'')}</div>
<div class="fr">
  <div class="fg"><label>Harga Saat Beli per Unit (Rp)</label>
    <input id="f-buy-price" type="number" min="0" value="${buyPrice}" oninput="syncEditTotalBuy()">
  </div>
  <div class="fg"><label>Jumlah / Qty</label>
    <input id="f-qty" type="number" min="0" step="any" value="${qty}" oninput="syncEditTotalBuy()">
  </div>
</div>
<div class="fg">
  <label>Total Beli (Rp) <span style="font-size:9px;color:var(--mu);font-weight:400">— otomatis atau edit manual</span></label>
  <input id="f-total-buy" type="number" min="0" value="${totalBuy}" style="font-weight:700;color:var(--pr)" oninput="calcUnrealized();markManualTotalBuy()">
</div>
<div class="fg"><label>Tanggal Beli</label><input id="f-dt" type="date" value="${r.date||td()}"></div>
<div class="fg" style="margin-top:4px">
  <label>Harga Sekarang per Unit (Rp)</label>
  <input id="f-cur-price" type="number" min="0" value="${curPrice}" oninput="calcUnrealized()">
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
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${esc(r.note||'')}" placeholder="Catatan tambahan..."></div>
<input type="hidden" id="f-manual-total" value="0">`;
}
function syncEditTotalBuy(){
  if(document.getElementById('f-manual-total')?.value==='1')return;
  const p=parseFloat(document.getElementById('f-buy-price')?.value)||0;
  const q=parseFloat(document.getElementById('f-qty')?.value)||0;
  const el=document.getElementById('f-total-buy');
  if(el){el.value=(p*q).toFixed(0);calcUnrealized();}
}
function calcUnrealized(){
  const qty      = parseFloat(document.getElementById('f-qty')?.value)||0;
  const totalBuy = parseFloat(document.getElementById('f-total-buy')?.value)||0;
  const curPrice = parseFloat(document.getElementById('f-cur-price')?.value)||0;
  const unrealized = (curPrice*qty) - totalBuy;
  const pct = totalBuy>0?((unrealized/totalBuy)*100).toFixed(2):'0.00';
  const el=document.getElementById('f-unrealized');
  if(el){el.value=unrealized.toFixed(0);el.style.color=unrealized>=0?'var(--ok)':'var(--er)';}
  const txt=document.getElementById('gain-formula-txt');
  if(txt)txt.innerHTML=`Nilai Skrg ${fRp(curPrice*qty)} − Beli ${fRp(totalBuy)} = <b style="color:${unrealized>=0?'var(--ok)':'var(--er)'}">${unrealized>=0?'+':''}${fRp(unrealized)} (${unrealized>=0?'+':''}${pct}%)</b>`;
}
