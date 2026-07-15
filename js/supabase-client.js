// Wrapper fetch ke Supabase REST API (GET/POST/PATCH/DELETE)

async function sbG(t,q=''){const r=await fetch(`${SB}/${t}?order=created_at.asc${q}`,{headers:{...H,'Prefer':''}});if(!r.ok)throw new Error(t+':'+r.status);return r.json();}
async function sbI(t,d){const r=await fetch(`${SB}/${t}`,{method:'POST',headers:H,body:JSON.stringify(d)});if(!r.ok)throw new Error(t+':'+r.status);return r.json();}
async function sbU(t,id,d){const r=await fetch(`${SB}/${t}?id=eq.${id}`,{method:'PATCH',headers:H,body:JSON.stringify(d)});if(!r.ok)throw new Error(t+':'+r.status);return r.json();}
async function sbD(t,id){const r=await fetch(`${SB}/${t}?id=eq.${id}`,{method:'DELETE',headers:{...H,'Prefer':''}});if(!r.ok)throw new Error(t+':'+r.status);}
