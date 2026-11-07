import test from 'node:test';
import assert from 'node:assert/strict';
import {examples,requests} from '../data.js';
import {validateExamples,splitExamples,fit,predict,evaluate,fingerprint,tokens} from '../model.js';
const partition=s=>({train:s.train.map(r=>fingerprint(r.text)),test:s.test.map(r=>fingerprint(r.text))});
test('feature-equivalent duplicate order cannot change holdout, fitted model or metrics',()=>{
 const duplicate={...examples[0],text:examples[0].text+'!!!'};
 const first=splitExamples([duplicate,...examples]),last=splitExamples([...examples,duplicate]);
 assert.deepEqual(partition(first),partition(last));
 assert.deepEqual(first.train,last.train);assert.deepEqual(first.test,last.test);
 assert.deepEqual(fit(first.train),fit(last.train));
 assert.deepEqual(evaluate(fit(first.train),first.test),evaluate(fit(last.train),last.test));
 assert.equal(first.duplicates,1);assert.equal(last.duplicates,1);
 // The original published synthetic split and prediction math stay unchanged.
 const baseline=splitExamples(examples);assert.deepEqual(first.train,baseline.train);assert.deepEqual(first.test,baseline.test);
 assert.equal(evaluate(fit(first.train),first.test).correct,7);
 for(const text of requests)assert.deepEqual(predict(fit(first.train),text),predict(fit(baseline.train),text));
});
test('deterministic representative covers punctuation, reordered words, stop words and repeated duplicates',()=>{
 const variants=examples.flatMap(r=>[r,{...r,text:r.text+'!!!'},{...r,text:tokens(r.text).reverse().join(' ')},{...r,text:'please '+r.text}]);
 const expected=splitExamples(variants);
 for(const rows of [[...variants].reverse(),[...variants.slice(17),...variants.slice(0,17)],variants.filter((_,i)=>i%2).concat(variants.filter((_,i)=>!(i%2)))]){
  const actual=splitExamples(rows);assert.deepEqual(actual.train,expected.train);assert.deepEqual(actual.test,expected.test);
  assert.equal(actual.duplicates,144);assert.equal(actual.rows.length,48);
  assert.deepEqual(fit(actual.train),fit(expected.train));
 }
 const featureGroups=new Map();for(const r of variants){const k=fingerprint(r.text);if(!featureGroups.has(k)||r.text<featureGroups.get(k))featureGroups.set(k,r.text);}
 for(const r of expected.rows)assert.equal(r.text,featureGroups.get(fingerprint(r.text)));
});
test('canonical representative does not relax conflicting-feature label rejection',()=>{
 const conflict={...examples[0],text:examples[0].text+'!!!',label:'Transport'};
 for(const rows of [[conflict,...examples],[...examples,conflict]])assert.throws(()=>validateExamples(rows),/conflicting labels/);
});
