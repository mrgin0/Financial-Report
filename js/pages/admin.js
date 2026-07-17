// Halaman Admin — approve/tolak permintaan akses + hapus akun, cuma bisa diakses MASTER_EMAIL

const ALL_DATA_COLLECTIONS=['current_assets','accounts_receivable','inventory',
  'property_plant_equipment','intangible_assets','investments',
  'income','expenses','debts','debt_payments','payment_history','laporan_snapshots'];

async function renderAdminPage(){
  const list=document.getElementById('admin-requests-list');
  const hist=document.getElementById('admin-history-list');
  if(!list)return;
  try{
    const snap=await db.collection('access_requests').where('status','==','pending').get();
    const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''));
    list.innerHTML = rows.length ? rows.map(r=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--bd);border-radius:8px;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div><b>${esc(r.businessName||'(tanpa nama usaha)')}</b><br><span style="font-size:11.5px;color:var(--mu)">${esc(r.email)}</span></div>
        <div style="display:flex;gap:6px">
          <button class="btn-sm" style="background:#dcfce7;color:#15803d" onclick="approveRequest('${r.id}','${escQ(r.email)}','${escQ(r.businessName||'')}')">✅ Approve</button>
          <button class="btn-sm bd" onclick="rejectRequest('${r.id}')">✕ Tolak</button>
        </div>
      </div>`).join('') : '<div style="color:var(--mu);font-size:12px">📭 Gak ada permintaan pending</div>';

    const snap2=await db.collection('access_requests').where('status','in',['approved','rejected']).get();
    const rows2=snap2.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));

    if(!rows2.length){
      hist.innerHTML='<div style="color:var(--mu);font-size:12px">Belum ada riwayat</div>';
    } else {
      // Buat entri 'approved', cek apakah orangnya udah beneran daftar (ada usedBy=uid di allowed_emails)
      const htmlParts=await Promise.all(rows2.map(async r=>{
        let delBtn='';
        if(r.status==='approved'){
          try{
            const aDoc=await db.collection('allowed_emails').doc(r.email).get();
            const usedBy=aDoc.exists?aDoc.data().usedBy:null;
            delBtn = usedBy
              ? `<button class="btn-sm bd" onclick="confirmDeleteAccount('${escQ(usedBy)}','${escQ(r.email)}')">🗑️ Hapus Akun</button>`
              : `<span style="font-size:10px;color:var(--mu)">belum daftar</span>`;
          }catch(e){}
        }
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:12px;gap:8px;flex-wrap:wrap">
          <span>${esc(r.email)}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="dbadge ${r.status==='approved'?'aman':'jt'}">${r.status==='approved'?'Disetujui':'Ditolak'}</span>
            ${delBtn}
          </div>
        </div>`;
      }));
      hist.innerHTML=htmlParts.join('');
    }
  }catch(e){
    list.innerHTML='<div style="color:var(--er);font-size:12px">❌ '+e.message+'</div>';
  }
}
async function approveRequest(reqId,email,businessName){
  try{
    await db.collection('allowed_emails').doc(email).set({approved:true,businessName});
    await db.collection('access_requests').doc(reqId).update({status:'approved'});
    showToast('✅ Disetujui: '+email);
    renderAdminPage();
  }catch(e){ showToast('❌ '+e.message); }
}
async function rejectRequest(reqId){
  try{
    await db.collection('access_requests').doc(reqId).update({status:'rejected'});
    showToast('🗑️ Ditolak');
    renderAdminPage();
  }catch(e){ showToast('❌ '+e.message); }
}

// ══════════════════════════════════════════════════════════════
// HAPUS AKUN — konfirmasi wajib tunggu 30 detik sebelum tombol aktif
// (hapus SEMUA data Firestore akun itu + profilnya. Login Firebase Auth-nya
//  sendiri gak bisa dihapus dari sini — cukup diblokir total lewat rules +
//  auth.js otomatis nendang keluar begitu users/{uid} udah gak ada)
// ══════════════════════════════════════════════════════════════
let delAccTarget=null,delAccTimer=null;

function confirmDeleteAccount(uid,email){
  delAccTarget={uid,email};
  const msg=document.getElementById('delacc-msg');
  if(msg)msg.textContent=`Akun "${email}" beserta SELURUH data keuangannya (Current Asset, Hutang, Pemasukan, Pengeluaran, dst) akan dihapus PERMANEN. Ini gak bisa dibatalin.`;
  const cbtn=document.getElementById('delacc-confirm-btn');
  let secs=30;
  cbtn.disabled=true;
  cbtn.textContent=`Tunggu ${secs}s…`;
  document.getElementById('delacc-mo').classList.add('open');
  if(delAccTimer)clearInterval(delAccTimer);
  delAccTimer=setInterval(()=>{
    secs--;
    if(secs<=0){
      clearInterval(delAccTimer);
      cbtn.disabled=false;
      cbtn.textContent='🗑️ Ya, Hapus Akun Ini';
    } else {
      cbtn.textContent=`Tunggu ${secs}s…`;
    }
  },1000);
}
function closeDeleteAccountModal(){
  document.getElementById('delacc-mo').classList.remove('open');
  if(delAccTimer)clearInterval(delAccTimer);
  delAccTarget=null;
}
async function runDeleteAccount(){
  if(!delAccTarget)return;
  const {uid,email}=delAccTarget;
  const btn=document.getElementById('delacc-confirm-btn');
  btn.disabled=true;btn.textContent='Menghapus…';
  try{
    for(const col of ALL_DATA_COLLECTIONS){
      const snap=await db.collection(col).where('uid','==',uid).get();
      await Promise.all(snap.docs.map(d=>d.ref.delete()));
    }
    await db.collection('users').doc(uid).delete();
    await db.collection('allowed_emails').doc(email).delete();
    showToast('🗑️ Akun '+email+' & seluruh datanya sudah dihapus');
    closeDeleteAccountModal();
    renderAdminPage();
  }catch(e){
    showToast('❌ Gagal hapus: '+e.message);
    btn.disabled=false;btn.textContent='🗑️ Ya, Hapus Akun Ini';
  }
}
