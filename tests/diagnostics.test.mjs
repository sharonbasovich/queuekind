import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeDiagnostics,renderDiagnostics} from '../diagnostics.js';
import {examples} from '../data.js';
import {splitExamples,fit,predict} from '../model.js';
test('synthetic check identifies all five misses without changing data',()=>{const s=splitExamples(examples),m=fit(s.train),before=JSON.stringify(s);const d=summarizeDiagnostics(s.test,t=>predict(m,t));assert.equal(d.total,12);assert.equal(d.misses.length,5);assert.equal(d.matches.length,7);assert.equal(d.pairs.reduce((n,p)=>n+p.count,0),5);assert.equal(JSON.stringify(s),before);const html=renderDiagnostics(d);assert.ok(html.indexOf('Inspect mismatches first')<html.indexOf('Inspect 7 matching'));assert.match(html,/5 of 12/);});
test('zero errors and empty evaluation are explicit',()=>{const d=summarizeDiagnostics([{text:'x',label:'Route'}],()=>({scores:[{label:'Route'}]}));assert.equal(d.pairs.length,0);assert.match(renderDiagnostics(d),/No mismatches/);assert.match(renderDiagnostics(summarizeDiagnostics([],()=>{throw Error('should not predict')})),/No held-out requests/);});
test('hostile labels and text remain inert and reserved keys are counted',()=>{const d=summarizeDiagnostics([{label:'__proto__',text:'<img src=x onerror=alert(1)>'},{label:'__proto__',text:'second'}],()=>({scores:[{label:'<script>alert(1)</script>'}]}));assert.equal(d.pairs[0].count,2);const html=renderDiagnostics(d);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);});
test('missing suggestion is an explicit mismatch',()=>{const d=summarizeDiagnostics([{text:'x',label:'A'}],()=>({scores:[]}));assert.equal(d.misses.length,1);assert.match(renderDiagnostics(d),/No suggestion/);});
