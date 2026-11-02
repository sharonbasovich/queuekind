// Read-only evaluation presentation. Never modifies examples, model or predictions.
export function summarizeDiagnostics(rows, predictRow) {
 const cases=rows.map((row,index)=>{const prediction=predictRow(row.text);const suggested=prediction.scores?.[0]?.label??null;return {index,text:row.text,expected:row.label,suggested,matched:suggested===row.label};});
 const misses=cases.filter(r=>!r.matched),matches=cases.filter(r=>r.matched),pairs=new Map();
 for(const row of misses){const key=JSON.stringify([row.expected,row.suggested]);const pair=pairs.get(key)||{expected:row.expected,suggested:row.suggested,count:0};pair.count++;pairs.set(key,pair);}
 return {total:cases.length,misses,matches,pairs:[...pairs.values()].sort((a,b)=>b.count-a.count)};
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderDiagnostics(d) {
 const route=s=>s===null?'No suggestion':escape(s);
 const cards=rows=>'<ol class="diagnostic-list">'+rows.map(r=>`<li class="diagnostic-case"><p class="diagnostic-route"><span><b>Expected label</b> ${route(r.expected)}</span><span><b>Suggested route</b> ${route(r.suggested)}</span></p><p class="small-note">${escape(r.text)}</p></li>`).join('')+'</ol>';
 return `<section class="diagnostics" aria-labelledby="diagnostic-title"><h3 id="diagnostic-title">${d.misses.length} of ${d.total} suggestions differ from expected labels</h3><p class="small-note">Expected labels come from your CSV (or the synthetic sample), not verified ground truth. Inspect label quality as well as model mistakes.</p>${!d.total?'<p class="small-note">No held-out requests to inspect.</p>':d.misses.length?`<h4>Observed confusion pairs</h4><ul class="confusion-pairs">${d.pairs.map(p=>`<li><span>Expected: <b>${route(p.expected)}</b></span><span>Suggested: <b>${route(p.suggested)}</b></span><strong>${p.count} request${p.count===1?'':'s'}</strong></li>`).join('')}</ul><h4>Inspect mismatches first</h4>${cards(d.misses)}`:'<p class="small-note">No mismatches in this check set. That does not establish reliability on new requests.</p>'}${d.matches.length?`<details><summary>Inspect ${d.matches.length} matching request${d.matches.length===1?'':'s'}</summary>${cards(d.matches)}</details>`:''}<p class="small-note diagnostic-next"><b>What to improve:</b> collect genuinely varied new labeled examples. Do not copy check-set rows into training. Tuning after inspecting these cases means this is no longer an independent validation of those changes.</p></section>`;
}
