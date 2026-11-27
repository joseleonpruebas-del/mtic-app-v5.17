// ===== Cámara GPS nativa (plugin GpsCam): la marca de agua, el GPS en vivo y el EXIF los hace Android.
// Solo actúa dentro del APK. En el navegador y si el plugin falla, se usa la cámara de siempre.
(function(){
 const _tomar=tomar,_opt=opt;
 if(PL('GpsCam')&&!SET.camUser&&SET.cam!=='gps'){SET.cam='gps';LS.s('mtic_set',SET)}
 tomar=async function(ns,k){
  const G=PL('GpsCam');
  if(!(G&&SET.cam==='gps'))return _tomar(ns,k);
  const sede=job&&job.f&&(job.f.sede||job.f.sedee)||'';
  try{
   const r=await G.capture({line1:'IB '+(job&&job.ib||'')+(sede?' - '+sede:''),maxEdge:photoMaxEdge(),quality:88,minAcc:30,gallery:SET.gpsGallery!==false});
   if(!r||r.canceled)return;
   const ph={d:'data:image/jpeg;base64,'+r.data,w:r.w,h:r.h};
   PH[ns][k]=ph;
   const saved=await idbPut('ph',photoKey(ns,k),ph);
   if(saved===null)throw new Error('No se pudo guardar la foto en este dispositivo');
   if(job){fixv={c:[r.lat,r.lon],acc:r.acc,t:r.time};if(!String(job.f.coord||'').trim()){job.f.coordAuto=true;autoCoord(true)}else autoCoord();gpsLabel()}
   drawP();
   if(r.mock)alert('Atención: la ubicación de esta foto parece simulada (GPS falso).')
  }catch(e){
   if(confirm('No se pudo usar la cámara GPS ('+(e&&e.message||e)+'). ¿Usar la cámara del teléfono?'))return _tomar(ns,k)
  }
 };
 function addCamOption(){
  const sec=[...document.querySelectorAll('#app .s')].find(s=>/Resolución de fotos/.test(s.textContent));
  if(!sec||document.getElementById('cam-opt'))return;
  const native=!!PL('GpsCam'),cur=SET.cam==='gps'?'gps':'sys';
  sec.insertAdjacentHTML('beforebegin','<div class="s" id="cam-opt"><h2>Cámara</h2><label>Cámara para las fotos de evidencia<select data-cam="1"'+(native?'':' disabled')+'><option value="gps"'+(cur==='gps'?' selected':'')+'>Cámara GPS (nativa de la app)</option><option value="sys"'+(cur==='sys'?' selected':'')+'>Cámara del teléfono</option></select></label>'+
   '<label><input type="checkbox" data-camg="1" '+(SET.gpsGallery!==false?'checked':'')+(native?'':' disabled')+'>Guardar una copia de cada foto en la galería (carpeta Pictures/MinTIC)</label>'+
   '<div class="m">'+(native?'La cámara GPS muestra el GPS en vivo y marca la foto con el IB, la sede, las coordenadas y la hora exacta de la captura. Espera una precisión de 30 m o mejor; si no la logra, deja capturar con la precisión actual.':'La cámara GPS nativa solo está disponible en la app instalada en el celular.')+'</div></div>')
 }
 opt=async function(){await _opt.apply(this,arguments);addCamOption()};
 document.addEventListener('change',e=>{const t=e.target;if(!t.dataset)return;
  if(t.dataset.cam){SET.cam=t.value==='gps'?'gps':'sys';SET.camUser=true;LS.s('mtic_set',SET)}
  else if(t.dataset.camg){SET.gpsGallery=t.checked;LS.s('mtic_set',SET)}})
})();
