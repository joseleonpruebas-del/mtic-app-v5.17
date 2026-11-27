/* Master: lee un libro maestro .xlsm (AMRTX) y extrae su estructura para armar el formulario.
   No modifica el archivo. Sirve también para comparar una versión nueva con la instalada. */
(function(g){
const unesc=s=>String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n)).replace(/&amp;/g,'&');
const c2n=c=>c.split('').reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0);
const n2c=n=>{let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s};
const relsOf=t=>{const o={};[...t.matchAll(/<Relationship [^>]*>/g)].forEach(m=>{o[(m[0].match(/Id="([^"]+)"/)||[])[1]]=(m[0].match(/Target="([^"]+)"/)||[])[1]});return o};
const norm=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();

function parseShared(x){const out=[];const re=/<si>([\s\S]*?)<\/si>/g;let m;while((m=re.exec(x))){let t='';const r2=/<t[^>]*>([\s\S]*?)<\/t>/g;let k;while((k=r2.exec(m[1])))t+=k[1];out.push(unesc(t))}return out}
// Lee una hoja completa: {cells:{REF:{v,f,t,vm,s}}, maxRow, merges:[...]}
function parseSheet(x,S,opts={}){
  const cells={};let maxRow=0;
  const rowRe=/<row r="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g;let rm;
  while((rm=rowRe.exec(x))){const r=+rm[1];if(!rm[2])continue;if(opts.maxRow&&r>opts.maxRow)break;maxRow=Math.max(maxRow,r);
    const cRe=/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;let cm;
    while((cm=cRe.exec(rm[2]))){const a=cm[2],b=cm[3]||'';if(!b&&!/vm=/.test(a))continue;
      const t=(a.match(/ t="(\w+)"/)||[])[1],v=b.match(/<v>([\s\S]*?)<\/v>/),f=b.match(/<f[^>]*?(?:\/>|>([\s\S]*?)<\/f>)/);let val=null;
      if(t==='inlineStr'){val=unesc((b.match(/<t[^>]*>([\s\S]*?)<\/t>/)||[,''])[1])}
      else if(v){val=t==='s'?S[+v[1]]:(t==='str'||t==='e'?unesc(v[1]):(isNaN(+v[1])?unesc(v[1]):+v[1]))}
      const o={v:val,t:t||null};if(f)o.f=f[1]?unesc(f[1]):'';if(/vm=/.test(a))o.vm=1;cells[cm[1]]=o}}
  const merges=[...x.matchAll(/<mergeCell ref="([^"]+)"/g)].map(m=>m[1]);
  return{cells,maxRow,merges};
}
function expandSq(sq){const out=[];sq.split(/\s+/).forEach(p=>{if(!p)return;const [a,b]=p.split(':');const ma=a.match(/^([A-Z]+)(\d+)$/),mb=(b||a).match(/^([A-Z]+)(\d+)$/);if(!ma||!mb)return;
  for(let c=c2n(ma[1]);c<=c2n(mb[1]);c++)for(let r=+ma[2];r<=+mb[2];r++)out.push(n2c(c)+r)});return out}
function parseValidations(x){
  const out={};
  const add=(refs,o)=>expandSq(refs).forEach(c=>out[c]=o);
  for(const m of x.matchAll(/<dataValidation ([^>]*?)>([\s\S]*?)<\/dataValidation>/g)){
    const a=m[1],type=(a.match(/type="(\w+)"/)||[])[1],sq=(a.match(/sqref="([^"]+)"/)||[])[1],f1=(m[2].match(/<formula1>([\s\S]*?)<\/formula1>/)||[])[1];
    if(sq)add(sq,{type,f1:f1?unesc(f1):'',prompt:unesc((a.match(/prompt="([^"]*)"/)||[,''])[1])})}
  for(const m of x.matchAll(/<x14:dataValidation ([^>]*?)>([\s\S]*?)<\/x14:dataValidation>/g)){
    const type=(m[1].match(/type="(\w+)"/)||[])[1],f1=(m[2].match(/<xm:f>([\s\S]*?)<\/xm:f>/)||[])[1],sq=(m[2].match(/<xm:sqref>([\s\S]*?)<\/xm:sqref>/)||[])[1];
    if(sq)add(sq,{type,f1:f1?unesc(f1):'',prompt:''})}
  return out;
}
const sheetRange=(txt)=>{ // 'Hoja'!$A$1:$B$4  ->  {sheet,c1,r1,c2,r2}
  const m=String(txt).match(/^(?:'([^']+)'|([^'!]+))!\$?([A-Z]+)\$?(\d*)(?::\$?([A-Z]+)\$?(\d*))?$/);if(!m)return null;
  return{sheet:m[1]||m[2],c1:c2n(m[3]),r1:m[4]?+m[4]:1,c2:m[5]?c2n(m[5]):c2n(m[3]),r2:m[6]?+m[6]:(m[5]?1048576:(m[4]?+m[4]:1048576))}};

async function parse(bytes,JSZ){
  const Z=JSZ||g.JSZip,zip=await Z.loadAsync(bytes),rd=async p=>zip.file(p)?zip.file(p).async('string'):null;
  const wb=await rd('xl/workbook.xml'),wr=relsOf(await rd('xl/_rels/workbook.xml.rels'));
  const sheets=[...wb.matchAll(/<sheet [^>]*?name="([^"]*)"[^>]*?(?:state="(\w+)")?[^>]*?r:id="([^"]*)"[^>]*>/g)].map(m=>({name:unesc(m[1]),state:m[2]||'visible',path:'xl/'+wr[m[3]].replace(/^\/?(xl\/)?/,'')}));
  const S=parseShared(await rd('xl/sharedStrings.xml')||'');
  const hasVba=!!zip.file('xl/vbaProject.bin');
  // hoja de entrada: la que tiene el encabezado Habilitado ... Dato
  let main=null,mp=null;
  for(const s of sheets){if(s.state!=='visible')continue;const x=await rd(s.path);if(!x)continue;const p=parseSheet(x,S,{maxRow:12});const h=p.cells.B8;if(h&&norm(h.v)==='Habilitado'&&p.cells.J8&&norm(p.cells.J8.v)==='Dato'){main=s;mp=x;break}}
  if(!main)throw new Error('No se encontró la hoja de entrada (encabezado "Habilitado" ... "Dato").');
  const M=parseSheet(mp,S),V=parseValidations(mp);
  const seedS=sheets.find(s=>/semilla/i.test(s.name)),listS=sheets.find(s=>/listas/i.test(s.name));
  if(!seedS)throw new Error('No se encontró la hoja de semilla.');
  const seedP=parseSheet(await rd(seedS.path),S),listP=listS?parseSheet(await rd(listS.path),S):{cells:{},maxRow:0};
  // semilla: fila 2 = encabezados, desde la 3 los sitios
  let seedCols=0;for(const k in seedP.cells){const c=c2n(k.match(/^[A-Z]+/)[0]);if(c>seedCols)seedCols=c}
  const header=[];for(let c=1;c<=seedCols;c++){const o=seedP.cells[n2c(c)+'2'];header.push(o?norm(o.v):'')}
  const seedRows=[];let keyNumeric=false;
  for(let r=3;r<=seedP.maxRow;r++){const a=seedP.cells['A'+r];if(!a||a.v===null||a.v==='')continue;if(typeof a.v==='number')keyNumeric=true;
    const row=[];for(let c=1;c<=seedCols;c++){const o=seedP.cells[n2c(c)+r];row.push(o&&o.v!=null?(typeof o.v==='number'?String(o.v):o.v):'')}seedRows.push(row)}
  // lista de valores de las hojas de listas
  const lists={};Object.keys(listP.cells).forEach(k=>{lists[k]=listP.cells[k].v});
  // opciones de una validación
  const optsOf=(v)=>{
    if(!v||v.type!=='list')return null;const f=v.f1||'';
    if(/^".*"$/.test(f))return{opts:f.slice(1,-1).split(',')};
    const sr=sheetRange(f);if(!sr)return null;
    if(/semilla/i.test(sr.sheet))return{seedKey:true};
    const out=[];for(let c=sr.c1;c<=sr.c2;c++)for(let r=sr.r1;r<=Math.min(sr.r2,listP.maxRow||500);r++){const o=listP.cells[n2c(c)+r];if(o&&o.v!==null&&o.v!=='')out.push(String(o.v))}
    return{opts:out}};
  // marcador de la lista ("SI - NO", "B - R - M", "Energia descripción"): es el encabezado de la lista, NO un valor de respuesta
  const mPh=(opts,Jc)=>{const v=Jc&&typeof Jc.v==='string'?Jc.v:'',o0=String(opts[0]||'');const hdr=x=>/\s-\s|descripci[oó]n|^seleccion/i.test(x);
    if(v&&opts.includes(v)&&opts.indexOf(v)>0)return hdr(o0)?o0:'';if(v&&hdr(v))return v;if(v&&!opts.includes(v))return v;return hdr(o0)?o0:''};
  // filas del formulario
  const rows=[];let ibRow=0,imRow=0,dateRow=0,obsGeneral=null;
  for(let r=9;r<=M.maxRow;r++){
    const c=k=>M.cells[k+r],g1=k=>{const o=c(k);return o&&o.v!=null?norm(o.v):''};
    const B=g1('B'),F=g1('F'),I=g1('I'),K=c('K'),Jc=c('J');
    if(B&&B!=='Habilitado'&&/observaci[oó]n general/i.test(B)){obsGeneral={hdrRow:r,cell:'B'+(r+1)};continue}
    if(!B&&!F&&!I)continue;
    if(B!=='Habilitado')continue;
    const row={r,cat:g1('C'),grp:g1('D'),cap:g1('E'),label:F,hint:I,kind:'hdr',kk:''};
    const val=V['J'+r],o=val?optsOf(val):null;
    if(Jc&&Jc.f!==undefined){row.kind='calc';row.f=Jc.f;if(Jc.vm)row.imgCalc=1}
    else if(Jc&&Jc.vm){row.kind='jimg'}
    else if(o&&o.seedKey){row.kind='ib';ibRow=r}
    else if(o&&o.opts){row.kind='list';row.opts=o.opts;row.ph=mPh(o.opts,Jc)}
    else if(val&&val.type==='date'){row.kind='date';dateRow=r}
    else if(val&&val.type==='textLength'){row.kind='im';row.len=+val.f1||0;row.prompt=val.prompt;imRow=r}
    else if(I||(Jc&&Jc.v!=null&&Jc.v!=='')){row.kind='text'}
    if(Jc&&Jc.v!==null&&Jc.v!==undefined&&Jc.v!==''&&row.kind!=='calc')row.jv=Jc.v;
    if(row.kind==='hdr'&&!F)continue;
    if(K){if(K.vm)row.kk='photo';else if(typeof K.v==='string'&&/escriba aqu/i.test(K.v))row.kk='obs';else if(norm(K.v)==='N/A')row.kk='na'}
    rows.push(row)}
  // valores que el formato ya trae llenos en la celda de respuesta (para "formato con opciones llenas")
  rows.forEach(x=>{const v=x.jv;if(v===undefined||v===null||v==='')return;
    if(x.kind==='list'){const sv=String(v);if(x.opts.includes(sv)&&sv!==x.ph)x.def=sv}
    else if(x.kind==='text'){if(typeof v==='number'){x.def=(v>30000&&v<80000)?serialToDate(v).toISOString().slice(0,10):String(v)}else if(v!=='#VALUE!'&&!/^observaci[oó]n$/i.test(String(v).trim()))x.def=String(v)}
    delete x.jv});
  // columna de la semilla con el nombre de la sede (a partir de la fórmula de la fila "sede")
  let nameCol=-1;const sedeRow=rows.find(x=>x.kind==='calc'&&/sede/i.test(x.label)&&!/dane/i.test(x.label)&&/VLOOKUP/i.test(x.f||''));
  if(sedeRow){const m=sedeRow.f.match(/VLOOKUP\([^,]+,[^,]+,\s*(\d+)/i);if(m)nameCol=+m[1]-1}
  const head={};for(const k of Object.keys(M.cells)){const r=+k.match(/\d+/)[0];if(r<=8)head[k]={v:M.cells[k].v,f:M.cells[k].f}}
  const jf={};rows.forEach(x=>{if(x.kind==='calc')jf[x.r]=x.f});
  const model={pv:4,label:norm((M.cells.B1||{}).v),mainName:main.name,seedName:seedS.name,listsName:listS?listS.name:'',hasVba,sheets:sheets.map(s=>s.name),
    rows,ibRow,imRow,dateRow,obsGeneral,nameCol,keyNumeric,header,head,lists,seedCount:seedRows.length};
  return{model,seed:{header,rows:seedRows}};
}
// ---------- evaluador mínimo de fórmulas (VLOOKUP, IFERROR, IF, CONCATENATE, TEXT, DAY...)
function splitArgs(s){const a=[];let d=0,q=false,cur='';for(const ch of s){if(ch==='"')q=!q;if(!q){if(ch==='(')d++;if(ch===')')d--;if(ch===','&&d===0){a.push(cur);cur='';continue}}cur+=ch}a.push(cur);return a}
const serialToDate=n=>new Date(Math.round((n-25569)*86400000));
function evaluator(model,seed,getAnswer){
  const sheetName=model.mainName;let depth=0;
  const seedMap=new Map();seed.rows.forEach(r=>{const k=String(r[0]);if(!seedMap.has(k))seedMap.set(k,r)});
  function cellVal(ref){
    ref=ref.replace(/\$/g,'');const m=ref.match(/^([A-Z]+)(\d+)$/);if(!m)throw new Error('ref');
    if(m[1]==='J'){const a=getAnswer(+m[2]);if(a!==undefined&&a!==null&&a!=='')return a;const f=model.rows.find(x=>x.r===+m[2]&&x.kind==='calc');if(f){if(depth>8)throw new Error('rec');depth++;try{return ev(f.f)}finally{depth--}}return ''}
    const h=model.head[ref];if(h){if(h.f){if(depth>8)throw new Error('rec');depth++;try{return ev(h.f)}finally{depth--}}return h.v==null?'':h.v}
    return ''}
  function vlookup(args){
    const key=String(ev(args[0])),sr=sheetRange(args[1].trim()),col=+ev(args[2]);if(!sr)throw new Error('rng');
    if(/semilla/i.test(sr.sheet)){const r=seedMap.get(key);if(!r||col>r.length||col<1)throw new Error('na');const v=r[col-1];return v===''?'':(isNaN(+v)||/^0\d/.test(v)?v:+v)}
    for(let r=sr.r1;r<=sr.r2&&r<=200;r++){const k=model.lists[n2c(sr.c1)+r];if(k!==undefined&&String(k)===key){const v=model.lists[n2c(sr.c1+col-1)+r];if(v===undefined)throw new Error('na');return v}}
    throw new Error('na')}
  function ev(expr){
    expr=expr.trim();
    // concatenación (&) de nivel superior
    {let d=0,q=false,parts=[],cur='';for(const ch of expr){if(ch==='"')q=!q;if(!q){if(ch==='(')d++;if(ch===')')d--;if(ch==='&'&&d===0){parts.push(cur);cur='';continue}}cur+=ch}parts.push(cur);
      if(parts.length>1)return parts.map(p=>String(ev(p))).join('')}
    {let d=0,q=false;for(let i=0;i<expr.length;i++){const ch=expr[i];if(ch==='"')q=!q;if(q)continue;if(ch==='(')d++;if(ch===')')d--;if(d===0&&(ch==='='||ch==='<'||ch==='>')&&i>0){let op=ch;if((ch==='<'||ch==='>')&&expr[i+1]==='='){op=ch+'='}else if(ch==='<'&&expr[i+1]==='>'){op='<>'}const L=expr.slice(0,i),R=expr.slice(i+op.length);const a=ev(L),b=ev(R);return op==='='?String(a)===String(b):op==='<>'?String(a)!==String(b):op==='<'?+a<+b:op==='>'?+a>+b:op==='<='?+a<=+b:+a>=+b}}}
    if(/^"[\s\S]*"$/.test(expr))return expr.slice(1,-1).replace(/""/g,'"');
    if(/^-?\d+(\.\d+)?$/.test(expr))return +expr;
    if(/^\$?[A-Z]{1,3}\$?\d+$/.test(expr))return cellVal(expr);
    const fm=expr.match(/^([A-Z.]+)\(([\s\S]*)\)$/);if(!fm)throw new Error('formula no soportada');
    const fn=fm[1],a=splitArgs(fm[2]);
    switch(fn){
      case 'IFERROR':try{const v=ev(a[0]);return v}catch(e){return ev(a[1])}
      case 'IF':return ev(a[0])?ev(a[1]):(a[2]!==undefined?ev(a[2]):false);
      case 'VLOOKUP':return vlookup(a);
      case 'CONCATENATE':case 'CONCAT':return a.map(x=>String(ev(x))).join('');
      case 'TRIM':return norm(ev(a[0]));case 'UPPER':return String(ev(a[0])).toUpperCase();case 'LOWER':return String(ev(a[0])).toLowerCase();
      case 'DAY':case 'MONTH':case 'YEAR':{const n=+ev(a[0]);if(!n)return fn==='YEAR'?1900:(fn==='DAY'?0:1);const d=serialToDate(n);return fn==='DAY'?d.getUTCDate():fn==='MONTH'?d.getUTCMonth()+1:d.getUTCFullYear()}
      case 'TEXT':{const v=ev(a[0]),f=String(ev(a[1]));if(/^0+$/.test(f))return String(Math.trunc(+v)).padStart(f.length,'0');return String(v)}
      default:throw new Error('función '+fn)}}
  return{eval:f=>ev(f),cell:cellVal};
}
const toSerial=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/86400000)+25569:''};
// nombre del archivo AMRTX según la fórmula F6 del propio libro
function fileName(model,seed,answers){
  const getA=r=>{const row=model.rows.find(x=>x.r===r),v=answers['r'+r]!==undefined?answers['r'+r]:answers[r];if(v===undefined||v===null||v==='')return undefined;return row&&row.kind==='date'?toSerial(v):(row&&row.kind==='ib'&&model.keyNumeric&&!isNaN(+v)?+v:v)};
  const E=evaluator(model,seed,getA),f6=model.head.F6;let n='';
  try{n=f6&&f6.f?String(E.eval(f6.f)):String(f6&&f6.v||'')}catch(e){n=String(f6&&f6.v||'')}
  return n.replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').trim();
}
// ---------- comparación de versiones
const rowKey=r=>norm(r.cat)+'|'+norm(r.cap)+'|'+norm(r.label).toLowerCase();
function diff(oldM,newM,oldSeedCount,newSeedCount){
  const mk=m=>{const d={},cnt={};m.rows.forEach(r=>{let k=rowKey(r);cnt[k]=(cnt[k]||0)+1;if(cnt[k]>1)k+='#'+cnt[k];d[k]=r});return d};
  const A=mk(oldM),B=mk(newM),added=[],removed=[],changed=[];
  Object.keys(B).forEach(k=>{if(!A[k])added.push(B[k]);else{const a=A[k],b=B[k];if(a.kind!==b.kind||a.kk!==b.kk||norm(a.hint)!==norm(b.hint)||JSON.stringify(a.opts||[])!==JSON.stringify(b.opts||[]))changed.push(b)}});
  Object.keys(A).forEach(k=>{if(!B[k])removed.push(A[k])});
  return{versionOld:oldM.label,versionNew:newM.label,added,removed,changed,seedOld:oldSeedCount,seedNew:newSeedCount,
    vba:{old:oldM.hasVba,new:newM.hasVba},sheetsAdded:newM.sheets.filter(s=>!oldM.sheets.includes(s)),sheetsRemoved:oldM.sheets.filter(s=>!newM.sheets.includes(s)),
    ibSame:oldM.ibRow===newM.ibRow&&oldM.imRow===newM.imRow&&oldM.dateRow===newM.dateRow}
}
// ¿la versión nueva mantiene la estructura que la app necesita?
function compat(m){const p=[];if(!m.ibRow)p.push('No se encontró la fila del ID beneficiario (lista de la semilla).');if(!m.imRow)p.push('No se encontró la fila del número de caso IM.');if(!m.dateRow)p.push('No se encontró la fila de la fecha.');if(!m.rows.length)p.push('La hoja de entrada no tiene preguntas.');if(!m.head.F6||!m.head.F6.f)p.push('No se encontró la fórmula del nombre del archivo (F6).');return p}

// ---------- especificación de relleno para el motor XL (solo celdas de entrada y fotos; el archivo no se reestiliza)
function buildSpec(model,m,ph,na){
  const C=[],I=[],S=model.mainName,a=m.a||{},o=m.o||{};
  model.rows.forEach(row=>{const k='r'+row.r,v=a[k];
    const keep=m.fill==='full'&&row.def!==undefined&&['list','text'].includes(row.kind)&&v!==undefined&&String(v)===row.def; // sigue como viene en el original
    if(m.fill==='clean'&&row.def!==undefined&&['list','text'].includes(row.kind)&&(v===undefined||v===null||v===''))C.push({sheet:S,ref:'J'+row.r,val:''});
    if(!keep&&['list','text','im','date','ib'].includes(row.kind)&&v!==undefined&&v!==null&&v!==''){let val=v;if(row.kind==='date')val=toSerial(v);else if(row.kind==='ib'&&model.keyNumeric&&!isNaN(+v))val=+v;C.push({sheet:S,ref:'J'+row.r,val})}
    if(row.kk==='obs'&&o[k])C.push({sheet:S,ref:'K'+row.r,val:o[k]});
    const put=(ref,p)=>{if(p&&p.bytes)I.push({sheet:S,range:ref,ext:p.ext||'jpeg',bytes:p.bytes,w:p.w,h:p.h,cell:true});else if(p&&p.na&&na)I.push({sheet:S,range:ref,ext:na.ext,bytes:na.bytes,w:na.w,h:na.h,cell:true})};
    if(row.kk==='photo')put('K'+row.r,ph[k]);
    if(row.kind==='jimg')put('J'+row.r,ph['j'+row.r])});
  if(model.obsGeneral&&m.g)C.push({sheet:S,ref:model.obsGeneral.cell,val:m.g});
  return{cells:C,images:I,noRestyle:true,fontName:null};
}
g.Master={parse,evaluator,fileName,diff,compat,toSerial,rowKey,norm,n2c,c2n,sheetRange,buildSpec};
})(typeof window!=='undefined'?window:globalThis);
