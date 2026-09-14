c = open('business_plan_tool.html', encoding='utf-8').read()

FUNC = """
// ===== EXPORT CSV =====
function exportCSV(){
  var filtered=getFiltered();
  var sm=calcSummary(filtered);
  var inScope=filtered.filter(function(r){return!isHX(r);});
  var difficult=filtered.filter(function(r){return isHX(r);});
  var retained=inScope.filter(function(r){return!S.churn.has(r._id);});
  var churned=inScope.filter(function(r){return S.churn.has(r._id);});
  var year=$('rnYear').value||new Date().getFullYear();
  var type=$('rnType').value||'BP';
  var code=type+year;

  function cv(v){
    if(v===null||v===undefined)return'';
    var s=String(v);
    if(s.indexOf(',')>=0||s.indexOf('"')>=0||s.indexOf('\\n')>=0)return'"'+s.replace(/"/g,'""')+'"';
    return s;
  }
  function row(){return Array.prototype.slice.call(arguments).map(cv).join(',')+'\\r\\n';}
  function sec(title){return'\\r\\n'+cv('=== '+title+' ===')+',\\r\\n';}

  var csv='';

  // Report header
  csv+=row('JJV Business Plan Tool',code,'Generated:',new Date().toLocaleDateString());
  csv+='\\r\\n';

  // 1. Revenue Summary
  csv+=sec('REVENUE SUMMARY');
  csv+=row('Metric','Value (USD)');
  csv+=row('Base Revenue (In-Scope)',sm.base.toFixed(2));
  csv+=row('Retained Revenue',sm.retRev.toFixed(2));
  csv+=row('Churn Revenue',sm.chnRev.toFixed(2));
  csv+=row('Difficult to Renew (Excluded)',sm.diffRev.toFixed(2));
  csv+=row('Risk-Weighted Exposure',sm.riskW.toFixed(2));
  csv+=row('Opportunity Upside',sm.oppUp.toFixed(2));
  csv+=row('Net Plan Revenue',sm.net.toFixed(2));
  csv+='\\r\\n';
  csv+=row('Count Metric','Count');
  csv+=row('Retained Contracts',sm.retCnt);
  csv+=row('Churned Contracts',sm.chnCnt);
  csv+=row('Difficult to Renew',sm.diffCnt);
  csv+=row('Total In-Scope',sm.inScopeCount);

  // 2. Platform Breakdown
  csv+=sec('REVENUE BY PLATFORM');
  csv+=row('Platform','Revenue (USD)','Contracts','% of Retained');
  var platMap={};
  retained.forEach(function(r){
    var p=r.Platform||'Unknown';
    if(!platMap[p])platMap[p]={rev:0,cnt:0};
    platMap[p].rev+=getRev(r);
    platMap[p].cnt++;
  });
  Object.keys(platMap).sort().forEach(function(p){
    var pct=sm.retRev>0?(platMap[p].rev/sm.retRev*100).toFixed(1)+'%':'0%';
    csv+=row(p,platMap[p].rev.toFixed(2),platMap[p].cnt,pct);
  });

  // 3. Country Breakdown
  csv+=sec('REVENUE BY COUNTRY');
  csv+=row('Country','Cluster','Revenue (USD)','Contracts','% of Retained');
  var ctryMap={};
  retained.forEach(function(r){
    var ctry=r.Country||'Unknown';
    if(!ctryMap[ctry])ctryMap[ctry]={rev:0,cnt:0,cluster:r.Cluster||''};
    ctryMap[ctry].rev+=getRev(r);
    ctryMap[ctry].cnt++;
  });
  Object.keys(ctryMap).sort().forEach(function(ctry){
    var pct=sm.retRev>0?(ctryMap[ctry].rev/sm.retRev*100).toFixed(1)+'%':'0%';
    csv+=row(ctry,ctryMap[ctry].cluster,ctryMap[ctry].rev.toFixed(2),ctryMap[ctry].cnt,pct);
  });

  // 4. Retained Contracts
  csv+=sec('RETAINED CONTRACTS ('+retained.length+')');
  csv+=row('Account','Country','Cluster','Platform','Serial','Coverage Type','End Date','Days to Expiry','Revenue Type','Annual Revenue (USD)');
  retained.forEach(function(r){
    csv+=row(r.account_name,r.Country,r.Cluster,r.Platform,r.Serial_number,r.Coverage_type,
      r.end_date&&r.end_date!=='not_contract'?r.end_date:'',
      r._days!==null?r._days:'',
      r.Direct_vs_bundle_revenue,getRev(r).toFixed(2));
  });

  // 5. Churned Contracts
  csv+=sec('CHURNED CONTRACTS ('+churned.length+')');
  csv+=row('Account','Country','Cluster','Platform','Serial','Coverage Type','End Date','Days to Expiry','Revenue Type','Annual Revenue (USD)');
  churned.forEach(function(r){
    csv+=row(r.account_name,r.Country,r.Cluster,r.Platform,r.Serial_number,r.Coverage_type,
      r.end_date&&r.end_date!=='not_contract'?r.end_date:'',
      r._days!==null?r._days:'',
      r.Direct_vs_bundle_revenue,getRev(r).toFixed(2));
  });

  // 6. Difficult to Renew
  csv+=sec('DIFFICULT TO RENEW - EXPIRED >1 YEAR ('+difficult.length+')');
  csv+=row('Account','Country','Cluster','Platform','Serial','Coverage Type','End Date','Days Expired','Revenue Type','Annual Revenue (USD)');
  difficult.forEach(function(r){
    csv+=row(r.account_name,r.Country,r.Cluster,r.Platform,r.Serial_number,r.Coverage_type,
      r.end_date&&r.end_date!=='not_contract'?r.end_date:'',
      r._days!==null?Math.abs(r._days):'',
      r.Direct_vs_bundle_revenue,getRev(r).toFixed(2));
  });

  // 7. Risk Register
  csv+=sec('RISK REGISTER ('+S.risks.length+')');
  csv+=row('Account','Platform','Serial','Coverage','Description','Contract End','Probability (%)','Revenue at Risk (USD)','Weighted Impact (USD)');
  S.risks.forEach(function(rk){
    csv+=row(rk.cust,rk.plat,rk.sn,rk.cov,rk.desc,rk.endStr,rk.prob,rk.impact.toFixed(2),(rk.prob/100*rk.impact).toFixed(2));
  });

  // 8. Opportunities
  csv+=sec('OPPORTUNITIES ('+S.opps.length+')');
  csv+=row('Account','Platform','Serial','Coverage','Type','Description','Quarter','Expected Revenue (USD)');
  S.opps.forEach(function(op){
    csv+=row(op.cust,op.plat,op.sn,op.cov,op.type,op.desc,op.qtr,op.revenue.toFixed(2));
  });

  // 9. Assumptions
  csv+=sec('ASSUMPTIONS ('+S.assumps.length+')');
  csv+=row('Category','Assumption');
  S.assumps.forEach(function(a){
    csv+=row(a.cat,a.txt);
  });

  // Trigger download with UTF-8 BOM for Excel compatibility
  var blob=new Blob(['\\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download=code+'_BusinessPlan_Export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}

"""

OLD = "function closeRpt(){$('rptOvl').classList.remove('on')}"
NEW = FUNC + OLD
c2 = c.replace(OLD, NEW, 1)
assert c2 != c, 'Replacement not found!'
print('exportCSV function injected OK. Length delta:', len(c2)-len(c))
open('business_plan_tool.html', 'w', encoding='utf-8').write(c2)
