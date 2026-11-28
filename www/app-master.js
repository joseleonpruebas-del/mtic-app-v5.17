// ===== AMRTX (libros maestros .xlsm): AMRTX-ODH (x1) y AMRTX-7K (x2).
// Cada formato se trata aparte: su propio archivo original (con macros), su propia semilla y sus versiones.
// El .xlsm que sale es el original con las respuestas y las fotos; no se modifica nada más.
const MP={x1:'AMRTX-ODH',x2:'AMRTX-7K'};
Object.keys(MP).forEach(k=>MODO[k]=MP[k]);
document.head.insertAdjacentHTML('beforeend','<style>.nv4{flex-wrap:nowrap!important;gap:4px!important}.nv4 button{flex:1 1 auto;min-width:0;white-space:nowrap;font-size:11.5px!important;padding:7px 5px!important}.mtabs{top:calc(env(safe-area-inset-top,0px) + var(--navh,44px))!important}.m-start{border-left:4px solid var(--ac)}.mq-row{border-bottom:1px solid var(--br);padding:8px 0}.mq-row select,.mq-row input,.mq-row textarea{margin-top:4px}.mc{background:var(--ac2);border-radius:8px;padding:6px 8px;font-size:13px;margin-top:4px;min-height:30px}.mh{font-weight:600;margin-top:14px;color:var(--ac)}.m-sug button{display:block;width:100%;text-align:left;margin-top:4px}.mtabs{position:sticky;top:44px;z-index:4;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px 0;background:var(--bg)}.mtabs button{padding:8px 4px;font-size:13px;line-height:1.2}.mtabs button.on{background:var(--ac);color:#fff;border-color:var(--ac)}.mtabs span{display:block;font-weight:400;font-size:12px}.mg{display:none}.mg.on{display:block}.mnum{font-weight:400;color:#888;font-size:12px}.mfi{margin-top:6px;border:1px solid #c62828;background:#fdecea;color:#c62828;border-radius:16px;padding:4px 12px;font-size:13px}.mfi.ok{border-color:#2e7d32;background:#e8f5e9;color:#2e7d32}.mflash{outline:2px solid var(--ac);outline-offset:2px}</style>');
// ---- almacén propio de versiones del formato
const mdbp=new Promise(r=>{try{const q=indexedDB.open('mtic_masters',1);q.onupgradeneeded=()=>q.result.createObjectStore('m');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const mtx=async(md,fn)=>{const d=await mdbp;if(!d)return null;return new Promise(res=>{try{const t=d.transaction('m',md),r=fn(t.objectStore('m'));t.oncomplete=()=>res(r&&r.result!==undefined?r.result:true);t.onerror=()=>res(null);t.onabort=()=>res(null)}catch(e){res(null)}})};
const mPut=(k,v)=>mtx('readwrite',o=>o.put(v,k)),mGet=async k=>{const v=await mtx('readonly',o=>o.get(k));return v&&v!==true?v:null};
let MI=LS.g('mtic_masters')||{},MC=new Map(),MCUR=null,MPEND={};
// Ajustes propios de cada formato (por numeral). AMRTX-7K solo usa las opciones de foto generales.
const MCFG={x1:{tech:true,vobo:true,scan:true,capture:['4.3.1','4.3.5','4.5.1','4.5.2','4.7.7','4.7.8','4.8.1','4.10.6','4.12.3','4.12.4','4.12.5','4.12.7','4.15.4','4.22.2','4.23.1','4.24.1','4.25.2']},x2:{tech:true,vobo:true,scan:true}};
function mInfo(){
 if(MCUR._i)return MCUR._i;const cfg=MCFG[job.mode]||{},rows=MCUR.model.rows,tech={};
 if(cfg.tech){let on=false;rows.forEach(r=>{if(r.kind==='hdr'){on=/quien repara/i.test(r.label);return}if(!on)return;const L=r.label;let k=null;
  if(/^nombres/i.test(L))k='tecn';else if(/^cargo/i.test(L))k='tecc';else if(/c[eé]dula/i.test(L))k='tecd';else if(/tel[eé]fono|celular/i.test(L))k='tect';else if(/correo/i.test(L))k='tecm';else if(/^firma/i.test(L))k='sig';if(k)tech[r.r]=k})}
 const vb=cfg.vobo?rows.find(r=>/firma vobo aliado/i.test(r.cat)&&r.kk==='photo'):null;
 return MCUR._i={tech,vobo:vb?vb.r:0,cap:new Set(cfg.capture||[]),scan:!!cfg.scan}}
// ---- ajustes por formato (solo en la app; el .xlsm original no se modifica)
function mCat(r,last,st){
 if(r.cap)st.cap=r.cap;
 if(job&&job.mode==='x2'){const m=/^4\.(\d+)/.exec(st.cap||'');if(m){const n=+m[1];if(n>=7&&n<=11)return 'KIT Energía Comercial';if(n>=12&&n<=19)return 'KIT Energía Solar';if(n===20)return 'KIT Radio TX';if(n===43)return 'KIT Satelital (Antenas)'}}
 return last}
const mHideRow=r=>/vobo regional/i.test(r.cat||'')||(job&&job.mode==='x2'&&r.cap==='3.3'&&r.kind==='text');
const mNoPh=r=>mHideRow(r)||(job&&job.mode==='x2'&&r.cap==='4.47.1');
const mCertKey=()=>{if(!job||job.mode!=='x2'||!MCUR)return null;const r=MCUR.model.rows.find(x=>x.cap==='4.40.4'&&x.kk==='photo');return r?'r'+r.r:null};
const mTechSigKey=()=>{const inf=mInfo(),rr=Object.keys(inf.tech).find(k=>inf.tech[k]==='sig'&&MCUR.model.rows.find(x=>x.r===+k).kind==='jimg');return rr?'j'+rr:null};
const mTechSigPh=()=>{const k=mTechSigKey(),p=k&&PH.x[k];return p&&p.d?p:null};
const hashBytes=u=>{let h=2166136261;for(let i=0;i<u.length;i++){h^=u[i];h=Math.imul(h,16777619)}return (h>>>0).toString(16)+'-'+u.length};
async function mEnsure(p){
 const b=MASTER_BUILTIN[p],bid=b.id||'b1';
 if(MI[p]&&MI[p].cur&&MI[p].list.some(v=>v.id===bid)&&await mGet(p+'|'+MI[p].cur+'|bin'))return;
 // versión incluida en la app (si es nueva para este equipo, queda como la instalada)
 const bin=Uint8Array.from(atob(b.b64),c=>c.charCodeAt(0));
 await mPut(p+'|'+bid+'|bin',bin);await mPut(p+'|'+bid+'|data',{model:b.model,seed:b.seed});MC.delete(p+'|'+bid);
 const list=((MI[p]&&MI[p].list)||[]).filter(v=>v.id!==bid);list.push({id:bid,label:b.model.label,ts:Date.now(),builtin:1,hash:hashBytes(bin),file:b.file});
 MI[p]={cur:bid,list};LS.s('mtic_masters',MI)}
async function mLoad(p,id){const k=p+'|'+id;if(MC.has(k))return MC.get(k);let d=await mGet(k+'|data');if(!d)throw new Error('No se encontró la versión '+id+' de '+MP[p]);
 if(!d.model||(d.model.pv||1)<4){const bin=await mGet(k+'|bin');if(bin){const np=await Master.parse(bin);d={model:np.model,seed:np.seed};await mPut(k+'|data',d)}}
 MC.set(k,d);return d}
const mBin=(p,id)=>mGet(p+'|'+id+'|bin');
const mLabel=async p=>{await mEnsure(p);const v=MI[p].list.find(x=>x.id===MI[p].cur);return(v?v.label:'')+(v&&v.builtin?' (incluido en la app)':'')};
// ---- seriales y versión de software de las AP desde el reporte de cnMaestro (por ID beneficiario)
const AP_NAMES={e1:'AP exterior 1',e2:'AP exterior 2',i:'AP interior'};
let APD=null;
function apData(){if(APD)return APD;const b=window.AP_DATA||{},u=LS.g('mtic_apdata')||{};APD={x1:Object.assign({},b.x1,u.x1),x2:Object.assign({},b.x2,u.x2)};return APD}
function mApRows(){ // filas de serial y de versión de software dentro de "Mantenimiento de la AP ..."
 if(MCUR._ap)return MCUR._ap;const m={};let cur=null;
 MCUR.model.rows.forEach(r=>{
  if(r.kind==='hdr'&&/^\d/.test(r.cap||'')){const t=r.label;cur=/^mantenimiento/i.test(t)?(/ap exterior 1/i.test(t)?'e1':/ap exterior 2/i.test(t)?'e2':/ap interior/i.test(t)?'i':null):null;return}
  if(!cur)return;if(mIsSer(r))m[r.r]={ap:cur,f:0};else if(r.kind==='text'&&/versi[oó]n de software/i.test(r.label))m[r.r]={ap:cur,f:1}});
 return MCUR._ap=m}
function mApFill(j){
 const e=(apData()[j.prog]||{})[String(j.ib)],M=mApRows(),has={};Object.keys(M).forEach(k=>has[M[k].ap]=1);
 const info={ok:[],dup:{},miss:[]};if(!Object.keys(has).length)return;
 Object.keys(has).forEach(ap=>{const c=e&&e[ap];if(!c||!c.length)info.miss.push(ap);else if(c.length>1)info.dup[ap]=c.map(x=>x[0]);else info.ok.push(ap)});
 Object.keys(M).forEach(rr=>{const c=e&&e[M[rr].ap];if(c&&c.length===1&&c[0][M[rr].f])j.m.a['r'+rr]=String(c[0][M[rr].f])});
 j.m.ap=info}
function mApNote(){
 const i=job.m.ap;if(!i)return '';const n=a=>a.map(x=>AP_NAMES[x]).join(', ');let t='';
 if(i.ok.length)t+='Serial y versión de software tomados del reporte cnMaestro: '+n(i.ok)+'. ';
 Object.keys(i.dup).forEach(ap=>{t+='<b>'+AP_NAMES[ap]+'</b>: el reporte trae más de un serial ('+i.dup[ap].map(esc).join(', ')+'); escribe el correcto. '});
 if(i.miss.length)t+='Sin datos en el reporte: '+n(i.miss)+'.';
 return t?'<div class="m" style="margin-top:6px">'+t+'</div>':''}
async function apParseXlsx(bytes){
 const z=await JSZip.loadAsync(bytes),un=t=>String(t).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
 const ss=z.file('xl/sharedStrings.xml')?await z.file('xl/sharedStrings.xml').async('string'):'',S=[...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m=>un([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join('')));
 const sp=Object.keys(z.files).filter(f=>/^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]))[0];
 if(!sp)throw new Error('El archivo no tiene hojas.');const x=await z.file(sp).async('string'),rows=[];
 for(const rm of x.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)){const o={};for(const cm of rm[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){const t=(cm[2].match(/ t="(\w+)"/)||[])[1],b=cm[3]||'',v=b.match(/<v>([\s\S]*?)<\/v>/);let val='';if(t==='inlineStr')val=un((b.match(/<t[^>]*>([\s\S]*?)<\/t>/)||[,''])[1]);else if(v)val=t==='s'?S[+v[1]]:un(v[1]);o[cm[1]]=String(val==null?'':val).trim()}rows.push(o)}
 const h=rows[0]||{},col=re=>Object.keys(h).find(k=>re.test(h[k]));const cA=col(/^ap$/i),cS=col(/serial/i),cV=col(/versi/i);
 if(!cA||!cS)throw new Error('No encontré las columnas "AP" y "Serial" en la primera fila.');
 const out={};let n=0;
 rows.slice(1).forEach(r=>{const m=String(r[cA]||'').match(/^\s*(\d+)-.+-AP-(EXT1|EXT2|INT)\s*$/i);if(!m||!r[cS])return;const k={EXT1:'e1',EXT2:'e2',INT:'i'}[m[2].toUpperCase()],e=(out[m[1]]=out[m[1]]||{})[k]=(out[m[1]]||{})[k]||[],t=[r[cS],cV?r[cV]||'':''];if(!e.some(q=>q[0]===t[0]&&q[1]===t[1])){e.push(t);n++}});
 return{data:out,aps:n}}
function apDetect(data,name){
 const ids=Object.keys(data),n1=ids.filter(k=>SEED_ODH[k]).length,n2=ids.filter(k=>SEED[k]).length;
 if(n1!==n2)return n1>n2?'x1':'x2';
 if(/odh/i.test(name))return 'x1';if(/7k/i.test(name))return 'x2';
 return confirm('No pude saber si el reporte es de ODH o de 7K.\nAceptar = ODH 5G · Cancelar = 7K')?'x1':'x2'}
async function apUpload(file){
 const info=$('#mapi');try{const r=await apParseXlsx(new Uint8Array(await file.arrayBuffer()));if(!r.aps)throw new Error('No encontré AP con el formato IB-...-AP-EXT1 / AP-EXT2 / AP-INT.');
  const p=apDetect(r.data,file.name),u=LS.g('mtic_apdata')||{},old=apData()[p]||{};let nuevos=0,cambios=0;
  Object.keys(r.data).forEach(ib=>{if(!old[ib])nuevos++;else Object.keys(r.data[ib]).forEach(ap=>{if(JSON.stringify(old[ib][ap])!==JSON.stringify(r.data[ib][ap]))cambios++})});
  u[p]=Object.assign(u[p]||{},r.data);LS.s('mtic_apdata',u);APD=null;
  const mt=LS.g('mtic_apmeta')||{};mt[p]={ts:Date.now(),file:file.name,aps:r.aps};LS.s('mtic_apmeta',mt);
  if(info)info.innerHTML='Reporte de <b>'+(p==='x1'?'ODH 5G':'7K')+'</b> cargado: '+r.aps+' AP en '+Object.keys(r.data).length+' sitios ('+nuevos+' sitios nuevos, '+cambios+' AP con serial o versión distinta).';apOptInfo()}
 catch(e){const m=String((e&&e.message)||e);if(info)info.textContent='No se pudo leer el reporte: '+(/zip|central directory/i.test(m)?'el archivo no es un .xlsx válido.':m)}}
function apOptInfo(){const mt=LS.g('mtic_apmeta')||{};const e=$('#mapi-st');if(!e)return;
 e.innerHTML=[['x1','ODH 5G'],['x2','7K']].map(x=>x[1]+': '+apCount(x[0])+' sitios'+(mt[x[0]]?' · último reporte '+new Date(mt[x[0]].ts).toLocaleDateString('es-CO')+' ('+esc(mt[x[0]].file)+')':' · datos incluidos en la app')).join('<br>')}
{const _o=opt;opt=async function(){const r=await _o.apply(this,arguments);
  const sec='<div class="s"><h2>Base de seriales y firmware de las AP</h2><div class="m">Sube el reporte de cnMaestro (.xlsx). La app detecta sola si es de ODH o de 7K y lo usa para llenar seriales y versión de software de las AP en los AMRTX nuevos.</div><div class="m" id="mapi-st" style="margin-top:6px"></div><div class="r"><button data-x="mapu">Cargar reporte de AP</button></div><div class="m" id="mapi" style="margin-top:6px"></div><input type="file" id="mfa-auto" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></div>';
  const h=[...document.querySelectorAll('#app .s h2')].find(x=>/Datos y almacenamiento/i.test(x.textContent));
  if(h)h.parentNode.insertAdjacentHTML('beforebegin',sec);else $('#app').insertAdjacentHTML('beforeend',sec);apOptInfo();return r}}
const apCount=p=>Object.keys(apData()[p]||{}).length;
// ---- inicio: una sección por formato
{const _home=home;
 home=function(){_home();const anchor=document.querySelector('.odh-start')||document.querySelector('.home-start');if(!anchor)return;let html='';
  Object.keys(MP).forEach(p=>{html+='<section class="s home-start m-start" data-p="'+p+'"><h2>'+MP[p]+' · Registrar</h2><label>Busca el sitio por su IB o nombre<input id="ibin-'+p+'" autocomplete="off" placeholder="Escribe el IB o parte del nombre de la sede"></label><div class="m-sug" id="sug-'+p+'"></div><button class="p" style="margin-top:8px" data-x="mgo" data-p="'+p+'">Continuar con '+MP[p]+'</button><div class="m" style="margin-top:8px" id="mver-'+p+'"></div><div class="r" style="margin-top:6px"><button data-x="mupd" data-p="'+p+'">Actualizar formato</button></div><input type="file" id="mf-'+p+'" accept=".xlsm,application/vnd.ms-excel.sheet.macroEnabled.12" hidden></section>'});
  anchor.insertAdjacentHTML('afterend',html);Object.keys(MP).forEach(async p=>{const e=$('#mver-'+p);if(e)e.textContent='Formato instalado: '+await mLabel(p)})}}
// listas desplegables de AMRTX: solo sitios de Córdoba (el IB se puede escribir a mano aunque sea de otro departamento)
const mCordRows=seed=>{const i=(seed.header||[]).findIndex(h=>/^nombre_departamento$/i.test(String(h)));return i<0?seed.rows:seed.rows.filter(r=>/^c[oó]rdoba$/i.test(String(r[i]||'').trim()))};
async function msuggest(p,q){
 const box=$('#sug-'+p);if(!box)return;q=q.trim().toLowerCase();if(q.length<3){box.innerHTML='';return}
 await mEnsure(p);const{model,seed}=await mLoad(p,MI[p].cur),nc=model.nameCol,out=[];
 for(const r of mCordRows(seed)){if(String(r[0]).startsWith(q)||(nc>=0&&String(r[nc]).toLowerCase().includes(q))){out.push(r);if(out.length>=8)break}}
 box.innerHTML=out.length?out.map(r=>'<button data-x="msug" data-p="'+p+'" data-id="'+esc(r[0])+'">'+esc(r[0])+' · '+esc(nc>=0?r[nc]:'')+'</button>').join(''):'<div class="m">Sin coincidencias en la semilla de '+MP[p]+'.</div>'}
async function mGate(p,ib){
 await mEnsure(p);const{seed}=await mLoad(p,MI[p].cur),found=seed.rows.some(r=>String(r[0])===String(ib));
 if(!found&&!confirm('Este IB no está en la semilla de '+MP[p]+'. ¿Continuar de todas formas?'))return;
 const works=((JI[ib]&&JI[ib].works)||[]).filter(w=>w.mode===p);
 if(!works.length)return mAsk(p,ib);
 sheet('<b>'+MP[p]+' · IB '+esc(ib)+'</b><div class="m">Ya hay un trabajo de este IB.</div><button data-x="mmode" data-m="new" data-p="'+p+'" data-ib="'+esc(ib)+'">Nuevo borrador vacío</button><button data-x="mmode" data-m="last" data-p="'+p+'" data-ib="'+esc(ib)+'">Continuar el último</button><button data-x="ovx">Cancelar</button>')}
// ---- trabajos
const rowBy=()=>{const o={};MCUR.model.rows.forEach(r=>o[r.r]=r);return o};
function mEvaluator(){const RB=rowBy(),{model,seed}=MCUR;return Master.evaluator(model,seed,r=>{const v=job.m.a['r'+r];if(v===undefined||v===null||v==='')return undefined;const row=RB[r];return row&&row.kind==='date'?Master.toSerial(v):(row&&row.kind==='ib'&&model.keyNumeric&&!isNaN(+v)?+v:v)})}
// antes de empezar un trabajo nuevo: formato limpio o con las opciones que ya trae el formato original
function mAsk(p,ib){
 sheet('<b>'+MP[p]+' · IB '+esc(ib)+'</b><div class="m">¿Qué formato quieres cargar?</div><button class="p" data-x="mfill" data-f="full" data-p="'+p+'" data-ib="'+esc(ib)+'">Formato con opciones llenas</button><div class="m" style="margin:2px 0 10px">Trae los campos que ya vienen llenos en el formato original (N/A, versiones, etc.). Puedes modificarlos.</div><button data-x="mfill" data-f="clean" data-p="'+p+'" data-ib="'+esc(ib)+'">Formato limpio</button><div class="m" style="margin:2px 0 10px">Todo vacío; esos campos quedan vacíos también en el Excel.</div><button data-x="ovx">Cancelar</button>')}
async function startMaster(p,ib,fill){
 await mEnsure(p);const ver=MI[p].cur,data=await mLoad(p,ver),{model,seed}=data,j=freshJob(ib,p);
 j.prog=p;j.ver=ver;j.m={a:{},o:{},g:'',fill:fill||'clean'};if(j.m.fill==='full')model.rows.forEach(r=>{if(r.def!==undefined)j.m.a['r'+r.r]=r.def});job=j;MCUR={p,ver,model,seed};mApFill(j);const row=seed.rows.find(r=>String(r[0])===String(ib));if(row&&model.nameCol>=0)j.f.sede=row[model.nameCol];
 j.m.a['r'+model.ibRow]=String(ib);if(model.dateRow)j.m.a['r'+model.dateRow]=today();job=j;PH={w:{},p:{},c:{},r:{},o:{},x:{}};MCUR={p,ver,model,seed};
 const ck=mCertKey();if(ck&&window.CERT_TELU){const o=Object.assign({},window.CERT_TELU);PH.x[ck]=o;await idbPut('ph',photoKey('x',ck),o)}
 try{const E=mEvaluator(),al=model.rows.find(r=>r.kind==='list'&&/aliado que ejecuta/i.test(r.label)),az=model.rows.find(r=>r.kind==='calc'&&/aliado zonificado/i.test(r.label));
  if(al&&az){const v=String(E.eval(az.f));if(al.opts.includes(v))j.m.a['r'+al.r]=v}}catch(e){}
 sv();gpsOn();screen();autoCoord();mRecalc()}
async function openMaster(ib,id,p){
 let j=id?LS.g(workKey(ib,id)):null;
 if(!j){for(const w of ((JI[ib]&&JI[ib].works)||[]).filter(w=>w.mode===p).sort((a,b)=>(b.ts||0)-(a.ts||0))){j=LS.g(workKey(ib,w.id));if(j)break}}
 if(!j)return mAsk(p,ib);
 await mEnsure(p);j.prog=p;j.mode=p;j.m=Object.assign({a:{},o:{},g:''},j.m);j.xl=j.xl||[];let ver=j.ver||MI[p].cur,data;
 try{data=await mLoad(p,ver)}catch(e){ver=MI[p].cur;data=await mLoad(p,ver);alert('La versión del formato con la que empezó este trabajo ya no está. Se usará la versión instalada.')}
 j.ver=ver;job=j;PH={w:{},p:{},c:{},r:{},o:{},x:{}};MCUR={p,ver,model:data.model,seed:data.seed};
 (await idbRange('ph',photoPrefix(j))).forEach(([k,v])=>{const s=k.split('|'),off=j.id?2:1;if(PH[s[off]])PH[s[off]][s[off+1]]=v});
 sv();gpsOn();screen();autoCoord();mRecalc()}
// ---- grupos: lista de chequeo / seriales / fotos (los nombres salen de names-amrtx.js; lo nuevo toma el nombre del capítulo)
const mNm=s=>String(s||'').replace(/\s+/g,' ').trim();
const mIsSer=r=>r.kind==='text'&&/(^(validar y confirmar serial|serial\b))|seriales/i.test(r.label||'');
function mElem(t){t=mNm(t).replace(/^\d+(\.\d+)*\s*/,'').replace(/^(Mantenimiento|Validaci[oó]n) (de la|del|de los|de las|de)\s+/i,'').replace(/\s*\(.*$/,'').replace(/[.\s]+$/,'');return t.charAt(0).toUpperCase()+t.slice(1)}
function mPlan(){
 if(MCUR._pl)return MCUR._pl;
 const rows=MCUR.model.rows,inf=mInfo(),N=(window.AMRTX_NAMES||{})[job.mode]||{},used={},mv=new Set(),ser=new Set(),pho=[],sers=[];let chap=null;
 const look=(tipo,r)=>{const k=tipo+'|'+r.cap+'|'+mNm(r.label).toLowerCase().slice(0,40),a=N[k];if(!a)return null;const i=used[k]||0;used[k]=i+1;return a[Math.min(i,a.length-1)]};
 rows.forEach(r=>{
  if(r.kind==='hdr'){if(/^\d/.test(r.cap||''))chap=r;return}
  const ct=chap?chap.cap+' '+chap.label:'',el=mElem(chap?chap.label:'');
  if(mIsSer(r)){ser.add(r.r);sers.push({r,key:'r'+r.r,chap:ct,name:look('Serial',r)||('Serial de '+el)});return}
  if(r.kind==='calc'||inf.tech[r.r]==='sig'||r.r===inf.vobo)return; // firmas: se quedan en la lista de chequeo
  const add=key=>{mv.add(key);pho.push({r,key,chap:ct,name:look('Foto',r)||(/^firma/i.test(r.label)?'Firma de quien repara':/coordenadas geogr[aá]ficas tomadas en sitio/i.test(r.label)?'Coordenadas en sitio':'Foto de '+el+(r.cap?' ('+r.cap+')':''))})};
  if(mNoPh(r))return;if(r.kk==='photo')add('r'+r.r);else if(r.kind==='jimg')add('j'+r.r)});
 return MCUR._pl={mv,ser,pho,sers}}
const mPhOk=k=>{const p=PH.x[k];return !!(p&&(p.d||p.na))};
const mFi=k=>'<button class="mfi'+(mPhOk(k)?' ok':'')+'" data-x="mgoto" data-k="'+k+'">'+(mPhOk(k)?'Foto lista':'Foto pendiente')+'</button>';
let MG='chk',MGJ='';
// descripción del equipo para cada código (SAP) de un desplegable: sale de las filas calculadas que le siguen (hoja de listas del propio formato)
function mOptDesc(r){
 const C=MCUR._od=MCUR._od||{};if(r.r in C)return C[r.r];
 const rows=MCUR.model.rows,i=rows.indexOf(r),calcs=[];let out=null;
 for(let j=i+1;j<rows.length&&rows[j].kind==='calc';j++)if((rows[j].f||'').includes('$J$'+r.r))calcs.push(rows[j]);
 if(calcs.length){out={};r.opts.forEach(code=>{if(code===r.ph)return;
  const E=Master.evaluator(MCUR.model,MCUR.seed,rr=>rr===r.r?(isNaN(+code)?code:+code):undefined),parts=[];
  calcs.forEach(c=>{try{const v=E.eval(c.f);const t=String(v).replace(/\s+/g,' ').trim();if(v!==''&&v!=null&&t&&!parts.includes(t))parts.push(t)}catch(e){}});
  if(parts.length)out[code]=parts.join(' · ')})}
 return C[r.r]=out}
// ---- formulario armado desde el propio archivo
function mrow(r){
 const k='r'+r.r,a=job.m.a[k],inf=mInfo(),sg=PROF.firma||firmaF,mode=inf.cap.has(r.cap)?'capture':'photo';
 if(mHideRow(r)||(mNoPh(r)&&r.kind==='jimg'))return '';
 if(r.kind==='hdr')return '<div class="mh">'+esc(r.label)+'</div>';
 const PL=mPlan();if(PL.ser.has(r.r)||(r.kind==='jimg'&&PL.mv.has('j'+r.r)))return '';
 const head='<b>'+(r.cap?esc(r.cap)+' · ':'')+esc(r.label)+'</b>'+(r.hint?'<div class="m">'+esc(r.hint)+'</div>':'');
 const sigRow=note=>'<div class="mq-row">'+head+'<img src="'+sg.d+'" style="height:60px;background:#fff;border-radius:6px;margin-top:6px"><div class="m">'+note+'</div></div>';
 const tk=inf.tech[r.r];
 if(tk==='sig'&&sg)return sigRow('Se usa la firma cargada en Opciones.');
 if(r.r===inf.vobo){const sp=sg||mTechSigPh();if(sp)return '<div class="mq-row">'+head+'<img src="'+sp.d+'" style="height:60px;background:#fff;border-radius:6px;margin-top:6px"><div class="m">'+(sg?'Se usa la firma cargada en Opciones.':'Se usa la firma que cargaste en Datos de quien repara.')+'</div></div>'}
 if(tk&&tk!=='sig'&&tec[tk])return '<div class="mq-row">'+head+'<div class="mc">'+esc(tec[tk])+'</div><div class="m">Tomado de tus datos de técnico en Opciones.</div></div>';
 let inp='';
 if(r.kind==='calc')inp='<div class="mc" data-calc="'+r.r+'">'+(r.imgCalc?'Se completa sola con la firma del técnico al abrir en Excel.':'')+'</div>';
 else if(r.kind==='ib')inp='<input disabled value="'+esc(job.ib)+'">';
 else if(r.kind==='jimg')inp='<div class="mph" data-k="j'+r.r+'" data-mode="'+mode+'"></div>';
 else if(r.kind==='list'){const o=r.opts.filter(x=>x!==r.ph),dm=mOptDesc(r);inp='<select data-b="m/a/'+k+'"><option value="">Sin responder</option>'+o.map(x=>'<option value="'+esc(x)+'"'+(a===x?' selected':'')+'>'+esc(dm&&dm[x]?x+' · '+dm[x]:x)+'</option>').join('')+'</select>'}
 else if(r.kind==='date')inp='<input type="date" data-b="m/a/'+k+'" value="'+esc(a||'')+'">';
 else if(r.kind==='im')inp='<input data-b="m/a/'+k+'" placeholder="'+esc(r.prompt||'IM1234567')+'" maxlength="'+(r.len||20)+'" value="'+esc(a||'')+'">';
 else if(inf.scan&&/^(validar y confirmar serial|serial\b)/i.test(r.label))inp='<div class="sc"><input data-b="m/a/'+k+'" placeholder="Escribe o escanea el serial" value="'+esc(a||'')+'"><button data-x="scan" data-b="m/a/'+k+'">▣ Escanear</button></div>';
 else inp=(r.hint||'').length>90?'<textarea rows="2" data-b="m/a/'+k+'">'+esc(a||'')+'</textarea>':'<input data-b="m/a/'+k+'" value="'+esc(a||'')+'">';
 const coord=/coordenadas geogr[aá]ficas tomadas en sitio/i.test(r.label)&&/longitud/i.test(r.label)?'<div class="r" style="margin-top:4px"><button data-x="mgps" data-r="'+r.r+'">Usar GPS ahora (latitud y longitud)</button></div>':'';
 let ext='';if(r.kk==='photo'&&!mNoPh(r))ext=PL.mv.has('r'+r.r)?mFi('r'+r.r):'<div class="mph" data-k="r'+r.r+'" data-mode="'+mode+'"></div>';else if(r.kk==='obs')ext='<textarea rows="2" placeholder="Observación (opcional)" data-b="m/o/'+k+'">'+esc(job.m.o[k]||'')+'</textarea>';
 return '<div class="mq-row">'+head+inp+coord+ext+'</div>'}
function mSerRow(x){
 const r=x.r,k='r'+r.r,a=job.m.a[k],inf=mInfo();
 const inp=inf.scan?'<div class="sc"><input data-b="m/a/'+k+'" placeholder="Escribe o escanea el serial" value="'+esc(a||'')+'"><button data-x="scan" data-b="m/a/'+k+'">▣ Escanear</button></div>':'<input data-b="m/a/'+k+'" placeholder="Serial" value="'+esc(a||'')+'">';
 return '<div class="mq-row"><b>'+esc(x.name)+'</b> <span class="mnum">'+esc(r.cap||'')+'</span>'+inp+'</div>'}
function mPhRow(x){
 const inf=mInfo(),mode=inf.cap.has(x.r.cap)?'capture':'photo';
 return '<div class="mq-row" data-ph="'+x.key+'"><b>'+esc(x.name)+'</b> <span class="mnum">'+esc(x.r.cap||'')+'</span><div class="m">'+esc(x.r.label)+'</div><div class="mph" data-k="'+x.key+'" data-mode="'+mode+'"></div></div>'}
function mByChap(L,fn){let last=null,h='';L.forEach(x=>{if(x.chap!==last){last=x.chap;h+='<div class="mh">'+esc(x.chap||'General')+'</div>'}h+=fn(x)});return h}
function mBody(){
 const{model}=MCUR,PL=mPlan(),jid=job.ib+'|'+(job.id||'');if(MGJ!==jid){MGJ=jid;MG='chk'}
 let html='<div class="s"><h2>'+MP[job.mode]+'</h2><div class="m">Formato '+esc(model.label)+(job.ver&&MI[job.mode]&&job.ver!==MI[job.mode].cur?' (la versión instalada es más nueva; este trabajo sigue con la suya)':'')+'</div><div class="m" id="gl"></div><div class="r" style="margin-top:6px"><button data-x="gps">Usar GPS ahora</button></div><div class="m" id="mprog" style="margin-top:6px"></div>'+mApNote()+'</div>';
 html+='<div class="mtabs">'+[['chk','Lista de chequeo'],['ser','Seriales'],['pho','Fotos']].map(g=>'<button data-x="mgrp" data-g="'+g[0]+'" class="'+(MG===g[0]?'on':'')+'">'+g[1]+'<span data-gp="'+g[0]+'"></span></button>').join('')+'</div>';
 const cats=[],cst={cap:''};let last='General';model.rows.forEach(r=>{if(r.cat)last=r.cat;const cn=mCat(r,last,cst);let c=cats[cats.length-1];if(!c||c.n!==cn){c={n:cn,rows:[]};cats.push(c)}c.rows.push(r)});
 html+='<div class="mg'+(MG==='chk'?' on':'')+'" data-g="chk">'+cats.map((c,i)=>{
  const it=c.rows.map(r=>({r,h:mrow(r)}));
  const keep=it.filter((x,j)=>{if(x.r.kind!=='hdr')return x.h!=='';for(let q=j+1;q<it.length&&it[q].r.kind!=='hdr';q++)if(it[q].h!=='')return true;return false});
  if(!keep.length)return '';
  return '<details class="s m-cat" data-sec="'+esc(job.mode+'|'+c.n)+'"'+(i===0?' open':'')+'><summary>'+esc(c.n)+' <span class="m" data-prog="'+i+'"></span></summary>'+keep.map(x=>x.h).join('')+'</details>'}).join('');
 if(model.obsGeneral)html+='<div class="s"><h2>Observación general</h2>'+TA('m/g','',4)+'</div>';
 html+='</div>';
 html+='<div class="mg'+(MG==='ser'?' on':'')+'" data-g="ser"><div class="s"><h2>Seriales</h2>'+(PL.sers.length?mByChap(PL.sers,mSerRow):'<div class="m">Este formato no tiene seriales.</div>')+'</div></div>';
 html+='<div class="mg'+(MG==='pho'?' on':'')+'" data-g="pho"><div class="s"><h2>Fotos</h2>'+(PL.pho.length?mByChap(PL.pho,mPhRow):'<div class="m">Este formato no tiene fotos.</div>')+'</div></div>';
 return html}
const mBar=()=>'<button class="p" data-x="exp" data-w="'+job.mode+'">Generar el Excel original (.xlsm)</button><div id="msg" class="m" style="margin:10px 0"></div>';
function xcard(k,mode){
 const p=PH.x[k],na=p&&p.na,at='data-ns="x" data-k="'+k+'"';
 return '<div class="ph">'+(p&&p.d?'<img src="'+p.d+'">':'<div class="e">'+(na?'N/A':'Sin imagen')+'</div>')+'<div class="r">'+
  (mode==='capture'?'<button data-x="cap" '+at+'>'+(p&&p.d?'Cambiar captura':'Cargar captura')+'</button>':'<button data-x="tk" '+at+'>'+(p&&p.d?'Cambiar: tomar foto':'Tomar foto')+'</button><button data-x="cap" '+at+'>Subir foto</button>')+
  '<button data-x="library" '+at+'>Galería</button><button data-x="na" '+at+'>N/A</button>'+(p?'<button data-x="rm" '+at+'>Quitar</button>':'')+(k===mCertKey()&&window.CERT_TELU?'<button data-x="mcert">Restaurar certificado</button>':'')+'</div>'+
  '<div class="m">'+(mode==='capture'?'Carga la captura de pantalla; no lleva marca de agua.':'La foto que tomas lleva marca de agua; la que subes no.')+'</div></div>'}
function drawX(){document.querySelectorAll('.mph').forEach(el=>{el.innerHTML=xcard(el.dataset.k,el.dataset.mode)});mRecalc()}
function mRecalc(){
 if(!job||!MP[job.mode]||!MCUR)return;const E=mEvaluator(),{model}=MCUR,inf=mInfo(),sg=PROF.firma||firmaF;
 document.querySelectorAll('.mc[data-calc]').forEach(el=>{const r=model.rows.find(x=>x.r===+el.dataset.calc);if(r.imgCalc)return;let v='';try{v=E.eval(r.f)}catch(e){v=null}el.textContent=v===null?'Se calcula al abrir en Excel':String(v)});
 const PL=mPlan(),G={chk:{t:0,o:0},ser:{t:0,o:0},pho:{t:0,o:0}};let tot=0,ok=0;const cats={},cst={cap:''},sgv=sg||mTechSigPh();let last='General',idx=-1,lastName=null;
 model.rows.forEach(r=>{if(r.cat)last=r.cat;const cn=mCat(r,last,cst);if(cn!==lastName){idx++;lastName=cn;cats[idx]={t:0,o:0}}const c=cats[idx],tk=inf.tech[r.r];if(mHideRow(r))return;
  if(['list','text','im','date'].includes(r.kind)){const g=PL.ser.has(r.r)?G.ser:G.chk,v=job.m.a['r'+r.r],has=(v!==undefined&&v!=='')||(tk&&tk!=='sig'&&tec[tk]);g.t++;tot++;if(has){g.o++;ok++}if(g===G.chk){c.t++;if(has)c.o++}}
  const slots=[];if(!mNoPh(r)){if(r.kk==='photo')slots.push('r'+r.r);if(r.kind==='jimg')slots.push('j'+r.r)}
  slots.forEach(key=>{const moved=PL.mv.has(key),g=moved?G.pho:G.chk,auto=(sg&&r.kind==='jimg'&&tk==='sig')||(r.r===inf.vobo&&sgv),done=auto||mPhOk(key);g.t++;tot++;if(done){g.o++;ok++}if(!moved){c.t++;if(done)c.o++}})});
 Object.keys(cats).forEach(i=>{const e=document.querySelector('[data-prog="'+i+'"]');if(e)e.textContent='('+cats[i].o+' de '+cats[i].t+')'});
 ['chk','ser','pho'].forEach(k=>{const e=document.querySelector('[data-gp="'+k+'"]');if(e)e.textContent=G[k].o+' de '+G[k].t});
 document.querySelectorAll('.mfi[data-k]').forEach(b=>{const o=mPhOk(b.dataset.k);b.classList.toggle('ok',o);b.textContent=o?'Foto lista':'Foto pendiente'});
 const pr=$('#mprog');if(pr)pr.textContent='Avance: '+ok+' de '+tot+' (chequeo '+G.chk.o+'/'+G.chk.t+' · seriales '+G.ser.o+'/'+G.ser.t+' · fotos '+G.pho.o+'/'+G.pho.t+').'}
// ---- exportar el .xlsm original
async function exportMaster(){
 const m=$('#msg'),{model,seed}=MCUR,a=job.m.a,im=a['r'+model.imRow]||'',imRow=model.rows.find(r=>r.r===model.imRow);
 if(!im){alert('Falta el número de caso IM.');return}
 if(imRow.len&&im.length!==imRow.len&&!confirm('El número de caso debería tener '+imRow.len+' caracteres (por ejemplo IM1234567). ¿Continuar?'))return;
 if(!a['r'+model.dateRow]){alert('Falta la fecha.');return}
 const al=model.rows.find(r=>r.kind==='list'&&/aliado que ejecuta/i.test(r.label));
 if(al&&!a['r'+al.r]&&!confirm('Falta el aliado que ejecuta (se usa en el nombre del archivo). ¿Continuar?'))return;
 m.textContent='Preparando el Excel...';
 try{const inf=mInfo(),sg=signature(),ph={},slots=[];
  Object.keys(inf.tech).forEach(rr=>{const key=inf.tech[rr];if(key!=='sig'&&tec[key])job.m.a['r'+rr]=String(tec[key])});
  model.rows.forEach(r=>{if(mNoPh(r))return;if(r.kk==='photo')slots.push(['r'+r.r,r]);if(r.kind==='jimg')slots.push(['j'+r.r,r])});
  const total=slots.filter(([key])=>PH.x[key]&&PH.x[key].d).length;let n=0;
  for(const[key,r]of slots){const auto=sg&&((r.kind==='jimg'&&inf.tech[r.r]==='sig')||r.r===inf.vobo);
   if(auto){ph[key]=sg;continue}
   if(r.r===inf.vobo){const sp=mTechSigPh();if(sp){ph[key]=await excelPhoto(sp)}continue}
   const p=PH.x[key];if(p&&p.d){n++;m.textContent='Optimizando imagen '+n+' de '+total+' para el Excel...';ph[key]=await excelPhoto(p);await new Promise(requestAnimationFrame)}else if(p&&p.na)ph[key]={na:1}}
  const bin=await mBin(job.prog,job.ver);if(!bin)throw new Error('No se encontró el formato de esta versión. Súbelo con "Actualizar formato".');
  m.textContent='Llenando el formato original...';
  const u=await XL.fill(bin,Master.buildSpec(model,job.m,ph,naImg())),fn=(Master.fileName(model,seed,a)||('AMRTX IDBen_'+job.ib))+'.xlsm',id=Date.now()+'-'+job.mode;
  await idbPut('xl',id,u);JI[job.ib].xl=(JI[job.ib].xl||[]).concat([{id,t:job.mode,fn,ts:Date.now(),size:u.size||u.length}]);LS.s('mtic_jobs',JI);
  await guardar([{u8:u,fn,mime:'application/vnd.ms-excel.sheet.macroEnabled.12'}]);m.textContent='Listo: '+fn+'. Queda una copia en el Registro. Ábrelo en Excel con macros para exportar.'}
 catch(e){m.textContent=(e&&(e.code==='declined'||/cancel/i.test(e.message||'')))?'Cancelado (la copia sí quedó en el Registro).':'No se pudo generar: '+((e&&e.message)||e)}}
// ---- actualizar el formato subiendo una versión nueva
async function mUpdate(p,file){
 const info=$('#mver-'+p);const say=t=>{if(info)info.textContent=t};say('Leyendo el formato nuevo...');
 try{const bytes=new Uint8Array(await file.arrayBuffer()),parsed=await Master.parse(bytes),probs=Master.compat(parsed.model);
  if(!parsed.model.hasVba)probs.push('El archivo no tiene macros: debe ser el .xlsm original.');
  await mEnsure(p);const cur=await mLoad(p,MI[p].cur),h=hashBytes(bytes);
  if(MI[p].list.some(v=>v.hash===h)){say('Ese archivo ya es una versión instalada: '+await mLabel(p));return}
  if(probs.length){say('Formato instalado: '+await mLabel(p));sheet('<b>No se puede instalar este archivo</b><div class="m">'+probs.map(esc).join('<br>')+'</div><div class="m">La estructura cambió más de lo que la app puede leer sola. Pásame el archivo y adapto la app.</div><button data-x="ovx">Cerrar</button>');return}
  const d=Master.diff(cur.model,parsed.model,cur.seed.rows.length,parsed.seed.rows.length),lst=(a,n)=>a.slice(0,n).map(r=>'· '+esc((r.cap?r.cap+' ':'')+r.label.slice(0,60))).join('<br>');
  MPEND[p]={parsed,bytes,hash:h,file:file.name};say('Formato instalado: '+await mLabel(p));
  sheet('<b>Nueva versión de '+MP[p]+'</b><div class="m">Instalada: '+esc(d.versionOld)+'<br>Nueva: '+esc(d.versionNew)+'</div><div class="m">Preguntas nuevas: '+d.added.length+' · eliminadas: '+d.removed.length+' · modificadas: '+d.changed.length+'<br>Semilla: '+d.seedOld+' → '+d.seedNew+' sitios'+(d.sheetsAdded.length||d.sheetsRemoved.length?'<br>Hojas nuevas: '+(d.sheetsAdded.join(', ')||'ninguna')+' · quitadas: '+(d.sheetsRemoved.join(', ')||'ninguna'):'')+(d.ibSame?'':'<br><b>Aviso:</b> cambió la posición de las filas del IB, el caso o la fecha.')+'</div>'+(d.added.length?'<div class="m"><b>Nuevas</b><br>'+lst(d.added,6)+'</div>':'')+(d.removed.length?'<div class="m"><b>Eliminadas</b><br>'+lst(d.removed,6)+'</div>':'')+'<div class="m">Los trabajos ya empezados siguen con la versión con la que empezaron. Los nuevos usan esta.</div><button class="p" data-x="mupok" data-p="'+p+'">Instalar esta versión</button><button data-x="ovx">Cancelar</button>')}
 catch(e){say('No se pudo leer el archivo: '+((e&&e.message)||e))}}
async function mInstall(p){
 const pe=MPEND[p];if(!pe)return;const id='v'+Date.now();
 await mPut(p+'|'+id+'|bin',pe.bytes);await mPut(p+'|'+id+'|data',{model:pe.parsed.model,seed:pe.parsed.seed});MC.set(p+'|'+id,{model:pe.parsed.model,seed:pe.parsed.seed});
 MI[p].list.push({id,label:pe.parsed.model.label,ts:Date.now(),hash:pe.hash,file:pe.file});MI[p].cur=id;LS.s('mtic_masters',MI);delete MPEND[p];seedSync();
 const e=$('#mver-'+p);if(e)e.textContent='Formato instalado: '+await mLabel(p)}
// ---- enganches (solo actúan en trabajos AMRTX)
{const _body=body,_bar=bar,_drawP=drawP,_exportar=exportar,_openJob=openJob;
 body=function(){return job&&MP[job.mode]?mBody():_body()};
 bar=function(){return job&&MP[job.mode]?mBar():_bar()};
 drawP=function(){if(job&&MP[job.mode])drawX();else _drawP()};
 exportar=function(w){return MP[w]?exportMaster():_exportar(w)};
 openJob=async function(ib,mode,id){if(MP[mode])return openMaster(ib,id,mode);return _openJob(ib,mode,id)}}
{const _scan=scan;scan=function(cb){return _scan(t=>{cb(t);mRecalc()})}}
function mShow(g){
 SCRY[scrKey()]=scrollY;MG=g;
 document.querySelectorAll('.mg').forEach(e=>e.classList.toggle('on',e.dataset.g===g));document.querySelectorAll('.mtabs button').forEach(e=>e.classList.toggle('on',e.dataset.g===g));
 SCRLOCK=Date.now()+600;const y=SCRY[scrKey()],t=document.querySelector('.mtabs');
 if(y!=null)scrollTo(0,y);else if(t)t.scrollIntoView()}
document.addEventListener('input',e=>{const t=e.target;
 if(t.id&&/^ibin-x[12]$/.test(t.id)){msuggest(t.id.slice(5),t.value);return}
 if(t.dataset&&t.dataset.b&&/^m\//.test(t.dataset.b))mRecalc()});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.dataset&&t.dataset.b&&/^m\//.test(t.dataset.b))mRecalc();
 if(t.id==='mfa-auto'&&t.files&&t.files[0]){const f=t.files[0];t.value='';await apUpload(f)}
 if(t.id&&/^mf-x[12]$/.test(t.id)&&t.files&&t.files[0]){const f=t.files[0];t.value='';await mUpdate(t.id.slice(3),f)}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const d=b.dataset;
 if(d.x==='mgo'){const v=($('#ibin-'+d.p).value||'').trim();if(!v)return alert('Escribe el IB.');mGate(d.p,v)}
 else if(d.x==='msug'){$('#ibin-'+d.p).value=d.id;$('#sug-'+d.p).innerHTML=''}
 else if(d.x==='mupd'){$('#mf-'+d.p).click()}
 else if(d.x==='mapu'){$('#mfa-auto').click()}
 else if(d.x==='mupok'){const o=$('#ov');if(o)o.remove();await mInstall(d.p)}
 else if(d.x==='mmode'){const o=$('#ov');if(o)o.remove();if(d.m==='new')mAsk(d.p,d.ib);else await openMaster(d.ib,null,d.p)}
 else if(d.x==='mgrp'){mShow(d.g)}
 else if(d.x==='mgoto'){mShow('pho');const el=document.querySelector('[data-ph="'+d.k+'"]');if(el){el.scrollIntoView({block:'center'});el.classList.add('mflash');setTimeout(()=>el.classList.remove('mflash'),1600)}}
 else if(d.x==='mfill'){const o=$('#ov');if(o)o.remove();await startMaster(d.p,d.ib,d.f)}
 else if(d.x==='mgps'){if(!fixv){try{fixv=await getPos()}catch(er){}}if(!fixv)return alert('Aún no hay señal GPS. Activa la ubicación del teléfono y espera unos segundos.');const R=MCUR.model.rows,lo=R.find(r=>r.r===+d.r),la=R.find(r=>/coordenadas geogr[aá]ficas tomadas en sitio/i.test(r.label)&&/latitud/i.test(r.label));[[lo,fixv.c[1]],[la,fixv.c[0]]].forEach(([row,v])=>{if(!row)return;job.m.a['r'+row.r]=v.toFixed(6);const n=document.querySelector('[data-b="m/a/r'+row.r+'"]');if(n)n.value=job.m.a['r'+row.r]});job.f.coordAuto=true;autoCoord(true);sv();mRecalc()}});
// ===== lista desplegable de IB junto a cada campo de IB de la pantalla principal (7K, ODH, AMRTX-ODH, AMRTX-7K)
document.head.insertAdjacentHTML('beforeend','<style>.ibrow{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.ibrow input{margin:0}.ibrow button{padding:10px 14px}#ibl{max-height:50vh;overflow:auto;display:grid;gap:4px}#ibl button{text-align:left;padding:10px;font-size:14px}</style>');
let IBL=[],IBT='';
async function ibList(id){
 if(id==='ibin')return Object.keys(SEED).map(k=>[k,(SEED[k][3]||'')+' · '+(SEED[k][0]||'')]);
 if(id==='ibin-odh')return Object.keys(SEED_ODH).map(k=>{const r=SEED_ODH[k];return[k,(r[6]||'')+' · '+(r[4]||'')]});
 const p=id.slice(5);await mEnsure(p);const{model,seed}=await mLoad(p,MI[p].cur),nc=model.nameCol;
 const mc=seed.header.findIndex(h=>/^nombre_municipio$/i.test(h));
 return mCordRows(seed).map(r=>[String(r[0]),[nc>=0?r[nc]:'',mc>=0?r[mc]:''].filter(Boolean).join(' · ')])}
function ibRender(q){
 const box=$('#ibl');if(!box)return;q=(q||'').trim().toLowerCase();
 const out=[];for(const x of IBL){if(!q||x[0].startsWith(q)||x[1].toLowerCase().includes(q)){out.push(x);if(out.length>=80)break}}
 box.innerHTML=out.length?out.map(x=>'<button data-x="ibpick" data-v="'+esc(x[0])+'">'+esc(x[0])+(x[1]?' · '+esc(x[1]):'')+'</button>').join(''):'<div class="m">Sin coincidencias.</div>'}
async function ibOpen(id){
 IBT=id;IBL=(await ibList(id)).sort((a,b)=>(+a[0]-+b[0])||a[0].localeCompare(b[0]));
 sheet('<b>Seleccionar IB</b><input id="ibq" autocomplete="off" placeholder="Filtra por IB o nombre ('+IBL.length+' sitios)"><div id="ibl"></div><button data-x="ovx">Cerrar</button>');ibRender('')}
function ibButtons(){
 ['ibin','ibin-odh','ibin-x1','ibin-x2'].forEach(id=>{const i=document.getElementById(id);if(!i||i.parentNode.classList.contains('ibrow'))return;
  const w=document.createElement('div');w.className='ibrow';i.parentNode.insertBefore(w,i);w.appendChild(i);
  const b=document.createElement('button');b.type='button';b.textContent='▾ Lista';b.dataset.x='iblist';b.dataset.t=id;b.setAttribute('aria-label','Lista de IB');w.appendChild(b)})}
{const _h=home;home=function(){_h();ibButtons()}}
document.addEventListener('input',e=>{if(e.target.id==='ibq')ibRender(e.target.value)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;
 if(b.dataset.x==='iblist'){e.preventDefault();ibOpen(b.dataset.t)}
 else if(b.dataset.x==='ibpick'){const i=document.getElementById(IBT),o=$('#ov');if(o)o.remove();if(i){i.value=b.dataset.v;i.dispatchEvent(new Event('input',{bubbles:true}))}}});

// ===== recordar dónde se iba: posición de la pantalla y secciones abiertas al volver de Fotos guardadas, Opciones, etc. (todos los formatos; en AMRTX, por pestaña)
var SCRY={},SCRLOCK=0;
const scrKey=()=>job?(job.ib+'|'+(job.id||'')+'|'+job.mode+(MP[job.mode]?'|'+MG:'')):'';
addEventListener('scroll',()=>{if(Date.now()<SCRLOCK||currentScreen!=='job'||!job)return;SCRY[scrKey()]=scrollY},{passive:true});
{const _sc=screen;screen=function(){
  const from=currentScreen,back=from!=='home'&&!!job,y=back?SCRY[scrKey()]:null;
  if(back)SCRLOCK=Date.now()+800;
  const r=_sc.apply(this,arguments);
  if(back){document.querySelectorAll('details[data-sec]').forEach(d=>{if(openS[d.dataset.sec]!==undefined&&d.open!==openS[d.dataset.sec])d.open=openS[d.dataset.sec]});
   if(y)requestAnimationFrame(()=>scrollTo(0,y))}
  if(job&&MP[job.mode]){const n=document.querySelector('.page-nav');if(n&&!n.querySelector('[data-x=mtpl]')){n.classList.add('nv4');n.firstElementChild.insertAdjacentHTML('afterend','<button data-x="mcr">Crear MTTO Correctivo</button><button data-x="mtpl">Plantilla</button>')}if(n){const h=()=>document.documentElement.style.setProperty('--navh',n.offsetHeight+'px');h();setTimeout(h,300)}}
  return r}}

// ===== lista de sitios de 7K y ODH: sale de la semilla de los formatos AMRTX (solo Córdoba). Si se instala una versión nueva del AMRTX, se actualiza sola.
const SEED_DEP=/^c[oó]rdoba$/i;
function seedBuild(p,seed){
 const h=(seed.header||[]).map(x=>String(x)),ix=re=>h.findIndex(x=>re.test(x)),dep=ix(/^nombre_departamento$/);if(dep<0)return null;
 const rows=seed.rows.filter(r=>SEED_DEP.test(String(r[dep]||'').trim())),t=v=>v==null?'':String(v),out={};
 if(p==='x2'){const c=[ix(/^nombre_municipio$/),dep,ix(/^nombre_centro_pob$/),ix(/^nombreSede$/),ix(/^ID Mintic$/i)];if(c.some(i=>i<0))return null;
  rows.forEach(r=>{out[t(r[0])]=c.map(i=>t(r[i]))})}
 else{const c=[ix(/^ID CLARO$/),ix(/^Resoluci/i),ix(/^nombre_centro_pob$/),ix(/^codDaneInstitucionEdu$/),ix(/^nombreInstitucionEd$/),ix(/^codDanesede$/),ix(/^nombreSede$/)];if(c.some(i=>i<0))return null;
  rows.forEach(r=>{out[t(r[0])]=c.map(i=>t(r[i]))})}
 return Object.keys(out).length?out:null}
async function seedSync(){
 for(const p of ['x1','x2']){try{await mEnsure(p);const d=await mLoad(p,MI[p].cur),o=seedBuild(p,d.seed);if(!o)continue;
   const T=p==='x2'?SEED:SEED_ODH;Object.keys(T).forEach(k=>delete T[k]);Object.assign(T,o)}catch(e){}}
 const a=document.getElementById('ids');if(a)a.innerHTML=Object.keys(SEED).map(k=>'<option value="'+esc(k)+'">'+esc(SEED[k][3])+'</option>').join('');
 const b=document.getElementById('ids-odh');if(b)b.innerHTML=Object.keys(SEED_ODH).map(k=>'<option value="'+esc(k)+'">'+esc(SEED_ODH[k][6])+'</option>').join('')}
seedSync();

// ===== plantilla del mensaje para el NOC (AMRTX-ODH y AMRTX-7K): sale con el texto tal cual se usa, se puede editar y se envía por WhatsApp o se copia
function mTplData(){
 const{model,seed}=MCUR,A=job.m.a,clean=v=>{v=v==null?'':String(v).replace(/\s+/g,' ').trim();return /^(n\/?a|no aplica|na)$/i.test(v)?'':v};
 const ans=(re,from)=>{const r=model.rows.filter(x=>['text','list','im'].includes(x.kind)&&re.test(x.label))[from||0];return r?clean(A['r'+r.r]):''};
 const calc=re=>{const r=model.rows.find(x=>x.kind==='calc'&&re.test(x.label));if(!r)return'';try{const v=clean(Master.evaluator(model,seed,rr=>A['r'+rr]).eval(r.f));return /^registre/i.test(v)||/^#/.test(v)?'':v}catch(e){return''}};
 const lat=ans(/tomadas en sitio - Latit/i),lon=ans(/tomadas en sitio - Longi/i),h=seed.header.map(String),sr=seed.rows.find(r=>String(r[0])===String(job.ib)),col=re=>{const i=h.findIndex(x=>re.test(x));return sr&&i>=0?clean(sr[i]):''};
 return{
  tec:clean(tec.tecn)||ans(/^Nombres y apellidos:/i,0),tel:clean(tec.tect)||ans(/^N[uú]mero de tel[eé]fono o celular:/i,0),
  aliado:ans(/^Aliado que ejecuta/i)||calc(/^Aliado zonificado/i),
  sede:calc(/^Nombre sede IE/i)||calc(/^Sede educativa/i)||col(/^nombreSede$/i),inst:col(/^nombreInstitucionEd$/i)||calc(/^Sede educativa/i),mintic:calc(/^ID MINTIC$/i),
  doc:ans(/^Nombre contacto alterno/i),cc:ans(/cedula contacto alterno/i),cel:ans(/^N[uú]mero de contacto alterno/i),mail:ans(/^Correo electr[oó]nico contacto alterno/i),
  coord:lat&&lon?lat+', '+lon:'',im:clean(A['r'+model.imRow]).replace(/^IM\s*/i,'')}}
function mTplText(ot){
 const d=mTplData();
 if(job.mode==='x1')return ['Buen día comparto el formato de solicitud para ','','Validación del NOC ODH 5G ','Técnico: '+d.tec+' ','Teléfono: '+d.tel,'ID MINTI: '+job.ib,'ALIADO: '+d.aliado,'SEDE:  '+d.sede,'DOCENTE: '+d.doc,'C.C: '+d.cc,'Cel. '+d.cel,'Coordenadas: '+d.coord,'Topología: FIBRA ODH 5G','Técnico en sitio'].join('\n');
 return ['Buen día comparto el formato de solicitud para recepción del NOC','Tecnico: '+d.tec,'Telefono: '+d.tel,'ID MINTIC: '+d.mintic,'ID BEN: '+job.ib,'ALIADO: '+d.aliado+' ','Inst. C.E: '+d.inst,'Nombre DOCENTES: '+d.doc,'Telefono Docente: '+d.cel,'Correo electrónico: '+d.mail,'Coordenadas: '+d.coord,'Topología: RADIO','MAC:','-No hay pc.','TECNICO EN SITIO','IM'+d.im,'OT'+String(ot||'').replace(/^OT\s*/i,'')].join('\n')}
let TPLE=false;
function mTplOpen(){
 TPLE=false;const k7=job.mode==='x2';
 sheet('<b>Plantilla para el NOC · IB '+esc(job.ib)+'</b>'+(k7?'<label>N° de OT (se pide antes de generar)<input id="tpl-ot" inputmode="numeric" autocomplete="off" placeholder="Ej. 5389544"></label>':'')+'<textarea id="tpl-tx" rows="15" style="width:100%;font-size:13px;font-family:monospace"></textarea><div class="m">Puedes editar el texto antes de enviarlo.</div><button class="p" data-x="tpl-wa">Enviar por WhatsApp</button><button data-x="tpl-copy">Copiar al portapapeles</button><button data-x="tpl-share">Compartir con otra app…</button><button data-x="ovx">Cerrar</button>');
 $('#tpl-tx').value=mTplText('')}
document.addEventListener('input',e=>{const t=e.target;if(t.id==='tpl-ot'){if(!TPLE||confirm('Vas a reemplazar el texto editado con el nuevo número de OT. ¿Continuar?')){$('#tpl-tx').value=mTplText(t.value);TPLE=false}}else if(t.id==='tpl-tx')TPLE=true});

// ===== Crear MTTO Correctivo desde un AMRTX (7K -> correctivo 7K, ODH -> correctivo ODH) =====
const CRX={
 x2:{mode:'c',ns:'c',key:i=>'p'+i,map:{0:'GPS',1:'4.5.1',2:'4.1.1',3:'4.3.1',6:'4.45.1',8:'4.44.1',9:'4.9.1',10:'4.10.1',11:'4.10.2',12:'4.6.1',13:'4.2.1',14:'4.37.1',15:'4.38.1',16:'4.39.1',17:'4.39.2'}},
 x1:{mode:'o',ns:'o',key:i=>'op'+i,map:{0:'GPS',1:'4.4.1',2:'4.1.1',3:'4.2.1',6:'4.29.1',8:'4.28.1',9:'4.8.1',10:'4.9.1',11:'4.9.2',12:'4.5.1',13:'4.3.1',14:'4.23.1',15:'4.24.1',16:'4.25.2#0',17:'4.25.2#1'}}};
const crNA=v=>/^\s*(n\/?a|no aplica|ninguno|ninguna|-+)?\s*$/i.test(String(v==null?'':v));
function crData(){
 const rows=MCUR.model.rows,A=r=>{const v=job.m.a['r'+r.r];return v==null?'':String(v).trim()},c32=rows.filter(r=>r.cap==='3.2');
 const at=(re,from)=>{const i=c32.findIndex((r,j)=>j>=(from||0)&&re.test(r.label));return i};
 const g=(i,o)=>i<0||!c32[i+o]?'':A(c32[i+o]);
 const ir=at(/^nombre del responsable/i),ia=at(/^nombre contacto alterno/i);
 const lon=c32.find(r=>/tomadas en sitio.*longitud/i.test(r.label)),lat=c32.find(r=>/tomadas en sitio.*latitud/i.test(r.label));
 const imR=rows.find(r=>r.kind==='im'),dtR=rows.find(r=>r.kind==='date');
 const o={im:imR?A(imR):'',fecha:dtR?A(dtR):'',resp:g(ir,0),cedr:g(ir,1),telr:g(ir,2),mailr:g(ir,3),an:g(ia,0),ac:g(ia,1),at1:g(ia,2),am:g(ia,3)};
 const la=lat?A(lat):'',lo=lon?A(lon):'';o.coord=la&&lo?la+', '+lo:'';
 if(crNA(o.an))o.an=o.ac=o.at1=o.am='';else{if(crNA(o.ac))o.ac='';if(crNA(o.at1))o.at1='';if(crNA(o.am))o.am=''}
 return o}
function crPhotos(){
 const C=CRX[job.mode],pl=mPlan(),out=[],ok=k=>PH.x[k]&&PH.x[k].d;
 Object.keys(C.map).forEach(i=>{const m=C.map[i];let ent;
  if(m==='GPS')ent=pl.pho.find(e=>/coordenadas geogr[aá]ficas tomadas en sitio/i.test(e.r.label));
  else{const[n,ix]=m.split('#'),cs=pl.pho.filter(e=>e.r.cap===n);ent=cs[+(ix||0)]}
  if(ent&&ok(ent.key))out.push({slot:C.key(i),from:ent.key,name:ent.name})});
 return out}
function crAsk(){
 if(!job||!MCUR||!CRX[job.mode])return;
 const C=CRX[job.mode],d=crData(),ph=crPhotos(),mp=Object.keys(C.map).length;
 sheet('<b>Crear MTTO Correctivo · IB '+esc(job.ib)+'</b><div class="m">Se creará un correctivo '+(C.mode==='c'?'7K':'ODH')+' NUEVO e independiente (los que ya existan de este IB no se tocan) con:<br>• Datos: IB, fecha, IM, sede, responsable'+(d.an?', quien acompaña (Docente)':'')+(d.coord?', coordenadas':'')+'<br>• Fotos copiadas del AMRTX: <b>'+ph.length+' de '+mp+'</b> (las demás se toman en el correctivo)<br>El AMRTX queda como está.</div><button data-x="mcrgo">Crear correctivo</button><button data-x="ovx">Cancelar</button>')}
async function crGo(){
 const C=CRX[job.mode],d=crData(),ph=crPhotos(),ib=job.ib;
 sv();
 const j=C.mode==='o'?odhNewJob(ib):freshJob(ib,'c'),e=C.mode==='c'?SEED[ib]:null;
 if(e){j.f.mpio=e[0];j.f.depto=e[1];j.f.cpob=e[2];j.f.sede=e[3];j.f.idmin=e[4]}
 if(C.mode==='o'&&!SEED_ODH[ib]&&job.f.sede)j.f.sede=job.f.sede;
 if(C.mode==='c'&&!e&&job.f.sede)j.f.sede=job.f.sede;
 if(d.im)j.f.im=d.im.replace(/\D/g,'');if(d.fecha)j.f.fecha=d.fecha;
 j.f.resp=d.resp;j.f.cedr=d.cedr;j.f.telr=d.telr;j.f.mailr=d.mailr;
 if(d.coord){j.f.coord=d.coord;j.f.coordAuto=false}
 const T=C.mode==='o'?j.o:j.c;
 if(d.an){T.acn=d.an;T.acc='Docente';T.acd=d.ac;T.act1=d.at1;T.act2='No informa';T.acm=d.am}
 const src=PH.x,ns=C.ns;let n=0;
 for(const x of ph){const p=Object.assign({},src[x.from]);if(!(p&&p.d))continue;j.__ph=j.__ph||{};j.__ph[x.slot]=p}
 const phs=j.__ph||{};delete j.__ph;
 job=j;PH={w:{},p:{},c:{},r:{},o:{}};
 for(const k of Object.keys(phs)){PH[ns][k]=phs[k];const sv2=await idbPut('ph',photoPrefix(j)+ns+'|'+k,phs[k]);if(sv2!==null)n++}
 sv();gpsOn();screen();toast('Correctivo creado con '+n+' foto'+(n===1?'':'s')+' del AMRTX');setTimeout(()=>toast(''),3500)}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
 if(x==='mtpl')mTplOpen();
 else if(x==='mcr')crAsk();
 else if(x==='mcert'){const ck=mCertKey();if(ck&&window.CERT_TELU&&confirm('¿Reemplazar la foto actual por el certificado del telurómetro predefinido?')){const o=Object.assign({},window.CERT_TELU);PH.x[ck]=o;await idbPut('ph',photoKey('x',ck),o);sv();drawX();mRecalc()}}
 else if(x==='mcrgo'){$('#ov')&&$('#ov').remove();crGo()}
 else if(x==='tpl-wa'){window.open('https://wa.me/?text='+encodeURIComponent($('#tpl-tx').value),'_blank')}
 else if(x==='tpl-copy'){const t=$('#tpl-tx');try{await navigator.clipboard.writeText(t.value)}catch(er){t.select();document.execCommand('copy')}toast('Copiado');setTimeout(()=>toast(''),1200)}
 else if(x==='tpl-share'){const v=$('#tpl-tx').value,C=window.Capacitor;try{if(C&&C.Plugins&&C.Plugins.Share)await C.Plugins.Share.share({title:'Plantilla NOC',text:v});else if(navigator.share)await navigator.share({text:v});else alert('Este equipo no permite compartir; usa Copiar.')}catch(er){}}});
