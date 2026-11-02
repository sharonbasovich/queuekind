import test from 'node:test';
import assert from 'node:assert/strict';
test('only routed review changes enable learning; holds remain exportable',async()=>{
 const elements=new Map();let blob;
 const el=k=>{if(!elements.has(k))elements.set(k,{value:'',innerHTML:'',textContent:'',disabled:false,dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},scrollIntoView(){}});return elements.get(k);};
 globalThis.document={querySelector:el,createElement:()=>({click(){}}),querySelectorAll(q){if(!['[data-route]','[data-confirm]','[data-undo]'].includes(q))return [];const name=q.slice(1,-1),key=name.slice(5);return [...el('#queue').innerHTML.matchAll(new RegExp(name+'="(\\d+)"','g'))].map(m=>{const e=el('['+name+'="'+m[1]+'"]');e.dataset[key]=m[1];return e;});}};
 globalThis.confirm=()=>true;globalThis.matchMedia=()=>({matches:true});globalThis.location={reload(){}};
 URL.createObjectURL=b=>{blob=b;return 'blob:test';};URL.revokeObjectURL=()=>{};
 await import('../app.js');
 const review=(i,label,hold=false)=>{const s=el('[data-route="'+i+'"]');s.value=label;s.selectedOptions=[{dataset:hold?{hold:'true'}:{}}];s.onchange();el('[data-confirm="'+i+'"]').onclick();};
 const undo=i=>el('[data-undo="'+i+'"]').onclick();
 const disabled=value=>assert.equal(el('#retrain').disabled,value);
 el('#demo').onclick();disabled(true);
 review(4,'',true);disabled(true);assert.match(el('#notice').textContent,/not used for training/);assert.doesNotMatch(el('#queueSummary').textContent,/not yet/);
 el('#export').onclick();assert.match(await blob.text(),/needs_follow_up/);
 el('#retrain').onclick();assert.match(el('#queueSummary').textContent,/model v1/);
 undo(4);disabled(true);assert.match(el('#notice').textContent,/No training change/);
 review(4,'',true);review(0,'Food support');disabled(false);assert.match(el('#queueSummary').textContent,/routed review changes not yet applied/);
 el('#retrain').onclick();disabled(true);assert.match(el('#queueSummary').textContent,/model v2/);
 undo(4);disabled(true);review(4,'',true);disabled(true);
 undo(0);disabled(false);el('#retrain').onclick();disabled(true);assert.match(el('#queueSummary').textContent,/model v3/);
 review(0,'Food support');disabled(false);undo(0);disabled(true);
 review(0,'Food support');el('#retrain').onclick();disabled(true);
 undo(0);disabled(false);review(0,'Food support');disabled(true); // restored same learned decision
});
