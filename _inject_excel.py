import sys, re
c = open('business_plan_tool.html', encoding='utf-8').read()

NEW_FN = r"""function exportExcel(){
  if(!window.XLSX){alert('SheetJS not loaded. Please reload the app with an internet connection.');return;}
  var filtered=getFiltered();
  var sm=calcSummary(filtered);
  var inScope=filtered.filter(function(r){return!isHX(r);});
  var difficult=filtered.filter(function(r){return isHX(r);});
  var retained=inScope.filter(function(r){return!S.churn.has(r._id);});
  var churned=inScope.filter(function(r){return S.churn.has(r._id);});
  var year=$('rnYear').value||new Date().getFullYear();
  var type=$('rnType').value||'BP';
  var code=type+year;
  var wb=XLSX.utils.book_new();

  // ── helper: set column widths
  function setCols(ws,widths){ws['!cols']=widths.map(function(w){return{wch:w};});}

  // ── Sheet 1: Summary ──────────────────────────────────────────────
  var platMapS={};
  retained.forEach(function(r){
    var p=r.Platform||'Unknown';
    if(!platMapS[p])platMapS[p]={rev:0,cnt:0};
    platMapS[p].rev+=getRev(r);platMapS[p].cnt++;
  });
  var topPlats=Object.keys(platMapS).sort(function(a,b){return platMapS[b].rev-platMapS[a].rev;});

  var sumData=[
    ['JJV Business Plan Tool — '+code,'','Generated:',new Date().toLocaleDateString()],
    [],
    ['REVENUE SUMMARY','Value (USD)'],
    ['Base Revenue (In-Scope)',sm.base],
    ['Retained Revenue',sm.retRev],
    ['Churn Revenue',sm.chnRev],
    ['Difficult to Renew (Excluded)',sm.diffRev],
    ['Risk-Weighted Exposure',sm.riskW],
    ['Opportunity Upside',sm.oppUp],
    ['Net Plan Revenue',sm.net],
    [],
    ['CONTRACT COUNTS','Count'],
    ['Retained Contracts',sm.retCnt],
    ['Churned Contracts',sm.chnCnt],
    ['Difficult to Renew',sm.diffCnt],
    ['Total In-Scope',sm.inScopeCount],
    [],
    ['PLATFORM REVENUE BREAKDOWN','Revenue (USD)','Contracts','% of Retained']
  ];
  topPlats.forEach(function(p){
    var pct=sm.retRev>0?platMapS[p].rev/sm.retRev:0;
    sumData.push([p,platMapS[p].rev,platMapS[p].cnt,pct]);
  });
  var wsSummary=XLSX.utils.aoa_to_sheet(sumData);
  setCols(wsSummary,[34,16,12,16]);
  XLSX.utils.book_append_sheet(wb,wsSummary,'Summary');

  // ── Sheet 2: By Platform ──────────────────────────────────────────
  var platData=[['Platform','Revenue (USD)','Contracts','% of Retained']];
  topPlats.forEach(function(p){
    var pct=sm.retRev>0?platMapS[p].rev/sm.retRev:0;
    platData.push([p,platMapS[p].rev,platMapS[p].cnt,pct]);
  });
  var wsPlat=XLSX.utils.aoa_to_sheet(platData);
  setCols(wsPlat,[20,16,12,16]);
  XLSX.utils.book_append_sheet(wb,wsPlat,'By Platform');

  // ── Sheet 3: By Country ───────────────────────────────────────────
  var ctryMap={};
  retained.forEach(function(r){
    var ct=r.Country||'Unknown';
    if(!ctryMap[ct])ctryMap[ct]={rev:0,cnt:0,cluster:r.Cluster||''};
    ctryMap[ct].rev+=getRev(r);ctryMap[ct].cnt++;
  });
  var ctryData=[['Country','Cluster','Revenue (USD)','Contracts','% of Retained']];
  Object.keys(ctryMap).sort().forEach(function(ct){
    var pct=sm.retRev>0?ctryMap[ct].rev/sm.retRev:0;
    ctryData.push([ct,ctryMap[ct].cluster,ctryMap[ct].rev,ctryMap[ct].cnt,pct]);
  });
  var wsCtry=XLSX.utils.aoa_to_sheet(ctryData);
  setCols(wsCtry,[18,14,16,12,16]);
  XLSX.utils.book_append_sheet(wb,wsCtry,'By Country');

  // ── Contract columns helper
  var contractHdr=['Account','Country','Cluster','Platform','Serial Number','Coverage Type','End Date','Days','Rev Type','Annual Revenue (USD)'];
  function contractRow(r){
    return[
      r.account_name||'',r.Country||'',r.Cluster||'',r.Platform||'',
      r.Serial_number||'',r.Coverage_type||'',
      r.end_date&&r.end_date!=='not_contract'?r.end_date:'',
      r._days!=null?r._days:'',
      r.Direct_vs_bundle_revenue||'',
      getRev(r)
    ];
  }
  var contractCols=[30,14,14,16,18,22,12,8,14,18];

  // ── Sheet 4: Retained ─────────────────────────────────────────────
  var retData=[contractHdr];
  retained.forEach(function(r){retData.push(contractRow(r));});
  var wsRet=XLSX.utils.aoa_to_sheet(retData);
  setCols(wsRet,contractCols);
  XLSX.utils.book_append_sheet(wb,wsRet,'Retained');

  // ── Sheet 5: Churned ──────────────────────────────────────────────
  var chnData=[contractHdr];
  churned.forEach(function(r){chnData.push(contractRow(r));});
  var wsChn=XLSX.utils.aoa_to_sheet(chnData);
  setCols(wsChn,contractCols);
  XLSX.utils.book_append_sheet(wb,wsChn,'Churned');

  // ── Sheet 6: Difficult to Renew ───────────────────────────────────
  var diffHdr=['Account','Country','Cluster','Platform','Serial Number','Coverage Type','End Date','Days Expired','Rev Type','Annual Revenue (USD)'];
  var diffData=[diffHdr];
  difficult.forEach(function(r){
    diffData.push([
      r.account_name||'',r.Country||'',r.Cluster||'',r.Platform||'',
      r.Serial_number||'',r.Coverage_type||'',
      r.end_date&&r.end_date!=='not_contract'?r.end_date:'',
      r._days!=null?Math.abs(r._days):'',
      r.Direct_vs_bundle_revenue||'',
      getRev(r)
    ]);
  });
  var wsDiff=XLSX.utils.aoa_to_sheet(diffData);
  setCols(wsDiff,contractCols);
  XLSX.utils.book_append_sheet(wb,wsDiff,'Difficult to Renew');

  // ── Sheet 7: Risk Register ────────────────────────────────────────
  var riskData=[['Account','Platform','Serial','Coverage','Description','Contract End','Probability (%)','Revenue at Risk (USD)','Weighted Impact (USD)']];
  S.risks.forEach(function(rk){
    riskData.push([rk.cust||'',rk.plat||'',rk.sn||'',rk.cov||'',rk.desc||'',rk.endStr||'',rk.prob,rk.impact,rk.prob/100*rk.impact]);
  });
  var wsRisk=XLSX.utils.aoa_to_sheet(riskData);
  setCols(wsRisk,[28,16,16,20,36,14,14,20,20]);
  XLSX.utils.book_append_sheet(wb,wsRisk,'Risks');

  // ── Sheet 8: Opportunities ────────────────────────────────────────
  var oppData=[['Account','Platform','Serial','Coverage','Type','Description','Quarter','Expected Revenue (USD)']];
  S.opps.forEach(function(op){
    oppData.push([op.cust||'',op.plat||'',op.sn||'',op.cov||'',op.type||'',op.desc||'',op.qtr||'',op.revenue]);
  });
  var wsOpp=XLSX.utils.aoa_to_sheet(oppData);
  setCols(wsOpp,[28,16,16,20,14,36,10,22]);
  XLSX.utils.book_append_sheet(wb,wsOpp,'Opportunities');

  // ── Sheet 9: Assumptions ──────────────────────────────────────────
  var assData=[['Category','Assumption']];
  S.assumps.forEach(function(a){assData.push([a.cat||'',a.txt||'']);});
  var wsAss=XLSX.utils.aoa_to_sheet(assData);
  setCols(wsAss,[20,60]);
  XLSX.utils.book_append_sheet(wb,wsAss,'Assumptions');

  // ── Download ──────────────────────────────────────────────────────
  XLSX.writeFile(wb,code+'_BusinessPlan.xlsx');
}"""

# Find and replace the existing exportExcel function
old_start = c.find('function exportExcel(){')
assert old_start >= 0, 'exportExcel() not found!'

# Find where the function ends (next top-level function)
old_end = c.find('\nfunction ', old_start + 10)
assert old_end >= 0, 'Could not find end of exportExcel()'

old_fn = c[old_start:old_end]
print('Old function length:', len(old_fn))
print('New function length:', len(NEW_FN))

c2 = c[:old_start] + NEW_FN + c[old_end:]
assert len(c2) != len(c) or c2 != c, 'No change made!'
print('Replacement OK. File delta:', len(c2)-len(c))
open('business_plan_tool.html', 'w', encoding='utf-8').write(c2)
