import test from 'node:test';import assert from 'node:assert/strict';
import {examples} from '../data.js';import {exportCSV,parseCSV} from '../csv.js';
// Browser parsing is also exercised by capture/route-labels.mjs. This dependency-free
// harness checks the emitted attribute and the existing review/recovery/learning flow.
test('route values preserve imported labels through rerender, removal, review, export and learning',async()=>{
 const els=new Map();let blob;
 const el=k=>{if(!els.has(k))els.set(k,{value:'',innerHTML:'',textContent:'',disabled:false,hidden:false,dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},scrollIntoView(){}});return els.get(k)};
 globalThis.document={querySelector:el,createElement:()=>({click(){}}),querySelectorAll(q){if(!['[data-route]','[data-confirm]','[data-undo]','[data-remove]'].includes(q))return [];const name=q.slice(1,-1),key=name.slice(5);return [...el('#queue').innerHTML.matchAll(new RegExp(name+'="(\\d+)"','g'))].map(m=>{const e=el('['+name+'="'+m[1]+'"]');e.dataset[key]=m[1];return e;});}};
 globalThis.confirm=()=>true;globalThis.matchMedia=()=>({matches:true});
 URL.createObjectURL=b=>{blob=b;return 'blob:test'};URL.revokeObjectURL=()=>{};
 await import('../app.js');
 const escaped=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/\r/g,'&#13;');
 for(const label of ['Food  support','Food\tsupport','Food\nsupport','Food\rsupport','Food\r\nsupport','Food "support" & <pantry>','Café 食品']){
  const csv=exportCSV(examples.map(r=>({...r,label:r.label==='Food support'?label:r.label})));
  await el('#examplesFile').onchange({target:{files:[{size:csv.length,text:async()=>csv}],value:'file'}});el('#train').onclick();
  el('#requestText').value='fresh pantry food delivery';el('#addRequest').onclick();
  assert.ok(el('#queue').innerHTML.includes(`<option value="${escaped(label)}">`),JSON.stringify(label));
  const select=el('[data-route="0"]');select.value=label;select.selectedOptions=[{dataset:{}}];select.onchange();
  el('#queueFilter').onchange({target:{value:'awaiting'}});
  assert.ok(el('#queue').innerHTML.includes(`<option value="${escaped(label)}" selected>`));
  el('[data-remove="0"]').onclick();el('#undoRemoval').onclick();
  assert.ok(el('#queue').innerHTML.includes(`<option value="${escaped(label)}" selected>`));
  el('[data-confirm="0"]').onclick();el('#export').onclick();assert.equal(parseCSV(await blob.text())[0].label,label);
  el('#retrain').onclick();assert.match(el('#notice').textContent,/Model 2 trained/);assert.equal(el('#retrain').disabled,true);
  el('#queueFilter').onchange({target:{value:'all'}});el('[data-undo="0"]').onclick();assert.ok(el('#queue').innerHTML.includes(`<option value="${escaped(label)}" selected>`));
 }
});
