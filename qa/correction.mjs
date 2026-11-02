import assert from 'node:assert/strict';
import {splitExamples,fit,evaluate,addCorrections} from '../model.js';
const rows=['food','travel'].flatMap(label=>['apple','banana','cherry','dates','elderberry','figs','grapes','honey'].map(w=>({text:`${label} ${w} delivery assistance`,label})));
const s=splitExamples(rows); const oneClass=fit(s.train.filter(r=>r.label==='travel'));const m=evaluate(oneClass,s.test);
assert.equal(m.perLabel.length,2,'Evaluation must retain labels absent from training');assert.ok(m.macroF1<1,'Collapsed model must not report perfect macro F1');
assert.throws(()=>addCorrections(s.train,s.test,[{text:'new copper request',label:'food'},{text:'new copper request!!!',label:'travel'}]),'Conflicting corrections must not silently last-win');
console.log('PASS correction integrity tests');
