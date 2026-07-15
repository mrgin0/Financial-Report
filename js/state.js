// State global aplikasi (dimuat semua modul lain)

let DB={ca:[],ar:[],ii:[],ppe:[],intg:[],inv:[],snaps:[],payHist:[],inc:[],exp:[],debt:[],debtPay:[]};
let TXP={inc:'7d',exp:'7d'};
let DEBT_PERIOD='7d';
let DEBTFILT=null;
let TXFILT={inc:null,exp:null};
let catMgrType='inc';
let CHS={};
let mType='',mId=null,cfmCb=null,sbOpen=window.innerWidth>768;
let LANG='id',CUR='IDR',FX_RATE=16200,FX_UPDATED='';
const AP={growth:'1m',recv:'1m',invg:'1m',gain:'1m'};
let dashCtx={mode:'month',ym:'',fromYM:'',toYM:'',label:''};
const I18={
  id:{dashboard:'Dashboard',sb_laporan:'Laporan Keuangan',laporan_pos:'Laporan Posisi Keuangan',sb_master:'Master Data',current_asset:'Current Asset',cash_equiv:'Cash Equivalent',non_current:'Non Current Asset',investment:'Investment',hutang:'Hutang',pengeluaran:'Pengeluaran',pemasukan:'Pemasukan',total_aset:'Total Aset',total_cur:'Total Current Asset',non_cur:'Non Current Asset',asset_today:'Asset Hari Ini',growth_aset:'History Growth Aset',alokasi_total:'Alokasi Total Asset',growth_recv:'Growth Receivable',inv_chart:'Investment Growth',alokasi_inv:'Alokasi Investment',gain_loss:'Investment Gain/Loss',laporan_detail:'Laporan Detail',ca_desc:'Kas, Bank & Penghasilan Platform',ar_title:'Accounts Receivable',inv_title:'Inventory',ppe_title:'Property, Plant & Equipment',intg_title:'Intangible Assets',inv_port:'Portofolio Investasi',btn_pdf:'📄 Download PDF',btn_detail:'📋 Detail',btn_add:'+ Tambah',btn_cancel:'Batal',btn_save:'Simpan',btn_del:'Hapus',p_1b:'1 Bln',p_6b:'6 Bln',p_1t:'1 Thn',p_5t:'5 Thn',p_all:'All',zoom_hint:'Scroll to zoom · Drag to pan',total:'Total',gain:'Gain',loss:'Loss',logo_sub:'Personal Finance Tracker',ls_title:'Laporan Keuangan Pribadi',ls_sub:'Memuat data dari Supabase…'},
  en:{dashboard:'Dashboard',sb_laporan:'Financial Reports',laporan_pos:'Statement of Financial Position',sb_master:'Master Data',current_asset:'Current Assets',cash_equiv:'Cash Equivalents',non_current:'Non-Current Assets',investment:'Investments',hutang:'Debts',pengeluaran:'Expenses',pemasukan:'Income',total_aset:'Total Assets',total_cur:'Total Current Assets',non_cur:'Non-Current Assets',asset_today:"Today's Assets",growth_aset:'Asset Growth History',alokasi_total:'Total Asset Allocation',growth_recv:'Receivable Growth',inv_chart:'Investment Growth',alokasi_inv:'Investment Allocation',gain_loss:'Investment Gain/Loss',laporan_detail:'Detailed Report',ca_desc:'Cash, Bank & Platform Income',ar_title:'Accounts Receivable',inv_title:'Inventory',ppe_title:'Property, Plant & Equipment',intg_title:'Intangible Assets',inv_port:'Investment Portfolio',btn_pdf:'📄 Download PDF',btn_detail:'📋 Detail',btn_add:'+ Add',btn_cancel:'Cancel',btn_save:'Save',btn_del:'Delete',p_1b:'1 Mo',p_6b:'6 Mo',p_1t:'1 Yr',p_5t:'5 Yr',p_all:'All',zoom_hint:'Scroll to zoom · Drag to pan',total:'Total',gain:'Gain',loss:'Loss',logo_sub:'Personal Finance Tracker',ls_title:'Personal Financial Report',ls_sub:'Loading data from Supabase…'}
};
let lapCtx={fym:null,tym:null,label:''};
let APPSET={};
