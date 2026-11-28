// ===== pantalla de inicio organizada: 7K y ODH en una fila, AMRTX en otra, consultas en otra
document.head.insertAdjacentHTML('beforeend','<style>.hrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}.hrow>.s{margin:0!important;padding:8px;min-width:0}.hrow h2{font-size:13.5px;margin:0 0 4px}.hrow label{font-size:11.5px}.hrow input{font-size:13px;padding:7px 8px}.hrow .m,.hrow .m-sug{font-size:11px}.hrow button{padding:7px 6px;font-size:12px}.hrow .ibrow button{padding:7px 8px}.hrow .home-card{padding:8px 10px;min-height:0}.hrow .home-card span{display:none}.hrow .home-card b{font-size:13px}.hrow .r button{width:100%}</style>');
function homeLayout(){
 const app=document.getElementById('app');if(!app||!app.querySelector('.home-header'))return;
 const q=s=>app.querySelector(s),k7=[...app.querySelectorAll('section.home-start')].find(x=>!x.classList.contains('odh-start')&&!x.classList.contains('m-start')),odh=q('.odh-start'),x1=q('.m-start[data-p=x1]'),x2=q('.m-start[data-p=x2]');
 const mk=(...els)=>{const d=document.createElement('div');d.className='hrow';return d};
 if(k7&&odh){const r=mk();k7.before(r);r.append(k7,odh)}
 if(x1&&x2){const r=mk();const ref=odh?odh.parentNode:k7;(ref&&ref.after?ref:app.querySelector('.home-header')).after(r);r.append(x2,x1)}

 [odh,x1,x2].forEach(x=>{if(!x)return;const b=x.querySelector('button.p');if(b)b.textContent='Continuar';const h=x.querySelector('h2');if(h)h.textContent=h.textContent.replace(' · Registrar','')});
 [k7,odh,x1,x2].forEach(x=>{if(!x)return;const i=x.querySelector('input[id^=ibin]');if(i)i.placeholder=/x[12]/.test(i.id)?'IB o nombre':'IB';const l=x.querySelector('label');if(l&&l.firstChild)l.firstChild.textContent=/x[12]/.test((i||{}).id||'')?'Busca por IB o nombre':'Busca por IB'});
 const eq=q('[data-x=equipment].home-card'),co=q('[data-x=codes].home-card');
 if(eq&&co){const r=mk(),g=q('.home-grid');g.before(r);r.append(eq,co)}
}
{const _h=home;home=function(){_h();homeLayout();if(typeof bkBanner==='function')bkBanner()}}
