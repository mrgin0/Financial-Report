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
  let ref=db.collection(t).where('uid','==',CURRENT_UID);
  try{ref=ref.orderBy(ord.field,ord.dir);}catch(e){}
  try{
    const snap=await ref.get();
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    // Query butuh composite index & belum dibuat di Firestore Console —
    // buka Console (F12), klik link "create index" yang muncul, tunggu ~1 menit, refresh.
    console.warn(`[Firestore] Query ${t} gagal (mungkin butuh index):`,e.message);
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
