// ══════════════════════════════════════════════════════════════
// FIREBASE CLIENT — pengganti supabase-client.js
// Nama fungsi (sbG/sbI/sbU/sbD) SENGAJA dipertahankan sama persis
// biar crud-engine.js & semua js/pages/*.js gak perlu diubah sama sekali.
// Setiap panggilan otomatis di-scope ke uid user yang lagi login (multi-tenant).
// ══════════════════════════════════════════════════════════════

function parseOrder(q){
  const m=/order=([a-zA-Z_]+)\.(asc|desc)/.exec(q||'');
  return m?{field:m[1],dir:m[2]}:null;
}

async function sbG(t,q=''){
  if(!CURRENT_UID)return[];
  const ord=parseOrder(q)||{field:'created_at',dir:'asc'};
  try{
    const snap=await db.collection(t).where('uid','==',CURRENT_UID).get();
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    rows.sort((a,b)=>{
      const av=a[ord.field]??'',bv=b[ord.field]??'';
      if(av<bv)return ord.dir==='asc'?-1:1;
      if(av>bv)return ord.dir==='asc'?1:-1;
      return 0;
    });
    return rows;
  }catch(e){
    console.warn(`[Firestore] Query ${t} gagal:`,e.message);
    showToast('❌ Gagal ambil data '+t+': '+e.message);
    return[];
  }
}
async function sbI(t,d){
  if(!CURRENT_UID)throw new Error('Belum login');
  const payload={...d,uid:CURRENT_UID,created_at:d.created_at||new Date().toISOString()};
  const ref=await db.collection(t).add(payload);
  return[{id:ref.id,...payload}];
}
async function sbU(t,id,d){
  await db.collection(t).doc(id).update(d);
  const saved=await db.collection(t).doc(id).get();
  return[{id,...saved.data()}];
}
async function sbD(t,id){
  await db.collection(t).doc(id).delete();
}
