// Halaman Admin — approve/tolak permintaan akses, cuma bisa diakses MASTER_EMAIL

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
    hist.innerHTML = rows2.length ? rows2.map(r=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd);font-size:12px">
        <span>${esc(r.email)}</span>
        <span class="dbadge ${r.status==='approved'?'aman':'jt'}">${r.status==='approved'?'Disetujui':'Ditolak'}</span>
      </div>`).join('') : '<div style="color:var(--mu);font-size:12px">Belum ada riwayat</div>';
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
