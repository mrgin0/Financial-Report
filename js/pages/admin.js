// Halaman Admin — approve/tolak permintaan akses + hapus akun, cuma bisa diakses MASTER_EMAIL

const ALL_DATA_COLLECTIONS=['current_assets','accounts_receivable','inventory',
  'property_plant_equipment','intangible_assets','investments',
  'income','expenses','debts','debt_payments','payment_history','laporan_snapshots'];

async function renderAdminPage(){
  const list=document.getElementById('admin-requests-list');
  const hist=document.getElementById('admin-history-list');
  if(!list)return;

  // Query 1: permintaan pending — diisolasi sendiri biar kalau gagal, errornya
  // kelihatan DI SINI juga (sebelumnya nyangkut selamanya di teks "Memuat...").
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
  }catch(e){
    list.innerHTML='<div style="color:var(--er);font-size:12px">❌ '+e.message+'</div>';
  }

  // Baris akun MASTER — di-pin paling atas, cuma tombol Backup, gak ada Hapus
  const masterRowHtml = (CURRENT_UID && CURRENT_USER) ? `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:12px;gap:8px;flex-wrap:wrap;background:rgba(245,158,11,.06)">
      <div><b>${esc(CURRENT_PROFILE.businessName||'Master')}</b><br><span style="font-size:11px;color:var(--mu)">${esc(CURRENT_USER.email)}</span></div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${roleBadge(true)}
        <button class="btn-sm" style="background:#dbeafe;color:#2563eb" onclick="backupAccountData('${escQ(CURRENT_UID)}','${escQ(CURRENT_USER.email)}')">💾 Backup Data</button>
      </div>
    </div>` : '';

  // Query 2: riwayat disetujui/ditolak — diisolasi sendiri juga
  try{
    const snap2=await db.collection('access_requests').where('status','in',['approved','rejected']).get();
    let rows2=snap2.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    // Dedupe by email — kalau ada yg submit "Ajukan Akses" berkali-kali, cuma tampilin yg paling baru
    const seenEmails=new Set();
    rows2=rows2.filter(r=>{
      if(seenEmails.has(r.email))return false;
      seenEmails.add(r.email);return true;
    });

    if(!rows2.length){
      hist.innerHTML = masterRowHtml || '<div style="color:var(--mu);font-size:12px">Belum ada riwayat</div>';
    } else {
      const htmlParts=await Promise.all(rows2.map(async r=>{
        let delBtn='',backupBtn='';
        if(r.status==='approved'){
          try{
            const aDoc=await db.collection('allowed_emails').doc(r.email).get();
            const uid=await findUidForEmail(r.email, aDoc.exists?aDoc.data():null);
            if(uid){
              backupBtn=`<button class="btn-sm" style="background:#dbeafe;color:#2563eb" onclick="backupAccountData('${escQ(uid)}','${escQ(r.email)}')">💾 Backup Data</button>`;
              delBtn=`<button class="btn-sm bd" onclick="confirmDeleteAccount('${escQ(uid)}','${escQ(r.email)}')">🗑️ Hapus Akun</button>`;
            } else {
              delBtn=`<span style="font-size:10px;color:var(--mu)">belum daftar</span> <button class="btn-sm bd" onclick="removeStaleRequest('${escQ(r.email)}')">🗑️ Hapus dari Riwayat</button>`;
            }
          }catch(e){}
        }
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:12px;gap:8px;flex-wrap:wrap">
          <div><b>${esc(r.businessName||'(tanpa nama usaha)')}</b><br><span style="font-size:11px;color:var(--mu)">${esc(r.email)}</span></div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${roleBadge(false)}
            <span class="dbadge ${r.status==='approved'?'aman':'jt'}">${r.status==='approved'?'Disetujui':'Ditolak'}</span>
            ${backupBtn}
            ${delBtn}
          </div>
        </div>`;
      }));
      hist.innerHTML = masterRowHtml + htmlParts.join('');
    }
  }catch(e){
    hist.innerHTML='<div style="color:var(--er);font-size:12px">❌ '+e.message+'</div>';
  }
}

async function findUidForEmail(email,allowedData){
  if(allowedData && allowedData.usedBy) return allowedData.usedBy;
  // Fallback: allowed_emails.usedBy kadang gagal ke-set (misal sempat error pas register) —
  // cek langsung ke koleksi users berdasarkan field email, biar tetep kedeteksi.
  try{
    const snap=await db.collection('users').where('email','==',email).limit(1).get();
    if(!snap.empty) return snap.docs[0].id;
  }catch(e){}
  return null;
}
function roleBadge(isMasterRow){
  return isMasterRow
    ? `<span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;background:#fef3c7;color:#92400e;letter-spacing:.3px">MASTER</span>`
    : `<span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;background:var(--bg);color:var(--mu);border:1px solid var(--bd);letter-spacing:.3px">USER</span>`;
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
// HAPUS RIWAYAT "belum daftar" — bekas approve yg emailnya gak pernah
// dipakai buat beneran bikin akun.
// ══════════════════════════════════════════════════════════════
function removeStaleRequest(email){
  document.getElementById('cfm-tt').textContent='Hapus dari Riwayat?';
  document.getElementById('cfm-mg').textContent=`Permintaan akses "${email}" (belum pernah dipakai daftar) akan dihapus dari riwayat. Kalau orang ini mau daftar lagi nanti, dia harus Ajukan Akses dari awal.`;
  cfmCb=async()=>{
    try{
      const reqSnap=await db.collection('access_requests').where('email','==',email).get();
      await Promise.all(reqSnap.docs.map(d=>d.ref.delete()));
      await db.collection('allowed_emails').doc(email).delete().catch(()=>{});
      showToast('🗑️ Riwayat '+email+' sudah dihapus');
      renderAdminPage();
    }catch(e){ showToast('❌ '+e.message); }
  };
  document.getElementById('cfm').classList.add('open');
}

// ══════════════════════════════════════════════════════════════
// BACKUP DATA — download semua data 1 akun jadi 1 file JSON
// ══════════════════════════════════════════════════════════════
async function backupAccountData(uid,email){
  showToast('⏳ Menyiapkan backup…');
  try{
    const data={};
    for(const col of ALL_DATA_COLLECTIONS){
      const snap=await db.collection(col).where('uid','==',uid).get();
      data[col]=snap.docs.map(d=>({id:d.id,...d.data()}));
    }
    const profSnap=await db.collection('users').doc(uid).get();
    data._profile=profSnap.exists?profSnap.data():null;
    data._meta={email,uid,exportedAt:new Date().toISOString()};

    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`backup-${email.replace(/[^a-z0-9]/gi,'_')}-${td()}.json`;
    document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
    showToast('✅ Backup berhasil didownload');
  }catch(e){
    showToast('❌ Gagal backup: '+e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// HAPUS AKUN — konfirmasi wajib tunggu 30 detik sebelum tombol aktif
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

    const reqSnap=await db.collection('access_requests').where('email','==',email).get();
    await Promise.all(reqSnap.docs.map(d=>d.ref.delete()));

    closeDeleteAccountModal();
    renderAdminPage();

    const consoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`;
    showDeleteFollowupNotice(email,uid,consoleUrl);
  }catch(e){
    showToast('❌ Gagal hapus: '+e.message);
    btn.disabled=false;btn.textContent='🗑️ Ya, Hapus Akun Ini';
  }
}
function showDeleteFollowupNotice(email,uid,consoleUrl){
  showToast('🗑️ Data '+email+' sudah dihapus dari aplikasi');
  const box=document.getElementById('admin-followup-notice');
  if(box){
    box.style.display='block';
    box.innerHTML=`
      <b>⚠️ Satu langkah lagi:</b> data di aplikasi udah bersih, tapi login akun
      <b>${esc(email)}</b> masih ada di Firebase Authentication (gak bisa dihapus otomatis
      dari sini). Buka
      <a href="${consoleUrl}" target="_blank" rel="noopener" style="color:var(--pr);font-weight:700">Firebase Console → Authentication</a>,
      cari User UID <code style="background:var(--bg);padding:1px 5px;border-radius:4px">${esc(uid)}</code>,
      lalu hapus manual biar orang itu beneran gak bisa login lagi.
      <button class="btn-sm bd" style="margin-left:8px" onclick="document.getElementById('admin-followup-notice').style.display='none'">Tutup</button>`;
  }
}
