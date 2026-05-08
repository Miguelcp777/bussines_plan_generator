
// ===== STATE =====
const S = {
  raw:[], cRev:{}, churn:new Set(), risks:[], opps:[], assumps:[],
  filt:{clusters:new Set(),countries:new Set(),platforms:new Set(),revTypes:new Set(),search:''},
  sort:{col:'_rev',dir:'desc'}, page:1, ps:50, charts:{}, iCharts:{}, _cmpData:null, _undo:[], _redo:[]
};
const TITLES={BP:{t:'Business Plan',s:'Annual Revenue Forecast & Strategic Overview'},JU:{t:'June Update',s:'Mid-Year Revenue Review & Forecast Adjustment'},NU:{t:'November Update',s:'Year-End Revenue Review & Forward Planning'}};
const COLORS=['#c62828','#1565c0','#2e7d32','#e65100','#6a1b9a','#00695c','#37474f','#4e342e','#880e4f','#1a237e','#f57f17','#00796b'];
const NET_URL='file:////awsusdjpfsxn01.jnj.com/bitab_cloud_storage/JJSV/EMEA%20Tableau%20input/Projects/Install_base_SAP/alteryx_output_zrsm0007.csv';

// ===== HELPERS =====
function $(id){return document.getElementById(id)}
function setText(id,v){const e=$(id);if(e)e.textContent=v}
function fmt(n){return'$'+Math.abs(n||0).toLocaleString('en-US',{maximumFractionDigits:0})}
function fmtK(n){return n>=1000?'$'+(n/1000).toFixed(0)+'K':'$'+Math.round(n)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function groupBy(arr,key,fn){const r={};arr.forEach(row=>{const k=row[key]||'Unknown';r[k]=(r[k]||0)+fn(row);});return r}
function emptyRow(cols,msg='No data'){return`<tr><td colspan="${cols}" style="text-align:center;color:#999;padding:18px;font-style:italic">${msg}</td></tr>`}
function isHX(r){return r._days!==null&&r._days<-356}
function getRev(r){return S.cRev[r._id]!==undefined?S.cRev[r._id]:r._rev}

// ===== REPORT NAME =====
function copyPath(){
  const path=$('uncPath').textContent.trim();
  navigator.clipboard.writeText(path).then(()=>{
    const btn=$('btnCopy');btn.textContent='✓ Copied!';btn.style.color='var(--grn)';
    setTimeout(()=>{btn.textContent='📋 Copy path';btn.style.color='';},2000);
  }).catch(()=>{
    // fallback
    const ta=document.createElement('textarea');ta.value=path;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    const btn=$('btnCopy');btn.textContent='✓ Copied!';
    setTimeout(()=>{btn.textContent='📋 Copy path';},2000);
  });
}


// ===== LOCALSTORAGE SESSION =====
const LS_KEY='jjv_bp_session';

function autoSave(){
  if(!S.raw.length)return;
  try{
    localStorage.setItem(LS_KEY,JSON.stringify({
      v:2,
      reportType:$('rnType').value, reportYear:$('rnYear').value,
      savedAt:new Date().toISOString(),
      csv:S._csv||'',
      churn:[...S.churn], cRev:S.cRev,
      risks:S.risks, opps:S.opps, assumps:S.assumps||[],
      filters:{
        clusters:[...S.filt.clusters],countries:[...S.filt.countries],
        platforms:[...S.filt.platforms],revTypes:[...S.filt.revTypes],
        search:S.filt.search
      }
    }));
    const btn=$('btnSave');
    btn.textContent='✓ Saved';
    setTimeout(()=>{btn.textContent='💾 Save';},1500);
  }catch(e){}
}

function restoreSession(){
  try{
    const st=JSON.parse(localStorage.getItem(LS_KEY));
    if(!st||!st.csv)return;
    if(st.reportType)$('rnType').value=st.reportType;
    if(st.reportYear)$('rnYear').value=st.reportYear;
    updateRN();
    S._csv=st.csv;
    Papa.parse(st.csv,{header:true,skipEmptyLines:true,complete:res=>{
      S.raw=res.data.map((r,i)=>{
        const rev=parseFloat(r.USD_annual_amount)||0;
        const d=r.days_to_contract_renew;
        const days=(d===''||d==null||d==='not_contract')?null:parseInt(d);
        return{...r,_id:i,_rev:rev,_days:isNaN(days)?null:days};
      });
      S.churn=new Set(st.churn||[]);
      S.cRev=st.cRev||{};
      S.risks=st.risks||[];
      S.opps=st.opps||[];
      S.assumps=st.assumps||[];
      const fl=st.filters||{};
      S.filt.clusters=new Set(fl.clusters||[]);
      S.filt.countries=new Set(fl.countries||[]);
      S.filt.platforms=new Set(fl.platforms||[]);
      S.filt.revTypes=new Set(fl.revTypes||[]);
      S.filt.search=fl.search||'';
      S.page=1;
      initFilts();renderAll();renderRisks();renderOpps();
      $('uploadZone').style.display='none';
      $('appContent').classList.add('on');
      $('btnGen').disabled=false;$('btnSave').classList.add('on');
      S.insightsDirty=true;
    }});
  }catch(e){alert('Error restoring: '+e.message);}
}

function clearSaved(){
  localStorage.removeItem(LS_KEY);
  $('lsBanner').style.display='none';
}

// Check for saved session on load
(function(){
  try{
    const st=JSON.parse(localStorage.getItem(LS_KEY));
    if(!st||!st.csv)return;
    const d=new Date(st.savedAt).toLocaleString('en-GB');
    $('lsInfo').textContent=`${st.reportType}${st.reportYear} · Saved ${d}`;
    $('lsBanner').style.display='flex';
  }catch(e){}
})();


function updateInsight(f,sm){
  const el=$('sysInsight');if(!el)return;
  if(!f||!f.length){el.className='sys-insight';return;}

  const inScope=f.filter(r=>!isHX(r));
  const retained=inScope.filter(r=>!S.churn.has(r._id));
  const difficult=f.filter(r=>isHX(r));
  const base=sm.base,retRev=sm.retRev,chnRev=sm.chnRev;
  const rnRate=base>0?((retRev/base)*100).toFixed(1):0;
  const chRate=base>0?((chnRev/base)*100).toFixed(1):0;
  const rnCls=rnRate>=80?'si-hi':rnRate>=60?'si-wa':'si-lo';
  const chCls=chRate<=10?'si-hi':chRate<=25?'si-wa':'si-lo';

  // Helper: avg revenue per system by key, only revenue>0
  function avgMap(rows,key){
    const m={};
    rows.forEach(r=>{const k=r[key]||'?';const v=getRev(r);if(v>0){if(!m[k])m[k]={s:0,n:0};m[k].s+=v;m[k].n++;}});
    const out={};Object.entries(m).forEach(([k,d])=>{if(d.n>0)out[k]=d.s/d.n;});
    return out;
  }

  // Global baseline (all countries, all in-scope, not HX)
  const allBase=S.raw.filter(r=>!isHX(r));
  const allPlatAvg=avgMap(allBase,'Platform');
  const allCovAvg=avgMap(allBase,'Coverage_type');
  const selPlatAvg=avgMap(retained,'Platform');
  const selCovAvg=avgMap(retained,'Coverage_type');

  // Build benchmark sentence for a key
  function benchLine(selA,allA,label){
    const entries=Object.entries(selA).sort((a,b)=>b[1]-a[1]);
    if(!entries.length)return'';
    const lines=entries.map(([k,sv])=>{
      const av=allA[k];
      if(!av)return'';
      const pct=((sv-av)/av*100);
      const sign=pct>=0?'+':'';
      const cls=pct>0?'si-hi':pct<0?'si-lo':'si-wa';
      return '<strong>'+esc(k)+'</strong>: '+fmtK(sv)+' vs '+fmtK(av)+' total (<span class="'+cls+'">'+sign+pct.toFixed(1)+'%</span>)';
    }).filter(Boolean);
    if(!lines.length)return'';
    return '<br><span style="color:var(--mut);font-size:0.78rem;display:block;margin-top:5px">'+
      '<span style="color:var(--txt);font-weight:600">'+label+':</span> '+lines.join(' &nbsp;·&nbsp; ')+'</span>';
  }

  // Top platform by total revenue
  const platRevMap={};retained.forEach(r=>{const p=r.Platform||'Other';platRevMap[p]=(platRevMap[p]||0)+getRev(r);});
  const topPlat=Object.entries(platRevMap).sort((a,b)=>b[1]-a[1])[0];

  // Critical contracts (<90d)
  const critical=inScope.filter(r=>r._days!==null&&r._days>=0&&r._days<90);
  const critRev=critical.reduce((s,r)=>s+getRev(r),0);
  const tmCount=inScope.filter(r=>isTM(r)).length;

  let parts=[];
  parts.push('Scope: <strong>'+f.length+' systems</strong> ('+inScope.length+' in scope'+(difficult.length?', <span class="si-wa">'+difficult.length+' excl. &gt;1Y</span>':'')+').');
  parts.push('Base <span class="si-bl">'+fmt(base)+'</span> &rarr; retained <span class="'+rnCls+'">'+fmt(retRev)+' ('+rnRate+'%)</span> · churn <span class="'+chCls+'">'+fmt(chnRev)+' ('+chRate+'%)</span>.');
  if(topPlat)parts.push('Top platform: <strong>'+esc(topPlat[0])+'</strong> '+fmt(topPlat[1])+'.');
  if(critical.length)parts.push('<span class="si-wa">'+critical.length+' system'+(critical.length>1?'s':'')+' &lt;90 days</span> ('+fmt(critRev)+' at stake).');
  if(tmCount)parts.push('<span class="si-wa">'+tmCount+' T&amp;M excluded</span>.');
  if(sm.riskW>0)parts.push('Risk: <span class="si-lo">'+fmt(sm.riskW)+'</span>.');
  if(sm.oppUp>0)parts.push('Upside: <span class="si-hi">'+fmt(sm.oppUp)+'</span>.');
  parts.push('Net: <strong class="si-bl">'+fmt(sm.net)+'</strong>.');
  if(S.assumps.length)parts.push('Assumptions logged: <span class="si-wa">'+S.assumps.length+'</span> ('+(S.assumps.map(a=>a.cat).filter((v,i,arr)=>arr.indexOf(v)===i).join(', '))+').');

  const benchPlat=benchLine(selPlatAvg,allPlatAvg,'Avg/system by Platform vs all-countries');
  const benchCov=benchLine(selCovAvg,allCovAvg,'Avg/system by Coverage vs all-countries');

  el.innerHTML=parts.join(' ')+benchPlat+benchCov;
  el.className='sys-insight on';
}

// ===== ASSUMPTIONS =====
function addAssump(){
  const cat=$('asCat').value,txt=$('asTxt').value.trim();
  if(!txt)return;
  pushHistory();
  S.assumps.push({id:Date.now(),cat,txt});
  $('asTxt').value='';
  renderAssumps();renderAll();
}
function delAssump(id){pushHistory();S.assumps=S.assumps.filter(a=>a.id!==id);renderAssumps();renderAll();}
function renderAssumps(){
  setText('assumpCount',S.assumps.length);setText('bdgAssump',S.assumps.length);
  const body=$('assumpBody');if(!body)return;
  if(!S.assumps.length){body.innerHTML='<div class="assump-empty">No assumptions added yet.</div>';return;}
  body.innerHTML=S.assumps.map(a=>'<div class="assump-item">'
    +'<span class="assump-cat-badge">'+esc(a.cat)+'</span>'
    +'<div class="assump-body">'+esc(a.txt)+'</div>'
    +'<button class="bsm dng" onclick="delAssump('+a.id+')">✕</button>'
    +'</div>').join('');
}
function updateRN(){const t=$('rnType').value,y=$('rnYear').value;$('rnPrev').textContent=t+y}

// ===== NETWORK LOAD =====
async function tryNetLoad(){
  const ns=$('netStatus');
  ns.style.color='var(--mut)';ns.textContent='⟳ Connecting to network share...';
  try{
    const resp=await Promise.race([
      fetch(NET_URL,{cache:'no-store'}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),8000))
    ]);
    if(!resp.ok)throw new Error('HTTP '+resp.status);
    const text=await resp.text();
    ns.style.color='var(--grn)';ns.textContent='✓ Network file loaded successfully';
    parseText(text);
  }catch(e){
    if(e.message==='timeout'){ns.style.color='var(--org)';ns.textContent='⚠ Connection timed out. Load manually below.';}
    else{ns.style.color='var(--org)';ns.textContent='⚠ Auto-load unavailable (browser security restriction). Load manually.';}
  }
}

// ===== FILE HANDLING =====
const dz=$('dropZone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag')});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag');const f=e.dataTransfer.files[0];if(f)parseFile(f)});
function handleFile(e){const f=e.target.files[0];if(f)parseFile(f)}

function parseFile(file){
  const r2=new FileReader();r2.onload=e=>{S._csv=e.target.result;};r2.readAsText(file,'ISO-8859-1');
  Papa.parse(file,{header:true,skipEmptyLines:true,encoding:'ISO-8859-1',complete:res=>parseRows(res.data)});
}
function parseText(text){
  S._csv=text;
  Papa.parse(text,{header:true,skipEmptyLines:true,complete:res=>parseRows(res.data)});
}
function isTM(r){return !!(r.Coverage_type&&r.Coverage_type.toUpperCase().includes('T&M'))}
function parseRows(data){
  S.raw=data.map((r,i)=>{
    const rev=parseFloat(r.USD_annual_amount)||0;
    const d=r.days_to_contract_renew;
    const days=(d===''||d==null||d==='not_contract')?null:parseInt(d);
    return{...r,_id:i,_rev:rev,_days:isNaN(days)?null:days};
  });
  S.churn.clear();S.cRev={};S.page=1;
  // T&M contracts default to churn — revenue excluded
  S.raw.forEach(r=>{if(isTM(r))S.churn.add(r._id)});
  initFilts();renderAll();
  $('uploadZone').style.display='none';
  $('appContent').classList.add('on');
  $('btnGen').disabled=false;$('btnSave').classList.add('on');
}

// ===== FILTERS =====
function initFilts(){
  const uniq=k=>[...new Set(S.raw.map(r=>r[k]).filter(Boolean))].sort();
  buildFL('fCluster',uniq('Cluster'),'clusters',r=>r.Cluster);
  buildFL('fCountry',uniq('Country'),'countries',r=>r.Country);
  buildFL('fPlatform',uniq('Platform'),'platforms',r=>r.Platform);
  buildFL('fRevType',uniq('Direct_vs_bundle_revenue'),'revTypes',r=>r.Direct_vs_bundle_revenue);
}
function buildFL(id,vals,key,fn){
  $(id).innerHTML=vals.map(v=>{
    const c=S.raw.filter(r=>fn(r)===v).length;
    return`<label class="fi"><input type="checkbox" value="${esc(v)}" onchange="onCB(this,'${key}')"><span>${esc(v)}</span><span class="fc-n">${c}</span></label>`;
  }).join('');
}
function onCB(cb,key){if(cb.checked)S.filt[key].add(cb.value);else S.filt[key].delete(cb.value);S.page=1;renderAll()}
function onFilt(){S.filt.search=$('srch').value.trim().toLowerCase();S.page=1;renderAll()}
function clearFilts(){
  ['clusters','countries','platforms','revTypes'].forEach(k=>S.filt[k].clear());
  S.filt.search='';$('srch').value='';
  document.querySelectorAll('.fl input[type=checkbox]').forEach(cb=>cb.checked=false);
  S.page=1;renderAll();
}

// ===== DATA =====
function getFiltered(){
  return S.raw.filter(r=>{
    if(S.filt.clusters.size&&!S.filt.clusters.has(r.Cluster))return false;
    if(S.filt.countries.size&&!S.filt.countries.has(r.Country))return false;
    if(S.filt.platforms.size&&!S.filt.platforms.has(r.Platform))return false;
    if(S.filt.revTypes.size&&!S.filt.revTypes.has(r.Direct_vs_bundle_revenue))return false;
    if(S.filt.search){
      const q=S.filt.search;
      if(!r.account_name?.toLowerCase().includes(q)&&!r.Serial_number?.toLowerCase().includes(q)&&!r.Country?.toLowerCase().includes(q))return false;
    }
    return true;
  });
}

function calcSummary(filtered){
  const inScope=filtered.filter(r=>!isHX(r));
  const difficult=filtered.filter(r=>isHX(r));
  const base=inScope.reduce((s,r)=>s+getRev(r),0);
  const diffRev=difficult.reduce((s,r)=>s+getRev(r),0);
  const churned=inScope.filter(r=>S.churn.has(r._id));
  const retained=inScope.filter(r=>!S.churn.has(r._id));
  const retRev=retained.reduce((s,r)=>s+getRev(r),0);
  const chnRev=churned.reduce((s,r)=>s+getRev(r),0);
  const riskW=S.risks.reduce((s,r)=>s+((r.prob/100)*r.impact),0);
  const oppUp=S.opps.reduce((s,o)=>s+o.revenue,0);
  return{base,diffRev,retRev,chnRev,riskW,oppUp,net:retRev-riskW+oppUp,
    chnCnt:churned.length,retCnt:retained.length,diffCnt:difficult.length,
    inScopeCount:inScope.length,totalCount:filtered.length};
}

// ===== RENDER ALL =====
function renderAll(){
  autoSave();
  const f=getFiltered();
  const sm=calcSummary(f);
  updateBar(f,sm);renderTable(f,sm);updateBadges(f);updateScope();updateInsight(f,sm);
  // Mark insights as dirty
  S.insightsDirty=true;
}

function updateBar(f,sm){
  setText('kBase',fmt(sm.base));setText('kBaseSub',`${sm.inScopeCount} systems in scope`);
  setText('kRet',fmt(sm.retRev));setText('kRetSub',`${sm.retCnt} renewing`);
  setText('kChurn',sm.chnRev>0?'-'+fmt(sm.chnRev):'$0');setText('kChurnSub',`${sm.chnCnt} systems lost`);
  setText('kDiff',sm.diffRev>0?fmt(sm.diffRev):'$0');setText('kDiffSub',`${sm.diffCnt} systems expired >1Y`);
  setText('kRisk',sm.riskW>0?'-'+fmt(sm.riskW):'$0');
  setText('kOpp',sm.oppUp>0?'+'+fmt(sm.oppUp):'$0');setText('kOppSub',`${S.opps.length} opportunities`);
  setText('kNet',fmt(sm.net));
  // HX banner
  const banner=$('hxBanner');
  if(sm.diffCnt>0){banner.style.display='flex';setText('hxCount',sm.diffCnt);setText('hxRev',fmt(sm.diffRev));}
  else banner.style.display='none';
}
function updateScope(){
  const cl=[...S.filt.clusters],co=[...S.filt.countries];
  setText('kScope',cl.length?cl.join(', '):co.length?co.join(', '):'All Regions');
  const det=[];
  if(S.filt.platforms.size)det.push([...S.filt.platforms].join(', '));
  if(S.filt.revTypes.size)det.push([...S.filt.revTypes].join(' · '));
  setText('kScopeD',det.join(' · ')||'–');
}
function updateBadges(f){setText('bdgSys',f.length);setText('bdgRisk',S.risks.length);setText('bdgOpp',S.opps.length);setText('bdgAssump',S.assumps.length);setText('assumpCount',S.assumps.length)}

// ===== TABLE =====
let sortState={col:'_rev',dir:'desc'};
function doSort(col){
  if(sortState.col===col)sortState.dir=sortState.dir==='asc'?'desc':'asc';
  else{sortState.col=col;sortState.dir='desc';}
  S.page=1;renderTable();
}
function getSorted(data){
  const{col,dir}=sortState;
  return[...data].sort((a,b)=>{
    let av=col==='_rev'?getRev(a):col==='_days'?(a._days??99999):(a[col]??'');
    let bv=col==='_rev'?getRev(b):col==='_days'?(b._days??99999):(b[col]??'');
    if(typeof av==='number')return dir==='asc'?av-bv:bv-av;
    return dir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
  });
}

function renderTable(filtered,sm){
  filtered=filtered||getFiltered();
  const showHX=$('showHX')?.checked;
  const display=showHX?filtered:filtered.filter(r=>!isHX(r));
  const sorted=getSorted(display);
  const total=sorted.length;
  const pages=Math.max(1,Math.ceil(total/S.ps));
  if(S.page>pages)S.page=pages;
  const start=(S.page-1)*S.ps;
  const page=sorted.slice(start,start+S.ps);
  // Use pre-calculated summary or recalc
  const fSm=sm||calcSummary(filtered);
  const renewing=filtered.filter(r=>!isHX(r)&&!S.churn.has(r._id)).length;
  const churning=filtered.filter(r=>!isHX(r)&&S.churn.has(r._id)).length;
  setText('tbShow',page.length);setText('tbTotal',total);setText('tbRenew',renewing);setText('tbChurn',churning);
  setText('pagInfo',`Page ${S.page} of ${pages}`);setText('pagN',S.page);
  $('btnPrev').disabled=S.page<=1;$('btnNext').disabled=S.page>=pages;

  const tbody=$('sysTbody');
  if(!page.length){tbody.innerHTML=`<tr><td colspan="11"><div class="empty-st">No systems match.<p>Adjust the filter criteria on the left.</p></div></td></tr>`;return}

  tbody.innerHTML=page.map(r=>{
    const hx=isHX(r);
    const isChurn=S.churn.has(r._id);
    const rev=getRev(r);
    const rt=r.Direct_vs_bundle_revenue||'';
    const tbc=rt==='Direct_revenue'?'dir':rt==='Bundle_revenue'?'bun':'oth';
    const tbl=rt==='Direct_revenue'?'Direct':rt==='Bundle_revenue'?'Bundle':'Other';
    const end=r.end_date&&r.end_date!=='not_contract'?r.end_date:'–';
    const rowCls=hx?'hx-row':'';
    const rowOp=(isChurn&&!hx)?'opacity:.42;':'';
    const revStr=rev>0?'$'+rev.toLocaleString('en-US',{maximumFractionDigits:0}):'<span style="color:var(--dim)">$0</span>';
    const daysBadge=fmtDays(r._days,hx);
    const tm=isTM(r)&&!hx;
    const toggleHtml=hx
      ?`<span class="db hx">Excl.</span>`
      :`<div class="tgl-w"><label class="tgl"><input type="checkbox" ${isChurn?'':'checked'} onchange="tglChurn(${r._id},this)"><span class="tgl-s"></span></label><span class="tgl-l" style="color:${isChurn?'var(--red)':'var(--grn)'}">${isChurn?'Churn':'Renew'}</span>${tm?'<span class="db hx" style="font-size:.62rem;margin-left:4px">T&M</span>':''}</div>`;
    return`<tr class="${rowCls}" style="${rowOp}">
      <td>${toggleHtml}</td>
      <td><strong>${esc(r.account_name||'–')}</strong></td>
      <td class="mu">${esc(r.Country||'–')}</td>
      <td class="mu">${esc(r.Cluster||'–')}</td>
      <td><strong>${esc(r.Platform||'–')}</strong></td>
      <td class="mo">${esc(r.Serial_number||'–')}</td>
      <td class="mu" style="font-size:.76rem">${esc(r.Coverage_type||'–')}</td>
      <td class="mu">${esc(end)}</td>
      <td>${daysBadge}</td>
      <td><div class="rc"><span class="rv" id="rv_${r._id}">${revStr}</span><button class="re" onclick="editRev(${r._id})" title="Override revenue">✏</button></div></td>
      <td><span class="tb ${tbc}">${tbl}</span></td>
    </tr>`;
  }).join('');
}

function fmtDays(d,hx){
  if(hx)return`<span class="db hx">${d}d</span>`;
  if(d===null||isNaN(d))return`<span class="db na">N/A</span>`;
  if(d<0)return`<span class="db exp">${d}d</span>`;
  if(d<90)return`<span class="db urg">${d}d</span>`;
  if(d<365)return`<span class="db ok">${d}d</span>`;
  return`<span class="db fut">${d}d</span>`;
}

// ===== CHURN =====
function tglChurn(id,cb){pushHistory();if(!cb.checked)S.churn.add(id);else S.churn.delete(id);renderAll()}
function setAll(renew){pushHistory();getFiltered().filter(r=>!isHX(r)).forEach(r=>{if(renew)S.churn.delete(r._id);else S.churn.add(r._id)});renderAll()}

// ===== REVENUE OVERRIDE =====
function editRev(id){
  const r=S.raw.find(x=>x._id===id);if(!r)return;
  const cur=getRev(r);const cell=$('rv_'+id);if(!cell)return;
  cell.parentElement.innerHTML=`<input class="ri" type="number" value="${cur}" onblur="saveRev(${id},this.value)" onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape')renderTable();" autofocus>`;
}
function saveRev(id,val){
  const n=parseFloat(val);
  pushHistory();
  if(!isNaN(n)&&n>=0)S.cRev[id]=n;else delete S.cRev[id];
  renderAll();
}

// ===== PAGINATION =====
function goPage(dir){
  const f=getFiltered();const pages=Math.max(1,Math.ceil(f.length/S.ps));
  S.page=Math.max(1,Math.min(S.page+dir,pages));renderTable(f);
}

// ===== TABS =====
function swTab(name,btn){
  document.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('act'));
  btn.classList.add('act');
  ['tabSystems','tabRisks','tabOpps','tabInsights','tabAssump'].forEach(id=>{const e=$(id);if(e){e.classList.remove('act');e.style.display='none'}});
  const map={systems:'tabSystems',risks:'tabRisks',opps:'tabOpps',insights:'tabInsights',assump:'tabAssump'};
  const el=$(map[name]);el.style.display='flex';el.classList.add('act');
  if(name==='insights'&&S.insightsDirty)renderInsights();
}

// ===== AUTOCOMPLETE =====
function acSearch(input,ctx){
  const q=input.value.toLowerCase().trim();
  const ddId=ctx==='risk'?'rDD':'oDD';
  if(!S.raw.length||q.length<2){hideDD(ddId);return}
  const matches=S.raw.filter(r=>
    r.Serial_number?.toLowerCase().includes(q)||r.account_name?.toLowerCase().includes(q)
  ).slice(0,14);
  const dd=$(ddId);
  if(!matches.length){dd.innerHTML='<div class="ac-empty">No systems found</div>';dd.classList.add('on');return}
  dd.innerHTML=matches.map(r=>{
    const rev=getRev(r);
    const hxTag=isHX(r)?'<span style="color:var(--red);font-size:0.68rem"> ⚠ Expired>1Y</span>':'';
    return`<div class="ac-item" onmousedown="selSys(${r._id},'${ctx}')">
      <div class="ac-main">${esc(r.account_name||r.Serial_number||'–')}${hxTag}</div>
      <div class="ac-sub">${esc(r.Serial_number)} · ${esc(r.Platform)} · ${esc(r.Coverage_type)} · ${rev>0?fmt(rev):'No revenue'}</div>
    </div>`;
  }).join('');
  dd.classList.add('on');
}
function hideDD(id){const e=$(id);if(e)e.classList.remove('on')}
function selSys(id,ctx){
  const r=S.raw.find(x=>x._id===id);if(!r)return;
  if(ctx==='risk'){
    $('rSrch').value=r.account_name||r.Serial_number||'';
    $('rCust').value=r.account_name||'';$('rPlat').value=r.Platform||'';
    $('rSN').value=r.Serial_number||'';$('rCov').value=r.Coverage_type||'';
    $('rBaseRev').value=getRev(r).toFixed(0);calcRisk();
  }else{
    $('oSrch').value=r.account_name||r.Serial_number||'';
    $('oCust').value=r.account_name||'';$('oPlat').value=r.Platform||'';
    $('oSN').value=r.Serial_number||'';$('oCov').value=r.Coverage_type||'';
  }
  hideDD(ctx==='risk'?'rDD':'oDD');
}

// ===== RISK CALC =====
function calcRisk(){
  const baseRev=parseFloat($('rBaseRev').value)||0;
  const mon=parseInt($('rMon').value);
  const yr=parseInt($('rYr').value);
  const repYr=parseInt($('rnYear').value)||new Date().getFullYear();
  const box=$('calcBox');
  if(!baseRev||!mon||!yr){$('rImpCalc').value='';box.className='calc-box';return}
  let months;
  if(yr<repYr)months=12;
  else if(yr===repYr)months=12-mon;
  else months=0;
  const impact=(baseRev/12)*months;
  const monName=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mon-1];
  $('rImpCalc').value=fmt(impact);
  $('rImpCalc').dataset.raw=impact.toFixed(0);
  if(months>0){
    box.className='calc-box on';
    box.style.background='';box.style.borderColor='';box.style.color='';
    box.textContent=`Contract ends ${monName} ${yr} → ${months} months lost in ${repYr} → ${fmt(impact)} revenue impact (${fmt(baseRev)}/12 × ${months})`;
  }else{
    box.className='calc-box on';box.style.background='rgba(56,139,253,.1)';box.style.borderColor='rgba(56,139,253,.25)';box.style.color='var(--blu)';
    box.textContent=`Contract ends ${monName} ${yr} → No revenue impact in ${repYr} (expires after year end)`;
  }
}

// ===== RISKS =====
function addRisk(){
  const cust=$('rCust').value.trim(),plat=$('rPlat').value.trim();
  const sn=$('rSN').value.trim(),cov=$('rCov').value.trim();
  const desc=$('rDesc').value.trim(),prob=parseFloat($('rProb').value);
  const impact=parseFloat($('rImpCalc').dataset?.raw||$('rImpCalc').value.replace(/[$,]/g,''));
  const mon=parseInt($('rMon').value),yr=parseInt($('rYr').value);
  if(!cust||!desc||isNaN(prob)||isNaN(impact)){alert('Required: Customer, Description, Probability %, and either select a month/year (auto-calc) or enter Revenue at Risk.');return}
  pushHistory();
  const monName=mon?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mon-1]:'–';
  const endStr=mon&&yr?`${monName} ${yr}`:'–';
  S.risks.push({id:Date.now(),cust,plat,sn,cov,desc,prob:Math.min(100,Math.max(0,prob)),impact,endStr});
  ['rSrch','rCust','rPlat','rSN','rCov','rDesc','rProb','rMon','rYr'].forEach(i=>$(i).value='');
  $('rImpCalc').value='';$('rImpCalc').dataset.raw='';$('calcBox').className='calc-box';
  renderRisks();renderAll();
}
function delRisk(id){pushHistory();S.risks=S.risks.filter(r=>r.id!==id);renderRisks();renderAll()}
function renderRisks(){
  const tot=S.risks.reduce((s,r)=>s+(r.prob/100)*r.impact,0);
  setText('riskTot',fmt(tot));
  const body=$('riskBody');
  if(!S.risks.length){body.innerHTML='<div class="reg-empty">No risks added yet. Search a system above to get started.</div>';return}
  body.innerHTML=`<table class="dt"><thead><tr>
    <th>Customer</th><th>SN</th><th>Platform</th><th>Coverage</th><th>Description</th><th>End</th>
    <th style="text-align:right">Prob.</th><th style="text-align:right">Revenue at Risk</th>
    <th style="text-align:right">Weighted</th><th style="width:36px"></th>
  </tr></thead><tbody>${S.risks.map(r=>{
    const pCls=r.prob>=70?'hi':r.prob>=40?'md':'lo';
    return`<tr>
      <td><strong>${esc(r.cust)}</strong></td><td class="mu" style="font-size:.73rem;font-family:monospace">${esc(r.sn||'–')}</td>
      <td>${esc(r.plat||'–')}</td><td class="mu" style="font-size:.73rem">${esc(r.cov||'–')}</td>
      <td class="mu">${esc(r.desc)}</td><td class="mu">${esc(r.endStr||'–')}</td>
      <td style="text-align:right"><span class="pb ${pCls}">${r.prob}%</span></td>
      <td style="text-align:right">${fmt(r.impact)}</td>
      <td style="text-align:right;color:var(--org);font-weight:600">-${fmt((r.prob/100)*r.impact)}</td>
      <td><button class="bsm dng" onclick="delRisk(${r.id})">✕</button></td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

// ===== OPPORTUNITIES =====
function addOpp(){
  const cust=$('oCust').value.trim(),plat=$('oPlat').value.trim();
  const sn=$('oSN').value.trim(),cov=$('oCov').value.trim();
  const type=$('oType').value,qtr=$('oQtr').value.trim();
  const desc=$('oDesc').value.trim(),rev=parseFloat($('oRev').value);
  if(!cust||isNaN(rev)){alert('Required: Customer and Expected Revenue.');return}
  pushHistory();
  S.opps.push({id:Date.now(),cust,plat,sn,cov,type,qtr,desc,revenue:rev});
  ['oSrch','oCust','oPlat','oSN','oCov','oQtr','oDesc','oRev'].forEach(i=>$(i).value='');
  renderOpps();renderAll();
}
function delOpp(id){pushHistory();S.opps=S.opps.filter(o=>o.id!==id);renderOpps();renderAll()}
function renderOpps(){
  const tot=S.opps.reduce((s,o)=>s+o.revenue,0);setText('oppTot',fmt(tot));
  const body=$('oppBody');
  if(!S.opps.length){body.innerHTML='<div class="reg-empty">No opportunities added yet.</div>';return}
  body.innerHTML=`<table class="dt"><thead><tr>
    <th>Customer</th><th>Platform</th><th>Type</th><th>Description</th><th>Quarter</th>
    <th style="text-align:right">Expected Revenue</th><th style="width:36px"></th>
  </tr></thead><tbody>${S.opps.map(o=>`<tr>
    <td><strong>${esc(o.cust)}</strong></td><td>${esc(o.plat||'–')}</td>
    <td><span class="tb bun">${esc(o.type)}</span></td>
    <td class="mu">${esc(o.desc||'–')}</td><td class="mu">${esc(o.qtr||'–')}</td>
    <td style="text-align:right;color:var(--grn);font-weight:600">+${fmt(o.revenue)}</td>
    <td><button class="bsm dng" onclick="delOpp(${o.id})">✕</button></td>
  </tr>`).join('')}</tbody></table>`;
}

// ===== INSIGHTS =====
function destroyICharts(){Object.values(S.iCharts).forEach(c=>{try{c.destroy()}catch(e){}});S.iCharts={}}

function renderInsights(){
  const filtered=getFiltered();
  const inScope=filtered.filter(r=>!isHX(r));
  const difficult=filtered.filter(r=>isHX(r));
  const retained=inScope.filter(r=>!S.churn.has(r._id));

  // Mini KPIs
  const critical=inScope.filter(r=>r._days!==null&&r._days>=0&&r._days<90);
  const atRisk=inScope.filter(r=>r._days!==null&&r._days>=90&&r._days<180);
  const withRev=inScope.filter(r=>getRev(r)>0);
  const avgVal=withRev.length?withRev.reduce((s,r)=>s+getRev(r),0)/withRev.length:0;
  const totRev=retained.reduce((s,r)=>s+getRev(r),0);
  const byAcc=groupBy(retained,'account_name',r=>getRev(r));
  const top10Rev=Object.values(byAcc).sort((a,b)=>b-a).slice(0,10).reduce((s,v)=>s+v,0);
  const concPct=totRev>0?((top10Rev/totRev)*100).toFixed(1):0;
  const rnRev=inScope.filter(r=>getRev(r)>0&&!S.churn.has(r._id)).reduce((s,r)=>s+getRev(r),0);
  const baseRev=inScope.filter(r=>getRev(r)>0).reduce((s,r)=>s+getRev(r),0);
  const rnRate=baseRev>0?((rnRev/baseRev)*100).toFixed(1):0;

  setText('iCrit',`${critical.length} systems`);setText('iCritRev',fmt(critical.reduce((s,r)=>s+getRev(r),0)));
  setText('iAtRisk',`${atRisk.length} systems`);setText('iAtRiskRev',fmt(atRisk.reduce((s,r)=>s+getRev(r),0)));
  setText('iAvg',fmtK(avgVal));
  setText('iConc',concPct+'%');setText('iConcSub',`top 10 accounts = ${fmt(top10Rev)}`);
  setText('iRnRate',rnRate+'%');

  destroyICharts();

  // Ch1: Platform revenue (horizontal bar)
  const platData=groupBy(retained,'Platform',r=>getRev(r));
  const platE=Object.entries(platData).sort((a,b)=>b[1]-a[1]);
  S.iCharts.p1=new Chart($('iCh1'),{
    type:'bar',
    data:{labels:platE.map(([k])=>k),datasets:[{data:platE.map(([,v])=>v),backgroundColor:platE.map((_,i)=>COLORS[i%COLORS.length]),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });

  // Ch2: Coverage type revenue (horizontal bar, top 12)
  const covData=groupBy(retained,'Coverage_type',r=>getRev(r));
  const covE=Object.entries(covData).sort((a,b)=>b[1]-a[1]).slice(0,12);
  S.iCharts.p2=new Chart($('iCh2'),{
    type:'bar',
    data:{labels:covE.map(([k])=>k),datasets:[{data:covE.map(([,v])=>v),backgroundColor:covE.map((_,i)=>COLORS[i%COLORS.length]),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });

  // Ch3: Direct/Bundle/Other donut
  const typeMap={Direct_revenue:'Direct',Bundle_revenue:'Bundle'};
  const typeData={Direct:0,Bundle:0,Other:0};
  retained.forEach(r=>{const t=typeMap[r.Direct_vs_bundle_revenue]||'Other';typeData[t]+=getRev(r)});
  S.iCharts.p3=new Chart($('iCh3'),{
    type:'doughnut',
    data:{labels:Object.keys(typeData),datasets:[{data:Object.values(typeData),backgroundColor:['#1565c0','#2e7d32','#37474f'],borderWidth:2,borderColor:'#21262d'}]},
    options:{responsive:true,plugins:{legend:{position:'right',labels:{color:'#e6edf3'}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${fmt(ctx.parsed)}`}}}}
  });

  // Ch4: Expiry timeline
  const zones=['Expired >1Y','Recently Expired','< 90 days','90–180 days','180–365 days','> 365 days','No contract'];
  const zoneRev=new Array(7).fill(0);
  inScope.forEach(r=>{
    const d=r._days,v=getRev(r);
    if(d===null)zoneRev[6]+=v;
    else if(d<0)zoneRev[1]+=v;
    else if(d<90)zoneRev[2]+=v;
    else if(d<180)zoneRev[3]+=v;
    else if(d<=365)zoneRev[4]+=v;
    else zoneRev[5]+=v;
  });
  difficult.forEach(r=>zoneRev[0]+=getRev(r));
  S.iCharts.p4=new Chart($('iCh4'),{
    type:'bar',
    data:{labels:zones,datasets:[{label:'Revenue',data:zoneRev,backgroundColor:['#f85149','#d29922','#d29922','#3fb950','#388bfd','#a78bfa','#484f58'],borderRadius:4}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });

  // Top 15 accounts table
  const topAcc=Object.entries(byAcc).sort((a,b)=>b[1]-a[1]).slice(0,15);
  $('iTopAcc').innerHTML=`<table class="dt"><thead><tr>
    <th>#</th><th>Account</th><th>Country</th><th>Platform</th><th style="text-align:right">Revenue</th><th style="text-align:right">% Total</th>
  </tr></thead><tbody>${topAcc.map(([name,rev],i)=>{
    const sample=retained.find(r=>r.account_name===name)||{};
    const pct=totRev>0?((rev/totRev)*100).toFixed(1):0;
    const bar=`<div style="display:inline-block;width:${Math.round(parseFloat(pct))}px;max-width:80px;height:4px;background:var(--acc);border-radius:2px;margin-left:6px"></div>`;
    return`<tr><td class="mu">${i+1}</td><td><strong>${esc(name)}</strong></td>
      <td class="mu">${esc(sample.Country||'–')}</td><td>${esc(sample.Platform||'–')}</td>
      <td style="text-align:right;font-weight:600">${fmt(rev)}</td>
      <td style="text-align:right;color:var(--mut)">${pct}%${bar}</td></tr>`;
  }).join('')}</tbody></table>`;

  // Difficult to renew table
  setText('iDiffTot',fmt(difficult.reduce((s,r)=>s+getRev(r),0)));
  $('iDiffList').innerHTML=difficult.length?`<table class="dt"><thead><tr>
    <th>Account</th><th>Country</th><th>Platform</th><th>Serial</th><th>Coverage</th>
    <th style="text-align:right">Days Expired</th><th style="text-align:right">Annual USD</th>
  </tr></thead><tbody>${difficult.sort((a,b)=>a._days-b._days).map(r=>`<tr class="hx-row">
    <td><strong>${esc(r.account_name||'–')}</strong></td><td class="mu">${esc(r.Country||'–')}</td>
    <td><strong>${esc(r.Platform||'–')}</strong></td><td class="mo">${esc(r.Serial_number||'–')}</td>
    <td class="mu" style="font-size:.73rem">${esc(r.Coverage_type||'–')}</td>
    <td style="text-align:right"><span class="db hx">${r._days}d</span></td>
    <td style="text-align:right;color:var(--org);font-weight:600">${getRev(r)>0?fmt(getRev(r)):'–'}</td>
  </tr>`).join('')}</tbody></table>`
  :'<div class="reg-empty">No systems expired >1 year in the current filter scope.</div>';

  S.insightsDirty=false;
}

// ===== REPORT =====
function destroyRCharts(){Object.values(S.charts).forEach(c=>{try{c.destroy()}catch(e){}});S.charts={}}

function generateReport(){
  const type=$('rnType').value,year=$('rnYear').value,code=type+year;
  const meta=TITLES[type];
  const filtered=getFiltered();
  const inScope=filtered.filter(r=>!isHX(r));
  const difficult=filtered.filter(r=>isHX(r));
  const sm=calcSummary(filtered);
  const retained=inScope.filter(r=>!S.churn.has(r._id)).sort((a,b)=>getRev(b)-getRev(a));
  const churned=inScope.filter(r=>S.churn.has(r._id)).sort((a,b)=>getRev(b)-getRev(a));
  const scopeParts=S.filt.clusters.size?[...S.filt.clusters]:S.filt.countries.size?[...S.filt.countries]:['All Regions'];

  // Cover
  setText('rpTi',`${meta.t} ${year}`);setText('rpSu',meta.s);setText('rpCode',code);
  setText('rpDate',new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'}));
  setText('rpScope',scopeParts.join(', '));setText('rpSys',`${filtered.length} systems (${sm.inScopeCount} in scope)`);

  // KPI cards
  const kpiDef=[
    {l:'Base Revenue (In Scope)',v:fmt(sm.base),s:`${sm.inScopeCount} systems`,c:''},
    {l:'Retained Revenue',v:fmt(sm.retRev),s:`${sm.retCnt} renewing`,c:'gr'},
    {l:'Revenue Lost (Churn)',v:sm.chnRev>0?'-'+fmt(sm.chnRev):'$0',s:`${sm.chnCnt} systems`,c:''},
    {l:'Difficult Renewals',v:fmt(sm.diffRev),s:`${sm.diffCnt} expired >1Y (excl.)`,c:'cy'},
    {l:'Risk-Weighted Exposure',v:sm.riskW>0?'-'+fmt(sm.riskW):'$0',s:`${S.risks.length} risks`,c:'or'},
    {l:'Opportunity Upside',v:sm.oppUp>0?'+'+fmt(sm.oppUp):'$0',s:`${S.opps.length} opportunities`,c:'pu'},
    {l:'Net Revenue Projection',v:fmt(sm.net),s:'retained − risk + upside',c:'gr'}
  ];
  $('rpKpis').innerHTML=kpiDef.map(k=>`<div class="rkpi ${k.c}"><div class="rkpi-l">${k.l}</div><div class="rkpi-v">${k.v}</div><div class="rkpi-s">${k.s}</div></div>`).join('');

  // Narrative
  const chP=sm.base>0?((sm.chnRev/sm.base)*100).toFixed(1):0;
  const oppP=sm.base>0?((sm.oppUp/sm.base)*100).toFixed(1):0;
  const diffNote=sm.diffCnt>0?` An additional ${sm.diffCnt} systems representing ${fmt(sm.diffRev)} have been excluded from the base as their contracts expired more than one year ago — these require significant commercial effort to recover.`:'';
  $('rpNarr').textContent=`This ${meta.t} covers ${sm.inScopeCount} systems in scope with a combined base revenue of ${fmt(sm.base)} USD across ${scopeParts.join(', ')}.${diffNote} ${sm.retCnt} systems (${fmt(sm.retRev)}) are projected to maintain their contracts. ${sm.chnCnt} systems (${chP}% of base) are projected to exit, resulting in ${fmt(sm.chnRev)} revenue loss. The risk register flags ${S.risks.length} items with a probability-weighted exposure of ${fmt(sm.riskW)}. ${S.opps.length} growth opportunities totalling ${fmt(sm.oppUp)} (${oppP}% of base) have been identified. Net projection for ${code}: ${fmt(sm.net)}.`;

  destroyRCharts();

  // S2: Allocation tables — Direct and Bundle by platform
  (function(){
    const retained=inScope.filter(r=>!S.churn.has(r._id));
    const types=['Direct_revenue','Bundle_revenue'];
    const labels={Direct_revenue:'Direct Revenue — Allocation by Platform',Bundle_revenue:'Bundle Revenue — Allocation by Platform'};
    const hdrCls={Direct_revenue:'',Bundle_revenue:'bun'};
    let html='';
    types.forEach(type=>{
      const rows=retained.filter(r=>r.Direct_vs_bundle_revenue===type);
      if(!rows.length)return;
      const byPlat={};
      rows.forEach(r=>{const p=r.Platform||'Unknown';byPlat[p]=(byPlat[p]||0)+getRev(r)});
      const sorted=Object.entries(byPlat).sort((a,b)=>b[1]-a[1]);
      const tot=sorted.reduce((s,[,v])=>s+v,0);
      html+=`<div class="alloc-tbl">
        <div class="alloc-tbl-hdr ${hdrCls[type]}">${labels[type]}</div>
        <table><tbody>
          ${sorted.map(([p,v])=>`<tr><td>${esc(p)}</td><td>$ ${v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr>`).join('')}
        </tbody>
        <tfoot><tr class="alloc-tot"><td><strong>TOTAL</strong></td><td><strong>$ ${tot.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td></tr></tfoot>
        </table>
      </div>`;
    });
    $('rpAllocTables').innerHTML=html;
  })();

  // S2b: Average revenue by Coverage and Platform — selection vs all-countries
  (function(){
    const allInScope=S.raw.filter(r=>!isHX(r));
    const selRetained=inScope.filter(r=>!S.churn.has(r._id));

    function avgByKey(rows,key){
      const map={};
      rows.forEach(r=>{
        const k=r[key]||'Unknown';
        if(!map[k])map[k]={sum:0,cnt:0};
        const v=getRev(r);if(v>0){map[k].sum+=v;map[k].cnt++;}
      });
      const out={};
      Object.entries(map).forEach(([k,d])=>{if(d.cnt>0)out[k]=d.sum/d.cnt;});
      return out;
    }

    function buildAvgTable(hdr,key){
      const selAvg=avgByKey(selRetained,key);
      const allAvg=avgByKey(allInScope,key);
      const keys=[...new Set([...Object.keys(selAvg),...Object.keys(allAvg)])];
      keys.sort((a,b)=>(selAvg[b]||0)-(selAvg[a]||0));
      if(!keys.length)return'';
      const f=v=>v>0?'$'+Math.round(v).toLocaleString('en-US'):'-';
      const rows=keys.map(k=>{
        const s=selAvg[k]||0,a=allAvg[k]||0;
        const diff=a>0?(s-a)/a*100:0;
        const cls=diff>0?'avg-pos':diff<0?'avg-neg':'avg-neu';
        const ds=a>0?(diff>=0?'+':'')+diff.toFixed(1)+'%':'–';
        return '<tr><td>'+esc(k)+'</td><td>'+f(s)+'</td><td>'+f(a)+'</td><td class="'+cls+'">'+ds+'</td></tr>';
      }).join('');
      return '<div class="avg-tbl"><div class="avg-tbl-hdr">'+hdr+'</div>'
        +'<table><thead><tr><th>Name</th><th>Selection Avg</th><th>All Countries Avg</th><th>vs Total</th></tr></thead>'
        +'<tbody>'+rows+'</tbody></table></div>';
    }

    $('rpAvgTables').innerHTML=
      buildAvgTable('Avg Revenue by Coverage Type','Coverage_type')+
      buildAvgTable('Avg Revenue by Platform','Platform');
  })();




  // S2: Platform (horizontal bar) + Cluster (donut)
  const platData=groupBy(retained,'Platform',r=>getRev(r));
  const platE=Object.entries(platData).sort((a,b)=>b[1]-a[1]);
  S.charts.plat=new Chart($('rpPlatC'),{
    type:'bar',
    data:{labels:platE.map(([k])=>k),datasets:[{data:platE.map(([,v])=>v),backgroundColor:platE.map((_,i)=>COLORS[i%COLORS.length]),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });
  const clusData=groupBy(retained,'Cluster',r=>getRev(r));
  const clusE=Object.entries(clusData).sort((a,b)=>b[1]-a[1]);
  S.charts.clus=new Chart($('rpClusC'),{
    type:'doughnut',
    data:{labels:clusE.map(([k])=>k),datasets:[{data:clusE.map(([,v])=>v),backgroundColor:COLORS,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,plugins:{legend:{position:'right'},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${fmt(ctx.parsed)}`}}}}
  });

  // S3: Coverage (horizontal bar, top 10) + Direct/Bundle/Other (donut)
  const covData=groupBy(retained,'Coverage_type',r=>getRev(r));
  const covE=Object.entries(covData).sort((a,b)=>b[1]-a[1]).slice(0,10);
  S.charts.cov=new Chart($('rpCovC'),{
    type:'bar',
    data:{labels:covE.map(([k])=>k),datasets:[{data:covE.map(([,v])=>v),backgroundColor:covE.map((_,i)=>COLORS[i%COLORS.length]),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });
  const typeData={Direct:0,Bundle:0,Other:0};
  retained.forEach(r=>{const t=r.Direct_vs_bundle_revenue==='Direct_revenue'?'Direct':r.Direct_vs_bundle_revenue==='Bundle_revenue'?'Bundle':'Other';typeData[t]+=getRev(r)});
  S.charts.type=new Chart($('rpTypeC'),{
    type:'doughnut',
    data:{labels:Object.keys(typeData),datasets:[{data:Object.values(typeData),backgroundColor:['#1565c0','#2e7d32','#37474f'],borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,plugins:{legend:{position:'right'},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${fmt(ctx.parsed)}`}}}}
  });

  // S4: Expiry timeline
  const zones=['Expired >1Y (Difficult)','Recently Expired','< 90 days','90–180 days','180–365 days','> 365 days','No contract'];
  const zBg=['#f85149','#d29922','#e65100','#3fb950','#388bfd','#a78bfa','#484f58'];
  const zoneRev=new Array(7).fill(0);
  inScope.forEach(r=>{const d=r._days,v=getRev(r);if(d===null)zoneRev[6]+=v;else if(d<0)zoneRev[1]+=v;else if(d<90)zoneRev[2]+=v;else if(d<180)zoneRev[3]+=v;else if(d<=365)zoneRev[4]+=v;else zoneRev[5]+=v;});
  difficult.forEach(r=>zoneRev[0]+=getRev(r));
  S.charts.exp=new Chart($('rpExpC'),{
    type:'bar',
    data:{labels:zones,datasets:[{label:'Revenue',data:zoneRev,backgroundColor:zBg,borderRadius:4}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });

  // S5: Retained systems table
  $('rpWins').querySelector('tbody').innerHTML=retained.map(r=>`<tr>
    <td>${esc(r.account_name||'–')}</td><td>${esc(r.Country||'–')}</td>
    <td><strong>${esc(r.Platform||'–')}</strong></td><td>${esc(r.Coverage_type||'–')}</td>
    <td>${esc(r.end_date&&r.end_date!=='not_contract'?r.end_date:'–')}</td>
    <td class="tr ga">${getRev(r)>0?fmt(getRev(r)):'–'}</td>
  </tr>`).join('')||emptyRow(6);
  setText('rpWinsTot',fmt(sm.retRev));

  // S6: Churned systems table
  $('rpChurn').querySelector('tbody').innerHTML=churned.map(r=>`<tr>
    <td>${esc(r.account_name||'–')}</td><td>${esc(r.Country||'–')}</td>
    <td><strong>${esc(r.Platform||'–')}</strong></td><td>${esc(r.Coverage_type||'–')}</td>
    <td>${esc(r.end_date&&r.end_date!=='not_contract'?r.end_date:'–')}</td>
    <td class="tr lo">${getRev(r)>0?'-'+fmt(getRev(r)):'–'}</td>
  </tr>`).join('')||emptyRow(6,'No churned systems in scope');
  setText('rpChurnTot',sm.chnRev>0?'-'+fmt(sm.chnRev):'$0');

  // S7: Difficult to renew
  const diffSorted=difficult.slice().sort((a,b)=>a._days-b._days);
  $('rpDiff').querySelector('tbody').innerHTML=diffSorted.map(r=>`<tr>
    <td>${esc(r.account_name||'–')}</td><td>${esc(r.Country||'–')}</td>
    <td><strong>${esc(r.Platform||'–')}</strong></td><td>${esc(r.Coverage_type||'–')}</td>
    <td style="color:#c62828;font-weight:600">${r._days}d</td>
    <td class="tr wa">${getRev(r)>0?fmt(getRev(r)):'–'}</td>
  </tr>`).join('')||emptyRow(6,'No systems expired >1 year in this scope');
  setText('rpDiffTot',fmt(sm.diffRev));setText('rpDiffTotFt',fmt(sm.diffRev));

  // S8: Risk register
  $('rpRisks').querySelector('tbody').innerHTML=S.risks.map(r=>`<tr>
    <td>${esc(r.cust)}</td><td>${esc(r.plat||'–')}</td><td>${esc(r.desc)}</td>
    <td>${esc(r.endStr||'–')}</td><td class="tr">${r.prob}%</td>
    <td class="tr">${fmt(r.impact)}</td>
    <td class="tr wa">-${fmt((r.prob/100)*r.impact)}</td>
  </tr>`).join('')||emptyRow(7,'No risks registered');
  setText('rpRiskTot',sm.riskW>0?'-'+fmt(sm.riskW):'$0');

  // S9: Opportunities
  $('rpOpps').querySelector('tbody').innerHTML=S.opps.map(o=>`<tr>
    <td>${esc(o.cust)}</td><td class="mu" style="font-size:.73rem;font-family:monospace">${esc(o.sn||'–')}</td>
    <td>${esc(o.plat||'–')}</td><td class="mu" style="font-size:.73rem">${esc(o.cov||'–')}</td>
    <td>${esc(o.type)}</td><td>${esc(o.desc||'–')}</td><td>${esc(o.qtr||'–')}</td>
    <td class="tr ga">+${fmt(o.revenue)}</td>
  </tr>`).join('')||emptyRow(8,'No opportunities registered');
  setText('rpOppTot',sm.oppUp>0?'+'+fmt(sm.oppUp):'$0');

  // S10: Top accounts + Country charts
  const byAcc=groupBy(retained,'account_name',r=>getRev(r));
  const totRev=sm.retRev||1;
  const topAcc=Object.entries(byAcc).sort((a,b)=>b[1]-a[1]).slice(0,10);
  S.charts.top=new Chart($('rpTopC'),{
    type:'bar',
    data:{labels:topAcc.map(([k])=>k.length>20?k.slice(0,18)+'…':k),datasets:[{data:topAcc.map(([,v])=>v),backgroundColor:COLORS,borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });
  const countryData=groupBy(retained,'Country',r=>getRev(r));
  const ctryE=Object.entries(countryData).sort((a,b)=>b[1]-a[1]).slice(0,10);
  S.charts.country=new Chart($('rpCountryC'),{
    type:'bar',
    data:{labels:ctryE.map(([k])=>k),datasets:[{data:ctryE.map(([,v])=>v),backgroundColor:COLORS,borderRadius:4}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}
  });
  $('rpTopTbl').querySelector('tbody').innerHTML=topAcc.map(([name,rev],i)=>{
    const s=retained.find(r=>r.account_name===name)||{};
    return`<tr>
      <td class="tr" style="font-weight:700;color:#c62828">${i+1}</td>
      <td><strong>${esc(name)}</strong></td><td>${esc(s.Country||'–')}</td>
      <td>${esc(s.Platform||'–')}</td>
      <td class="tr" style="font-weight:600">${fmt(rev)}</td>
      <td class="tr" style="color:#888">${((rev/totRev)*100).toFixed(1)}%</td>
    </tr>`;
  }).join('');

  // S11: Revenue projection waterfall
  const rows=[
    {l:'Base Revenue (In Scope)',v:fmt(sm.base),c:''},
    {l:'⚠ Difficult Renewals (excluded from base)',v:fmt(sm.diffRev),c:'sub'},
    {l:'− Contract Churn',v:sm.chnRev>0?'-'+fmt(sm.chnRev):'$0',c:'neg'},
    {l:'= Retained Revenue',v:fmt(sm.retRev),c:''},
    {l:'− Risk-Weighted Exposure',v:sm.riskW>0?'-'+fmt(sm.riskW):'$0',c:'neg'},
    {l:'+ Opportunity Upside',v:sm.oppUp>0?'+'+fmt(sm.oppUp):'$0',c:'pos'},
    {l:`NET PROJECTION — ${code}`,v:fmt(sm.net),c:'tot'}
  ];
  $('rpProj').innerHTML=rows.map(p=>`<div class="prj-row ${p.c}"><span class="prj-l">${p.l}</span><span class="prj-v">${p.v}</span></div>`).join('');

  $('rptOvl').classList.add('on');
  $('rptOvl').scrollTop=0;
}


// ===== EMAIL SUMMARY =====
function buildEmailHTML(){
  const filtered=getFiltered();
  const sm=calcSummary(filtered);
  const type=$('rnType').value,year=$('rnYear').value,code=type+year;
  const scopeParts=S.filt.clusters.size?[...S.filt.clusters]:S.filt.countries.size?[...S.filt.countries]:['All Regions'];
  const chPct=sm.base>0?((sm.chnRev/sm.base)*100).toFixed(1):0;
  const oppPct=sm.base>0?((sm.oppUp/sm.base)*100).toFixed(1):0;
  const rnRate=sm.base>0?((sm.retRev/sm.base)*100).toFixed(1):0;
  const date=new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'});

  // Avg benchmark
  function avgMapH(rows,key){const m={};rows.forEach(r=>{const k=r[key]||'?';const v=getRev(r);if(v>0){if(!m[k])m[k]={s:0,n:0};m[k].s+=v;m[k].n++;}});const out={};Object.entries(m).forEach(([k,d])=>{if(d.n>0)out[k]=d.s/d.n;});return out;}
  const retained2=getFiltered().filter(r=>!isHX(r)&&!S.churn.has(r._id));
  const allBase2=S.raw.filter(r=>!isHX(r));
  const selPlatAvgH=avgMapH(retained2,'Platform');
  const allPlatAvgH=avgMapH(allBase2,'Platform');
  const selCovAvgH=avgMapH(retained2,'Coverage_type');
  const allCovAvgH=avgMapH(allBase2,'Coverage_type');

  function benchRows(selA,allA){
    return Object.entries(selA).sort((a,b)=>b[1]-a[1]).map(([k,sv])=>{
      const av=allA[k];if(!av)return'';
      const pct=((sv-av)/av*100);const sign=pct>=0?'+':'';
      const col=pct>0?'#2e7d32':pct<0?'#c62828':'#555';
      return '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;color:#333">'+k+'</td>'
        +'<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:right;color:#333">'+fmtK(sv)+'</td>'
        +'<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:right;color:#333">'+fmtK(av)+'</td>'
        +'<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:right;color:'+col+';font-weight:700">'+sign+pct.toFixed(1)+'%</td></tr>';
    }).filter(Boolean).join('');
  }

  const topPlatRows=Object.entries((()=>{const m={};retained2.forEach(r=>{const k=r.Platform||'Unknown';m[k]=(m[k]||0)+getRev(r)});return m})()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([p,v],i)=>'<tr style="background:'+(i%2?'#f9f9f9':'#fff')+'"><td style="padding:7px 12px;color:#333">'+p+'</td><td style="padding:7px 12px;text-align:right;font-weight:600;color:#1a1a2e">'+fmt(v)+'</td></tr>').join('');
  const topAccRows=Object.entries((()=>{const m={};retained2.forEach(r=>{const k=r.account_name||'Unknown';m[k]=(m[k]||0)+getRev(r)});return m})()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([a,v],i)=>'<tr style="background:'+(i%2?'#f9f9f9':'#fff')+'"><td style="padding:7px 12px;color:#333">'+a+'</td><td style="padding:7px 12px;text-align:right;font-weight:600;color:#1a1a2e">'+fmt(v)+'</td></tr>').join('');
  const riskRows=S.risks.length?S.risks.map((r,i)=>'<tr style="background:'+(i%2?'#f9f9f9':'#fff')+'"><td style="padding:7px 12px;color:#333">'+esc(r.cust)+'</td><td style="padding:7px 12px;color:#555">'+esc(r.desc)+'</td><td style="padding:7px 12px;text-align:center;color:#333">'+r.prob+'%</td><td style="padding:7px 12px;text-align:right;color:#c62828;font-weight:600">'+fmt((r.prob/100)*r.impact)+'</td></tr>').join(''):'<tr><td colspan="4" style="padding:10px 12px;color:#999;text-align:center">No risks registered</td></tr>';
  const oppRows=S.opps.length?S.opps.map((o,i)=>'<tr style="background:'+(i%2?'#f9f9f9':'#fff')+'"><td style="padding:7px 12px;color:#333">'+esc(o.cust)+'</td><td style="padding:7px 12px;color:#555">'+esc(o.type)+'</td><td style="padding:7px 12px;text-align:center;color:#333">'+(o.qtr||'—')+'</td><td style="padding:7px 12px;text-align:right;color:#2e7d32;font-weight:600">+'+fmt(o.revenue)+'</td></tr>').join(''):'<tr><td colspan="4" style="padding:10px 12px;color:#999;text-align:center">No opportunities registered</td></tr>';
  const assumpRows=S.assumps.length?S.assumps.map((a,i)=>'<tr style="background:'+(i%2?'#f9f9f9':'#fff')+'"><td style="padding:6px 10px"><span style="background:#e8eaf6;color:#3949ab;font-size:10px;font-weight:700;border-radius:3px;padding:2px 6px">'+esc(a.cat)+'</span></td><td style="padding:6px 10px;color:#555">'+esc(a.txt)+'</td></tr>').join(''):'<tr><td colspan="2" style="padding:10px 12px;color:#999;text-align:center">No assumptions logged</td></tr>';

  const netCol=sm.net>=sm.base?'#2e7d32':'#c62828';
  const rnCol=rnRate>=80?'#2e7d32':rnRate>=60?'#e65100':'#c62828';
  const chCol=chPct<=10?'#2e7d32':chPct<=25?'#e65100':'#c62828';
  const platBench=benchRows(selPlatAvgH,allPlatAvgH);
  const covBench=benchRows(selCovAvgH,allCovAvgH);

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0">'
    +'<tr><td align="center">'
    +'<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:640px">'

    // Header (bgcolor attr for Outlook + CSS background for modern clients)
    +'<tr><td bgcolor="#c62828" style="background:#c62828;padding:28px 32px">'
    +'<p style="margin:0 0 4px 0;color:#ffffff;font-size:11px;letter-spacing:2px;text-transform:uppercase">Johnson &amp; Johnson Vision &middot; Technical Service Iberia</p>'
    +'<p style="margin:0 0 6px 0;color:#ffffff;font-size:26px;font-weight:700">'+code+' Business Plan</p>'
    +'<p style="margin:0;color:#f5c6c6;font-size:13px">Scope: '+scopeParts.join(', ')+' &nbsp;&middot;&nbsp; '+date+'</p>'
    +'</td></tr>'

    // KPI bar — light background so Outlook renders text correctly
    +'<tr><td bgcolor="#f2f4f8" style="background:#f2f4f8;padding:20px 32px;border-bottom:2px solid #e0e0e0">'
    +'<table width="100%" cellpadding="0" cellspacing="0"><tr>'
    +'<td align="center" style="padding:0 8px;border-right:2px solid #d0d4de">'
    +'<p style="margin:0 0 4px 0;color:#666666;font-size:10px;text-transform:uppercase;letter-spacing:1px">Base Revenue</p>'
    +'<p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:700">'+fmt(sm.base)+'</p>'
    +'</td>'
    +'<td align="center" style="padding:0 8px;border-right:2px solid #d0d4de">'
    +'<p style="margin:0 0 4px 0;color:#666666;font-size:10px;text-transform:uppercase;letter-spacing:1px">Retained</p>'
    +'<p style="margin:0;color:'+rnCol+';font-size:18px;font-weight:700">'+fmt(sm.retRev)+'</p>'
    +'<p style="margin:0;color:'+rnCol+';font-size:11px">'+rnRate+'% rate</p>'
    +'</td>'
    +'<td align="center" style="padding:0 8px;border-right:2px solid #d0d4de">'
    +'<p style="margin:0 0 4px 0;color:#666666;font-size:10px;text-transform:uppercase;letter-spacing:1px">Churn</p>'
    +'<p style="margin:0;color:'+chCol+';font-size:18px;font-weight:700">-'+fmt(sm.chnRev)+'</p>'
    +'<p style="margin:0;color:'+chCol+';font-size:11px">'+chPct+'% of base</p>'
    +'</td>'
    +'<td align="center" style="padding:0 8px">'
    +'<p style="margin:0 0 4px 0;color:#666666;font-size:10px;text-transform:uppercase;letter-spacing:1px">Net Projection</p>'
    +'<p style="margin:0;color:'+netCol+';font-size:20px;font-weight:700">'+fmt(sm.net)+'</p>'
    +'</td>'
    +'</tr></table>'
    +'</td></tr>'

    // Adjustments strip
    +(sm.riskW>0||sm.oppUp>0?'<tr><td bgcolor="#f8f9fa" style="background:#f8f9fa;padding:12px 32px;border-bottom:1px solid #eee">'
    +'<table width="100%" cellpadding="0" cellspacing="0"><tr>'
    +(sm.riskW>0?'<td style="padding:0 12px 0 0"><span style="font-size:11px;color:#555">Risk exposure: </span><strong style="color:#c62828">-'+fmt(sm.riskW)+'</strong></td>':'')
    +(sm.oppUp>0?'<td><span style="font-size:11px;color:#555">Opportunity upside: </span><strong style="color:#2e7d32">+'+fmt(sm.oppUp)+'</strong></td>':'')
    +'</tr></table></td></tr>':'')

    // Revenue by Platform
    +'<tr><td style="padding:24px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c62828;margin-bottom:8px">Revenue by Platform (top 5 — retained)</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +'<tr style="background:#f5f5f5"><th style="padding:7px 12px;text-align:left;font-size:11px;color:#666;font-weight:600">Platform</th><th style="padding:7px 12px;text-align:right;font-size:11px;color:#666;font-weight:600">Revenue</th></tr>'
    +(topPlatRows||'<tr><td colspan="2" style="padding:10px;color:#999;text-align:center">No data</td></tr>')
    +'</table></td></tr>'

    // Top Accounts
    +'<tr><td style="padding:20px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c62828;margin-bottom:8px">Top 5 Accounts (retained)</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +'<tr style="background:#f5f5f5"><th style="padding:7px 12px;text-align:left;font-size:11px;color:#666;font-weight:600">Account</th><th style="padding:7px 12px;text-align:right;font-size:11px;color:#666;font-weight:600">Revenue</th></tr>'
    +(topAccRows||'<tr><td colspan="2" style="padding:10px;color:#999;text-align:center">No data</td></tr>')
    +'</table></td></tr>'

    // Risk Register
    +'<tr><td style="padding:20px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c62828;margin-bottom:8px">Risk Register</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +'<tr style="background:#f5f5f5"><th style="padding:7px 12px;text-align:left;font-size:11px;color:#666;font-weight:600">Account</th><th style="padding:7px 12px;text-align:left;font-size:11px;color:#666;font-weight:600">Description</th><th style="padding:7px 12px;text-align:center;font-size:11px;color:#666;font-weight:600">Prob.</th><th style="padding:7px 12px;text-align:right;font-size:11px;color:#666;font-weight:600">Weighted</th></tr>'
    +riskRows+'</table></td></tr>'

    // Opportunity Pipeline
    +'<tr><td style="padding:20px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1565c0;margin-bottom:8px">Opportunity Pipeline</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +'<tr style="background:#f5f5f5"><th style="padding:7px 12px;text-align:left;font-size:11px;color:#666;font-weight:600">Account</th><th style="padding:7px 12px;text-align:left;font-size:11px;color:#666;font-weight:600">Type</th><th style="padding:7px 12px;text-align:center;font-size:11px;color:#666;font-weight:600">Quarter</th><th style="padding:7px 12px;text-align:right;font-size:11px;color:#666;font-weight:600">Upside</th></tr>'
    +oppRows+'</table></td></tr>'

    // Assumptions
    +(S.assumps.length?'<tr><td style="padding:20px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#555;margin-bottom:8px">Assumptions</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +assumpRows+'</table></td></tr>':'')

    // Benchmarks - Platform
    +(platBench?'<tr><td style="padding:20px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#555;margin-bottom:8px">Avg Revenue/System by Platform vs All-Countries</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +'<tr style="background:#f5f5f5"><th style="padding:6px 10px;text-align:left;font-size:11px;color:#666">Platform</th><th style="padding:6px 10px;text-align:right;font-size:11px;color:#666">Selection</th><th style="padding:6px 10px;text-align:right;font-size:11px;color:#666">All Countries</th><th style="padding:6px 10px;text-align:right;font-size:11px;color:#666">Vs Avg</th></tr>'
    +platBench+'</table></td></tr>':'')

    // Benchmarks - Coverage
    +(covBench?'<tr><td style="padding:20px 32px 0">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#555;margin-bottom:8px">Avg Revenue/System by Coverage vs All-Countries</div>'
    +'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">'
    +'<tr style="background:#f5f5f5"><th style="padding:6px 10px;text-align:left;font-size:11px;color:#666">Coverage Type</th><th style="padding:6px 10px;text-align:right;font-size:11px;color:#666">Selection</th><th style="padding:6px 10px;text-align:right;font-size:11px;color:#666">All Countries</th><th style="padding:6px 10px;text-align:right;font-size:11px;color:#666">Vs Avg</th></tr>'
    +covBench+'</table></td></tr>':'')

    // Footer
    +'<tr><td style="padding:28px 32px;margin-top:8px">'
    +'<div style="border-top:1px solid #eee;padding-top:20px;color:#999;font-size:11px;text-align:center">'
    +'Generated by JJV Business Plan Tool &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Internal Use Only'
    +'</div></td></tr>'

    +'</table></td></tr></table>'
    +'</body></html>';
}


function openEmailModal(){
  const html=buildEmailHTML();
  const frame=$('emlFrame');
  const doc=frame.contentDocument||frame.contentWindow.document;
  doc.open();doc.write(html);doc.close();
  $('emlModal').classList.add('on');
}
function closeEmailModal(){$('emlModal').classList.remove('on')}
function copyEmailHTML(){
  const html=buildEmailHTML();
  const btn=$('btnCopyHtml');
  const ok=()=>{btn.textContent='✓ Copied!';btn.style.background='#2e7d32';setTimeout(()=>{btn.textContent='Copy HTML';btn.style.background='';},2500);};
  try{
    const item=new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([html],{type:'text/plain'})});
    navigator.clipboard.write([item]).then(ok).catch(()=>{navigator.clipboard.writeText(html).then(ok).catch(()=>alert('Copy failed — please use Ctrl+A / Ctrl+C on the preview.'));});
  }catch(e){navigator.clipboard.writeText(html).then(ok).catch(()=>alert('Copy failed — please use Ctrl+A / Ctrl+C on the preview.'));}
}
function sendEmail(){
  const to=$('emlTo').value.trim();
  const cc=$('emlCc').value.trim();
  const type=$('rnType').value,year=$('rnYear').value,code=type+year;
  const filtered=getFiltered();
  const sm=calcSummary(filtered);
  const scopeParts=S.filt.clusters.size?[...S.filt.clusters]:S.filt.countries.size?[...S.filt.countries]:['All Regions'];
  const rnRate=sm.base>0?((sm.retRev/sm.base)*100).toFixed(1):0;
  const chPct=sm.base>0?((sm.chnRev/sm.base)*100).toFixed(1):0;
  const date=new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'});
  const riskLine=sm.riskW>0?'  Risk-weighted exposure:  -'+fmt(sm.riskW)+'\n':'';
  const oppLine=sm.oppUp>0?'  Opportunity upside:       +'+fmt(sm.oppUp)+'\n':'';
  const riskNote=S.risks.length?'\nRISK REGISTER ('+S.risks.length+')\n'+S.risks.map(r=>'  • '+r.cust+' — '+r.desc+' ('+r.prob+'% / weighted '+fmt((r.prob/100)*r.impact)+')').join('\n'):'';
  const oppNote=S.opps.length?'\nOPPORTUNITY PIPELINE ('+S.opps.length+')\n'+S.opps.map(o=>'  • '+o.cust+' — '+o.type+(o.qtr?' ['+o.qtr+']':'')+': +'+fmt(o.revenue)).join('\n'):'';
  const assumpNote=S.assumps.length?'\nASSUMPTIONS ('+S.assumps.length+')\n'+S.assumps.map(a=>'  ['+a.cat+'] '+a.txt).join('\n'):'';
  const body='Johnson & Johnson Vision — Technical Service Iberia\n'
    +code+' Business Plan Summary | '+date+'\n'
    +'Scope: '+scopeParts.join(', ')+'\n'
    +'─'.repeat(52)+'\n\n'
    +'REVENUE SUMMARY\n'
    +'  Base revenue:        '+fmt(sm.base)+'\n'
    +'  Retained revenue:    '+fmt(sm.retRev)+'  ('+rnRate+'% retention)\n'
    +'  Contract churn:     -'+fmt(sm.chnRev)+'  ('+chPct+'% of base, '+sm.chnCnt+' systems)\n'
    +riskLine+oppLine
    +'  ────────────────────────────────\n'
    +'  NET PROJECTION '+code+': '+fmt(sm.net)+'\n'
    +riskNote+oppNote+assumpNote+'\n\n'
    +'─'.repeat(52)+'\n'
    +'For the full formatted report with charts, open the Business Plan HTML file in your browser.\n'
    +'Generated by JJV Business Plan Tool';
  const subject=encodeURIComponent('JJV Technical Service — '+code+' Business Plan Summary');
  const bodyEnc=encodeURIComponent(body);
  const ccPart=cc?'&cc='+encodeURIComponent(cc):'';
  window.location.href='mailto:'+encodeURIComponent(to)+'?subject='+subject+ccPart+'&body='+bodyEnc;
}

function closeRpt(){$('rptOvl').classList.remove('on')}


// ===== DB REPORTS =====
const IS_FLASK = window.location.protocol === 'http:';

function saveSession(){ autoSave(); }

function showToast(msg, isErr){
  var t = $('rptToast');
  t.textContent = msg;
  t.style.background = isErr ? '#c62828' : '#2e7d32';
  t.classList.add('on');
  clearTimeout(t._tm);
  t._tm = setTimeout(function(){ t.classList.remove('on'); }, 2600);
}

function getStateJson(){
  return JSON.stringify({
    v:2,
    reportType:$('rnType').value, reportYear:$('rnYear').value,
    savedAt:new Date().toISOString(),
    csv:S._csv||'',
    churn:[...S.churn], cRev:S.cRev,
    risks:S.risks, opps:S.opps, assumps:S.assumps||[],
    filters:{
      clusters:[...S.filt.clusters], countries:[...S.filt.countries],
      platforms:[...S.filt.platforms], revTypes:[...S.filt.revTypes],
      search:S.filt.search
    }
  });
}

function openSaveRptModal(){
  if(!IS_FLASK){alert('Save to DB requires the launcher.\nOpen the tool via JJV_BusinessPlanTool.exe');return;}
  if(!S.raw.length){alert('Load a CSV first.');return;}
  var code = $('rnPrev').textContent;
  var filtered = getFiltered();
  var scopeParts = S.filt.clusters.size ? [...S.filt.clusters]
                 : S.filt.countries.size ? [...S.filt.countries]
                 : ['All Regions'];
  var sm = calcSummary(filtered);
  $('srNameInp').value = code + ' — ' + scopeParts.join(', ') + ' — ' + new Date().toLocaleDateString('en-GB');
  $('srCodeInp').value = code;
  $('srScopeInp').value = scopeParts.join(', ');
  window._pendingSummary = {base:sm.base, net:sm.net, churn:sm.chnRev, systems:filtered.length};
  $('saveRptModal').classList.add('on');
  setTimeout(function(){ $('srNameInp').select(); }, 80);
}

function closeSaveRptModal(){
  $('saveRptModal').classList.remove('on');
}

function confirmSaveRpt(){
  var name = $('srNameInp').value.trim();
  if(!name){ $('srNameInp').focus(); return; }
  var body = {
    name: name,
    plan_code: $('srCodeInp').value.trim(),
    scope: $('srScopeInp').value.trim(),
    state_json: getStateJson(),
    summary: window._pendingSummary||{}
  };
  var btn = $('srSaveBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  fetch('/api/reports', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  }).then(function(r){ return r.json(); }).then(function(d){
    closeSaveRptModal();
    showToast('Report saved ✓');
  }).catch(function(){
    showToast('Save failed', true);
  }).finally(function(){
    btn.disabled = false; btn.textContent = 'Save';
  });
}

function openHistory(){
  if(!IS_FLASK){alert('Report history requires the launcher.\nOpen the tool via JJV_BusinessPlanTool.exe');return;}
  $('histPanel').classList.add('on');
  loadHistoryList();
}

function closeHistory(){
  $('histPanel').classList.remove('on');
}

function _escH(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadHistoryList(){
  $('histList').innerHTML = '<div style="color:var(--mut);padding:40px;text-align:center">Loading…</div>';
  fetch('/api/reports').then(function(r){ return r.json(); }).then(function(rows){
    if(!rows.length){
      $('histList').innerHTML = '<div style="color:var(--mut);padding:48px;text-align:center">No saved reports yet.<br>Generate a report and click 💾 Save Report.</div>';
      return;
    }
    $('histList').innerHTML = rows.map(function(r){
      var sm; try{ sm=JSON.parse(r.summary_json); }catch(e){ sm={}; }
      var base = sm.base ? '$'+(sm.base/1e6).toFixed(2)+'M' : '–';
      var net  = sm.net  ? '$'+(sm.net/1e6).toFixed(2)+'M'  : '–';
      var kpis = sm.base ? '<div class="hrpt-kpis">Base: <strong>'+base+'</strong> &nbsp;&middot;&nbsp; Net: <strong>'+net+'</strong>'+(sm.systems?' &nbsp;&middot;&nbsp; '+sm.systems+' systems':'')+' </div>' : '';
      return '<div class="hrpt-row">'
        +'<div class="hrpt-info">'
          +'<div class="hrpt-name">'+_escH(r.name)+'</div>'
          +'<div class="hrpt-meta">'+_escH(r.plan_code||'')+(r.scope?' · '+_escH(r.scope):'')+' · '+_escH(r.created_at)+'</div>'
          +kpis
        +'</div>'
        +'<div class="hrpt-acts">'
          +'<button class="hrpt-btn" onclick="restoreFromDB('+r.id+')">&#8617; Restore</button>'
          +'<button class="hrpt-btn dng" onclick="deleteHistoryRpt('+r.id+',this)">✕</button>'
        +'</div>'
        +'</div>';
    }).join('');
  }).catch(function(){
    $('histList').innerHTML = '<div style="color:var(--red);padding:40px;text-align:center">Failed to load reports.</div>';
  });
}

function restoreFromDB(id){
  fetch('/api/reports/'+id).then(function(r){ return r.json(); }).then(function(d){
    var st; try{ st=JSON.parse(d.state_json); }catch(e){ showToast('Invalid state',true); return; }
    if(!st||!st.csv){ showToast('No CSV data in saved state',true); return; }
    if(st.reportType) $('rnType').value=st.reportType;
    if(st.reportYear) $('rnYear').value=st.reportYear;
    updateRN();
    S._csv=st.csv;
    Papa.parse(st.csv,{header:true,skipEmptyLines:true,complete:function(res){
      S.raw=res.data.map(function(r,i){
        var rev=parseFloat(r.USD_annual_amount)||0;
        var dv=r.days_to_contract_renew;
        var days=(dv===''||dv==null||dv==='not_contract')?null:parseInt(dv);
        return Object.assign({},r,{_id:i,_rev:rev,_days:isNaN(days)?null:days});
      });
      S.churn=new Set(st.churn||[]);
      S.cRev=st.cRev||{};
      S.risks=st.risks||[];
      S.opps=st.opps||[];
      S.assumps=st.assumps||[];
      var fl=st.filters||{};
      S.filt.clusters=new Set(fl.clusters||[]);
      S.filt.countries=new Set(fl.countries||[]);
      S.filt.platforms=new Set(fl.platforms||[]);
      S.filt.revTypes=new Set(fl.revTypes||[]);
      S.filt.search=fl.search||'';
      S.page=1;
      initFilts(); renderAll(); renderRisks(); renderOpps();
      $('uploadZone').style.display='none';
      $('appContent').classList.add('on');
      $('btnGen').disabled=false; $('btnSave').classList.add('on');
      S.insightsDirty=true;
      closeHistory();
      showToast('Report restored ✓');
    }});
  }).catch(function(){ showToast('Failed to load report',true); });
}

function deleteHistoryRpt(id, btn){
  if(!confirm('Delete this saved report?')) return;
  fetch('/api/reports/'+id,{method:'DELETE'}).then(function(){
    loadHistoryList();
  }).catch(function(){ showToast('Delete failed',true); });
}


// ===== REPORT COMPARISON =====
function openCompareModal(){
  if(!IS_FLASK){alert('Compare requires the launcher.\nOpen via JJV_BusinessPlanTool.exe');return;}
  if(!S.raw.length){alert('Load a CSV first.');return;}
  $('cmpModal').classList.add('on');
  loadCompareList();
}
function closeCompareModal(){ $('cmpModal').classList.remove('on'); }
function clearComparison(){ $('cmpBar').classList.remove('on'); }

function loadCompareList(){
  $('cmpList').innerHTML='<div style="color:var(--mut);padding:32px;text-align:center">Loading…</div>';
  fetch('/api/reports').then(function(r){return r.json();}).then(function(rows){
    if(!rows.length){
      $('cmpList').innerHTML='<div style="color:var(--mut);padding:36px;text-align:center">No saved reports yet.<br>Save a report first via 💾 Save Report.</div>';
      return;
    }
    $('cmpList').innerHTML=rows.map(function(r){
      var sm; try{sm=JSON.parse(r.summary_json);}catch(e){sm={};}
      var base=sm.base?'Base $'+(sm.base/1e6).toFixed(2)+'M':'';
      var net=sm.net?' · Net $'+(sm.net/1e6).toFixed(2)+'M':'';
      return '<div class="cmpm-row">'
        +'<div class="cmpm-info">'
          +'<div class="cmpm-name">'+_escH(r.name)+'</div>'
          +'<div class="cmpm-meta">'+_escH(r.plan_code||'')+(r.scope?' · '+_escH(r.scope):'')+' · '+_escH(r.created_at)+(base?' · '+base+net:'')+' </div>'
        +'</div>'
        +'<button class="cmpm-btn" onclick="selectForCompare('+r.id+',this)">Compare</button>'
        +'</div>';
    }).join('');
  }).catch(function(){
    $('cmpList').innerHTML='<div style="color:var(--red);padding:32px;text-align:center">Failed to load reports.</div>';
  });
}

function computeSummaryFrom(st){
  var rows=[];
  var churn=new Set(st.churn||[]);
  var cRevMap=st.cRev||{};
  try{
    var parsed=Papa.parse(st.csv||'',{header:true,skipEmptyLines:true});
    rows=parsed.data.map(function(r,i){
      var rev=parseFloat(r.USD_annual_amount)||0;
      var dv=r.days_to_contract_renew;
      var days=(dv===''||dv==null||dv==='not_contract')?null:parseInt(dv);
      return Object.assign({},r,{_id:i,_rev:rev,_days:isNaN(days)?null:days});
    });
  }catch(e){ return {base:0,retRev:0,chnRev:0,diffRev:0,riskW:0,oppUp:0,net:0}; }
  var base=0,retRev=0,chnRev=0,diffRev=0;
  rows.forEach(function(r){
    var rev=cRevMap[r._id]!==undefined?cRevMap[r._id]:r._rev;
    var hx=r._days!==null&&r._days<-356;
    if(hx){diffRev+=rev;return;}
    base+=rev;
    if(churn.has(r._id))chnRev+=rev; else retRev+=rev;
  });
  var riskW=(st.risks||[]).reduce(function(s,r){return s+(r.prob/100)*r.impact;},0);
  var oppUp=(st.opps||[]).reduce(function(s,o){return s+o.revenue;},0);
  return{base:base,retRev:retRev,chnRev:chnRev,diffRev:diffRev,riskW:riskW,oppUp:oppUp,net:retRev-riskW+oppUp};
}

function selectForCompare(id, btn){
  btn.textContent='…'; btn.disabled=true;
  fetch('/api/reports/'+id).then(function(r){return r.json();}).then(function(d){
    var st; try{st=JSON.parse(d.state_json);}catch(e){showToast('Invalid saved state',true);return;}
    var other=computeSummaryFrom(st);
    closeCompareModal();
    renderComparison(other, d.name);
  }).catch(function(){
    showToast('Failed to load report',true);
  }).finally(function(){btn.textContent='Compare';btn.disabled=false;});
}

function _fmtM(v){
  var abs=Math.abs(v);
  if(abs>=1e6) return '$'+(v/1e6).toFixed(2)+'M';
  if(abs>=1e3) return '$'+(v/1e3).toFixed(1)+'K';
  return '$'+Math.round(v);
}

function renderComparison(other, otherName){
  var filtered=getFiltered();
  var cur=calcSummary(filtered);
  var code=$('rnPrev').textContent;
  $('cmpCurrName').textContent=code;
  $('cmpOtherName').textContent=otherName;

  // good:true  → higher current is better (green when delta>0)
  // good:false → lower  current is better (green when delta<0)
  var metrics=[
    {lbl:'Base Revenue',     cur:cur.base,    oth:other.base,    good:true },
    {lbl:'Retained Revenue', cur:cur.retRev,  oth:other.retRev,  good:true },
    {lbl:'Churn Loss',       cur:cur.chnRev,  oth:other.chnRev,  good:false},
    {lbl:'⚠ Difficult',     cur:cur.diffRev, oth:other.diffRev, good:false},
    {lbl:'Risk Exposure',    cur:cur.riskW,   oth:other.riskW,   good:false},
    {lbl:'Opp. Upside',      cur:cur.oppUp,   oth:other.oppUp,   good:true },
    {lbl:'Net Projection',   cur:cur.net,     oth:other.net,     good:true },
  ];

  var tRows=metrics.map(function(m){
    var delta=m.cur-m.oth;
    var pct=m.oth!==0?(delta/Math.abs(m.oth)*100):null;
    var positive=m.good?(delta>0):(delta<0);
    var negative=m.good?(delta<0):(delta>0);
    var cls=delta===0?'cmp-neu':positive?'cmp-pos':'cmp-neg';
    var arrow=delta===0?'':delta>0?'↑':'↓';
    var sign=delta>=0?'+':'';
    return '<tr>'
      +'<td>'+m.lbl+'</td>'
      +'<td>'+_fmtM(m.cur)+'</td>'
      +'<td>'+_fmtM(m.oth)+'</td>'
      +'<td class="'+cls+'">'+sign+_fmtM(delta)+' '+arrow+'</td>'
      +'<td class="'+cls+'">'+(pct!==null?sign+pct.toFixed(1)+'%':'–')+'</td>'
      +'</tr>';
  });

  var otherHeader=_escH(otherName.length>28?otherName.slice(0,26)+'…':otherName);
  $('cmpTable').innerHTML='<table class="cmp-tbl">'
    +'<thead><tr>'
    +'<th style="text-align:left">Metric</th>'
    +'<th>Current ('+_escH(code)+')</th>'
    +'<th>'+otherHeader+'</th>'
    +'<th>Δ Absolute</th>'
    +'<th>Δ %</th>'
    +'</tr></thead>'
    +'<tbody>'+tRows.join('')+'</tbody>'
    +'</table>';

  $('cmpBar').classList.add('on');
  // Scroll to top so bar is visible
  window.scrollTo({top:0,behavior:'smooth'});
}


// ===== UNDO / REDO =====
const MAX_UNDO = 40;

function _snap(){
  return{
    churn:[...S.churn],
    cRev:Object.assign({},S.cRev),
    risks:S.risks.map(function(r){return Object.assign({},r);}),
    opps:S.opps.map(function(o){return Object.assign({},o);}),
    assumps:(S.assumps||[]).map(function(a){return Object.assign({},a);})
  };
}

function pushHistory(){
  S._redo=[];
  S._undo.push(_snap());
  if(S._undo.length>MAX_UNDO) S._undo.shift();
  _updUR();
}

function _applySnap(snap){
  S.churn=new Set(snap.churn);
  S.cRev=Object.assign({},snap.cRev);
  S.risks=snap.risks.map(function(r){return Object.assign({},r);});
  S.opps=snap.opps.map(function(o){return Object.assign({},o);});
  S.assumps=snap.assumps.map(function(a){return Object.assign({},a);});
  renderAll(); renderRisks(); renderOpps(); renderAssumps();
  _updUR();
}

function doUndo(){
  if(!S._undo.length) return;
  S._redo.push(_snap());
  _applySnap(S._undo.pop());
  showToast('Undone (' + S._undo.length + ' left)');
}

function doRedo(){
  if(!S._redo.length) return;
  S._undo.push(_snap());
  _applySnap(S._redo.pop());
  showToast('Redone');
}

function _updUR(){
  var bu=$('btnUndo'), br=$('btnRedo');
  if(bu){ bu.disabled=!S._undo.length; bu.title='Undo'+( S._undo.length?' ('+S._undo.length+')':''); }
  if(br){ br.disabled=!S._redo.length; br.title='Redo'+( S._redo.length?' ('+S._redo.length+')':''); }
}

document.addEventListener('keydown', function(e){
  var ctrl=e.ctrlKey||e.metaKey;
  if(ctrl && e.key==='z' && !e.shiftKey){ e.preventDefault(); doUndo(); }
  if(ctrl && (e.key==='y' || (e.key==='z' && e.shiftKey))){ e.preventDefault(); doRedo(); }
});


// ===== THEME =====
function toggleTheme(){
  var html=document.documentElement;
  var isLight=html.getAttribute('data-theme')==='light';
  html.setAttribute('data-theme', isLight?'dark':'light');
  localStorage.setItem('jjv_theme', isLight?'dark':'light');
  var btn=$('btnTheme');
  if(btn) btn.textContent=isLight?'☀':'🌙';
}
function applyThemeBtn(){
  var btn=$('btnTheme');if(!btn)return;
  btn.textContent=document.documentElement.getAttribute('data-theme')==='light'?'🌙':'☀';
}

// ===== INIT =====
applyThemeBtn();
updateRN();
renderRisks();
renderOpps();
renderAssumps();
S.insightsDirty=false;
