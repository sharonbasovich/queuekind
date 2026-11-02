// QueueKind's transparent, browser-local multinomial Naive Bayes model.
export const normalize = s => String(s).normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g,' ').trim();
const stop = new Set('a an the and or to for of in on at is it i we you my our your this that with be have has can could please need would like'.split(' '));
function contentTokens(text) { return (normalize(text).match(/[\p{L}\p{N}]+/gu)||[]).filter(t=>t.length>1&&!stop.has(t)); }
export function tokens(text) { return contentTokens(text).slice(0,500); }
export function fingerprint(text) { const counts=new Map(); for(const t of tokens(text)) counts.set(t,(counts.get(t)||0)+1); return JSON.stringify([...counts].sort(([a],[b])=>a.localeCompare(b))); }
function hash(s) { let h=2166136261; for(const c of s) h=Math.imul(h^c.codePointAt(0),16777619); return h>>>0; }
export function validateExamples(rows) {
 if(!Array.isArray(rows)||rows.length>3000) throw Error('Use at most 3,000 labeled examples.');
 const unique=new Map(); let duplicates=0;
 for(const row of rows) {
  const text=String(row.text||'').trim(), label=String(row.label||'').trim();
  if(!text||!label) throw Error('Every example needs text and a label.');
  if(text.length>4000||label.length>60) throw Error('Text is limited to 4,000 characters; labels to 60.');
  if(!tokens(text).length) throw Error('Each example needs meaningful words, not only punctuation or stop words.');
  const key=fingerprint(text), old=unique.get(key);
  if(old&&old.label!==label) throw Error('The same request has conflicting labels. Resolve it before training.');
  if(old) duplicates++; else unique.set(key,{text,label});
 }
 const clean=[...unique.values()], counts=Object.create(null); for(const r of clean) counts[r.label]=(counts[r.label]||0)+1;
 if(Object.keys(counts).length<2) throw Error('Add at least two labels so the model can distinguish routes.');
 if(Object.keys(counts).length>20) throw Error('Use at most 20 labels.');
 const sparse=Object.entries(counts).filter(([,n])=>n<6);
 if(sparse.length) throw Error(`Each label needs at least 6 unique examples. Add more for: ${sparse.map(([l,n])=>`${l} (${n}/6)`).join(', ')}.`);
 return {rows:clean,counts,duplicates};
}
export function splitExamples(rows) {
 const valid=validateExamples(rows), train=[],test=[];
 for(const label of Object.keys(valid.counts).sort()) {
  const group=valid.rows.filter(r=>r.label===label).sort((a,b)=>hash(normalize(a.text))-hash(normalize(b.text))||a.text.localeCompare(b.text));
  const n=Math.max(1,Math.floor(group.length*.25)); test.push(...group.slice(0,n)); train.push(...group.slice(n));
 }
 return {...valid,train,test};
}
export function fit(rows) {
 const classes=new Map(),vocab=new Set();
 for(const {text,label} of rows) {
  if(!classes.has(label)) classes.set(label,{docs:0,total:0,words:new Map()});
  const c=classes.get(label); c.docs++;
  for(const w of tokens(text)) {vocab.add(w); c.total++; c.words.set(w,(c.words.get(w)||0)+1);}
 }
 return {classes,vocab,n:rows.length};
}
export function predict(model,text) {
 const full=contentTokens(text), all=full.slice(0,500), known=all.filter(w=>model.vocab.has(w));
 const scores=[...model.classes].map(([label,c])=>({label,score:Math.log(c.docs/model.n)+known.reduce((s,w)=>s+Math.log(((c.words.get(w)||0)+1)/(c.total+model.vocab.size)),0)})).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
 if(!scores.length) throw Error('Train the model before reviewing requests.');
 const max=scores[0].score, sum=scores.reduce((s,r)=>s+Math.exp(r.score-max),0);
 for(const r of scores) r.share=Math.exp(r.score-max)/sum;
 const uniqueKnown=new Set(known).size;
 const coverage=all.length?known.length/all.length:0, margin=scores.length>1?scores[0].share-scores[1].share:0;
 const reasons=[];
 if(full.length>500) reasons.push('Long request — only the first 500 content words affect this suggestion');
 const repeats=new Map();for(const word of all) repeats.set(word,(repeats.get(word)||0)+1);
 const largestRepeat=Math.max(0,...repeats.values());
 if(all.length>=10&&largestRepeat>=5&&largestRepeat/all.length>=.4) reasons.push('Repeated wording may inflate the model score — read the whole request');
 if(uniqueKnown<2) reasons.push('Too few familiar words');
 if(coverage<.4) reasons.push('Mostly unfamiliar wording');
 if(scores[0].share<.75||margin<.35) reasons.push('Routes are close');
 // A bag-of-words model cannot resolve the scope of negation or contrasting intents.
 // This conservative English cue check changes only review warnings, never scores or routes.
 if(/\b(?:no|not|never|neither|nor|cannot|without|except|but|however|instead|rather)\b|n['’]t\b/iu.test(normalize(text))) reasons.push('Negation or contrast detected — read the whole request');
 // Evidence is a token's smoothed likelihood advantage versus the runner-up.
 const winner=model.classes.get(scores[0].label), other=model.classes.get(scores[1]?.label);
 const evidence=[...new Set(known)].map(word=>({word,weight:other?Math.log(((winner.words.get(word)||0)+1)/(winner.total+model.vocab.size))-Math.log(((other.words.get(word)||0)+1)/(other.total+model.vocab.size)):0})).filter(e=>e.weight>0).sort((a,b)=>b.weight-a.weight).slice(0,5).map(e=>e.word);
 return {scores,coverage,known:known.length,needsReview:reasons.length>0,reasons,evidence};
}
export function evaluate(model,rows) {
 const labels=[...new Set([...model.classes.keys(),...rows.map(r=>r.label)])].sort(), confusion=Object.fromEntries(labels.map(l=>[l,Object.fromEntries(labels.map(k=>[k,0]))]));
 let correct=0,review=0; for(const row of rows){const p=predict(model,row.text), l=p.scores[0].label; if(l===row.label)correct++; if(p.needsReview)review++; if(confusion[row.label])confusion[row.label][l]++;}
 const perLabel=labels.map(label=>{const tp=confusion[label][label],actual=Object.values(confusion[label]).reduce((a,b)=>a+b,0),pred=labels.reduce((s,l)=>s+confusion[l][label],0);return {label,support:actual,precision:pred?tp/pred:0,recall:actual?tp/actual:0,f1:actual+pred?2*tp/(actual+pred):0};});
 return {total:rows.length,correct,accuracy:rows.length?correct/rows.length:0,macroF1:perLabel.reduce((s,r)=>s+r.f1,0)/labels.length,review,confusion,perLabel};
}
export function addCorrections(train,test,corrections) {
 const heldout=new Set(test.map(r=>fingerprint(r.text))), map=new Map(train.map(r=>[fingerprint(r.text),r])); let excluded=0;const seen=new Map();
 for(const r of corrections){const k=fingerprint(r.text);if(seen.has(k)&&seen.get(k)!==r.label)throw Error("Reviewed duplicates have different routes. Resolve the conflicting decisions before retraining.");seen.set(k,r.label); if(heldout.has(k)){excluded++;continue;} map.set(k,{text:r.text,label:r.label});}
 return {train:[...map.values()],excluded};
}
