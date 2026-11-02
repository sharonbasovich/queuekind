import test from 'node:test';import assert from 'node:assert/strict';
import {examples} from '../data.js';import {parseCSV,exportCSV} from '../csv.js';import {tokens,validateExamples,splitExamples,fit,predict,evaluate,addCorrections,fingerprint} from '../model.js';
test('synthetic split is stratified, deterministic and disjoint',()=>{const a=splitExamples(examples),b=splitExamples([...examples].reverse());assert.equal(a.train.length,36);assert.equal(a.test.length,12);assert.deepEqual(a.train,b.train);assert.deepEqual(a.test,b.test);const train=new Set(a.train.map(r=>fingerprint(r.text)));assert.ok(a.test.every(r=>!train.has(fingerprint(r.text))));});
test('genuine trained model, finite scores and honest evaluation support',()=>{const s=splitExamples(examples),m=fit(s.train),p=predict(m,'volunteer orientation training');assert.equal(p.scores[0].label,'Volunteering');assert.ok(p.scores.every(x=>Number.isFinite(x.share)));const e=evaluate(m,s.test);assert.equal(e.total,12);assert.ok(e.accuracy<=1&&e.accuracy>=0);assert.equal(e.perLabel.reduce((n,r)=>n+r.support,0),12);});
test('empty/OOV/repeated single word is uncertain',()=>{const m=fit(splitExamples(examples).train);for(const t of ['','qwerty xyzzy','volunteer volunteer'])assert.ok(predict(m,t).needsReview);});
test('validate sparse, conflicting, punctuation clones and reserved labels',()=>{assert.throws(()=>validateExamples(examples.slice(0,6)));assert.throws(()=>validateExamples([...examples,{text:examples[0].text,label:'Other'}]));assert.equal(validateExamples([...examples,{...examples[0],text:examples[0].text+'!!!'}]).rows.length,48);const rows=examples.map(r=>({...r,label:r.label==='Food support'?'__proto__':r.label}));assert.equal(validateExamples(rows).counts.__proto__,12);});
test('heldout corrections cannot leak into training',()=>{const s=splitExamples(examples),r=addCorrections(s.train,s.test,[{text:s.test[0].text+'!!!',label:'Other'}]);assert.equal(r.excluded,1);assert.equal(r.train.length,s.train.length);});
test('correction updates existing training example rather than duplicate',()=>{const s=splitExamples(examples),r=addCorrections(s.train,s.test,[{text:s.train[0].text,label:'Donations'}]);assert.equal(r.train.length,s.train.length);assert.equal(r.train.find(x=>x.text===s.train[0].text).label,'Donations');});
test('CSV multiline and escaping round trip',()=>{const rows=[{text:'Hi, "team"\nLine two',label:'Transport'}];assert.deepEqual(parseCSV(exportCSV(rows)),rows);});
test('CSV invalid and formula neutralization',()=>{assert.throws(()=>parseCSV('text,label\n"broken,x'));assert.throws(()=>parseCSV('text,label\na,b,c'));assert.throws(()=>parseCSV('text,text\na,b'));assert.ok(exportCSV([{text:' =SUM(A1)',label:'@evil'}]).includes("' =SUM"));});
test('conflicting reviewed feature duplicates rejected before learning',()=>{const s=splitExamples(examples);assert.throws(()=>addCorrections(s.train,s.test,[{text:'new unique request',label:'Donations'},{text:'request unique new!!!',label:'Transport'}]),/conflicting/);});
test('bag order cannot cross holdout firewall',()=>{const s=splitExamples(examples),r=s.test[0];const shuffled=tokens(r.text).reverse().join(' ');assert.equal(fingerprint(r.text),fingerprint(shuffled));assert.equal(addCorrections(s.train,s.test,[{text:shuffled,label:'Donations'}]).excluded,1);});
test('evaluation retains a held-out class missing from model',()=>{const m=fit([{text:'donation clothing',label:'Donations'}]);const e=evaluate(m,[{text:'donation clothing',label:'Donations'},{text:'volunteer training',label:'Volunteering'}]);assert.equal(e.perLabel.length,2);assert.ok(e.macroF1<1);assert.equal(e.total,2);});
test('negation and contrast always prompt closer reading without changing score math',()=>{
 const m=fit(splitExamples(examples).train);
 for(const text of [
  'I do not need groceries. I want to help at the event.',
  'Please arrange transport, but do not collect donated books.',
  "I don't want a meal delivery; I want to donate blankets.",
  'I can’t drive this week, however I can sort clothing.',
  'No food please. Instead I am asking about volunteer orientation.',
  'I cannot attend training; please cancel the volunteer shift.',
  'Rather than a bus ticket I need a food parcel.'
 ]){
  const p=predict(m,text);assert.ok(p.needsReview);assert.ok(p.reasons.some(x=>/Negation or contrast/.test(x)));
  const known=tokens(text).filter(w=>m.vocab.has(w));
  for(const item of p.scores){const c=m.classes.get(item.label);const expected=Math.log(c.docs/m.n)+known.reduce((sum,w)=>sum+Math.log(((c.words.get(w)||0)+1)/(c.total+m.vocab.size)),0);assert.equal(item.score,expected);}
 }
 const plain=predict(m,'I have notebooks and blankets to donate.');assert.ok(!plain.reasons.some(x=>/Negation or contrast/.test(x)));
});
test('repetition warning uses explicit boundaries and preserves raw score math',()=>{
 const m=fit(splitExamples(examples).train);
 for(const text of ['food '.repeat(8)+'volunteer orientation', 'transport '.repeat(5)+'donation clothing blankets books furniture']){
  const p=predict(m,text);assert.ok(p.needsReview);assert.ok(p.reasons.some(x=>/Repeated wording/.test(x)));
  const known=tokens(text).filter(w=>m.vocab.has(w));
  for(const item of p.scores){const c=m.classes.get(item.label);assert.equal(item.score,Math.log(c.docs/m.n)+known.reduce((s,w)=>s+Math.log(((c.words.get(w)||0)+1)/(c.total+m.vocab.size)),0));}
 }
 for(const text of ['food '.repeat(4)+'volunteer orientation', 'food '.repeat(4)+'volunteer orientation donation books transport clothing']){
  assert.ok(!predict(m,text).reasons.some(x=>/Repeated wording/.test(x)));
 }
});
test('truncation warning counts content tokens and does not alter capped scoring',()=>{
 const m=fit(splitExamples(examples).train), prefix=Array.from({length:500},(_,i)=>i%2?'food':'transport').join(' ');
 const capped=predict(m,prefix),long=predict(m,prefix+' volunteer');
 assert.ok(!capped.reasons.some(x=>/first 500/.test(x)));
 assert.ok(long.needsReview);assert.ok(long.reasons.some(x=>/first 500/.test(x)));
 assert.deepEqual(long.scores,capped.scores);
 assert.ok(!predict(m,prefix+' the and please').reasons.some(x=>/first 500/.test(x)));
});
