// PaveTrack Tidplan. The host supplies its authenticated company context and Firebase SDK.
export const TP_STATUSES=['planned','ongoing','completed'];
export function validPlanDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value&&value>='2000-01-01'&&value<='2100-12-31';
}
export function shiftPlanDate(value,days){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function planMonday(value){const day=new Date(value+'T12:00:00Z').getUTCDay();return shiftPlanDate(value,-((day+6)%7))}
export function planWeek(value){const thursday=new Date(planMonday(value)+'T12:00:00Z');thursday.setUTCDate(thursday.getUTCDate()+3);const year=thursday.getUTCFullYear();return {year,week:Math.ceil(((thursday-new Date(Date.UTC(year,0,1,12)))/86400000+1)/7)}}
export function planPhone(value){return String(value||'').replace(/[^0-9+]/g,'')}
export function comparePlans(a,b){return a.date.localeCompare(b.date)||(a.startTime||'99:99').localeCompare(b.startTime||'99:99')||a.customer.localeCompare(b.customer,'sv')||a.id.localeCompare(b.id)}
export function validatePlan(data){
 const lengths={customer:150,location:200,littra:80,description:2000,asphaltType:100,thickness:80,instructions:1500,leadName:120,contactName:120,contactPhone:50,teamId:150,teamName:80};
 for(const [key,max] of Object.entries(lengths))if(typeof data[key]!=='string'||data[key].length>max)throw Error('Kontrollera textfälten och deras längd.');
 if(!data.customer.trim())throw Error('Ange kund eller jobbnamn.');
 if(!validPlanDate(data.date))throw Error('Ange ett giltigt datum mellan år 2000 och 2100.');
 if(!/^$|^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(data.startTime))throw Error('Ange en giltig starttid.');
 for(const [key,max] of [['area',10000000],['tons',100000]])if(data[key]!==null&&(!Number.isFinite(data[key])||data[key]<0||data[key]>max))throw Error('Kontrollera beräknad yta och mängd.');
 if(!TP_STATUSES.includes(data.status)||typeof data.archived!=='boolean')throw Error('Ogiltig jobbstatus.');
 return data;
}
export function createTidplan({getContext,firestore,esc,fmt,toast,today}){
 const {collection,doc,query,where,onSnapshot,runTransaction,serverTimestamp}=firestore;
 const $=id=>document.getElementById(id),root=$('tidplanView');
 const form=$('tpForm'),editor=$('tpEditor'),details=$('tpDetails');
 let monday=planMonday(today()),rows=[],loaded=false,loadError='',fromCache=false,listener=null,contextKey='',generation=0;
 let editId='',editVersion=null,editArchived=false,editContext='',baseline='',saving=false,lastFocus=null,filterValue='all';
 const statusText=s=>({planned:'Planerat',ongoing:'Pågående',completed:'Klart'}[s]||'Planerat');
 const context=()=>{const c=getContext();return {...c,allowed:!!(c.uid&&c.cid&&c.approved)}};
 const key=c=>c.uid+':'+c.cid;
 const stamp=t=>t&&Number.isFinite(t.seconds)?`${t.seconds}:${t.nanoseconds||0}`:'';
 const planCollection=c=>collection(c.db,'companies',c.cid,'schedule');
 const dateText=d=>new Date(d+'T12:00:00Z').toLocaleDateString('sv-SE',{day:'numeric',month:'long',timeZone:'UTC'});
 function setMessage(text,error=false){$('tpMessage').textContent=text;$('tpMessage').classList.toggle('tp-error',error);$('tpMessage').setAttribute('role',error?'alert':'status')}
 function stop(){
  listener?.();listener=null;generation++;contextKey='';rows=[];loaded=false;loadError='';fromCache=false;
  if(editor.open)editor.close();if(details.open)details.close();editId='';editContext='';baseline='';
  filterValue='all';$('tpTeamFilter').value='all';$('tpShowArchived').checked=false;
  $('tpBoard').replaceChildren();$('tpCount').textContent='';setMessage('');
 }
 function start(){stop();const c=context();if(!c.allowed)return;contextKey=key(c);monday=planMonday(today());subscribe();refreshTeams()}
 function subscribe(){
  listener?.();listener=null;const c=context();if(!c.allowed||contextKey!==key(c))return;
  const token=++generation;loaded=false;loadError='';rows=[];render();
  const request=query(planCollection(c),where('date','>=',monday),where('date','<=',shiftPlanDate(monday,6)));
  listener=onSnapshot(request,{includeMetadataChanges:true},snapshot=>{
   if(token!==generation)return;
   rows=snapshot.docs.map(d=>({...d.data(),id:d.id})).sort(comparePlans);loaded=true;loadError='';fromCache=snapshot.metadata.fromCache;render();
  },err=>{if(token!==generation)return;loaded=false;loadError=err.code==='permission-denied'?'Tidplanen kunde inte öppnas. Kontrollera att de nya Firebase-reglerna är publicerade.':'Tidplanen kunde inte hämtas. Kontrollera anslutningen och försök igen.';rows=[];render()});
 }
 function refreshTeams(){
  const c=context(),teams=c.teams||[];
  const values=[{id:'all',name:'Alla arbetslag'},{id:'',name:'Ej tilldelat arbetslag'},...teams];
  $('tpTeamFilter').innerHTML=values.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  if(!values.some(t=>t.id===filterValue))filterValue='all';$('tpTeamFilter').value=filterValue;
  const selected=$('tpTeam').value;
  $('tpTeam').innerHTML='<option value="">Ej tilldelat arbetslag</option>'+teams.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  if(teams.some(t=>t.id===selected))$('tpTeam').value=selected;
  render();
 }
 function render(){
  const c=context(),canEdit=c.allowed&&c.admin;
  $('tpNew').hidden=!canEdit;$('tpArchivedWrap').hidden=!canEdit;
  const week=planWeek(monday);$('tpWeek').textContent=`Vecka ${week.week} · ${week.year}`;
  $('tpRange').textContent=`${dateText(monday)} – ${dateText(shiftPlanDate(monday,6))}`;
  $('tpJumpDate').value=monday;
  $('tpPrev').disabled=monday<='2000-01-03';$('tpNext').disabled=monday>='2100-12-20';
  $('tpWeekNav').setAttribute('aria-label',`Vecka ${week.week}, ${week.year}`);
  $('tpEditorActions').hidden=!canEdit;
  if(!c.allowed){$('tpBoard').innerHTML='';$('tpCount').textContent='';return}
  if(loadError){$('tpBoard').innerHTML='';setMessage(loadError,true);$('tpCount').textContent='';return}
  if(!loaded){$('tpBoard').innerHTML='<p class="tp-empty">Hämtar veckans jobb…</p>';setMessage('');$('tpCount').textContent='';return}
  setMessage(fromCache?'Visar senast hämtade planering. Anslut till internet för senaste ändringarna.':'');
  const showArchived=canEdit&&$('tpShowArchived').checked;
  const visible=rows.filter(r=>(showArchived||!r.archived)&&(filterValue==='all'||r.teamId===filterValue));
  $('tpCount').textContent=`${visible.length} ${visible.length===1?'jobb':'jobb'} denna vecka`;
  const days=visible.some(r=>r.date>shiftPlanDate(monday,4))?7:5;
  let html='<div class="tp-columns" aria-hidden="true"><span>Kund / arbetsplats</span><span>Arbete / mängd</span><span>Viktig information</span><span>Ansvarig / lag</span><span>Kontaktperson</span></div>';
  for(let i=0;i<days;i++){
   const date=shiftPlanDate(monday,i),dayRows=visible.filter(r=>r.date===date);
   const dayName=new Date(date+'T12:00:00Z').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'numeric',timeZone:'UTC'});
   html+=`<section class="tp-day"><div class="tp-dayhead"><h3>${esc(dayName)}${date===today()?' <span class="tp-today">Idag</span>':''}</h3><div><span>${dayRows.length} jobb</span>${canEdit?`<button type="button" class="tp-add-day" data-tp-add="${date}" aria-label="Lägg till jobb ${esc(dayName)}">+ Lägg till</button>`:''}</div></div>`;
   html+=dayRows.length?dayRows.map(r=>{
    const quantities=[r.area!==null&&r.area!==undefined?`${fmt(r.area)} m²`:'',r.tons!==null&&r.tons!==undefined?`${fmt(r.tons)} ton`:''].filter(Boolean).join(' · ');
    const work=[r.asphaltType,r.thickness].filter(Boolean).join(' · ');
    return `<article class="tp-row${r.archived?' tp-archived':''}"><div class="tp-name-cell"><button type="button" class="tp-job-link" data-tp-open="${esc(r.id)}">${esc(r.customer)}</button><span class="tp-sub">${esc(r.location||'Arbetsplats ej angiven')}</span>${r.littra?`<span class="tp-sub">Littra: ${esc(r.littra)}</span>`:''}<span class="tp-status tp-status-${TP_STATUSES.includes(r.status)?r.status:'planned'}">${r.archived?'Arkiverat':statusText(r.status)}</span></div><div class="tp-work"><span class="tp-mobile-label">Arbete / mängd</span>${esc(work||r.description||'—')}${work&&r.description?`<span class="tp-sub">${esc(r.description)}</span>`:''}${quantities?`<span class="tp-sub">${esc(quantities)}</span>`:''}</div><div class="tp-instruction${!r.instructions&&!r.startTime?' tp-no-instructions':''}"><span class="tp-mobile-label">Viktig information</span>${r.startTime?`<strong class="tp-important">Start ${esc(r.startTime)}</strong>`:''}<span class="${r.instructions?'tp-important':''}">${esc(r.instructions||(!r.startTime?'—':''))}</span></div><div><span class="tp-mobile-label">Ansvarig / lag</span>${esc(r.leadName||'Ej angiven')}<span class="tp-sub">${esc(r.teamName||'Ej tilldelat lag')}</span></div><div><span class="tp-mobile-label">Kontaktperson</span>${esc(r.contactName||'—')}${planPhone(r.contactPhone)?`<a class="tp-phone" href="tel:${esc(planPhone(r.contactPhone))}">${esc(r.contactPhone)}</a>`:''}</div></article>`;
   }).join(''):'<p class="tp-empty">Inga jobb inplanerade</p>';
   html+='</section>';
  }
  $('tpBoard').innerHTML=html;
 }
 function goTo(value){if(!validPlanDate(value))return;const next=planMonday(value);if(next===monday)return;monday=next;subscribe();if(details.open)details.close()}
 function shiftWeek(delta){const next=shiftPlanDate(monday,delta*7);if(next<'2000-01-03'||next>'2100-12-27')return;goTo(next)}
 function formData(){
  const c=context(),team=(c.teams||[]).find(t=>t.id===$('tpTeam').value);
  if($('tpTeam').value&&!team)throw Error('Välj ett giltigt arbetslag.');
  const text=id=>$(id).value.trim(),numeric=id=>$(id).value===''?null:Number($(id).value);
  return validatePlan({date:$('tpDate').value,startTime:$('tpStartTime').value,customer:text('tpCustomer'),location:text('tpLocation'),littra:text('tpLittra'),description:text('tpDescription'),asphaltType:text('tpAsphalt'),thickness:text('tpThickness'),area:numeric('tpArea'),tons:numeric('tpTons'),instructions:text('tpInstructions'),leadName:text('tpLead'),contactName:text('tpContact'),contactPhone:text('tpPhone'),teamId:team?.id||'',teamName:team?.name||'',status:$('tpStatus').value,archived:editArchived});
 }
 function signature(){return JSON.stringify(Array.from(form.elements).filter(el=>el.name).map(el=>[el.name,el.value]))}
 function openEditor(record=null,date=today()){
  const c=context();if(!c.allowed||!c.admin){toast('Endast administratörer kan ändra tidplanen.');return}
  if(saving)return;lastFocus=document.activeElement;form.reset();editId=record?.id||'';editVersion=record?.updatedAt||null;editArchived=record?.archived||false;editContext=key(c);
  const fields={tpDate:record?.date||date,tpStartTime:record?.startTime||'',tpCustomer:record?.customer||'',tpLocation:record?.location||'',tpLittra:record?.littra||'',tpDescription:record?.description||'',tpAsphalt:record?.asphaltType||'',tpThickness:record?.thickness||'',tpArea:record?.area??'',tpTons:record?.tons??'',tpInstructions:record?.instructions||'',tpLead:record?.leadName||'',tpContact:record?.contactName||'',tpPhone:record?.contactPhone||'',tpTeam:record?.teamId||'',tpStatus:record?.status||'planned'};
  for(const [id,value]of Object.entries(fields))$(id).value=value;
  $('tpEditorTitle').textContent=record?'Redigera planerat jobb':'Nytt planerat jobb';$('tpFormError').textContent='';baseline=signature();
  if(details.open)details.close();editor.showModal();
 }
 function closeEditor(){if(saving)return;if(signature()!==baseline&&!confirm('Stäng utan att spara ändringarna?'))return;editor.close();lastFocus?.focus?.()}
 function openDetails(id){
  const r=rows.find(r=>r.id===id);if(!r)return;const c=context();lastFocus=document.activeElement;
  $('tpDetailsTitle').textContent=r.customer;$('tpDetailsBody').innerHTML=`<dl class="tp-facts"><div><dt>Datum</dt><dd>${esc(dateText(r.date))}${r.startTime?' · '+esc(r.startTime):''}</dd></div><div><dt>Status</dt><dd>${r.archived?'Arkiverat':statusText(r.status)}</dd></div><div><dt>Arbetsplats</dt><dd>${esc(r.location||'—')}</dd></div><div><dt>Littra</dt><dd>${esc(r.littra||'—')}</dd></div><div><dt>Ansvarig</dt><dd>${esc(r.leadName||'—')}</dd></div><div><dt>Arbetslag</dt><dd>${esc(r.teamName||'Ej tilldelat')}</dd></div><div><dt>Beräknad yta</dt><dd>${r.area!==null?fmt(r.area)+' m²':'—'}</dd></div><div><dt>Beräknad mängd</dt><dd>${r.tons!==null?fmt(r.tons)+' ton':'—'}</dd></div><div><dt>Asfalttyp / tjocklek</dt><dd>${esc([r.asphaltType,r.thickness].filter(Boolean).join(' · ')||'—')}</dd></div><div><dt>Kontaktperson</dt><dd>${esc(r.contactName||'—')}${planPhone(r.contactPhone)?`<a class="tp-phone" href="tel:${esc(planPhone(r.contactPhone))}">${esc(r.contactPhone)}</a>`:''}</dd></div></dl>${r.description?`<h3>Arbetsbeskrivning</h3><p class="tp-pre">${esc(r.description)}</p>`:''}${r.instructions?`<h3>Viktig information</h3><p class="tp-important tp-pre">${esc(r.instructions)}</p>`:''}`;
  $('tpEdit').hidden=!c.admin;$('tpArchive').hidden=!c.admin;$('tpArchive').textContent=r.archived?'Återställ jobb':'Arkivera jobb';
  $('tpEdit').onclick=()=>openEditor(r);$('tpArchive').onclick=()=>archive(r);
  $('tpDetailsError').textContent='';details.showModal();
 }
 async function save(event){
  event.preventDefault();if(saving)return;const c=context();if(!c.allowed||!c.admin||key(c)!==editContext){$('tpFormError').textContent='Behörighet eller företagskoppling har ändrats. Öppna formuläret igen.';return}
  if(!navigator.onLine){$('tpFormError').textContent='Anslut till internet innan du sparar. Uppgifterna finns kvar i formuläret.';return}
  let data;try{data=formData()}catch(err){$('tpFormError').textContent=err.message;return}
  const id=editId||crypto.randomUUID(),expected=editVersion,isNew=!editId,identity=editContext;
  saving=true;$('tpSave').disabled=true;$('tpCancel').disabled=true;$('tpFormError').textContent='';
  try{
   await runTransaction(c.db,async tx=>{
    const ref=doc(planCollection(c),id),snap=await tx.get(ref);
    if(isNew){if(snap.exists())throw Error('Jobbet finns redan. Öppna formuläret igen.');tx.set(ref,{...data,createdAt:serverTimestamp(),createdBy:c.uid,updatedAt:serverTimestamp(),updatedBy:c.uid})}
    else{if(!snap.exists())throw Error('Jobbet finns inte längre.');if(!stamp(expected)||stamp(snap.data().updatedAt)!==stamp(expected))throw Error('Jobbet har ändrats av någon annan. Stäng och öppna jobbet igen för att se senaste versionen.');tx.update(ref,{...data,updatedAt:serverTimestamp(),updatedBy:c.uid})}
   });
   if(key(context())!==identity||contextKey!==identity)return;
   baseline=signature();editor.close();goTo(data.date);toast('Tidplanen sparad.');
  }catch(err){if(key(context())===identity)$('tpFormError').textContent=err.code==='permission-denied'?'Du saknar behörighet. Kontrollera att de nya Firebase-reglerna är publicerade.':(err.message||'Kunde inte spara. Försök igen.')}
  finally{saving=false;$('tpSave').disabled=false;$('tpCancel').disabled=false}
 }
 async function archive(record){
  const c=context();if(!c.allowed||!c.admin||saving)return;
  if(!confirm(record.archived?'Återställ jobbet till tidplanen?':'Arkivera jobbet? Det kan återställas genom att visa arkiverade jobb.'))return;
  if(!navigator.onLine){$('tpDetailsError').textContent='Anslut till internet för att ändra jobbet.';return}
  saving=true;$('tpArchive').disabled=true;$('tpEdit').disabled=true;
  try{await runTransaction(c.db,async tx=>{const ref=doc(planCollection(c),record.id),snap=await tx.get(ref);if(!snap.exists()||!stamp(record.updatedAt)||stamp(snap.data().updatedAt)!==stamp(record.updatedAt))throw Error('Jobbet har ändrats. Öppna det igen innan du fortsätter.');tx.update(ref,{archived:!record.archived,updatedAt:serverTimestamp(),updatedBy:c.uid})});if(key(context())===key(c)){details.close();toast(record.archived?'Jobbet återställt.':'Jobbet arkiverat.')}}
  catch(err){if(key(context())===key(c))$('tpDetailsError').textContent=err.message||'Kunde inte ändra jobbet.'}
  finally{saving=false;$('tpArchive').disabled=false;$('tpEdit').disabled=false}
 }
 $('tpPrev').onclick=()=>shiftWeek(-1);$('tpNext').onclick=()=>shiftWeek(1);$('tpThisWeek').onclick=()=>goTo(today());
 $('tpJumpDate').onchange=e=>goTo(e.target.value);$('tpTeamFilter').onchange=e=>{filterValue=e.target.value;render()};$('tpShowArchived').onchange=render;
 $('tpNew').onclick=()=>openEditor(null,monday<=today()&&today()<=shiftPlanDate(monday,6)?today():monday);
 $('tpRetry').onclick=subscribe;
 $('tpBoard').addEventListener('click',e=>{const add=e.target.closest('[data-tp-add]'),open=e.target.closest('[data-tp-open]');if(add)openEditor(null,add.dataset.tpAdd);if(open)openDetails(open.dataset.tpOpen)});
 form.onsubmit=save;$('tpCancel').onclick=closeEditor;editor.addEventListener('cancel',e=>{e.preventDefault();closeEditor()});
 $('tpDetailsClose').onclick=()=>{details.close();lastFocus?.focus?.()};
 let touch=null;$('tpBoard').addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
 $('tpBoard').addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)shiftWeek(dx<0?1:-1)},{passive:true});
 $('tpBoard').addEventListener('touchcancel',()=>touch=null,{passive:true});
 window.addEventListener('beforeunload',e=>{if(editor.open&&signature()!==baseline){e.preventDefault();e.returnValue=''}});
 window.addEventListener('online',()=>{if(contextKey)subscribe()});
 return {start,stop,refreshTeams,render,onView(){if(context().allowed&&contextKey!==key(context()))start();else render()}};
}
