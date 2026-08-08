// Engine CRUD generik: tabel sort/pagination, modal tambah/edit, kelola kategori

const TMAP={ca:'current_assets',ar:'accounts_receivable',ii:'inventory',ppe:'property_plant_equipment',intg:'intangible_assets',inv:'investments',inc:'income',exp:'expenses',debt:'debts'};
const DARR={ca:'ca',ar:'ar',ii:'ii',ppe:'ppe',intg:'intg',inv:'inv',inc:'inc',exp:'exp',debt:'debt'};
const MLBL_={ca:'Current Asset',ar:'Piutang',ii:'Inventory',ppe:'PPE',intg:'Intangible',inv:'Investasi',inc:'Pemasukan',exp:'Pengeluaran',debt:'Hutang'};
const INC_BASE=['Gaji & Bonus','Bisnis','Investasi','Freelance','Sewa','Lainnya'];
const EXP_BASE=['Makanan & Minuman','Transportasi','Kebutuhan Rumah','Hiburan','Kesehatan','Lainnya'];
function getIncSources(){
  const removed=JSON.parse(localStorage.getItem('incSourcesRemoved')||'[]');
  const extra=JSON.parse(localStorage.getItem('incSources')||'[]');
  return[...INC_BASE.filter(c=>!removed.includes(c)),...extra.filter(c=>!INC_BASE.includes(c)&&!removed.includes(c))];
}
function getExpCats(){
  const removed=JSON.parse(localStorage.getItem('expCatsRemoved')||'[]');
  const extra=JSON.parse(localStorage.getItem('expCats')||'[]');
  return[...EXP_BASE.filter(c=>!removed.includes(c)),...extra.filter(c=>!EXP_BASE.includes(c)&&!removed.includes(c))];
}
function addCatMgr(){
  const inp=document.getElementById('catmgr-input');const v=(inp.value||'').trim();if(!v)return;
  const key=catMgrType==='inc'?'incSources':'expCats';
  const removedKey=catMgrType==='inc'?'incSourcesRemoved':'expCatsRemoved';
  const base=catMgrType==='inc'?INC_BASE:EXP_BASE;
  if(base.includes(v)){
    const removed=JSON.parse(localStorage.getItem(removedKey)||'[]').filter(c=>c!==v);
    localStorage.setItem(removedKey,JSON.stringify(removed));
    inp.value='';renderCatMgrList();refreshTxFilterOptions();showToast('✅ Kategori dipulihkan');return;
  }
  const extra=JSON.parse(localStorage.getItem(key)||'[]');
  if(extra.includes(v)){showToast('⚠️ Kategori sudah ada');return;}
  extra.push(v);localStorage.setItem(key,JSON.stringify(extra));
  inp.value='';renderCatMgrList();refreshTxFilterOptions();showToast('✅ Kategori ditambahkan');
}
function delCatMgr(name){
  const key=catMgrType==='inc'?'incSources':'expCats';
  const removedKey=catMgrType==='inc'?'incSourcesRemoved':'expCatsRemoved';
  const base=catMgrType==='inc'?INC_BASE:EXP_BASE;
  if(base.includes(name)){
    const removed=JSON.parse(localStorage.getItem(removedKey)||'[]');
    if(!removed.includes(name)){removed.push(name);localStorage.setItem(removedKey,JSON.stringify(removed));}
  } else {
    const extra=JSON.parse(localStorage.getItem(key)||'[]').filter(c=>c!==name);
    localStorage.setItem(key,JSON.stringify(extra));
  }
  renderCatMgrList();refreshTxFilterOptions();showToast('🗑️ Kategori dihapus');
}
function renderCatMgrList(){
  const list=catMgrType==='inc'?getIncSources():getExpCats();
  const el=document.getElementById('catmgr-list');
  if(!list.length){el.innerHTML='<span style="color:var(--mu);font-size:11.5px">Semua kategori terhapus. Tambahkan minimal satu di atas.</span>';return;}
  el.innerHTML=list.map(c=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border:1px solid var(--bd);border-radius:8px;font-size:12px">
    <span>${c}</span>
    <button class="btn-sm bd" onclick="delCatMgr('${escQ(c)}')">Hapus</button>
  </div>`).join('');
}
function openCatMgr(type){
  catMgrType=type;
  document.getElementById('catmgr-title').textContent='⚙ Kelola '+(type==='inc'?'Sumber Pemasukan':'Kategori Pengeluaran');
  renderCatMgrList();
  document.getElementById('catmgr-mo').classList.add('open');
}
function closeCatMgr(){document.getElementById('catmgr-mo').classList.remove('open');refreshTxFilterOptions();renderIncPage();renderExpPage();}
function buildSelectOpts(list,cur){return list.map(c=>`<option value="${c}" ${cur===c?'selected':''}>${c}</option>`).join('');}
function buildMethodSelect(cur,idAttr){
  const names=DB.ca.map(x=>x.name);
  if(!names.length)return`<select id="${idAttr}"><option value="">— Tambah Current Asset dulu —</option></select>`;
  return`<select id="${idAttr}">${names.map(n=>`<option value="${n}" ${cur===n?'selected':''}>${n}</option>`).join('')}</select>`;
}
const noR=(c)=>`<tbody><tr><td class="empty-td" colspan="${c}">📭 Belum ada data</td></tr></tbody>`;
function getCategories(){
  const base=['Kas','Bank','Platform'];
  const custom=[...new Set(DB.ca.map(x=>x.category).filter(c=>c&&!base.includes(c)))];
  return[...base,...custom,'Lainnya'];
}
const SORT_STATE={};
const PAGE_STATE={};
const RENDER_MAP={'t-ca':()=>rCA(),'t-ar':()=>rAR(),'t-ii':()=>rII(),'t-ppe':()=>rPPE(),'t-intg':()=>rINTG(),'t-inv':()=>rINV()};
const STICKY_COL={ // tabel id -> index kolom yang di-freeze (0-based)
  't-ca':1, 't-ar':1, 't-ii':1, 't-ppe':1, 't-intg':1, 't-inv':1,
  't-debt':1, 't-exp':2, 't-inc':2,
};
function mkTbl(id,ths,rows){
  const el=document.getElementById(id);if(!el)return;
  if(!SORT_STATE[id])SORT_STATE[id]={col:-1,asc:true};
  if(!PAGE_STATE[id])PAGE_STATE[id]={size:10,page:1};
  const ss=SORT_STATE[id];
  const ps=PAGE_STATE[id];

  const thHtml=ths.map((h,i)=>{
    const isAksi=h==='Aksi';
    if(isAksi)return`<th>${h}</th>`;
    const dir=ss.col===i?(ss.asc?'↑':'↓'):'⇅';
    return`<th style="cursor:pointer;user-select:none;white-space:nowrap" onclick="sortTbl('${id}',${i})">${h} <span style="font-size:9px;opacity:.6">${dir}</span></th>`;
  }).join('');

  // Pagination slice
  const total=rows.length;
  const size=ps.size==='all'?total||1:ps.size;
  const totalPages=Math.max(1,Math.ceil(total/size));
  if(ps.page>totalPages)ps.page=totalPages;
  const start=(ps.page-1)*size;
  const pageRows=ps.size==='all'?rows:rows.slice(start,start+size);

  el.innerHTML=`<thead><tr>${thHtml}</tr></thead>`+(pageRows.length?`<tbody>${pageRows.join('')}</tbody>`:noR(ths.length));

  // Freeze kolom (kalau tabel ini terdaftar) — biar tetep kelihatan pas digeser ke samping di HP
  const stickyIdx=STICKY_COL[id];
  if(stickyIdx!=null){
    const headCell=el.querySelector('thead tr')?.children[stickyIdx];
    if(headCell)headCell.classList.add('sticky-col');
    el.querySelectorAll('tbody tr').forEach(tr=>{
      const cell=tr.children[stickyIdx];
      if(cell)cell.classList.add('sticky-col');
    });
  }

  // Render pagination controls in sibling element
  renderPager(id,total,totalPages);
}
function renderPager(id,total,totalPages){
  const wrap=document.getElementById(id)?.closest('.tw');
  if(!wrap)return;
  let pager=wrap.nextElementSibling;
  if(!pager||!pager.classList.contains('tbl-pager')){
    pager=document.createElement('div');
    pager.className='tbl-pager';
    wrap.insertAdjacentElement('afterend',pager);
  }
  const ps=PAGE_STATE[id];
  if(total===0){pager.innerHTML='';return;}
  const sizes=[10,50,100,'all'];
  pager.innerHTML=`
    <div class="pager-info">Menampilkan ${ps.size==='all'?total:Math.min(ps.size,total-(ps.page-1)*ps.size)} dari ${total} data</div>
    <div class="pager-controls">
      <select class="pager-size" onchange="changePageSize('${id}',this.value)">
        ${sizes.map(s=>`<option value="${s}" ${ps.size==s?'selected':''}>${s==='all'?'Semua':s+' baris'}</option>`).join('')}
      </select>
      ${ps.size!=='all'?`
      <button class="pager-btn" onclick="changePage('${id}',${ps.page-1})" ${ps.page<=1?'disabled':''}>‹</button>
      <span class="pager-num">${ps.page} / ${totalPages}</span>
      <button class="pager-btn" onclick="changePage('${id}',${ps.page+1})" ${ps.page>=totalPages?'disabled':''}>›</button>`:''}
    </div>`;
}
function changePageSize(id,val){
  const ps=PAGE_STATE[id]||{size:10,page:1};
  ps.size=val==='all'?'all':parseInt(val);
  ps.page=1;
  PAGE_STATE[id]=ps;
  if(RENDER_MAP[id])RENDER_MAP[id]();
}
function changePage(id,page){
  const ps=PAGE_STATE[id];if(!ps)return;
  ps.page=Math.max(1,page);
  if(RENDER_MAP[id])RENDER_MAP[id]();
}
function sortTbl(id,col){
  const ss=SORT_STATE[id]||{col:-1,asc:true};
  if(ss.col===col){ss.asc=!ss.asc;}else{ss.col=col;ss.asc=true;}
  SORT_STATE[id]=ss;
  if(PAGE_STATE[id])PAGE_STATE[id].page=1;
  if(RENDER_MAP[id])RENDER_MAP[id]();
}
function sortArr(arr,id){
  const ss=SORT_STATE[id];if(!ss||ss.col<0)return arr;
  return[...arr].sort((a,b)=>{
    // Get text content of col index by generating a temp row and reading cell
    const aVal=getSortVal(a,id,ss.col);
    const bVal=getSortVal(b,id,ss.col);
    const cmp=typeof aVal==='number'&&typeof bVal==='number'
      ?aVal-bVal
      :String(aVal).localeCompare(String(bVal),'id',{numeric:true});
    return ss.asc?cmp:-cmp;
  });
}
function getSortVal(r,tid,col){
  // Map column index to data field per table
  const maps={
    't-ca':   [null,'name','category','amount','date','note',null],
    't-ar':   [null,'name','amount','paid',r=>(Math.max(0,(+(r.amount||0))-(+(r.paid||0)))),'date','due_date','status',null,'note',null],
    't-ii':   [null,'name','qty',r=>+(r.buy_price||r.amount||0),r=>+(r.current_price||r.buy_price||r.amount||0),'date',r=>(+(r.current_price||0))-(+(r.buy_price||r.amount||0)),r=>{const bp=+(r.buy_price||r.amount||0);const sp=+(r.current_price||bp);return bp>0?((sp-bp)/bp*100):0;},r=>r.updated_at||'','note',null],
    't-ppe':  [null,'name','qty',r=>+(r.buy_price||r.amount||0),r=>+(r.current_price||r.buy_price||r.amount||0),'date','depreciation_date',r=>(+(r.current_price||+(r.buy_price||r.amount||0)))-(+(r.buy_price||r.amount||0)),r=>{const bp=+(r.buy_price||r.amount||0);const sp=+(r.current_price||bp);return bp>0?((sp-bp)/bp*100):0;},'note',null],
    't-intg': [null,'name','amount','date','note',null],
    't-inv':  [null,'name','type',r=>r.totalBuy,r=>r.avgBuyPrice,r=>r.nilaiSkrg,r=>r.updatedAt||'',r=>r.unrealized,r=>r.pct,null],
    't-inc':  [null,'date','source','category','description','method',r=>+(r.amount||0),'note',null],
    't-exp':  [null,'date','category','description','method',r=>+(r.amount||0),'note',null],
    't-debt': ['date','name','purpose',r=>+(r.amount||0),r=>+(r.paid||0),r=>debtSisa(r),'due_date',r=>debtStatus(r),null],
    't-ca-detail': ['date','desc','type',r=>+(r.amount||0),null],
  };
  const m=maps[tid];if(!m||col>=m.length)return'';
  const fn=m[col];
  if(fn===null)return'';
  if(typeof fn==='function')return fn(r);
  return r[fn]??'';
}
function buildCatSelect(cur){
  const cats=getCategories();
  const isCustom=cur&&!cats.slice(0,-1).includes(cur);
  return`<select id="f-cat" onchange="handleCatChange(this)">
    ${cats.map(c=>`<option value="${c}" ${cur===c||(!cur&&c==='Kas')?'selected':''}>${c}</option>`).join('')}
    ${isCustom?`<option value="${cur}" selected>${cur}</option>`:''}
  </select>
  <div id="f-cat-custom" style="display:${isCustom?'block':'none'};margin-top:6px">
    <input id="f-cat-input" placeholder="Tulis kategori baru…" value="${isCustom?cur:''}" style="width:100%;border:1.5px solid var(--bd);border-radius:7px;padding:7px 10px;font-size:13px;background:var(--bg);color:var(--txt);outline:none">
  </div>`;
}
function handleCatChange(el){
  const custom=document.getElementById('f-cat-custom');
  if(custom)custom.style.display=el.value==='Lainnya'?'block':'none';
}
function getCatValue(){
  const sel=document.getElementById('f-cat');if(!sel)return'Kas';
  if(sel.value==='Lainnya'){const inp=document.getElementById('f-cat-input');return inp&&inp.value.trim()?inp.value.trim():'Lainnya';}
  return sel.value;
}
const MF={
  ca:r=>`<div class="fg"><label>Nama</label><input id="f-nm" value="${r?esc(r.name):''}"></div>
<div class="fg"><label>Kategori</label>${buildCatSelect(r?.category)}</div>
<div class="fr"><div class="fg"><label>Jumlah (Rp)</label><input id="f-amt" type="number" min="0" value="${r?+(r.amount||0):0}"></div><div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${r?r.date:td()}"></div></div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${r?esc(r.note||''):''}" placeholder="Catatan tambahan..."></div>`,
  ar:r=>r?buildARFormEdit(r):buildARFormAdd(),
  ii:r=>buildIIForm(r,!!r),
  ppe:r=>buildPPEForm(r,!!r),
  intg:r=>`<div class="fg"><label>Nama Aset Tak Berwujud</label><input id="f-nm" value="${r?esc(r.name):''}"></div><div class="fr"><div class="fg"><label>Nilai (Rp)</label><input id="f-amt" type="number" min="0" value="${r?+(r.amount||0):0}"></div><div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${r?r.date:td()}"></div></div>
<div class="fg"><label>Note (opsional)</label><input id="f-note" value="${r?esc(r.note||''):''}" placeholder="Catatan tambahan..."></div>`,
  inv:r=>r?buildInvFormEdit(r):buildInvFormAdd(),
  debt:r=>r?buildDebtFormEdit(r):buildDebtFormAdd(),
  inc:r=>`
<div class="fr"><div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${r?r.date:td()}"></div>
<div class="fg"><label>Sumber</label><select id="f-src">${buildSelectOpts(getIncSources(),r?.source||'Gaji & Bonus')}</select></div></div>
<div class="fg"><label>Kategori (opsional)</label><input id="f-cat2" value="${r?esc(r.category||''):''}" placeholder="cth: Gaji Bulanan"></div>
<div class="fg"><label>Deskripsi</label><input id="f-nm" value="${r?esc(r.description||''):''}" placeholder="cth: Gaji bulan Juni 2026"></div>
<div class="fr"><div class="fg"><label>Metode Pembayaran</label>${buildMethodSelect(r?.method,'f-method')}</div>
<div class="fg"><label>Jumlah (Rp)</label><input id="f-amt" type="number" min="0" value="${r?+(r.amount||0):0}"></div></div>
<div class="fg"><label>Catatan (opsional)</label><input id="f-note" value="${r?esc(r.note||''):''}"></div>`,
  exp:r=>`
<div class="fr"><div class="fg"><label>Tanggal</label><input id="f-dt" type="date" value="${r?r.date:td()}"></div>
<div class="fg"><label>Kategori</label><select id="f-ecat">${buildSelectOpts(getExpCats(),r?.category||'Makanan & Minuman')}</select></div></div>
<div class="fg"><label>Deskripsi</label><input id="f-nm" value="${r?esc(r.description||''):''}" placeholder="cth: Makan siang"></div>
<div class="fr"><div class="fg"><label>Metode Pembayaran</label>${buildMethodSelect(r?.method,'f-method')}</div>
<div class="fg"><label>Jumlah (Rp)</label><input id="f-amt" type="number" min="0" value="${r?+(r.amount||0):0}"></div></div>
<div class="fg"><label>Catatan (opsional)</label><input id="f-note" value="${r?esc(r.note||''):''}"></div>`,
};
function openM(type){mType=type;mId=null;document.getElementById('m-title').textContent='+ '+(MLBL_[type]||type);document.getElementById('m-body').innerHTML=MF[type](null);document.getElementById('mo').classList.add('open');setTimeout(()=>document.querySelector('#m-body input')?.focus(),200);}
function openE(type,id){
  mType=type;mId=id;
  // Always get fresh data from DB
  const r=DB[DARR[type]].find(x=>x.id===id);
  if(!r){showToast('❌ Data tidak ditemukan');return;}
  document.getElementById('m-title').textContent='✏️ Edit '+(MLBL_[type]||type);
  document.getElementById('m-body').innerHTML=MF[type](r);
  document.getElementById('mo').classList.add('open');
}
function closeM(){document.getElementById('mo').classList.remove('open');}
async function applyAssetDelta(assetName,delta){
  if(!assetName||!delta)return;
  const item=DB.ca.find(x=>x.name===assetName);
  if(!item)return;
  await sbU('current_assets',item.id,{amount:(+(item.amount||0))+delta});
}
async function saveM(){
  const name=(document.getElementById('f-nm')?.value||'').trim();
  const date=document.getElementById('f-dt')?.value||td();
  const noteVal=(document.getElementById('f-note')?.value||'').trim();
  if(!name){showToast('⚠️ Nama tidak boleh kosong');return;}
  let pay={};
  let oldTxRec=null;
  let invRenameSiblings=null;
  let invPriceCascade=null;

  if(mType==='ca'){
    const amount=parseFloat(document.getElementById('f-amt')?.value)||0;
    pay={name,category:getCatValue(),amount,date,note:noteVal};
  }
  else if(mType==='ar'){
    // Poin 3: form Edit sekarang cuma ngubah data inti Piutang (Nama, Total Tagihan,
    // Status, Tanggal, Jatuh Tempo, Note) — logic "Tambah Pembayaran" udah DIPINDAH
    // ke modal terpisah (openPayAR/savePayAR di cash-equivalent.js), gak nyentuh saveM lagi.
    const amount=parseFloat(document.getElementById('f-amt')?.value)||0;
    const status=document.getElementById('f-sts')?.value||'Outstanding';
    const due_date=document.getElementById('f-due')?.value||null;
    if(mId){
      pay={name,amount,date,due_date,status,note:noteVal};
    } else {
      pay={name,amount,date,due_date,status,paid:0,note:noteVal};
    }
  }
  else if(mType==='debt'){
    const amount=parseFloat(document.getElementById('f-amt')?.value)||0;
    const status=document.getElementById('f-sts')?.value||'Aman';
    const due_date=document.getElementById('f-due')?.value||null;
    const purpose=(document.getElementById('f-tujuan')?.value||'').trim();
    if(mId){
      const existingPaid=parseFloat(document.getElementById('f-paid-total')?.value)||0;
      const addPayment=parseFloat(document.getElementById('f-paid-add')?.value)||0;
      const via=document.getElementById('f-via')?.value||'';
      const payDate=document.getElementById('f-pay-date')?.value||td();
      const newPaid=Math.min(existingPaid+addPayment,amount);
      let newStatus=status;
      if(newPaid>=amount&&amount>0)newStatus='Lunas';
      else if(due_date&&due_date<td())newStatus='Jatuh Tempo';

      pay={name,purpose,amount,date,due_date,status:newStatus,paid:newPaid,payment_via:via||null,note:noteVal};

      // Insert debt_payments record (real table)
      if(addPayment>0){
        try{
          await sbI('debt_payments',{
            debt_id:mId,
            amount:addPayment,
            paid_date:payDate,
            via:via||null,
            paid_total:newPaid,
            sisa:Math.max(0,amount-newPaid)
          });
          DB.debtPay=await sbG('debt_payments','&order=paid_date.asc');
        }catch(e){console.warn('debt_payments insert failed:',e.message);}
      }

      // Bayar hutang = uang keluar dari Current Asset (kebalikan dari AR)
      if(addPayment>0&&via){
        const caItem=DB.ca.find(x=>x.name===via);
        if(caItem){await sbU('current_assets',caItem.id,{amount:(+(caItem.amount||0))-addPayment,date:payDate});DB.ca=await sbG('current_assets');}
      }
    } else {
      const fundTo=document.getElementById('f-fund')?.value||'';
      pay={name,purpose,amount,date,due_date,status,paid:0,fund_to:fundTo||null,note:noteVal};
    }
  }
  else if(mType==='ii'){
    const qty=parseFloat(document.getElementById('f-qty')?.value)||0;
    const buyPrice=parseFloat(document.getElementById('f-buy-price')?.value)||0;
    const curPrice=parseFloat(document.getElementById('f-cur-price')?.value)||buyPrice;
    const amount=buyPrice*qty||0;
    pay={name,qty,buy_price:buyPrice,current_price:curPrice,amount,date,note:noteVal};
  }
  else if(mType==='ppe'){
    const qty=parseFloat(document.getElementById('f-qty')?.value)||1;
    const buyPrice=parseFloat(document.getElementById('f-buy-price')?.value)||0;
    const amount=buyPrice*qty;
    pay={name,qty,buy_price:buyPrice,amount,date,note:noteVal};
    if(mId){
      const curPrice=parseFloat(document.getElementById('f-cur-price')?.value)||buyPrice;
      const depDt=document.getElementById('f-dep-dt')?.value||null;
      pay.current_price=curPrice;
      if(depDt)pay.depreciation_date=depDt;
    }
  }
  else if(mType==='intg'){
    const amount=parseFloat(document.getElementById('f-amt')?.value)||0;
    pay={name,amount,date,note:noteVal};
  }
  else if(mType==='inv'){
    const typ=getInvTypValue();
    const nowIso=new Date().toISOString();
    if(mId){
      // Edit grup investasi: Nama, Tipe, Harga Sekarang, Tanggal Update, Note.
      // buy_price/qty/total_buy/date milik lot ini SENGAJA tidak disentuh (form Edit udah
      // gak punya input itu lagi — riwayat pembelian per-lot tetap akurat, diedit lewat Detail).
      const curPrice=parseFloat(document.getElementById('f-cur-price')?.value)||0;
      const priceDt =document.getElementById('f-price-dt')?.value;
      const updAt   =priceDt?new Date(priceDt).toISOString():nowIso;
      const oldRec=DB.inv.find(x=>x.id===mId);
      const oldName=oldRec?oldRec.name:name;
      pay={name,type:typ,current_price:curPrice,updated_at:updAt};
      if(oldName && oldName!==name)invRenameSiblings={oldName,newName:name};
      // Harga Sekarang & Tipe itu satu nilai buat SELURUH investasi ini (bukan per-lot) —
      // cascade ke semua lot lain biar gak "flip-flop" tergantung lot mana yg kebetulan
      // paling baru pas dibuka lagi nanti.
      invPriceCascade={name:oldName,newName:name,currentPrice:curPrice,updatedAt:updAt,type:typ};
    } else {
      const buyPrice=parseFloat(document.getElementById('f-buy-price')?.value)||0;
      const qty     =parseFloat(document.getElementById('f-qty')?.value)||0;
      const totalBuy=parseFloat(document.getElementById('f-total-buy')?.value)||(buyPrice*qty);
      pay={name,type:typ,buy_price:buyPrice,qty,total_buy:totalBuy,current_price:buyPrice,
           unrealized_gain:0,amount:totalBuy,gain:0,date,updated_at:nowIso,note:noteVal};
    }
  }
  else if(mType==='inc'||mType==='exp'){
    const amount=parseFloat(document.getElementById('f-amt')?.value)||0;
    const method=document.getElementById('f-method')?.value||'';
    const note=(document.getElementById('f-note')?.value||'').trim();
    oldTxRec=mId?DB[DARR[mType]].find(x=>x.id===mId):null;
    if(mType==='inc'){
      const source=document.getElementById('f-src')?.value||'Lainnya';
      const category=(document.getElementById('f-cat2')?.value||'').trim();
      pay={date,source,category,description:name,method,amount,note};
    } else {
      const category=document.getElementById('f-ecat')?.value||'Lainnya';
      pay={date,category,description:name,method,amount,note};
    }
  }

  try{
    if(mId){await sbU(TMAP[mType],mId,pay);}
    else{const res=await sbI(TMAP[mType],pay);const rec=Array.isArray(res)?res[0]:res;if(rec)DB[DARR[mType]].push(rec);}
    DB[DARR[mType]]=await sbG(TMAP[mType]);
    if(mType==='inv'&&invRenameSiblings){
      const{oldName,newName}=invRenameSiblings;
      const siblings=DB.inv.filter(x=>x.name===oldName&&x.id!==mId);
      if(siblings.length)await Promise.all(siblings.map(s=>sbU('investments',s.id,{name:newName})));
      DB.inv=await sbG('investments');
    }
    if(mType==='inv'&&invPriceCascade){
      const finalName=pay.name; // nama akhir (udah kepakai kalau ada rename barusan)
      const{currentPrice,updatedAt,type}=invPriceCascade;
      const siblings=DB.inv.filter(x=>x.name===finalName&&x.id!==mId);
      if(siblings.length)await Promise.all(siblings.map(s=>sbU('investments',s.id,{current_price:currentPrice,updated_at:updatedAt,type})));
      DB.inv=await sbG('investments');
    }
    if(mType==='inc'||mType==='exp'){
      const sign=mType==='inc'?1:-1;
      if(mId&&oldTxRec)await applyAssetDelta(oldTxRec.method,-sign*(+oldTxRec.amount||0));
      await applyAssetDelta(pay.method,sign*(+pay.amount||0));
      DB.ca=await sbG('current_assets');
      renderIncPage();renderExpPage();
    }
    if(mType==='debt'&&!mId&&pay.fund_to){
      await applyAssetDelta(pay.fund_to,+(pay.amount||0));
      DB.ca=await sbG('current_assets');
    }
    if(mType==='debt')renderHutangPage();
    closeM();doSnap().catch(()=>{});updateAll();reRender();
    showToast(mId?'✅ Data diupdate!':'✅ Data ditambahkan!');
  }catch(e){showToast('❌ '+e.message);}
}
function delR(type,id,name){
  document.getElementById('cfm-tt').textContent='Hapus '+MLBL_[type]+'?';
  document.getElementById('cfm-mg').textContent=`"${name}" akan dihapus permanen.`;
  cfmCb=async()=>{
    try{
      if(type==='inc'||type==='exp'){
        const rec=DB[DARR[type]].find(x=>x.id===id);
        if(rec){const sign=type==='inc'?1:-1;await applyAssetDelta(rec.method,-sign*(+rec.amount||0));DB.ca=await sbG('current_assets');}
      }
      await sbD(TMAP[type],id);
      DB[DARR[type]]=await sbG(TMAP[type]);
      if(type==='ar')DB.payHist=await sbG('payment_history','&order=paid_date.asc'); // cascade cleanup sync
      if(type==='debt'){DB.debtPay=await sbG('debt_payments','&order=paid_date.asc');renderHutangPage();}
      if(type==='inc'||type==='exp'){renderIncPage();renderExpPage();}
      doSnap().catch(()=>{});updateAll();reRender();showToast('🗑️ Data dihapus!');
    }
    catch(e){showToast('❌ '+e.message);}
  };
  document.getElementById('cfm').classList.add('open');
}
function closeCfm(){document.getElementById('cfm').classList.remove('open');cfmCb=null;}
function runCfm(){if(cfmCb)cfmCb();closeCfm();}
