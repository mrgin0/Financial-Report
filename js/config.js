// ══════════════════════════════════════════════════════════════
// KONFIGURASI FIREBASE — WAJIB DIGANTI dengan punya project kamu sendiri!
// Ambil dari: Firebase Console → ⚙️ Project Settings → Your apps → (Web app) → SDK config
// ══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_KAMU",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI",
  appId: "GANTI"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Email akun MASTER (kamu) — satu-satunya yang boleh approve akses & lihat halaman Admin.
// WAJIB SAMA PERSIS dengan email akun pertama yang kamu daftarkan sendiri di Firebase Console.
const MASTER_EMAIL = "raihan.nor.falah@mhs.politala.ac.id";
