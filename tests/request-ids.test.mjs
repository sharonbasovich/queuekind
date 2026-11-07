import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,exportCSV} from '../csv.js';

test('ID imports are bounded and atomic; valid IDs survive review/export without truncation',async()=>{
 const els=new Map();let blob;
 const el=k=>{if(!els.has(k))els.set(k,{value:'',innerHTML:'',textContent:'',disabled:false,hidden:false,dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},scrollIntoView(){}});return els.get(k)};
 globalThis.document={querySelector:el,createElement:()=>({click(){}}),querySelectorAll(q){if(!['[data-route]','[data-confirm]','[data-undo]','[data-remove]'].includes(q))return [];const name=q.slice(1,-1),key=name.slice(5);return [...el('#queue').innerHTML.matchAll(new RegExp(name+'="(\\d+)"','g'))].map(m=>{const e=el('['+name+'="'+m[1]+'"]');e.dataset[key]=m[1];return e;});}};
 globalThis.confirm=()=>true;globalThis.matchMedia=()=>({matches:true});
 URL.createObjectURL=b=>{blob=b;return 'blob:test'};URL.revokeObjectURL=()=>{};
 await import('../app.js');el('#demo').onclick();
 const choose=(i,label)=>{const s=el(`[data-route="${i}"]`);s.value=label;s.selectedOptions=[{dataset:{}}];s.onchange()};
 const review=i=>{choose(i,'Food support');el(`[data-confirm="${i}"]`).onclick()};
 const upload=async ids=>{
  // Quote source IDs without applying the exporter's formula neutralization.
  const quote=s=>'"'+s.replaceAll('"','""')+'"';
  const csv='id,text\r\n'+ids.map(id=>`${quote(id)},"Please arrange pantry food delivery"`).join('\r\n');
  await el('#queueFile').onchange({target:{files:[{size:new TextEncoder().encode(csv).length,text:async()=>csv}],value:'file'}});
 };
 review(0);choose(1,'Donations');el('[data-remove="1"]').onclick();
 el('#export').onclick();const priorExport=await blob.text();
 const snapshot=()=>JSON.stringify(['#queue','#queueCount','#queueSummary','#removedSummary','#undoRemoval','#metricsContent','#retrain','#export'].map(k=>{const e=el(k);return [k,e.innerHTML,e.textContent,e.hidden,e.disabled]}));
 const before=snapshot();
 for(const [ids,row] of [[['valid-first','x'.repeat(101)],2],[['x'.repeat(100)+'A','x'.repeat(100)+'B'],1],[['😀'.repeat(50)+'A'],1]]){
  await upload(ids);assert.match(el('#notice').textContent,new RegExp(`Request row ${row}: ID must be 100 characters or fewer`));
  assert.equal(snapshot(),before,'rejected import must not mutate the existing session');
  el('#export').onclick();assert.equal(await blob.text(),priorExport);
 }
 const ids=['x'.repeat(100),'😀'.repeat(50),'  ticket,"quoted"\t\r\nΩ  ','',' =SUM(A1:A2)'];
 await upload(ids);assert.match(el('#notice').textContent,/5 requests added/);assert.equal(el('#queueCount').textContent,10);
 assert.match(el('#queue').innerHTML,/REQUEST 07/);assert.match(el('#queue').innerHTML,/REQUEST 11/);assert.doesNotMatch(el('#queue').innerHTML,/REQUEST 12/);
 el('#undoRemoval').onclick();assert.equal(el('#queueCount').textContent,11);assert.match(el('#queue').innerHTML,/REQUEST 02/);assert.match(el('#queue').innerHTML,/option value="Donations" selected/);
 for(let i=6;i<11;i++)review(i);
 el('#export').onclick();const actual=await blob.text(),added=parseCSV(actual).slice(1);
 assert.deepEqual(added.map(r=>r.id),ids.map(id=>/^\s*[=+@-]/.test(id)?"'"+id:id));
 const expectedRows=[parseCSV(priorExport)[0],...ids.map(id=>({id,text:'Please arrange pantry food delivery',label:'Food support',review_status:'human_reviewed',model_version:1,data_origin:'user_provided'}))];
 const expected=exportCSV(expectedRows,['id','text','label','review_status','model_version','data_origin']);
 assert.deepEqual(new TextEncoder().encode(actual),new TextEncoder().encode(expected),'export bytes preserve valid IDs with existing CSV safety encoding');
 el('#requestText').value='Another pantry request';el('#addRequest').onclick();assert.match(el('#queue').innerHTML,/REQUEST 12/);
});
