// Popup Profile — SEKARANG SEMUA PER-AKUN, disimpan di Firestore users/{uid}
// (nama app, deskripsi, avatar, logo Family Office, nama usaha, email login)
// Sebelumnya ini kesimpen di localStorage & ke-share ke SEMUA akun di browser yang sama — sudah dibetulkan.

function applyAppSettings(){
  const p=CURRENT_PROFILE||{};
  const nameTxt=document.getElementById('app-name-txt');if(nameTxt)nameTxt.textContent=p.appName||'Lap. Keuangan Pribadi';
  const descTxt=document.getElementById('logo-sub');if(descTxt)descTxt.textContent=p.appDesc||'Personal Finance Tracker';
  const unameTxt=document.getElementById('sb-uname-txt');if(unameTxt)unameTxt.textContent=p.businessName||(CURRENT_USER&&CURRENT_USER.email)||'—';
  const uemailTxt=document.getElementById('sb-uemail-txt');if(uemailTxt)uemailTxt.textContent=(CURRENT_USER&&CURRENT_USER.email)||'—';
  const hdrAv=document.getElementById('hdr-avatar');
  if(hdrAv){
    if(p.avatar)hdrAv.innerHTML=`<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else hdrAv.textContent=((p.businessName||(CURRENT_USER&&CURRENT_USER.email)||'?').trim().charAt(0)||'?').toUpperCase();
  }
  const foBlock=document.getElementById('fo-logo-block');
  if(foBlock){
    if(p.foLogo)foBlock.innerHTML=`<img src="${p.foLogo}" style="max-width:100%;max-height:110px;object-fit:contain;margin:0 auto 8px;display:block">`;
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
  const p=CURRENT_PROFILE||{};
  const sv=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
  sv('set-app-name',p.appName||'Lap. Keuangan Pribadi');
  sv('set-app-desc',p.appDesc||'Personal Finance Tracker');
  sv('set-acc-name',p.businessName||'');
  sv('set-acc-email',(CURRENT_USER&&CURRENT_USER.email)||'');
  const avP=document.getElementById('set-avatar-preview');
  if(avP){avP.innerHTML=p.avatar?`<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover">`:'?';avP.dataset.value=p.avatar||'';}
  const foP=document.getElementById('set-fologo-preview');
  if(foP){foP.innerHTML=p.foLogo?`<img src="${p.foLogo}" style="width:100%;height:100%;object-fit:contain">`:'Belum ada';foP.dataset.value=p.foLogo||'';}
}
function openProfileModal(){
  fillSettingsForm();
  document.getElementById('profile-mo').classList.add('open');
}
function closeProfileModal(){
  document.getElementById('profile-mo').classList.remove('open');
}
async function saveAppSettings(){
  if(!CURRENT_UID){showToast('⚠️ Belum login');return;}
  const appName=(document.getElementById('set-app-name')?.value||'').trim()||'Lap. Keuangan Pribadi';
  const appDesc=(document.getElementById('set-app-desc')?.value||'').trim()||'Personal Finance Tracker';
  const businessName=(document.getElementById('set-acc-name')?.value||'').trim();
  const newEmail=(document.getElementById('set-acc-email')?.value||'').trim().toLowerCase();
  const avVal=document.getElementById('set-avatar-preview')?.dataset.value||'';
  const foVal=document.getElementById('set-fologo-preview')?.dataset.value||'';

  const payload={appName,appDesc,businessName};
  if(avVal)payload.avatar=avVal;
  if(foVal)payload.foLogo=foVal;

  try{
    await db.collection('users').doc(CURRENT_UID).set(payload,{merge:true});
    Object.assign(CURRENT_PROFILE,payload);
  }catch(e){
    showToast('❌ Gagal simpan — kemungkinan gambar kegedean (usahain di bawah ±700KB per gambar). '+(e.message||''));
    return;
  }

  try{
    if(CURRENT_USER && newEmail && newEmail!==CURRENT_USER.email){
      await CURRENT_USER.updateEmail(newEmail);
      await db.collection('users').doc(CURRENT_UID).set({email:newEmail},{merge:true});
      CURRENT_PROFILE.email=newEmail;
      showToast('✅ Email akun diganti ke '+newEmail);
    }
  }catch(e){
    if(e.code==='auth/requires-recent-login'){
      showToast('⚠️ Ganti email butuh login ulang dulu (demi keamanan). Logout lalu login lagi, baru coba lagi.');
    } else {
      showToast('❌ '+(e.message||e.code||'Gagal update email'));
    }
  }
  applyAppSettings();
  showToast('✅ Pengaturan disimpan');
}
async function resetAppSettings(){
  if(!CURRENT_UID)return;
  try{
    await db.collection('users').doc(CURRENT_UID).set({appName:'',appDesc:'',avatar:'',foLogo:''},{merge:true});
    Object.assign(CURRENT_PROFILE,{appName:'',appDesc:'',avatar:'',foLogo:''});
    applyAppSettings();fillSettingsForm();
    showToast('↺ Tampilan direset ke default');
  }catch(e){ showToast('❌ '+e.message); }
}
