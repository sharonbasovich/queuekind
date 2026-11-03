import test from 'node:test';import assert from 'node:assert/strict';
test('request removal is deliberate, reversible, capacity-safe and session-scoped',async()=>{
 const els=new Map();let focus='',accept=true,prompt='',blob;
 const el=k=>{if(!els.has(k))els.set(k,{value:'',innerHTML:'',textContent:'',disabled:false,hidden:false,dataset:{},classList:{toggle(){}},setAttribute(){},focus(){focus=k},scrollIntoView(){}});return els.get(k)};
 globalThis.document={querySelector:el,createElement:()=>({click(){}}),querySelectorAll(q){if(!['[data-route]','[data-confirm]','[data-undo]','[data-remove]'].includes(q))return [];const name=q.slice(1,-1),key=name.slice(5);return [...el('#queue').innerHTML.matchAll(new RegExp(name+'="(\\d+)"','g'))].map(m=>{const e=el('['+name+'="'+m[1]+'"]');e.dataset[key]=m[1];return e;});}};
 globalThis.confirm=s=>{prompt=s;return accept};globalThis.matchMedia=()=>({matches:true});globalThis.location={reload(){}};URL.createObjectURL=b=>{blob=b;return 'blob:test'};URL.revokeObjectURL=()=>{};
 await import('../app.js');el('#demo').onclick();
 const choose=(i,value,hold=false)=>{const s=el(`[data-route="${i}"]`);s.value=value;s.selectedOptions=[{dataset:hold?{hold:'true'}:{}}];s.onchange()};
 choose(0,'Food support');el('[data-confirm="0"]').onclick();choose(4,'',true);el('[data-confirm="4"]').onclick();el('#retrain').onclick();el('#export').onclick();const before=await blob.text();const metrics=el('#metricsContent').innerHTML;
 choose(2,'Donations');accept=false;el('[data-remove="2"]').onclick();assert.equal(el('#queueCount').textContent,6);assert.equal(el('#undoRemoval').hidden,true);
 accept=true;el('[data-remove="2"]').onclick();assert.equal(el('#queueCount').textContent,5);assert.equal(focus,'[data-route="2"]');assert.doesNotMatch(el('#queue').innerHTML,/REQUEST 03/);assert.match(el('#queue').innerHTML,/REQUEST 04/);assert.equal(el('#retrain').disabled,true);
 el('#export').onclick();assert.equal(await blob.text(),before);assert.equal(el('#metricsContent').innerHTML,metrics);
 el('#queueFilter').onchange({target:{value:'held'}});el('#undoRemoval').onclick();assert.equal(el('#queueFilter').value,'awaiting');assert.equal(focus,'[data-route="2"]');assert.match(el('#queue').innerHTML,/option selected>Donations/);assert.equal(el('#queueCount').textContent,6);assert.equal(el('#undoRemoval').hidden,true);el('#undoRemoval').onclick();assert.equal(el('#queueCount').textContent,6);
 el('[data-remove="2"]').onclick();el('[data-remove="2"]').onclick();assert.match(prompt,/replaces the previous removal undo/);el('#undoRemoval').onclick();assert.match(el('#queue').innerHTML,/REQUEST 04/);assert.doesNotMatch(el('#queue').innerHTML,/REQUEST 03/);
 el('#demo').onclick();assert.equal(el('#undoRemoval').hidden,true);assert.match(el('#queue').innerHTML,/REQUEST 01/);
 const file={size:100,text:async()=> 'text\n'+Array.from({length:2994},(_,i)=>'request '+i).join('\n')};await el('#queueFile').onchange({target:{files:[file],value:'file'}});assert.equal(el('#queueCount').textContent,3000);
 el('[data-remove="0"]').onclick();el('#requestText').value='new extra request';el('#addRequest').onclick();assert.equal(el('#queueCount').textContent,2999);assert.match(el('#notice').textContent,/reserved for Undo/);assert.equal(el('#requestText').value,'new extra request');el('#undoRemoval').onclick();assert.equal(el('#queueCount').textContent,3000);
});
