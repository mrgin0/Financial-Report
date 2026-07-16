// ══════════════════════════════════════════════════════════════
// KONFIGURASI FIREBASE — WAJIB DIGANTI dengan punya project kamu sendiri!
// Ambil dari: Firebase Console → ⚙️ Project Settings → Your apps → (Web app) → SDK config
// ══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: AIzaSyD0LuYrwJ3pZ2H7l52N472uD0aQpHLi_40",
  authDomain: "laporan-keuangan-9b7b0.firebaseapp.com",
  projectId: "laporan-keuangan-9b7b0",
  storageBucket: "laporan-keuangan-9b7b0.firebasestorage.app",
  messagingSenderId: "248122424099",
  appId: "1:248122424099:web:3be217282bdbf44003ea96"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Email akun MASTER (kamu) — satu-satunya yang boleh approve akses & lihat halaman Admin.
// WAJIB SAMA PERSIS dengan email akun pertama yang kamu daftarkan sendiri di Firebase Console.
const MASTER_EMAIL = "raihan.nor.falah@mhs.politala.ac.id";
