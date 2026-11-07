// Read-only presentation of the top-two model score decomposition.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>`${n>0?'+':''}${n.toFixed(3)}`;
export function renderScoreEvidence(e){
 if(!e)return '';
 // Keep both directions visible even when the strongest terms mostly favor one side.
 const byStrength=(a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution)||a.word.localeCompare(b.word);
 const positive=e.terms.filter(t=>t.contribution>0).sort(byStrength),negative=e.terms.filter(t=>t.contribution<0).sort(byStrength);
 const shown=[...positive.slice(0,4),...negative.slice(0,4)];
 const shownWords=new Set(shown.map(t=>t.word)),rest=e.terms.filter(t=>!shownWords.has(t.word));
 const row=(label,n)=>`<li><span>${label}</span><strong>${signed(n)}</strong></li>`;
 const group=(label,terms)=>`<p class="evidence-direction">${label}</p><ul>${terms.length?terms.map(t=>row(`${esc(t.word)} <span class="small-note">× ${t.count}</span>`,t.contribution)).join(''):'<li>No words favor this route.</li>'}</ul>`;
 return `<details class="score-evidence"><summary>Why these two routes?</summary><p>Comparing <b>${esc(e.first)}</b> with <b>${esc(e.second)}</b>. Positive values favor the first route; negative values favor the second.</p><p class="small-note">These are additive log-score contributions, not probabilities or proof that a route is correct. Word counts do not explain intent or cause. Values are rounded to 3 decimals.</p>${group(`Words favoring ${esc(e.first)}`,positive.slice(0,4))}${group(`Words favoring ${esc(e.second)}`,negative.slice(0,4))}<ul class="evidence-totals">${row('Training-frequency starting point (class prior)',e.prior)}${rest.length?row(`Other ${rest.length} distinct known words (${rest.reduce((n,t)=>n+t.count,0)} occurrences), combined`,rest.reduce((n,t)=>n+t.contribution,0)):''}${row('Total log-score difference',e.total)}</ul><p class="small-note">${e.known} known + ${e.unknown} unknown = ${e.processed} processed content words. ${e.truncated} additional content words excluded by the 500-word limit. Unknown words contribute zero. Repetitions count each time; stop words and one-character tokens are removed first.</p></details>`;
}
