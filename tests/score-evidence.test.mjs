import test from 'node:test';import assert from 'node:assert/strict';
import {fit,predict} from '../model.js';import {renderScoreEvidence} from '../score-evidence.js';
const model=fit([{text:'apple apple orchard shared',label:'Fruit'},{text:'apple pear shared',label:'Fruit'},{text:'wheel wheel road shared',label:'Travel'}]);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('contrastive terms include counts, counterevidence and nonuniform priors',()=>{
 const before=structuredClone(model),p=predict(model,'apple apple wheel mystery'),e=p.explanation;
 assert.equal(e.first,'Fruit');assert.equal(e.second,'Travel');assert.equal(e.known,3);assert.equal(e.unknown,1);
 assert.equal(e.terms.find(t=>t.word==='apple').count,2);assert.ok(e.terms.find(t=>t.word==='wheel').contribution<0);
 close(e.prior,Math.log(2));for(const t of e.terms)close(t.contribution,t.count*t.perOccurrence);
 close(e.total,e.scoreDifference);close(e.total,e.prior+e.terms.reduce((n,t)=>n+t.contribution,0));assert.deepEqual(model,before);
});
test('empty, unknown, tied, repeated and truncated inputs reconcile',()=>{
 for(const text of ['', 'the and a','xyz unknown','apple '.repeat(499)+'wheel road','wheel '.repeat(500)+'apple '.repeat(20)]){
 const e=predict(model,text).explanation;close(e.total,e.scoreDifference);assert.equal(e.known+e.unknown,e.processed);
 }
 const e=predict(model,'wheel '.repeat(500)+'apple '.repeat(20)).explanation;assert.equal(e.truncated,20);assert.equal(e.known,500);assert.equal(e.terms.length,1);assert.equal(e.terms[0].count,500);
 const tie=predict(fit([{text:'same',label:'B'},{text:'same',label:'A'}]),'same').explanation;assert.equal(tie.first,'A');assert.equal(tie.total,0);assert.equal(tie.terms[0].contribution,0);
 assert.equal(predict(fit([{text:'same',label:'A'}]),'same').explanation,null);
});
test('bounded disclosure preserves both directions, aggregated remainder and escaping',()=>{
 const terms=Array.from({length:22},(_,i)=>({word:i===0?'<img onerror=x>':`word${i}`,count:2,contribution:i<11?i+1:-i}));
 const e={first:'<First>',second:'"Second"',terms,prior:1,total:2,known:44,unknown:3,processed:47,truncated:2};const html=renderScoreEvidence(e);
 assert.match(html,/<details class="score-evidence"><summary>/);assert.match(html,/Other 14 distinct known words \(28 occurrences\)/);assert.match(html,/Words favoring &lt;First&gt;/);assert.match(html,/Words favoring &quot;Second&quot;/);assert.doesNotMatch(html,/<img|<First>/);assert.match(html,/not probabilities/);assert.match(html,/44 known \+ 3 unknown = 47/);
 const hostile=renderScoreEvidence({...e,terms:[{word:'<img onerror=x>',count:1,contribution:1}]});assert.match(hostile,/&lt;img onerror=x&gt;/);assert.doesNotMatch(hostile,/<img/);
 assert.equal(renderScoreEvidence(null),'');assert.match(renderScoreEvidence({...e,terms:[]}),/No words favor this route/);
});
