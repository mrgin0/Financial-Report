// Chart Dashboard (growth aset, alokasi, investasi, dll)

function updateStats(){
  const ta=tAst(),tc=tCur(),tnc=tNC();
  setText('sv-tot',fRp(ta));setText('sv-cur',fRp(tc));setText('sv-nc',fRp(tnc));setText('sv-td',fRp(ta));
  const now=new Date();
  const curYM=now.toISOString().slice(0,7);
  const prevD=new Date(now.getFullYear(),now.getMonth()-1,1);
  const prevYM=prevD.getFullYear()+'-'+String(prevD.getMonth()+1).padStart(2,'0');
  const sup=(arr)=>arr.filter(x=>x.date&&ymOf(x.date)<=prevYM).reduce((a,x)=>a+(+x.amount),0);
  const pCa=sup(DB.ca),pAr=sup(DB.ar),pIi=sup(DB.ii),pPpe=sup(DB.ppe),pInt=sup(DB.intg),pInv=sup(DB.inv);
  const pCur=pCa+pAr+pIi,pNC=pPpe+pInt+pInv,pTa=pCur+pNC;
  const prevLbl=mLbl(prevYM+'-01');
  if(pTa>0||pCur>0){setChg('sc-tot',ta-pTa,pTa,prevLbl);setChg('sc-cur',tc-pCur,pCur,prevLbl);setChg('sc-nc',tnc-pNC,pNC,prevLbl);}
  else{
    const allOld=[...DB.ca,...DB.ar,...DB.ii,...DB.ppe,...DB.intg,...DB.inv].filter(x=>x.date&&ymOf(x.date)<curYM);
    if(allOld.length){const months=[...new Set(allOld.map(x=>ymOf(x.date)))].sort();const lym=months[months.length-1];const su2=(arr)=>arr.filter(x=>x.date&&ymOf(x.date)<=lym).reduce((a,x)=>a+(+x.amount),0);const lc=su2(DB.ca)+su2(DB.ar)+su2(DB.ii),ln=su2(DB.ppe)+su2(DB.intg)+su2(DB.inv),lt=lc+ln;setChg('sc-tot',ta-lt,lt,mLbl(lym+'-01'));setChg('sc-cur',tc-lc,lc,mLbl(lym+'-01'));setChg('sc-nc',tnc-ln,ln,mLbl(lym+'-01'));}
    else{['sc-tot','sc-cur','sc-nc'].forEach(id=>{const el=document.getElementById(id);if(el){el.className='sc-chg neu';el.textContent=LANG==='id'?'Belum ada data bulan sebelumnya':'No previous month data';}});}
  }
  const elTd=document.getElementById('sc-td');
  if(elTd){elTd.className='sc-chg neu';elTd.textContent='Update: '+now.toLocaleString('id-ID',{timeZone:'Asia/Makassar',weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})+' WITA';}
}
function setChg(id,diff,base,lbl){
  const el=document.getElementById(id);if(!el)return;
  const up=diff>=0;el.className='sc-chg '+(up?'up':'dn');
  const pct=base>0?((Math.abs(diff)/base)*100).toFixed(1)+'%':'—';
  el.textContent=(up?'↑ +':'↓ -')+fRp(Math.abs(diff))+' ('+pct+') vs '+lbl;
}
function buildMonthPts(){
  const allD=[...DB.ca,...DB.ar,...DB.ii,...DB.ppe,...DB.intg,...DB.inv].map(x=>x.date).filter(Boolean);
  if(!allD.length)return[];
  const months=[...new Set(allD.map(d=>d.slice(0,7)))].sort();
  const su=(arr,ym)=>arr.filter(x=>x.date&&x.date.slice(0,7)<=ym).reduce((a,x)=>a+(+x.amount),0);
  const suInv=(arr,ym)=>arr.filter(x=>x.date&&x.date.slice(0,7)<=ym).reduce((a,x)=>a+(+(x.total_buy||x.amount||0)),0);
  return months.map(ym=>{
    const ca=su(DB.ca,ym);
    const ar=DB.ar.filter(x=>x.date&&x.date.slice(0,7)<=ym).reduce((a,x)=>a+(+(x.amount||0))-(+(x.paid||0)),0);
    const ii=su(DB.ii,ym);
    const ppe=su(DB.ppe,ym),intg=su(DB.intg,ym),inv=suInv(DB.inv,ym);
    const cur=ca+ar+ii,nc=ppe+intg+inv;
    return{ym,snapshot_date:ym+'-28',total_asset:cur+nc,total_current:cur,total_non_current:nc,total_receivable:ar,total_investment:inv};
  });
}
function filterPts(period){
  const pts=buildMonthPts();
  const byM={};DB.snaps.forEach(s=>{byM[s.snapshot_date.slice(0,7)]=s;});
  const all=pts.map(p=>byM[p.ym]||p).sort((a,b)=>a.snapshot_date.localeCompare(b.snapshot_date));
  if(!all.length)return[];
  if(period==='all')return all;
  const now=new Date();let months=0;
  if(period==='7d'){const cut=new Date(now);cut.setDate(cut.getDate()-7);return all.filter(s=>new Date(s.snapshot_date+'T00:00:00')>=cut);}
  if(period==='1m')months=1;else if(period==='6m')months=6;else if(period==='1y')months=12;
  if(months){const cut=new Date(now.getFullYear(),now.getMonth()-months,1);return all.filter(s=>new Date(s.snapshot_date+'T00:00:00')>=cut);}
  return all;
}
function ptLabel(s){const d=new Date(s.snapshot_date+'T00:00:00');return d.toLocaleDateString('id-ID',{month:'short',year:'2-digit'});}
function initCharts(){
  ['growth','alok','invd','invg','gain','recv','recvPie'].forEach(k=>{if(CHS[k]){try{CHS[k].destroy();}catch(e){}delete CHS[k];}});
  // Growth Aset — 3 lines
  const gc=document.getElementById('c-growth');
  if(gc)CHS.growth=new Chart(gc.getContext('2d'),{type:'line',data:{labels:[],datasets:[
    {label:'Total Asset',data:[],borderColor:CHART_COLORS[0],backgroundColor:'rgba(37,99,235,.07)',tension:.4,pointRadius:3,fill:false,borderWidth:2.5},
    {label:'Current',data:[],borderColor:CHART_COLORS[1],tension:.4,pointRadius:2,fill:false,borderWidth:1.5,borderDash:[4,3]},
    {label:'Non-Current',data:[],borderColor:CHART_COLORS[2],tension:.4,pointRadius:2,fill:false,borderWidth:1.5,borderDash:[4,3]},
  ]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:true,position:'bottom',labels:{usePointStyle:true,font:{size:9},boxWidth:7,color:'#94a3b8'}},tooltip:TT,zoom:zoomPlugin},scales:SC()}});

  // Receivable
  const rc=document.getElementById('c-recv');
  if(rc)CHS.recv=new Chart(rc.getContext('2d'),{type:'line',data:{labels:[],datasets:[{label:'Total Receivable',data:[],borderColor:CHART_COLORS[1],backgroundColor:'rgba(34,197,94,.08)',tension:.4,pointRadius:3,fill:true,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:true,position:'bottom',labels:{usePointStyle:true,font:{size:9},boxWidth:7,color:'#94a3b8'}},tooltip:TT,zoom:zoomPlugin},scales:SC()}});

  // Investment Growth — multi-line per instrument (Point 6)
  const ic=document.getElementById('c-invg');
  if(ic)CHS.invg=new Chart(ic.getContext('2d'),{type:'line',data:{labels:[],datasets:[]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:true,position:'bottom',labels:{usePointStyle:true,font:{size:9},boxWidth:7,color:'#94a3b8'}},tooltip:{...TT,mode:'index',intersect:false},zoom:zoomPlugin},scales:SC()}});

  // Gain
  const gainc=document.getElementById('c-gain');
  if(gainc)CHS.gain=new Chart(gainc.getContext('2d'),{type:'bar',data:{labels:[],datasets:[{label:'Gain/Loss',data:[],backgroundColor:[],borderColor:[],borderWidth:1.5,borderRadius:3,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{...TT,callbacks:{label:c=>(c.parsed.y>=0?'Gain: +':'Loss: ')+fRp(Math.abs(c.parsed.y))}},zoom:zoomPlugin},scales:{...SC(),y:{ticks:{font:{size:9},color:'#94a3b8',callback:v=>(v>=0?'+':'')+fRp(Math.abs(v))},grid:{color:'rgba(0,0,0,.04)'}}}}});

  refreshCharts();
  updateAlokasiChart();
  updateInvDChart();
  updateRecvPieChart();
}
function resetZoom(key){if(CHS[key])CHS[key].resetZoom();}
function refreshCharts(){
  setPeriod('growth',AP.growth,null);
  setPeriod('recv',AP.recv,null);
  setPeriod('invg',AP.invg,null);
  setPeriod('gain',AP.gain,null);
}
function setPeriod(type,period,btn){
  AP[type]=period;
  if(btn){document.querySelectorAll('#pb-'+type+' .pb').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
  const pts=filterPts(period);
  const labels=pts.map(ptLabel);
  if(type==='growth'&&CHS.growth){
    CHS.growth.data.labels=labels;
    CHS.growth.data.datasets[0].data=pts.map(s=>+(+s.total_asset).toFixed(0));
    CHS.growth.data.datasets[1].data=pts.map(s=>+(+(s.total_current||0)).toFixed(0));
    CHS.growth.data.datasets[2].data=pts.map(s=>+(+(s.total_non_current||0)).toFixed(0));
    CHS.growth.update();
  }
  if(type==='recv'&&CHS.recv){
    CHS.recv.data.labels=labels;
    CHS.recv.data.datasets[0].data=pts.map(s=>+(+(s.total_receivable||0)).toFixed(0));
    CHS.recv.update();
  }
  if(type==='invg'&&CHS.invg){
    const names=[...new Set(DB.inv.map(x=>x.name))];
    CHS.invg.data.labels=labels;

    const perNameDatasets=names.map((name,i)=>{
      const color=CHART_COLORS[(i+1)%CHART_COLORS.length];
      let lastVal=null;
      const data=pts.map(p=>{
        // p.ym exists for synthetic points, for real snapshots use snapshot_date
        const ptYM=p.ym||p.snapshot_date.slice(0,7);
        const items=DB.inv.filter(x=>x.name===name&&x.date&&x.date.slice(0,7)<=ptYM);
        if(items.length>0){
          lastVal=items.reduce((a,x)=>a+(+(x.total_buy||x.amount||0)),0);
        }
        // carry-forward: return lastVal (null means no data yet → Chart.js skips)
        return lastVal;
      });
      return{label:name,data,borderColor:color,backgroundColor:'transparent',
             tension:.4,pointRadius:2,fill:false,borderWidth:1.8,spanGaps:true};
    });

    // Total line first (behind others)
    const totalLine={
      label:'Total Investment',
      data:pts.map(p=>{
        const ptYM=p.ym||p.snapshot_date.slice(0,7);
        // Sum all investments up to this month for total
        return DB.inv.filter(x=>x.date&&x.date.slice(0,7)<=ptYM)
                     .reduce((a,x)=>a+(+(x.total_buy||x.amount||0)),0)||
               +(+(p.total_investment||0)).toFixed(0);
      }),
      borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.06)',
      tension:.4,pointRadius:3,fill:true,borderWidth:2.5,spanGaps:true
    };

    CHS.invg.data.datasets=[totalLine,...perNameDatasets];
    CHS.invg.update();
  }
  if(type==='gain'&&CHS.gain){
    let items=[...DB.inv];
    if(period!=='all'&&items.length){
      let cut=null;
      if(period==='7d'){cut=new Date();cut.setDate(cut.getDate()-7);}
      else if(period==='1m'){cut=new Date(new Date().getFullYear(),new Date().getMonth()-1,1);}
      else if(period==='6m'){cut=new Date(new Date().getFullYear(),new Date().getMonth()-6,1);}
      else if(period==='1y'){cut=new Date(new Date().getFullYear()-1,new Date().getMonth(),1);}
      if(cut){cut.setHours(0,0,0,0);items=items.filter(x=>{if(!x.date)return true;return new Date(x.date+'T00:00:00')>=cut;});}
    }
    const data=items.map(i=>+(+i.gain).toFixed(0));
    CHS.gain.data.labels=items.map(i=>i.name.length>12?i.name.slice(0,12)+'…':i.name);
    CHS.gain.data.datasets[0].data=data;
    CHS.gain.data.datasets[0].backgroundColor=data.map(v=>v>=0?'rgba(34,197,94,.85)':'rgba(239,68,68,.85)');
    CHS.gain.data.datasets[0].borderColor=data.map(v=>v>=0?'#16a34a':'#dc2626');
    CHS.gain.update();
  }
}
function updateAlokasiChart(){
  const COLS=['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
  const items=[{l:'Kas/Bank',v:sCA(),c:COLS[0]},{l:'Receivable',v:sAR(),c:COLS[1]},{l:'Inventory',v:sII(),c:COLS[2]},{l:'PPE',v:sPPE(),c:COLS[3]},{l:'Investment',v:sINV(),c:COLS[4]},{l:'Intangible',v:sINT(),c:COLS[5]}].filter(x=>x.v>0);
  const tot=tAst();setText('alok-tot',fRp(tot));
  const el=document.getElementById('alok-leg');
  if(el)el.innerHTML=items.map(d=>`<div class="lgrow"><div class="lgdot" style="background:${d.c}"></div><span class="lgnm">${d.l}</span><span class="lgpct">${tot?((d.v/tot)*100).toFixed(1):0}%</span><span class="lgval">${fRp(d.v)}</span></div>`).join('');
  const ctx=document.getElementById('c-alok');if(!ctx)return;
  if(CHS.alok){CHS.alok.data.labels=items.map(d=>d.l);CHS.alok.data.datasets[0].data=items.map(d=>d.v);CHS.alok.data.datasets[0].backgroundColor=items.map(d=>d.c);CHS.alok.update();}
  else{CHS.alok=new Chart(ctx.getContext('2d'),{type:'doughnut',data:{labels:items.map(d=>d.l),datasets:[{data:items.map(d=>d.v),backgroundColor:items.map(d=>d.c),borderWidth:2,hoverOffset:5}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.parsed)}`}}}}});}
}
function updateInvDChart(){
  const COLS=CHART_COLORS;
  const tot=sINV();setText('invd-tot',fRp(tot));
  // Group by name
  const byName={};DB.inv.forEach(x=>{byName[x.name]=(byName[x.name]||0)+(+x.amount);});
  const items=Object.entries(byName).map(([n,v],i)=>({l:n,v,c:COLS[i%COLS.length]})).filter(x=>x.v>0);
  const el=document.getElementById('invd-leg');
  if(el)el.innerHTML=items.map(d=>`<div class="lgrow"><div class="lgdot" style="background:${d.c}"></div><span class="lgnm">${d.l}</span><span class="lgpct">${tot?((d.v/tot)*100).toFixed(1):0}%</span><span class="lgval">${fRp(d.v)}</span></div>`).join('');
  const ctx=document.getElementById('c-invd');if(!ctx)return;
  if(CHS.invd){CHS.invd.data.labels=items.map(d=>d.l);CHS.invd.data.datasets[0].data=items.map(d=>d.v);CHS.invd.data.datasets[0].backgroundColor=items.map(d=>d.c);CHS.invd.update();}
  else{CHS.invd=new Chart(ctx.getContext('2d'),{type:'doughnut',data:{labels:items.map(d=>d.l),datasets:[{data:items.map(d=>d.v),backgroundColor:items.map(d=>d.c),borderWidth:2,hoverOffset:4}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.parsed)}`}}}}});}
}
function updateRecvPieChart(){
  const COLS=['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];
  // Group by name, use outstanding sisa
  const byName={};
  DB.ar.forEach(r=>{
    const sisa=Math.max(0,(+(r.amount||0))-(+(r.paid||0)));
    if(sisa>0)byName[r.name]=(byName[r.name]||0)+sisa;
  });
  const items=Object.entries(byName).map(([n,v],i)=>({l:n,v,c:COLS[i%COLS.length]}));
  const tot=items.reduce((a,x)=>a+x.v,0);
  setText('recv-pie-tot',fRp(tot));
  const legEl=document.getElementById('recv-pie-leg');
  if(legEl)legEl.innerHTML=items.map(d=>`<div class="lgrow"><div class="lgdot" style="background:${d.c}"></div><span class="lgnm">${d.l}</span><span class="lgpct">${tot?((d.v/tot)*100).toFixed(1):0}%</span><span class="lgval">${fRp(d.v)}</span></div>`).join('');
  const ctx=document.getElementById('c-recv-pie');if(!ctx)return;
  if(CHS.recvPie){
    CHS.recvPie.data.labels=items.map(d=>d.l);
    CHS.recvPie.data.datasets[0].data=items.map(d=>d.v);
    CHS.recvPie.data.datasets[0].backgroundColor=items.map(d=>d.c);
    CHS.recvPie.update();
  } else {
    CHS.recvPie=new Chart(ctx.getContext('2d'),{
      type:'doughnut',
      data:{labels:items.map(d=>d.l),datasets:[{data:items.map(d=>d.v),backgroundColor:items.map(d=>d.c),borderWidth:2,hoverOffset:4}]},
      options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fRp(c.parsed)}`}}}}
    });
  }
}
function updateAll(){
  updateStats();updateAlokasiChart();updateInvDChart();updateRecvPieChart();refreshCharts();
  const dym=document.getElementById('dash-pick')?.value;if(dym)onDashMonth(dym,'update');
  reRender();
}
