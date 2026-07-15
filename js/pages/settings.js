// Halaman Setting (profil, logo, avatar)

function loadAppSettings(){
  try{APPSET=JSON.parse(localStorage.getItem('appSettings')||'{}');}catch(e){APPSET={};}
  applyAppSettings();
}
function applyAppSettings(){
  const nameTxt=document.getElementById('app-name-txt');if(nameTxt)nameTxt.textContent=APPSET.appName||'Lap. Keuangan Pribadi';
  const descTxt=document.getElementById('logo-sub');if(descTxt)descTxt.textContent=APPSET.appDesc||'Personal Finance Tracker';
  const unameTxt=document.getElementById('sb-uname-txt');if(unameTxt)unameTxt.textContent=APPSET.accName||'Raihan Nor Falah';
  const uemailTxt=document.getElementById('sb-uemail-txt');if(uemailTxt)uemailTxt.textContent=APPSET.accEmail||'raihan.nor.falah@mhs.politala.ac.id';
  const hdrAv=document.getElementById('hdr-avatar');
  if(hdrAv){
    if(APPSET.avatar)hdrAv.innerHTML=`<img src="${APPSET.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else hdrAv.textContent=((APPSET.accName||'Raihan Nor Falah').trim().charAt(0)||'R').toUpperCase();
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
  sv('set-acc-name',APPSET.accName||'Raihan Nor Falah');
  sv('set-acc-email',APPSET.accEmail||'raihan.nor.falah@mhs.politala.ac.id');
  const avP=document.getElementById('set-avatar-preview');
  if(avP){avP.innerHTML=APPSET.avatar?`<img src="${APPSET.avatar}" style="width:100%;height:100%;object-fit:cover">`:((APPSET.accName||'R').trim().charAt(0)||'R').toUpperCase();avP.dataset.value=APPSET.avatar||'';}
  const foP=document.getElementById('set-fologo-preview');
  if(foP){foP.innerHTML=APPSET.foLogo?`<img src="${APPSET.foLogo}" style="width:100%;height:100%;object-fit:contain">`:'Belum ada';foP.dataset.value=APPSET.foLogo||'';}
}
function saveAppSettings(){
  APPSET.appName=(document.getElementById('set-app-name')?.value||'').trim()||'Lap. Keuangan Pribadi';
  APPSET.appDesc=(document.getElementById('set-app-desc')?.value||'').trim()||'Personal Finance Tracker';
  APPSET.accName=(document.getElementById('set-acc-name')?.value||'').trim()||'Raihan Nor Falah';
  APPSET.accEmail=(document.getElementById('set-acc-email')?.value||'').trim()||'raihan.nor.falah@mhs.politala.ac.id';
  const avVal=document.getElementById('set-avatar-preview')?.dataset.value;
  if(avVal)APPSET.avatar=avVal;
  const foVal=document.getElementById('set-fologo-preview')?.dataset.value;
  if(foVal)APPSET.foLogo=foVal;
  try{localStorage.setItem('appSettings',JSON.stringify(APPSET));}
  catch(e){showToast('❌ Gagal simpan — gambar terlalu besar');return;}
  applyAppSettings();
  showToast('✅ Pengaturan disimpan');
}
function resetAppSettings(){
  APPSET={};
  localStorage.removeItem('appSettings');
  applyAppSettings();fillSettingsForm();
  showToast('↺ Pengaturan direset ke default');
}
