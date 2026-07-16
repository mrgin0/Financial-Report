// Wrapper Firestore, meniru sbG/sbI/sbU/sbD versi Supabase
const db = firebase.firestore();

function parseOrder(q){
  const m = /order=([a-zA-Z_]+)\.(asc|desc)/.exec(q||'');
  return m ? {field:m[1], dir:m[2]} : null;
}

async function sbG(t,q=''){
  const ord = parseOrder(q) || {field:'created_at', dir:'asc'};
  let ref = db.collection(t);
  try{ ref = ref.orderBy(ord.field, ord.dir); }catch(e){}
  const snap = await ref.get();
  return snap.docs.map(d=>({id:d.id, ...d.data()}));
}
async function sbI(t,d){
  const payload = {...d, created_at: d.created_at || new Date().toISOString()};
  const ref = await db.collection(t).add(payload);
  return [{id:ref.id, ...payload}];
}
async function sbU(t,id,d){
  await db.collection(t).doc(id).update(d);
  return [{id, ...d}];
}
async function sbD(t,id){
  await db.collection(t).doc(id).delete();
}
