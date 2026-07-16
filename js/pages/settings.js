// Popup Profile (pengganti halaman Setting) — logo, avatar, nama app (lokal per-browser)
// + Nama Akun & Email Akun (beneran terikat ke akun Firebase yang lagi login, BUKAN email master)

function loadAppSettings(){
  try{APPSET=JSON.parse(localStorage.getItem('appSettings')||'{}');}catch(e){APPSET={};}
  applyAppSettings();
}
function applyAppSettings(){
  const nameTxt=document.getElementById('app-name-txt');if(nameTxt)nameTxt.textContent=APPSET.appName||'Lap. Keuangan Pribadi';
  const descTxt=document.getElementById('logo-sub');if(descTxt)descTxt.textContent=APPSET.appDesc||'Personal Finance Tracker';
  const unameTxt=document.getElementById('sb-uname-txt');if(unameTxt)unameTxt.textContent=(CURRENT_PROFILE&&CURRENT_PROFILE.businessName)||(CURRENT_USER&&CURRENT_USER.email)||'—';
  const uemailTxt=document.getElementById('sb-uemail-txt');if(uemailTxt)uemailTxt.textContent=(CURRENT_USER&&CURRENT_USER.email)||'—';
  const hdrAv=document.getElementById('hdr-avatar');
  if(hdrAv){
    if(APPSET.avatar)hdrAv.innerHTML=`<img src="${APPSET.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else hdrAv.textContent=(((CURRENT_PROFILE&&CURRENT_PROFILE.businessName)||(CURRENT_USER&&CURRENT_USER.email)||'?').trim().charAt(0)||'?').toUpperCase();
  }
  const foBlock=document.getElementById('fo-logo-block');
  if(foBlock){
    if(APPSET.foLogo)foBlock.innerHTML=`<img src="${APPSET.foLogo}" style="max-width:100%;max-height:110px;object-fit:contain;margin:0 auto 8px;display:block">`;
    else foBlock.innerHTML=`<div class="fo-lbl">— FAMILY OFFICE —</div><div class="fo-logo">MI<span>&amp;</span>RAI</div><div class="fo-cap">CAPITAL</div><div class="fo-tag">Investing in Today,<br>Building Forever.</div>`;
  }
}
function previewSettingImage(fileId,previewId){
  const f=document.getElementById(fileId)?.files?.[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const el=document.getElementById(previewId);
    if(el){el.innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;el.dataset.value=e.target.result;}
  };
  reader.readAsDataURL(f);
}
function fillSettingsForm(){
  const sv=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
  sv('set-app-name',APPSET.appName||'Lap. Keuangan Pribadi');
  sv('set-app-desc',APPSET.appDesc||'Personal Finance Tracker');
  sv('set-acc-name',(CURRENT_PROFILE&&CURRENT_PROFILE.businessName)||'');
  sv('set-acc-email',(CURRENT_USER&&CURRENT_USER.email)||'');
  const avP=document.getElementById('set-avatar-preview');
  if(avP){avP.innerHTML=APPSET.avatar?`<img src="${APPSET.avatar}" style="width:100%;height:100%;object-fit:cover">`:'?';avP.dataset.value=APPSET.avatar||'';}
  const foP=document.getElementById('set-fologo-preview');
  if(foP){foP.innerHTML=APPSET.foLogo?`<img src="${APPSET.foLogo}" style="width:100%;height:100%;object-fit:contain">`:'Belum ada';foP.dataset.value=APPSET.foLogo||'';}
}
function openProfileModal(){
  fillSettingsForm();
  document.getElementById('profile-mo').classList.add('open');
}
function closeProfileModal(){
  document.getElementById('profile-mo').classList.remove('open');
}
async function saveAppSettings(){
  // Bagian tampilan aplikasi — disimpan lokal per-browser (bukan per-akun)
  APPSET.appName=(document.getElementById('set-app-name')?.value||'').trim()||'Lap. Keuangan Pribadi';
  APPSET.appDesc=(document.getElementById('set-app-desc')?.value||'').trim()||'Personal Finance Tracker';
  const avVal=document.getElementById('set-avatar-preview')?.dataset.value;
  if(avVal)APPSET.avatar=avVal;
  const foVal=document.getElementById('set-fologo-preview')?.dataset.value;
  if(foVal)APPSET.foLogo=foVal;
  try{localStorage.setItem('appSettings',JSON.stringify(APPSET));}
  catch(e){showToast('❌ Gagal simpan tampilan — gambar terlalu besar');return;}

  // Bagian akun — beneran nyimpen ke Firestore users/{uid} + Firebase Auth (BUKAN email master)
  const newName=(document.getElementById('set-acc-name')?.value||'').trim();
  const newEmail=(document.getElementById('set-acc-email')?.value||'').trim().toLowerCase();
  try{
    if(CURRENT_UID && newName!==(CURRENT_PROFILE.businessName||'')){
      await db.collection('users').doc(CURRENT_UID).set({businessName:newName},{merge:true});
      CURRENT_PROFILE.businessName=newName;
    }
    if(CURRENT_USER && newEmail && newEmail!==CURRENT_USER.email){
      await CURRENT_USER.updateEmail(newEmail);
      await db.collection('users').doc(CURRENT_UID).set({email:newEmail},{merge:true});
      showToast('✅ Email akun diganti ke '+newEmail);
    }
  }catch(e){
    if(e.code==='auth/requires-recent-login'){
      showToast('⚠️ Ganti email butuh login ulang dulu (demi keamanan). Logout lalu login lagi, baru coba lagi.');
    } else {
      showToast('❌ '+(e.message||e.code||'Gagal update akun'));
    }
  }
  applyAppSettings();
  showToast('✅ Pengaturan disimpan');
}
function resetAppSettings(){
  APPSET={};
  localStorage.removeItem('appSettings');
  applyAppSettings();fillSettingsForm();
  showToast('↺ Tampilan direset ke default');
}
