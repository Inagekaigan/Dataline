'use strict';
const $=s=>document.querySelector(s);
const rules={...Cleaner.defaults};
const labels={
  trim:['Trim whitespace','Remove leading and trailing spaces in cells.'],
  blank:['Remove empty rows','Drop records with every field empty.'],
  dedupe:['Remove duplicates','Keep the first copy of each identical row.'],
  tokens:['Normalize missing markers','Convert NA, N/A, null and NaN to empty cells.']
};
const sample='sensor_id,zone,temperature,humidity,status\nS-001,north,18.4,61,ok\nS-002, west ,19.1,58,ok\nS-003,east,20.2,,ok\nS-002,west,19.1,58,ok\nS-004,south,17.9,64, check \n,,,,\nS-005,north,18.8,NA,ok\nS-006,east,20.4,53,ok\nS-007,west,19.3,57,ok\nS-007,west,19.3,57,ok\n';
let data=Cleaner.parse(sample,','), cleaned, name='sensor_readings.csv',sep=',',isSample=true,view='cleaned',page=0,loadID=0;
function element(tag,value){const node=document.createElement(tag);node.textContent=value;return node}
for(let i=0;i<53;i++){const mark=element('i','');mark.style.height=(9+Math.abs(Math.sin(i*.39)*Math.cos(i*.11))*78)+'px';mark.style.opacity=String(.32+i/78);$('.signal').append(mark)}
for(const [key,[title,description]] of Object.entries(labels)){
  const label=element('label',''),box=document.createElement('input'),text=element('span','');
  box.type='checkbox';box.checked=rules[key];box.onchange=()=>{rules[key]=box.checked;refresh()};
  text.append(element('b',title),element('small',description));label.append(box,text);$('#rules').append(label)
}
function refresh(){
  cleaned=Cleaner.clean(data,rules);page=0;
  const stats=Cleaner.analyze(data.rows);
  $('#metrics').replaceChildren(...Object.entries({'SOURCE ROWS':data.rows.length,'COLUMNS':data.headers.length,'EMPTY CELLS':stats.blanks,'EXACT DUPLICATES':stats.duplicates}).map(([k,v])=>{const card=element('div','');card.className='metric';card.append(element('small',k),element('b',v.toLocaleString()));return card}));
  $('#filename').textContent=name;$('#sourceinfo').textContent=(isSample?'Synthetic sample':'Local file')+' · Drop a CSV or TSV here';$('#format').textContent=sep==='\t'?'TSV':'CSV';
  const c=cleaned.changes;$('#audit').replaceChildren(...[c.trim+' cells trimmed',c.blank+' empty rows removed',c.dedupe+' duplicate rows removed',c.tokens+' markers normalized'].map(s=>element('span',s)));preview()
}
function preview(){
  const d=view==='cleaned'?cleaned:data,size=8,start=page*size;
  for(const id of ['original','cleaned']){const b=$('#'+id);b.classList.toggle('active',view===id);b.setAttribute('aria-pressed',String(view===id))}
  $('#dimensions').textContent=d.rows.length.toLocaleString()+' rows × '+d.headers.length+' columns';
  const header=element('tr','');header.append(element('th','#'),...d.headers.map(h=>element('th',h||'(unnamed)')));$('thead').replaceChildren(header);
  $('tbody').replaceChildren(...d.rows.slice(start,start+size).map((r,i)=>{const tr=element('tr','');tr.append(element('td',String(start+i+1)));for(const cell of r){const td=element('td',cell===''?'empty':cell);td.title=cell;if(cell==='')td.className='empty';tr.append(td)}return tr}));
  $('#range').textContent=d.rows.length?'Rows '+(start+1)+'–'+Math.min(start+size,d.rows.length)+' of '+d.rows.length:'No data rows';
  $('#prev').disabled=page===0;$('#next').disabled=start+size>=d.rows.length;
}
for(const k of ['original','cleaned'])$('#'+k).onclick=()=>{view=k;page=0;preview()};
$('#prev').onclick=()=>{page--;preview()};$('#next').onclick=()=>{page++;preview()};
async function importFile(file){
  if(!file)return;const token=++loadID;
  try{
    if(!/\.(tsv|csv)$/i.test(file.name))throw Error('Choose a .csv or .tsv file.');
    if(file.size>12*1024*1024)throw Error('Choose a file under 12 MiB.');
    $('#status').textContent='Reading dataset…';
    const delimiter=/\.tsv$/i.test(file.name)?'\t':',';
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
    if(token!==loadID)return;
    const parsed=Cleaner.parse(raw,delimiter);
    data=parsed;name=file.name;sep=delimiter;isSample=false;view='cleaned';refresh();$('#status').textContent='Cleaned automatically using the selected rules.';
  }catch(e){if(token===loadID)$('#status').textContent='Import failed. '+e.message}
}
$('#import').onclick=()=>$('#file').click();$('#file').onchange=e=>{importFile(e.target.files[0]);e.target.value=''};
const drop=$('#drop');for(const event of ['dragover','drop'])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.toggle('over',event==='dragover');if(event==='drop')importFile(e.dataTransfer.files[0])});drop.ondragleave=()=>drop.classList.remove('over');
function download(suffix,contents,type){const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name.replace(/\.(csv|tsv)$/i,'')+suffix;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#export').onclick=()=>download(sep==='\t'?'_clean.tsv':'_clean.csv',Cleaner.encode(cleaned,sep),'text/plain;charset=utf-8');
$('#report').onclick=()=>download('_report.json',JSON.stringify({source:name,inputRows:data.rows.length,outputRows:cleaned.rows.length,columns:data.headers.length,rules,changes:cleaned.changes},null,2),'application/json');
refresh();
