// ══════════════════════════════════════════════════════════════
// AUTH — login, register (invite-only 2 tahap), logout, reset password
// ══════════════════════════════════════════════════════════════

function showAppShell(){
  const a=document.getElementById('app-shell'),b=document.getElementById('auth-shell');
  if(a)a.style.display='';if(b)b.style.display='none';
}
function showAuthShell(){
  const a=document.getElementById('app-shell'),b=document.getElementById('auth-shell');
  if(a)a.style.display='none';if(b)b.style.display='';
}
async function authNav(id){
  try{
    const res=await fetch(`pages/${id}.html`);
    document.getElementById('auth-app').innerHTML=await res.text();
  }catch(e){
    document.getElementById('auth-app').innerHTML='<div class="card">❌ Gagal memuat halaman. Pastikan diakses lewat server (http), bukan file langsung.</div>';
  }
}
function showForgotPassword(){
  const box=document.getElementById('forgot-box');
  if(box)box.style.display=(box.style.display==='none'||!box.style.display)?'block':'none';
}
function showCompleteRegisterForm(){
  const s1=document.getElementById('reg-step1'),s2=document.getElementById('reg-step2');
  if(s1)s1.style.display='none';if(s2)s2.style.display='block';
}

function mapAuthError(code){
  const m={
    'auth/user-not-found':'Email belum terdaftar',
    'auth/wrong-password':'Password salah',
    'auth/invalid-email':'Format email salah',
    'auth/email-already-in-use':'Email ini sudah punya akun',
    'auth/weak-password':'Password terlalu lemah (min. 6 karakter)',
    'auth/too-many-requests':'Terlalu banyak percobaan, coba lagi beberapa menit lagi',
    'auth/invalid-credential':'Email atau password salah',
    'auth/network-request-failed':'Koneksi bermasalah, coba lagi',
  };
  return m[code]||code||'Terjadi kesalahan';
}

async function doLogin(){
  const email=(document.getElementById('login-email')?.value||'').trim();
  const pass=document.getElementById('login-pass')?.value||'';
  if(!email||!pass){showToast('⚠️ Isi email & password');return;}
  try{ await auth.signInWithEmailAndPassword(email,pass); }
  catch(e){ showToast('❌ '+mapAuthError(e.code)); }
}
async function doForgotPassword(){
  const email=(document.getElementById('forgot-email')?.value||'').trim();
  if(!email){showToast('⚠️ Isi email dulu');return;}
  try{
    await auth.sendPasswordResetEmail(email);
    showToast('✅ Link reset password dikirim ke '+email+' (cek folder spam kalau belum keliatan)');
  }catch(e){ showToast('❌ '+mapAuthError(e.code)); }
}
async function doLogout(){
  try{ await auth.signOut(); closeProfileModal(); showToast('👋 Berhasil logout'); }
  catch(e){ showToast('❌ '+e.message); }
}
async function doResetPasswordFromProfile(){
  if(!CURRENT_USER)return;
  try{
    await auth.sendPasswordResetEmail(CURRENT_USER.email);
    showToast('✅ Link reset password dikirim ke '+CURRENT_USER.email);
  }catch(e){ showToast('❌ '+e.message); }
}

// ── Register tahap 1: ajukan akses (belum bikin akun, cuma nyatet permintaan) ──
async function submitAccessRequest(){
  const biz=(document.getElementById('reg-biz')?.value||'').trim();
  const email=(document.getElementById('reg-email')?.value||'').trim().toLowerCase();
  if(!email){showToast('⚠️ Isi email dulu');return;}
  try{
    // Catatan: gak ada pre-check duplikat di sini, karena koleksi access_requests
    // memang cuma boleh DIBACA oleh master (lihat firestore-rules.txt) — kalau ada
    // yang submit dobel, ketauan pas master buka halaman Admin, aman diabaikan.
    await db.collection('access_requests').add({email,businessName:biz,status:'pending',created_at:new Date().toISOString()});
    showToast('✅ Permintaan terkirim! Tunggu master approve, lalu balik ke sini pilih "Lanjut buat akun"');
  }catch(e){ showToast('❌ '+e.message); }
}
// ── Register tahap 2: bikin akun beneran (cuma bisa kalau email udah di-approve master) ──
async function completeRegister(){
  const email=(document.getElementById('reg2-email')?.value||'').trim().toLowerCase();
  const pass=document.getElementById('reg2-pass')?.value||'';
  const pass2=document.getElementById('reg2-pass2')?.value||'';
  if(!email||!pass){showToast('⚠️ Lengkapi form dulu');return;}
  if(pass!==pass2){showToast('⚠️ Konfirmasi password gak sama');return;}
  if(pass.length<6){showToast('⚠️ Password minimal 6 karakter');return;}
  try{
    const allowedDoc=await db.collection('allowed_emails').doc(email).get();
    if(!allowedDoc.exists||!allowedDoc.data().approved){
      showToast('⚠️ Email ini belum di-approve master. Ajukan akses dulu di tahap 1.');
      return;
    }
    const cred=await auth.createUserWithEmailAndPassword(email,pass);
    await db.collection('users').doc(cred.user.uid).set({
      email, businessName:allowedDoc.data().businessName||'', created_at:new Date().toISOString()
    });
    await db.collection('allowed_emails').doc(email).update({approved:false,usedBy:cred.user.uid});
    showToast('✅ Akun dibuat! Selamat datang.');
    // onAuthStateChanged otomatis masuk ke app setelah ini
  }catch(e){ showToast('❌ '+mapAuthError(e.code)); }
}

function checkIsMaster(){
  return !!(CURRENT_USER && CURRENT_USER.email && CURRENT_USER.email.toLowerCase()===MASTER_EMAIL.toLowerCase());
}
function applyMasterUI(isMaster){
  const navAdmin=document.getElementById('nav-admin');
  if(navAdmin)navAdmin.style.display=isMaster?'':'none';
}

// ══════════════════════════════════════════════════════════════
// GERBANG UTAMA — jalan otomatis tiap status login berubah
// ══════════════════════════════════════════════════════════════
auth.onAuthStateChanged(async(user)=>{
  if(user){
    CURRENT_USER=user;CURRENT_UID=user.uid;
    let prof;
    try{ prof=await db.collection('users').doc(user.uid).get(); }
    catch(e){ CURRENT_PROFILE={email:user.email}; prof=null; }
    if(prof && !prof.exists){
      // Akun sudah dihapus master (users/{uid} udah gak ada) — paksa logout
      showToast('⛔ Akun kamu sudah dihapus/dinonaktifkan master. Hubungi master kalau ini keliru.');
      await auth.signOut();
      return; // onAuthStateChanged bakal kepanggil lagi dengan user=null
    }
    CURRENT_PROFILE = prof ? prof.data() : (CURRENT_PROFILE||{email:user.email});
    showAppShell();
    applyAppSettings();
    applyMasterUI(checkIsMaster());
    await bootApp();
  } else {
    CURRENT_USER=null;CURRENT_UID=null;CURRENT_PROFILE={};
    showAuthShell();
    authNav('login');
    hideLS();
  }
});
