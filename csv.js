export function parseCSV(input) {
 if(input.length>2_000_000) throw Error('CSV files must be smaller than 2 MB.');
 const s=input.replace(/^\uFEFF/,''), rows=[];let row=[],v='',quoted=false,closed=false;
 for(let i=0;i<s.length;i++) {const c=s[i];
  if(quoted){if(c==='"'){if(s[i+1]==='"'){v+='"';i++;}else{quoted=false;closed=true;}}else v+=c;continue;}
  if(c==='"'){if(v||closed)throw Error('Unexpected quote in CSV. Quote the entire field.');quoted=true;}
  else if(c===','){row.push(v);v='';closed=false;}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(v);if(row.some(x=>x.trim()))rows.push(row);row=[];v='';closed=false;}
  else {if(closed&&!/\s/.test(c))throw Error('Unexpected text after a quoted CSV field.');if(!closed)v+=c;}
 }
 if(quoted)throw Error('A quoted CSV field is not closed.');row.push(v);if(row.some(x=>x.trim()))rows.push(row);
 if(!rows.length)throw Error('The CSV is empty.');
 const headers=rows.shift().map(x=>x.trim().toLowerCase());
 if(new Set(headers).size!==headers.length)throw Error('CSV headers must be unique.');
 if(!headers.includes('text'))throw Error('Include a text column in your CSV.');
 if(rows.length>3000)throw Error('Use at most 3,000 rows.');
 return rows.map((r,i)=>{if(r.length!==headers.length)throw Error(`Row ${i+2} has ${r.length} fields; expected ${headers.length}.`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});
}
// Neutralize spreadsheet formula prefixes on exported cells, including leading whitespace.
export function exportCSV(rows,headers=['text','label']) {const cell=v=>{let s=String(v??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return [headers,...rows.map(r=>headers.map(h=>r[h]))].map(r=>r.map(cell).join(',')).join('\r\n');}
