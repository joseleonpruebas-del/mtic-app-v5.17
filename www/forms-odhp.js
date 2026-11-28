/* Formato ODH preventivo: MTI-F09 (Notificación de mantenimiento preventivo del contratista). Separado del 7K y del correctivo ODH. */
(function(g){
const F=g.FORMS,digits=F.digits,dmy=F.dmy;
const nm=v=>{v=String(v==null?'':v).trim();return /^\d{1,15}$/.test(v)?+v:v};
const clean=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'').trim();
// [numeral, descripción] (filas 21 a 40 de la hoja ACTA DE MANTENIMIENTO; solo SI / NO)
const OPA=[['1','Ajuste y limpieza de elementos que componen el kit de WiFi incluidos herrajes y mástiles'],['1.1','AP INTERIOR'],['1.2','AP EXTERIOR 1'],['1.3','AP EXTERIOR 2'],['2','Ajuste y limpieza de elementos que componen el kit de Energía'],['2.1','Rack Metalico'],['2.2','UPS'],['2.3','Batería'],['3','Ajuste y validación de elementos que componen el kit de UM'],['3.1','Router'],['3.2','ODF en el RACK'],['4','Señalética'],['4.1','Interior'],['4.2','Exterior'],['5','Medición eléctrica'],['6','Prueba de gestión de UPS'],['7','Velocidad UP - DOWN'],['8','Portal cautivo'],['9','Bloqueo de páginas'],['11','Validación física Politica de Seguridad']];
const OPS=['AP INTERIOR','AP EXTERIOR 1','AP EXTERIOR 2','UPS','Batería','Router','Gateway - SMARBOX','TRANSCEIVER S-C53DLC40D','TRANSCEIVER S-55DLC80D'];
// [etiqueta, rango, solo captura, actividad]
const WP=[['EQUIPOS WIFI INTERIOR','B14:G30',0,'1.1'],['EQUIPOS WIFI EXTERIOR 1 (AP 1)','H14:M30',0,'1.2'],['EQUIPOS WIFI EXTERIOR 2 (AP2)','N14:S30',0,'1.3'],['RACK METALICO','B32:G48',0,'2.1'],['UPS','H32:M48',0,'2.2'],['BATERIA','N32:S48',0,'2.3'],['ODF EN RACK','B50:G66',0,'3.2'],['SEÑALÉTICA INTERIOR','H50:M66',0,'4.1'],['SEÑALÉTICA EXTERIOR','N50:S66',0,'4.2'],['MEDICIÓN ELÉCTRICA 1','B68:G84',0,'5'],['MEDICIÓN ELÉCTRICA 2','H68:M84',0,'5'],['MEDICIÓN ELÉCTRICA - RESISTENCIA SPT','N68:S84',0,'5'],['PRINT DE SERVIDOR CON EVENTO CREADO A UPS','B86:G102',1,'6'],['NAVEGACIÓN AP INDOOR','H86:M102',1,null],['NAVEGACIÓN AP OUTDOOR','N86:S102',1,null],['PRUEBA DE VELOCIDAD','B104:S113',1,'7'],['CONECTIVIDAD PORTAL CAUTIVO','B115:G132',1,'8'],['BLOQUEO DE PÁGINAS 1','H115:M132',1,'9'],['BLOQUEO DE PÁGINAS 2','N115:S132',1,'9'],['ACERCAMIENTO COMUNIDAD','B134:G151',0,null]];
const W_SLOTS=WP.map((x,i)=>({k:'w'+i,sec:'Registro fotográfico del preventivo',l:x[0],r:x[1],only:x[2],a:x[3]}));
function odhpFile(f){return 'ODH_Notificación_de_mantenimiento_Preventivo_del_Contratista_IDBen_'+clean(f.idben)+'-IM'+digits(f.im)+'-'+dmy(f.fecha).replace(/\//g,'')+'.xlsx'}
function odhpSpec(f,p,tec,ph,firma,na,place){
  const S='ACTA DE MANTENIMIENTO',C=[],I=[],cm=place==='cell',c=(ref,val,st)=>C.push({sheet:S,ref,val,st});
  const SH1={shrink:1};
  c('C11','IM'+digits(f.im));c('I11',dmy(f.fecha));
  c('B14',nm(f.res));
  c('B16',nm(f.idben));c('D16',f.claro||'');c('F16',nm(f.daneI));c('H16',f.nomI||'',SH1);c('K16',nm(f.daneS));c('M16',f.sede||'',SH1);
  c('B18',f.resp||'',SH1);c('F18',digits(f.cedr));c('H18',digits(f.telr));c('K18',f.mailr||'',SH1);
  OPA.forEach((x,i)=>{const v=p.a[x[0]]||'',r=21+i;c('K'+r,v==='SI'?'X':'');c('M'+r,v==='NO'?'X':'')});
  OPS.forEach((x,i)=>{const r=43+i;c('F'+r,p.s['r'+i]||'');c('L'+r,p.s['i'+i]||'')});
  c('B55',p.hall||'');
  c('E57',tec.tecn||'');c('E58',tec.tecc||'');c('E59',digits(tec.tecd));c('E60',digits(tec.tect));c('E61',tec.tecm||'');
  c('M57',tec.nocn||'');c('M59',tec.nocc||'');c('M61',p.imc||'N/A');
  if(firma)I.push({sheet:S,range:'E62:I62',...firma,cell:cm});
  const k=F.coord(f.coord),R='REGISTRO FOTOGRÁFICO';
  W_SLOTS.forEach(s=>{const x=ph[s.k];if(x&&(x.bytes||x.base64))I.push({sheet:R,range:s.r,ext:'jpeg',...x,cell:cm});else if(x&&x.na&&na)I.push({sheet:R,range:s.r,...na,cell:cm})});
  const E='ETIQUETA_RE_FOTOGRÁFICO',st={size:11};
  C.push({sheet:E,ref:'D4',val:nm(f.idben),st},{sheet:E,ref:'D5',val:f.sede||'',st},{sheet:E,ref:'D6',val:k?k[1]:'',st},{sheet:E,ref:'E6',val:k?k[0]:'',st},{sheet:E,ref:'D7',val:dmy(f.fecha),st});
  return{cells:C,images:I,fontName:'Arial'};
}
F.OPA=OPA;F.OPS=OPS;F.W_SLOTS=W_SLOTS;F.odhpSpec=odhpSpec;F.odhpFile=odhpFile;
})(typeof window!=='undefined'?window:globalThis);
