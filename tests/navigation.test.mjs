import test from 'node:test';import assert from 'node:assert/strict';
test('memory-only session warns on exit without disabling protection after export or cancelled reset',async()=>{
 const els=new Map();let beforeUnload,accept=false,reloads=0,prompts=0;
 const el=k=>{if(!els.has(k))els.set(k,{value:'',innerHTML:'',textContent:'',disabled:false,hidden:false,dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},scrollIntoView(){}});return els.get(k)};
 globalThis.document={querySelector:el,querySelectorAll:()=>[],createElement:()=>({click(){}})};
 globalThis.addEventListener=(type,handler)=>{assert.equal(type,'beforeunload');beforeUnload=handler};
 globalThis.confirm=()=>{prompts++;return accept};globalThis.matchMedia=()=>({matches:true});
 const attempt=()=>{let prevented=false;const event={preventDefault(){prevented=true},returnValue:undefined};beforeUnload(event);return {prevented,value:event.returnValue}};
 globalThis.location={reload(){reloads++;assert.equal(attempt().prevented,false)}};
 URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
 await import('../app.js');assert.equal(attempt().prevented,false);
 el('#requestText').value='An unfinished request';assert.deepEqual(attempt(),{prevented:true,value:''});
 el('#demo').onclick();assert.equal(prompts,1);assert.equal(el('#requestText').value,'An unfinished request');
 el('#requestText').value='';assert.equal(attempt().prevented,false);
 el('#demo').onclick();assert.equal(el('#queueCount').textContent,6);assert.equal(attempt().prevented,true);
 el('#export').onclick();assert.equal(attempt().prevented,true,'CSV is not a complete restorable session');
 el('#reset').onclick();assert.equal(reloads,0);assert.equal(attempt().prevented,true);
 accept=true;el('#reset').onclick();assert.equal(reloads,1);assert.equal(attempt().prevented,true,'the reset bypass is one-shot if navigation is cancelled elsewhere');
});
