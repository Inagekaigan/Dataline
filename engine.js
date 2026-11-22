'use strict';
const Cleaner = (() => {
  function parse(text, sep) {
    text = text.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], cell = '', quoted = false, closed = false, started = false;
    function endCell() { row.push(cell); cell = ''; closed = false; }
    function endRow() { endCell(); rows.push(row); row = []; started = false; }
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c !== '"') cell += c;
        else if (text[i+1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
        continue;
      }
      if (c === sep) { endCell(); started = true; }
      else if (c === '\r' || c === '\n') { if (c === '\r' && text[i+1] === '\n') i++; endRow(); }
      else if (c === '"' && !cell && !closed) { quoted = true; started = true; }
      else if (closed || c === '"') throw Error('Unexpected character or quote in record '+(rows.length+1)+'.');
      else { cell += c; started = true; }
    }
    if (quoted) throw Error('An opening quote has no closing quote.');
    if (started || closed || row.length || cell) endRow();
    if (!rows.length) throw Error('This file is empty.');
    const headers = rows.shift();
    if (headers.every(h=>!h.trim())) throw Error('The first record must contain column names.');
    rows.forEach((r,i)=>{
      if (r.length === 1 && r[0] === '') while(r.length < headers.length) r.push('');
      if(r.length !== headers.length) throw Error('Record '+(i+2)+' has '+r.length+' fields. Expected '+headers.length+'. Check the file delimiter.');
    });
    return {headers,rows};
  }
  const defaults = {trim:true, blank:true, dedupe:true, tokens:false};
  const missing = /^(?:n\/a|na|null|nan)$/i;
  function analyze(rows) {
    const seen = new Set(); let duplicates=0, blanks=0;
    for (const r of rows) {const k=JSON.stringify(r);if(seen.has(k))duplicates++;seen.add(k);for(const v of r)if(v==='')blanks++;}
    return {duplicates,blanks};
  }
  function clean(data, rules=defaults) {
    const rows=[],seen=new Set(),changes={trim:0,tokens:0,blank:0,dedupe:0};
    for(const source of data.rows){
      const r=source.map(raw=>{
        let v=raw;
        if(rules.trim && v!==v.trim()){v=v.trim();changes.trim++;}
        if(rules.tokens && missing.test(v)){v='';changes.tokens++;}
        return v;
      });
      if(rules.blank && r.every(v=>v==='')){changes.blank++;continue;}
      if(rules.dedupe){const key=JSON.stringify(r);if(seen.has(key)){changes.dedupe++;continue;}seen.add(key);}
      rows.push(r);
    }
    return {headers:[...data.headers],rows,changes};
  }
  function encode({headers,rows},sep=','){
    const quote=v=>(v.includes(sep)||/["\r\n]/.test(v))?'"'+v.replace(/"/g,'""')+'"':v;
    return [headers,...rows].map(r=>r.map(quote).join(sep)).join('\r\n')+'\r\n';
  }
  return {parse,analyze,clean,encode,defaults};
})();
if(typeof module!=='undefined' && module.exports) module.exports=Cleaner;
