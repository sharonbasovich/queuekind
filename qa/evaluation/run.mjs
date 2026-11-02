import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {splitExamples,fit,predict,fingerprint} from '../../model.js';
import {examples} from '../../data.js';
const here=new URL('./',import.meta.url);
const bytes=fs.readFileSync(new URL('cases.json',here));
const casesSha256=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(casesSha256,'ec565c0abb8622b376c4255a4653365f3446af71f203ee72b0a3fb1cd82f7995','Frozen cases must not change');
const cases=JSON.parse(bytes),split=splitExamples(examples),model=fit(split.train),seen=new Set(examples.map(r=>fingerprint(r.text)));
const results=cases.map(c=>{const p=predict(model,c.text);return {...c,fixtureCollision:seen.has(fingerprint(c.text)),predicted:p.scores[0].label,relativeScore:p.scores[0].share,flagged:p.needsReview,reasons:p.reasons,correct:c.expected?c.expected===p.scores[0].label:null};});
const summary={};
for(const category of ['clear','negation','mixed','oos']){
 const rows=results.filter(r=>r.category===category),labeled=rows.filter(r=>r.expected);
 summary[category]={n:rows.length,labeled:labeled.length,correct:labeled.length?labeled.filter(r=>r.correct).length:null,flagged:rows.filter(r=>r.flagged).length,wrongUnflagged:labeled.length?labeled.filter(r=>!r.correct&&!r.flagged).length:null};
}
assert.equal(summary.clear.n,32);assert.equal(summary.clear.correct,23);assert.equal(summary.clear.flagged,22);
assert.equal(summary.negation.n,12);assert.equal(summary.negation.correct,8);assert.equal(summary.negation.flagged,12);
assert.equal(summary.mixed.n,8);assert.equal(summary.mixed.flagged,6);assert.equal(summary.oos.n,8);assert.equal(summary.oos.flagged,8);
const fixtureCollisions=results.filter(r=>r.fixtureCollision).length;assert.equal(fixtureCollisions,0);
const output={casesSha256,trainingExamples:split.train.length,summary,fixtureCollisions,results};
fs.writeFileSync(new URL('results.json',here),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({summary,fixtureCollisions},null,2));
