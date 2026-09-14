import sys
sys.stdout.reconfigure(encoding='utf-8')
c = open('business_plan_tool.html', encoding='utf-8').read()
original_len = len(c)

def apply(old, new, label):
    global c
    assert old in c, f'NOT FOUND: {label}'
    c = c.replace(old, new, 1)
    print(f'OK: {label}')

# ── 1. CSS: add multi-compare styles after .cmpm-btn:hover ───────────────────
apply(
    '.cmpm-btn:hover{background:#8b5cf6}',
    '''.cmpm-btn:hover{background:#8b5cf6}
.cmpm-check{display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--bdr);border-radius:var(--rs);margin-bottom:8px;cursor:pointer;transition:all .15s;user-select:none}
.cmpm-check:hover{border-color:#a78bfa;background:rgba(167,139,250,.05)}
.cmpm-check.selected{border-color:#a78bfa;background:rgba(167,139,250,.08)}
.cmpm-check input[type=checkbox]{width:15px;height:15px;accent-color:#a78bfa;flex-shrink:0;cursor:pointer;pointer-events:none}
.cmpm-footer{padding:11px 20px;border-top:1px solid var(--bdr);display:flex;align-items:center;gap:10px;justify-content:flex-end;flex-shrink:0}
.cmpm-count{color:var(--mut);font-size:0.8rem;flex:1}
.cmpm-run{background:#a78bfa;color:#fff;border:none;border-radius:var(--rs);padding:7px 18px;font-size:0.83rem;font-weight:600;cursor:pointer;transition:background .15s;white-space:nowrap}
.cmpm-run:disabled{opacity:.35;cursor:not-allowed}
.cmpm-run:not(:disabled):hover{background:#8b5cf6}''',
    'CSS: cmpm-check/footer/run styles'
)

# ── 2. HTML: update modal box (header + add footer) ──────────────────────────
apply(
    '''  <div class="cmpm-box">
    <div class="cmpm-hdr">
      <h3>⇄ Select report to compare against</h3>
      <button class="btn-cls" onclick="closeCompareModal()">✕</button>
    </div>
    <div class="cmpm-body">
      <div id="cmpList"></div>
    </div>
  </div>''',
    '''  <div class="cmpm-box">
    <div class="cmpm-hdr">
      <h3>⇄ Compare Reports</h3>
      <button class="btn-cls" onclick="closeCompareModal()">✕</button>
    </div>
    <div class="cmpm-body">
      <div style="font-size:0.78rem;color:var(--mut);margin-bottom:10px">Select 2 or more reports to compare side by side. Check <em>Current Session</em> to include the active view.</div>
      <div id="cmpList"></div>
    </div>
    <div class="cmpm-footer">
      <span class="cmpm-count" id="cmpSelCount"></span>
      <button class="cmpm-run" id="cmpRunBtn" onclick="runMultiCompare()" disabled>Select 2+ to Compare</button>
    </div>
  </div>''',
    'HTML: modal header + footer'
)

# ── 3. HTML: simplify cmpBar title to a single dynamic span ──────────────────
apply(
    '<span class="cmp-title">⇄ Comparing: <strong id="cmpCurrName">Current</strong> &nbsp;vs&nbsp; <strong id="cmpOtherName">—</strong></span>',
    '<span class="cmp-title" id="cmpTitleSpan">⇄ Comparing</span>',
    'HTML: cmpBar title span'
)

# ── 4. JS: replace loadCompareList ───────────────────────────────────────────
OLD_LOAD = '''function loadCompareList(){
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
}'''

NEW_LOAD = '''function loadCompareList(){
  $('cmpList').innerHTML='<div style="color:var(--mut);padding:32px;text-align:center">Loading…</div>';
  fetch('/api/reports').then(function(r){return r.json();}).then(function(rows){
    if(!rows.length){
      $('cmpList').innerHTML='<div style="color:var(--mut);padding:36px;text-align:center">No saved reports yet.<br>Save a report first via 💾 Save Report.</div>';
      _onCmpCheck();return;
    }
    var curRow=S.raw.length
      ?'<div class="cmpm-check" onclick="var cb=this.querySelector(\'input\');cb.checked=!cb.checked;_onCmpCheck();">'
        +'<input type="checkbox" class="cmpm-chk" value="__current__" onclick="event.stopPropagation()" onchange="_onCmpCheck()">'
        +'<div class="cmpm-info">'
          +'<div class="cmpm-name">⧡ Current Session</div>'
          +'<div class="cmpm-meta">'+_escH($('rnPrev').textContent)+' · active filters applied</div>'
        +'</div></div>'
      :'';
    $('cmpList').innerHTML=curRow+rows.map(function(r){
      var sm;try{sm=JSON.parse(r.summary_json);}catch(e){sm={};}
      var base=sm.base?'Base $'+(sm.base/1e6).toFixed(2)+'M':'';
      var net=sm.net?' · Net $'+(sm.net/1e6).toFixed(2)+'M':'';
      return '<div class="cmpm-check" onclick="var cb=this.querySelector(\'input\');cb.checked=!cb.checked;_onCmpCheck();">'
        +'<input type="checkbox" class="cmpm-chk" value="'+r.id+'" onclick="event.stopPropagation()" onchange="_onCmpCheck()">'
        +'<div class="cmpm-info">'
          +'<div class="cmpm-name">'+_escH(r.name)+'</div>'
          +'<div class="cmpm-meta">'+_escH(r.plan_code||'')+(r.scope?' · '+_escH(r.scope):'')+' · '+_escH(r.created_at)+(base?' · '+base+net:'')+' </div>'
        +'</div></div>';
    }).join('');
    _onCmpCheck();
  }).catch(function(){
    $('cmpList').innerHTML='<div style="color:var(--red);padding:32px;text-align:center">Failed to load reports.</div>';
  });
}'''

apply(OLD_LOAD, NEW_LOAD, 'JS: loadCompareList rewrite')

# ── 5. JS: replace selectForCompare with _onCmpCheck + runMultiCompare ───────
OLD_SEL = '''function selectForCompare(id, btn){
  btn.textContent='…'; btn.disabled=true;
  fetch('/api/reports/'+id).then(function(r){return r.json();}).then(function(d){
    var st; try{st=JSON.parse(d.state_json);}catch(e){showToast('Invalid saved state',true);return;}
    var other=computeSummaryFrom(st);
    closeCompareModal();
    renderComparison(other, d.name);
  }).catch(function(){
    showToast('Failed to load report',true);
  }).finally(function(){btn.textContent='Compare';btn.disabled=false;});
}'''

NEW_SEL = '''function _onCmpCheck(){
  var n=document.querySelectorAll('#cmpList .cmpm-chk:checked').length;
  var btn=$('cmpRunBtn'),lbl=$('cmpSelCount');
  if(btn){btn.disabled=n<2;btn.textContent=n>=2?'Compare '+n+' Reports':'Select 2+ to Compare';}
  if(lbl){lbl.textContent=n>0?n+' selected':'';}
  document.querySelectorAll('#cmpList .cmpm-check').forEach(function(row){
    var cb=row.querySelector('input');
    if(cb)row.classList.toggle('selected',cb.checked);
  });
}

function runMultiCompare(){
  var checks=document.querySelectorAll('#cmpList .cmpm-chk:checked');
  var ids=[],includeCurrent=false;
  checks.forEach(function(cb){
    if(cb.value==='__current__')includeCurrent=true;
    else ids.push(parseInt(cb.value));
  });
  if(ids.length+(includeCurrent?1:0)<2){alert('Select at least 2 reports.');return;}
  var btn=$('cmpRunBtn');
  btn.disabled=true;btn.textContent='Loading…';
  Promise.all(ids.map(function(id){
    return fetch('/api/reports/'+id).then(function(r){return r.json();}).then(function(d){
      var st;try{st=JSON.parse(d.state_json);}catch(e){return null;}
      if(!st)return null;
      return{name:d.name,data:computeSummaryFrom(st)};
    });
  })).then(function(results){
    var reports=results.filter(Boolean);
    if(includeCurrent){
      var cd=calcSummary(getFiltered());
      cd.platforms=_curPlatformData();
      reports.unshift({name:$('rnPrev').textContent+' ▪ current',data:cd});
    }
    if(reports.length<2){showToast('Could not load selected reports',true);return;}
    closeCompareModal();
    renderMultiComparison(reports);
  }).catch(function(){
    showToast('Failed to load reports',true);
  }).finally(function(){btn.disabled=false;btn.textContent='Compare '+ids.length+' Reports';});
}'''

apply(OLD_SEL, NEW_SEL, 'JS: selectForCompare -> _onCmpCheck + runMultiCompare')

# ── 6. JS: replace renderComparison with unified multi-compare version ────────
OLD_RENDER = '''function renderComparison(other, otherName){
  var filtered=getFiltered();
  var cur=calcSummary(filtered);
  var code=$('rnPrev').textContent;
  $('cmpCurrName').textContent=code;
  $('cmpOtherName').textContent=otherName;

  var ch=_escH(code.length>18?code.slice(0,16)+'…':code);
  var oh=_escH(otherName.length>18?otherName.slice(0,16)+'…':otherName);

  // ── Table 1: Revenue ────────────────────────────────────────────────────────────────────────────
  var revMetrics=[
    {lbl:'Base Revenue',     icon:'&#9679;', cur:cur.base,    oth:other.base,    good:true },
    {lbl:'Retained Revenue', icon:'&#10003;', cur:cur.retRev,  oth:other.retRev,  good:true },
    {lbl:'Churn Loss',       icon:'&#9888;',  cur:cur.chnRev,  oth:other.chnRev,  good:false},
    {lbl:'Difficult',        icon:'&#9744;',  cur:cur.diffRev, oth:other.diffRev, good:false},
    {lbl:'Risk Exposure',    icon:'&#9651;',  cur:cur.riskW,   oth:other.riskW,   good:false},
    {lbl:'Opp. Upside',      icon:'&#9650;',  cur:cur.oppUp,   oth:other.oppUp,   good:true },
    {lbl:'Net Projection',   icon:'&#9654;',  cur:cur.net,     oth:other.net,     good:true },
  ];
  $('cmpTable').innerHTML=_buildCmpTable(revMetrics, ch, oh, _fmtM);

  // ── Tables 2 & 3: Per-platform ────────────────────────────────────────────────────────────────────────────────
  var curPlat=_curPlatformData();
  var othPlat=other.platforms||{};
  var allPlt=Object.keys(Object.assign({},curPlat,othPlat)).sort();
  var target=S.cRateTarget||80;

  $('cmpTableIB').innerHTML=_buildIBTable(curPlat,othPlat,allPlt,target,ch,oh);

  var avgMetrics=allPlt.map(function(p){
    var cp=curPlat[p]||{retCount:0,retRev:0};
    var op=othPlat[p]||{retCount:0,retRev:0};
    var cv=cp.retCount?cp.retRev/cp.retCount:0;
    var ov=op.retCount?op.retRev/op.retCount:0;
    return{lbl:p, cur:cv, oth:ov, good:true};
  });
  $('cmpTableAvg').innerHTML=_buildCmpTable(avgMetrics, ch, oh, _fmtM);

  $('cmpBar').classList.add('on');
  window.scrollTo({top:0,behavior:'smooth'});
}'''

NEW_RENDER = '''function renderComparison(other, otherName){
  // Wrap in multi-compare format
  var cd=calcSummary(getFiltered());
  cd.platforms=_curPlatformData();
  renderMultiComparison([
    {name:$('rnPrev').textContent,data:cd},
    {name:otherName,data:other}
  ]);
}

function _shortName(n){return _escH(n.length>16?n.slice(0,15)+'…':n);}

function _buildMultiRevTable(reports){
  var keys=['base','retRev','chnRev','diffRev','riskW','oppUp','net'];
  var lbls=['Base Revenue','Retained Revenue','Churn Loss','Difficult to Renew','Risk Exposure','Opp. Upside','Net Projection'];
  var icons=['&#9679;','&#10003;','&#9888;','&#9744;','&#9651;','&#9650;','&#9654;'];
  var hiBetter=[true,true,false,false,false,true,true];
  var colW=Math.max(80,Math.min(130,Math.floor(400/reports.length)));
  var hdr='<div style="overflow-x:auto"><table class="cmp-tbl" style="width:100%;min-width:'+(120+reports.length*colW)+'px">'
    +'<thead><tr style="background:var(--sur2)">'
    +'<th style="text-align:left;padding:7px 12px;min-width:120px">Metric</th>'
    +reports.map(function(r){return'<th style="text-align:right;padding:7px 8px;min-width:'+colW+'px">'+_shortName(r.name)+'</th>';}).join('')
    +'</tr></thead><tbody>';
  var rows=keys.map(function(key,i){
    var vals=reports.map(function(r){return(r.data[key])||0;});
    var mx=Math.max.apply(null,vals),mn=Math.min.apply(null,vals),allSame=mx===mn,good=hiBetter[i];
    var cells=vals.map(function(v){
      var best=!allSame&&(good?v===mx:v===mn),worst=!allSame&&(good?v===mn:v===mx);
      var clr=allSame?'':best?'#3fb950':worst?'#f85149':'var(--txt)';
      return'<td style="text-align:right;padding:6px 8px;color:'+clr+';font-weight:'+(best&&!allSame?700:400)+'">'+_fmtM(v)+'</td>';
    }).join('');
    return'<tr><td style="padding:6px 12px;font-size:0.79rem;white-space:nowrap"><span style="margin-right:5px;opacity:.7">'+icons[i]+'</span>'+lbls[i]+'</td>'+cells+'</tr>';
  }).join('');
  return hdr+rows+'</tbody></table></div>';
}

function _buildMultiIBTable(reports,target){
  var allPlt={};
  reports.forEach(function(r){Object.keys(r.data.platforms||{}).forEach(function(p){allPlt[p]=1;});});
  var plts=Object.keys(allPlt).sort();
  var colW=Math.max(70,Math.min(110,Math.floor(360/reports.length)));
  var html='<div style="overflow-x:auto"><table class="cmp-tbl" style="width:100%;min-width:'+(110+reports.length*colW)+'px">'
    +'<thead><tr style="background:var(--sur2)">'
    +'<th style="text-align:left;padding:7px 12px;min-width:110px">Platform</th>'
    +reports.map(function(r){return'<th style="text-align:right;padding:7px 8px;min-width:'+colW+'px">'+_shortName(r.name)+'</th>';}).join('')
    +'</tr></thead><tbody>';
  plts.forEach(function(p){
    var rates=reports.map(function(r){var pd=(r.data.platforms||{})[p]||{active:0,total:0};return pd.total?pd.active/pd.total*100:0;});
    var mx=Math.max.apply(null,rates),mn=Math.min.apply(null,rates),allSame=mx===mn;
    var cells=reports.map(function(r,ri){
      var pd=(r.data.platforms||{})[p]||{active:0,total:0};
      var rate=rates[ri],best=!allSame&&rate===mx,worst=!allSame&&rate===mn;
      var clr=allSame?'':best?'#3fb950':worst?'#f85149':'var(--txt)';
      return'<td style="text-align:right;padding:5px 8px">'
        +'<div style="color:'+clr+';font-weight:'+(best&&!allSame?700:400)+'">'+rate.toFixed(1)+'%</div>'
        +'<div style="font-size:.7rem;color:var(--mut)">'+pd.active+'/'+pd.total+'</div>'
        +'</td>';
    }).join('');
    html+='<tr><td style="padding:6px 12px;font-size:0.79rem;font-weight:500">'+_escH(p)+'</td>'+cells+'</tr>';
  });
  html+='</tbody></table></div>';
  return html;
}

function _buildMultiAvgTable(reports){
  var allPlt={};
  reports.forEach(function(r){Object.keys(r.data.platforms||{}).forEach(function(p){allPlt[p]=1;});});
  var plts=Object.keys(allPlt).sort();
  var colW=Math.max(80,Math.min(120,Math.floor(380/reports.length)));
  var html='<div style="overflow-x:auto"><table class="cmp-tbl" style="width:100%;min-width:'+(110+reports.length*colW)+'px">'
    +'<thead><tr style="background:var(--sur2)">'
    +'<th style="text-align:left;padding:7px 12px;min-width:110px">Platform</th>'
    +reports.map(function(r){return'<th style="text-align:right;padding:7px 8px;min-width:'+colW+'px">'+_shortName(r.name)+'</th>';}).join('')
    +'</tr></thead><tbody>';
  plts.forEach(function(p){
    var avgs=reports.map(function(r){var pd=(r.data.platforms||{})[p]||{retCount:0,retRev:0};return pd.retCount?pd.retRev/pd.retCount:0;});
    var mx=Math.max.apply(null,avgs),mn=Math.min.apply(null,avgs),allSame=mx===mn;
    var cells=avgs.map(function(avg){
      var best=!allSame&&avg===mx,worst=!allSame&&avg===mn;
      var clr=allSame?'':best?'#3fb950':worst?'#f85149':'var(--txt)';
      return'<td style="text-align:right;padding:6px 8px;color:'+clr+';font-weight:'+(best&&!allSame?700:400)+'">'+_fmtM(avg)+'</td>';
    }).join('');
    html+='<tr><td style="padding:6px 12px;font-size:0.79rem;font-weight:500">'+_escH(p)+'</td>'+cells+'</tr>';
  });
  html+='</tbody></table></div>';
  return html;
}

function renderMultiComparison(reports){
  var target=parseInt($('cmpRateTarget').value)||S.cRateTarget||80;
  var titleEl=$('cmpTitleSpan');
  if(titleEl) titleEl.innerHTML='⇄ Comparing: '+reports.map(function(r){return'<strong>'+_shortName(r.name)+'</strong>';}).join(' &nbsp;·&nbsp; ');
  $('cmpTable').innerHTML=_buildMultiRevTable(reports);
  $('cmpTableIB').innerHTML=_buildMultiIBTable(reports,target);
  $('cmpTableAvg').innerHTML=_buildMultiAvgTable(reports);
  $('cmpBar').classList.add('on');
  window.scrollTo({top:0,behavior:'smooth'});
}'''

apply(OLD_RENDER, NEW_RENDER, 'JS: renderComparison -> renderMultiComparison unified')

# ── Save ─────────────────────────────────────────────────────────────────────
print(f'\nFile delta: {len(c) - original_len:+d} chars')
open('business_plan_tool.html', 'w', encoding='utf-8').write(c)
print('Saved OK')
