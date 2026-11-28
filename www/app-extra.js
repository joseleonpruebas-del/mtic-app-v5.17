// ===== v5.18: lector ZXing, fotos a la biblioteca, entrega (WhatsApp / Descargas), base de seriales, respaldo por partes, liberar espacio
// 1) Lector: dentro del APK se usa siempre el lector ZXing nativo; el lector web queda solo para el navegador.
scan=async function(cb){if(PL('Scan'))return scanNative(cb);if(window.Html5Qrcode)return scanWeb(cb);return scanNative(cb)};

// 2) Toda foto tomada con la app se guarda también en la biblioteca para volver a usarla
const LIBD=new WeakSet();
async function toLib(p){
 if(!p||!p.d||LIBD.has(p))return;LIBD.add(p);
 try{await idbPut('gallery',newWorkId(),{d:p.d,w:p.w,h:p.h,ts:Date.now(),name:'MinTIC_'+new Date().toISOString().replace(/[:.]/g,'-')+'.jpg'})}catch(e){}
}
{const _p=proc;proc=async function(ns,k,fl,mk){const r=await _p.apply(this,arguments);if(mk&&PH[ns])await toLib(PH[ns][k]);return r}}
{const _t=tomar;tomar=async function(ns,k){const before=PH[ns]&&PH[ns][k];const r=await _t.apply(this,arguments);const p=PH[ns]&&PH[ns][k];if(p&&p!==before)await toLib(p);return r}}

// 3) Entrega de archivos: pregunta si se comparte (WhatsApp, Drive, correo…) o se guarda en Descargas
function askDeliver(n){return new Promise(res=>{
 sheet('<b>'+(n>1?'Archivos generados':'Archivo generado')+'</b><div class="m">¿Qué quieres hacer con '+(n>1?'estos archivos':'este archivo')+'?</div><button class="p" data-dl="share">Compartir (WhatsApp, Drive, correo…)</button><button data-dl="down">Guardar en Descargas</button><button data-dl="no">Ahora no</button>');
 const o=$('#ov');let done=false;const fin=v=>{if(done)return;done=true;window.__cancelRestoreChoice=null;o.remove();res(v)};
 window.__cancelRestoreChoice=()=>fin('no');
 o.addEventListener('click',e=>{if(e.target===o)return fin('no');const b=e.target.closest('[data-dl]');if(b)fin(b.dataset.dl)})})}
const toB64=u=>new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.onerror=()=>j(fr.error||new Error('No se pudo preparar el archivo'));fr.readAsDataURL(u instanceof Blob?u:new Blob([u]))});
guardar=async function(files,opt){
 opt=opt||{};const C=CAP();
 const bytes=async f=>{const v=f.load?await f.load():f.u8,s=v&&(v.size||v.byteLength||v.length);if(!v||!s)throw new Error('El archivo '+f.fn+' no está disponible en el almacenamiento local');return v};
 if(!C){const dl=window.claude&&window.claude.use?await window.claude.use('downloads'):null;
  for(const f of files){const bl=new Blob([await bytes(f)],{type:f.mime||XLSX_T});if(dl)await dl.save({filename:f.fn,data:bl});else{const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=f.fn;document.body.appendChild(a);a.click();a.remove()}}
  return true}
 let mode=opt.mode||'share';
 if(!opt.noask){mode=await askDeliver(files.length);if(mode==='no'){toast('No se compartió ni se guardó. El archivo sigue en el Registro.');setTimeout(()=>toast(''),3000);return false}}
 const{Filesystem,Share}=C.Plugins,Cam=PL('Cam'),items=[];
 for(const f of files){const u=await bytes(f);items.push({fn:f.fn,mime:f.mime||XLSX_T,uri:(await Filesystem.writeFile({path:f.fn,data:await toB64(u),directory:'CACHE'})).uri})}
 if(mode==='down'&&Cam&&Cam.saveDownload){
  let n=0,bad='';for(const x of items){try{await Cam.saveDownload({uri:x.uri,name:x.fn,mime:x.mime});n++}catch(e){bad=e.message||String(e)}}
  if(bad&&!n){if(!confirm('No se pudo guardar en Descargas ('+bad+'). ¿Compartir el archivo en su lugar?'))return false;mode='share'}
  else{toast('Guardado en Descargas: '+n+' archivo'+(n===1?'':'s')+(bad?' (alguno falló: '+bad+')':''));setTimeout(()=>toast(''),3500);return true}}
 await Share.share(items.length>1?{title:'MinTIC',files:items.map(x=>x.uri)}:{title:items[0].fn,url:items[0].uri});return true};

// 4) Base de seriales (instalados, retirados y validados en AMRTX) con búsqueda y exportación a Excel
const SDBFMT={p:'7K · Preventivo',c:'7K · Correctivo',pc:'7K · Prev. + corr.',op:'ODH · Preventivo',o:'ODH · Correctivo',x1:'AMRTX-ODH',x2:'AMRTX-7K'};
const sdbNorm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const sdbDmy=s=>{const p=String(s||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(s||'')};
let SDB=[],SDBQ='',SDBE='all',SDBN=80;
async function sdbData(){
 const eqd=c=>{const s=String(c||'').trim();if(!s)return '';const e=(window.EQ||[]).concat(window.EQ_ODH||[]).find(x=>String(x[0])===s);return e?e[1]:''};
 const out=[],bad=v=>{v=String(v==null?'':v).trim();return !v||/^(n\/?a|no aplica|ninguno|-+)$/i.test(v)};
 const push=(b,estado,sap,desc,serial)=>{if(bad(serial))return;out.push(Object.assign({},b,{estado,sap:String(sap||'').trim(),desc:desc||eqd(sap)||'',serial:String(serial).trim()}))};
 for(const ib of Object.keys(JI)){const site=JI[ib];
  for(const w of (site.works||[])){const j=LS.g(workKey(ib,w.id));if(!j)continue;
   const f=j.f||{},b={ib,sede:f.sede||site.sede||'',fecha:f.fecha||'',fmt:SDBFMT[j.mode]||j.mode,mode:j.mode};
   if(['p','pc'].includes(j.mode)&&j.p&&j.p.s)(F.P_SER||[]).forEach((n,i)=>{push(b,'Retirado','',n,j.p.s['r'+i]);push(b,'Instalado','',n,j.p.s['i'+i])});
   if(j.mode==='op'&&j.p&&j.p.s)(F.OPS||[]).forEach((n,i)=>{push(b,'Retirado','',n,j.p.s['r'+i]);push(b,'Instalado','',n,j.p.s['i'+i])});
   const sr=(j.mode==='o'?j.o&&j.o.sr:['c','pc'].includes(j.mode)?j.c&&j.c.sr:null)||null;
   if(sr)for(let i=0;i<10;i++){const rs=sr['r'+i],is=sr['i'+i];push(b,'Retirado',rs,'',sr['rs'+i]);push(b,'Instalado',is||rs,'',sr['is'+i])}
   if(MP[j.mode]&&j.m&&j.m.a){try{const d=await mLoad(j.prog||j.mode,j.ver),rows=d.model.rows;let chap='';
     rows.forEach((r,i)=>{if(r.kind==='hdr'&&/^\d/.test(r.cap||'')){chap=r.label;return}
      if(!mIsSer(r))return;const v=j.m.a['r'+r.r];let sap='';
      for(let k=i-1;k>=Math.max(0,i-6);k--){const a=j.m.a['r'+rows[k].r];if(rows[k].kind==='list'&&/^\d{5,}$/.test(String(a||''))){sap=a;break}}
      push(b,'Validado',sap,eqd(sap)||mElem(chap),v)})}catch(e){}}
  }}
 // un mismo serial/estado/IB: se queda el más reciente
 const m=new Map();out.forEach(r=>{const k=[r.ib,r.estado,r.serial.toUpperCase()].join('|'),o=m.get(k);if(!o||String(r.fecha)>=String(o.fecha))m.set(k,r)});
 const rows=[...m.values()],inst={};rows.filter(r=>r.estado==='Instalado').forEach(r=>{const k=r.serial.toUpperCase();(inst[k]=inst[k]||new Set()).add(r.ib)});
 rows.forEach(r=>{const s=inst[r.serial.toUpperCase()];if(s&&s.size>1&&r.estado==='Instalado')r.dup=[...s].filter(x=>x!==r.ib)});
 rows.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||String(a.ib).localeCompare(String(b.ib)));
 return rows}
function sdbFiltered(){const ws=sdbNorm(SDBQ).split(/\s+/).filter(Boolean);return SDB.filter(r=>(SDBE==='all'||r.estado===SDBE)&&(!ws.length||ws.every(w=>sdbNorm([r.ib,r.sede,r.sap,r.desc,r.serial,r.fmt,sdbDmy(r.fecha),r.estado].join(' ')).includes(w))))}
function sdbList(){
 const L=sdbFiltered(),box=$('#sdb-l');if(!box)return;
 $('#sdb-c').textContent=L.length+' de '+SDB.length+' registros';
 box.innerHTML=L.slice(0,SDBN).map(r=>'<div class="s" style="margin:6px 0;padding:10px"><b style="word-break:break-all">'+esc(r.serial)+'</b> <span class="m" style="display:inline">· '+esc(r.estado)+'</span><div class="m">IB '+esc(r.ib)+' · '+esc(r.sede||'sin sede')+'</div><div class="m">'+(r.sap?'SAP '+esc(r.sap)+' · ':'')+esc(r.desc||'Sin descripción')+'</div><div class="m">'+esc(sdbDmy(r.fecha)||'Sin fecha')+' · '+esc(r.fmt)+'</div>'+(r.dup?'<div class="m" style="color:#b45309">⚠ Este serial también aparece instalado en IB '+esc(r.dup.join(', '))+'</div>':'')+'</div>').join('')+(L.length>SDBN?'<button data-x="sdbmore">Mostrar más ('+(L.length-SDBN)+' restantes)</button>':'')||'<div class="m">No hay registros con ese filtro.</div>'}
async function sdbScreen(){
 currentScreen='sdb';
 $('#app').innerHTML=pageHeader()+'<h1>Base de seriales</h1><div class="m" id="sdb-m">Leyendo los trabajos guardados…</div>';
 SDB=await sdbData();SDBN=80;
 $('#sdb-m').outerHTML='<div class="m">Se arma sola con los seriales de los trabajos guardados en este teléfono (7K, ODH y AMRTX).</div><section class="s"><input id="sdbq" type="search" placeholder="Buscar por IB, sede, SAP, descripción o serial" value="'+esc(SDBQ)+'"><label>Estado<select id="sdbe">'+[['all','Todos'],['Instalado','Instalados'],['Retirado','Retirados'],['Validado','Validados (AMRTX)']].map(o=>'<option value="'+o[0]+'"'+(SDBE===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></label><div class="m" id="sdb-c"></div><button class="p" data-x="sdbxl">Exportar a Excel (lo que se ve filtrado)</button></section><div id="sdb-l"></div>';
 sdbList()}
function xlsxSimple(headers,rows,name){
 const E=s=>String(s==null?'':s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),col=i=>String.fromCharCode(65+i);
 const W=[10,36,12,44,22,12,12,18,30];
 const sh='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+headers.map((h,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(W[i]||16)+'" customWidth="1"/>').join('')+'</cols><sheetData>'+[headers].concat(rows).map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>'<c r="'+col(ci)+(ri+1)+'" t="inlineStr"'+(ri===0?' s="1"':'')+'><is><t xml:space="preserve">'+E(v)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData><autoFilter ref="A1:'+col(headers.length-1)+(rows.length+1)+'"/></worksheet>';
 const z=new JSZip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 z.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+E(name)+'" sheetId="1" r:id="rId1"/></sheets></workbook>');
 z.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 z.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
 z.file('xl/worksheets/sheet1.xml',sh);
 return z.generateAsync({type:'uint8array',compression:'DEFLATE'})}
async function sdbExport(){
 const L=sdbFiltered();if(!L.length)return alert('No hay registros para exportar con ese filtro.');
 const u=await xlsxSimple(['IB','Sede','SAP','Descripción','Serial','Estado','Fecha','Formato','Observación'],L.map(r=>[r.ib,r.sede,r.sap,r.desc,r.serial,r.estado,sdbDmy(r.fecha),r.fmt,r.dup?'Serial también instalado en IB '+r.dup.join(', '):'']),'Seriales');
 await guardar([{u8:u,fn:'Base_de_seriales_'+today()+'.xlsx'}])}

// 5) Respaldo por partes (no carga todo en memoria) y restauración que suma los respaldos
async function backupParts(say){
 if(!(await dbp))throw new Error('El almacenamiento local no está disponible');
 const LIM=18*1048576,parts=[],ls={};Object.keys(localStorage).filter(k=>k.startsWith('mtic_')).forEach(k=>ls[k]=localStorage.getItem(k));
 let z,d,size,n=0,skipped=0;
 const begin=()=>{z=new JSZip();d={v:4,ls:parts.length?{}:ls,ph:[],xl:[],gallery:[]};size=0};
 const flush=async()=>{z.file('data.json',JSON.stringify(d));parts.push({u8:await z.generateAsync({type:'uint8array',compression:'STORE'})});z=null};
 begin();
 const total=(await Promise.all(['ph','xl','gallery'].map(idbKeys))).reduce((a,k)=>a+k.length,0);let done=0;
 for(const st of ['ph','xl','gallery']){
  for(const k of await idbKeys(st)){
   if(size>=LIM&&(d.ph.length+d.xl.length+d.gallery.length)){await flush();begin()}
   const v=await idbGet(st,k);done++;if(done%15===0){say('Preparando respaldo: '+done+' de '+total+'…');await new Promise(r=>setTimeout(r))}
   if(v==null)continue;
   if(st==='xl'){const f='xl/'+(++n)+'.xlsx';z.file(f,v);d.xl.push({key:k,f});size+=v.size||v.byteLength||v.length||0;continue}
   if(st==='ph'&&v.na){d.ph.push({key:k,na:1});continue}
   const b64=v.d&&String(v.d).split(',')[1];if(!b64||!/^data:image\/(?:jpeg|png);base64,/.test(v.d)){skipped++;continue}
   const f=(st==='ph'?'ph/':'gallery/')+(++n)+'.jpg';z.file(f,b64,{base64:true});size+=b64.length*.75;
   if(st==='ph')d.ph.push({key:k,f,w:v.w||1,h:v.h||1});else d.gallery.push({key:k,f,w:v.w||1,h:v.h||1,ts:v.ts||0,name:v.name||''})}}
 await flush();
 const t=today();parts.forEach((p,i)=>{p.fn='MinTIC_backup_'+t+(parts.length>1?'_parte'+(i+1)+'de'+parts.length:'')+'.zip';p.mime='application/zip'});
 parts.skipped=skipped;return parts}
async function respaldo(){
 const m=$('#om'),say=t=>{if(m)m.textContent=t;else{toast(t);setTimeout(()=>toast(''),3500)}};
 try{say('Preparando respaldo…');const parts=await backupParts(say);
  say('Respaldo listo: '+parts.length+' archivo'+(parts.length===1?'':'s')+(parts.skipped?' ('+parts.skipped+' fotos dañadas se omitieron)':'')+'. Elige dónde enviarlo.');
  const ok=await guardar(parts);
  if(ok){LS.s('mtic_lastbk',Date.now());say('Respaldo generado: '+parts.length+' archivo'+(parts.length===1?'':'s')+'. Para restaurar, usa «Cargar backup(s)» y elige todas las partes juntas (se suman a lo que ya hay si eliges «Combinar»).')}
  else say('Respaldo preparado pero no enviado. Vuelve a intentarlo cuando quieras.');
  const b=$('#bkn');if(b&&ok)b.remove()
 }catch(e){say('No se pudo generar el respaldo: '+(e.message||e))}}

// 6) Liberar espacio: borra fotos de trabajos ya exportados, solo si lo confirmas
async function liberar(){
 const keys=await idbKeys('ph'),pre=[];
 Object.keys(JI).forEach(ib=>(JI[ib].works||[]).forEach(w=>{const j=LS.g(workKey(ib,w.id));if(j&&(j.xl||[]).length)pre.push(ib+'|'+w.id+'|')}));
 const mine=keys.filter(k=>pre.some(p=>String(k).startsWith(p)));
 if(!mine.length)return alert('No hay fotos de trabajos ya exportados para liberar.');
 let bytes=0;for(const k of mine){const v=await idbGet('ph',k);bytes+=v&&v.d?v.d.length*.75:0}
 const mb=(bytes/1048576).toFixed(1);
 if(!confirm('Se borrarán '+mine.length+' fotos (≈ '+mb+' MB) de trabajos que ya exportaste a Excel.\n\nNo se borran los Excel, los datos de los trabajos ni la biblioteca de fotos. Si vuelves a exportar esos trabajos, saldrán sin esas fotos.\n\nSe recomienda crear un respaldo antes. ¿Borrar estas fotos?')){toast('No se borró nada.');setTimeout(()=>toast(''),2500);return}
 if(!confirm('Última confirmación: ¿borrar definitivamente '+mine.length+' fotos?')){toast('No se borró nada.');setTimeout(()=>toast(''),2500);return}
 for(const k of mine)await idbDel('ph',k);
 toast('Se liberaron ≈ '+mb+' MB.');setTimeout(()=>toast(''),3500);storageSummary()}

// 7) Aviso semanal de respaldo
function bkBanner(){
 const app=document.getElementById('app'),h=app&&app.querySelector('.home-header');if(!h||document.getElementById('bkn')||!Object.keys(JI).length)return;
 const last=+LS.g('mtic_lastbk')||0,snooze=+LS.g('mtic_bksnooze')||0,now=Date.now(),day=86400000;
 if(now-last<7*day||now-snooze<2*day)return;
 const days=last?Math.floor((now-last)/day):null;
 h.insertAdjacentHTML('afterend','<div class="s" id="bkn" style="border-left:4px solid #b45309"><b>Respaldo pendiente</b><div class="m">'+(days===null?'Aún no has hecho un respaldo.':'Hace '+days+' días que no haces un respaldo.')+' <span id="bkn-s"></span></div><div class="r"><button data-x="bk">Crear respaldo</button><button data-x="bkx">Recordármelo después</button></div></div>');
 if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(e=>{const s=$('#bkn-s');if(s&&e.usage)s.textContent='La app ocupa ≈ '+(e.usage/1048576).toFixed(0)+' MB.'}).catch(()=>{})}

document.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
 try{
  if(x==='sdb')await sdbScreen();
  else if(x==='sdbmore'){SDBN+=80;sdbList()}
  else if(x==='sdbxl')await sdbExport();
  else if(x==='free')await liberar();
  else if(x==='bkx'){LS.s('mtic_bksnooze',Date.now());const n=$('#bkn');if(n)n.remove()}
 }catch(er){alert('No se pudo completar la acción: '+(er.message||er))}
});
document.addEventListener('input',e=>{if(e.target.id==='sdbq'){SDBQ=e.target.value;SDBN=80;sdbList()}});
document.addEventListener('change',e=>{if(e.target.id==='sdbe'){SDBE=e.target.value;SDBN=80;sdbList()}});
