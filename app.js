import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,setPersistence,browserLocalPersistence,browserSessionPersistence,signOut,updateProfile} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,setDoc,getDoc,collection,query,where,onSnapshot,addDoc,updateDoc,deleteDoc,serverTimestamp,getDocs,writeBatch} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const $=id=>document.getElementById(id), show=(id,yes=true)=>$(id).classList.toggle('hidden',!yes);
// All visible copy is translated client-side. User-entered content remains unchanged.
const translations={
'ASFALT • ARBETSLOGG':'ASPHALT • WORK LOG','Logga ut':'Log out','Förbered PaveTrack':'Set up PaveTrack',
'Firebase är ännu inte konfigurerat. Följ INSTALLATION.md och fyll i firebase-config.js.':'Firebase is not configured yet. Follow INSTALLATION.md and complete firebase-config.js.',
'Välkommen till PaveTrack':'Welcome to PaveTrack','Logga in eller skapa ett konto. Nya konton måste godkännas.':'Sign in or create an account. New accounts must be approved.',
'Logga in':'Sign in','Skapa konto':'Create account','Namn':'Name','E-post':'Email','Lösenord':'Password',
'Kontot väntar på godkännande':'Account awaiting approval','En administratör behöver godkänna ditt konto innan du kan registrera jobb.':'An administrator must approve your account before you can register jobs.',
'Kontrollera status':'Check status','Arbetsöversikt':'Work overview','Jobb':'Jobs','Historik':'History','Statistik':'Statistics','Användare':'Users',
'Jobb idag':'Jobs today','Använt idag':'Used today','Överblivet idag':'Left over today','Nytt asfaltjobb':'New asphalt job',
'AUTOSPARAS I MOLNET':'SAVED TO THE CLOUD','Datum':'Date','Kund / beställare':'Customer / client','Littranummer':'Job reference number',
'(valfritt)':'(optional)','Arbetsplats':'Work site','Yta (m²)':'Area (m²)','Använd asfalt (ton)':'Asphalt used (tons)',
'Överbliven asfalt (ton)':'Leftover asphalt (tons)','Anteckningar':'Notes','Spara jobb':'Save job','Avbryt redigering':'Cancel editing',
'Senaste jobb':'Recent jobs','Jobbhistorik':'Job history','Sök kund, littra, plats eller person':'Search customer, reference, location or person',
'Rensa filter':'Clear filters','Exportera CSV (Excel)':'Export CSV (Excel)','Sammanställning':'Summary','Totalt antal jobb':'Total jobs',
'Totalt m²':'Total m²','Använt, ton':'Used, tons','Överblivet, ton':'Leftover, tons','Användarhantering':'User management',
'Godkänn nya konton. Superadministratören kan även utse administratörer.':'Approve new accounts. The super administrator can also appoint administrators.',
'PAVETRACK • BYGGT FÖR ASFALTARBETEN':'PAVETRACK • BUILT FOR ASPHALT WORK',
'Ex. PEAB':'E.g. PEAB','Ex. L-1042':'E.g. L-1042','Adress eller område':'Address or area',
'Övrig information om jobbet':'Additional job information','Sök bland jobben':'Search jobs',
'Inga jobb registrerade ännu.':'No jobs registered yet.','Inga jobb matchar sökningen.':'No matching jobs.',
'Alla användares jobb':'All users’ jobs','Dina registrerade jobb':'Your registered jobs','Redigera':'Edit','Radera':'Delete',
'Godkänn':'Approve','Neka':'Reject','Spärra':'Block','Gör till admin':'Make admin','Ta bort admin':'Remove admin',
'Återaktivera':'Reactivate','Inga användare hittades.':'No users found.','Redigera jobb':'Edit job',
'Jobbet sparat i molnet!':'Job saved to the cloud!','Jobbet raderat':'Job deleted','Användaren uppdaterad':'User updated',
'Kontrollera uppgifterna.':'Check the information.','Ange ditt namn.':'Enter your name.',
'Profil saknas. Kontakta administratören.':'Profile missing. Contact an administrator.',
'Kunde inte läsa jobb: ':'Could not load jobs: ','Kunde inte läsa användare: ':'Could not load users: ',
'Kunde inte läsa kontot: ':'Could not load account: ','Kunde inte spara: ':'Could not save: ',
'Ändringen nekades: ':'Change denied: ','Jobbet hittades inte.':'Job not found.',
'Fel i Firebase-konfigurationen':'Firebase configuration error','HEJ, ':'HELLO, ','ANVÄNDARE':'USER',
'INLOGGAD':'SIGNED IN','Kund':'Customer','Littra':'Reference','Arbetsplats':'Work site','Använt ton':'Used tons',
'Överblivet ton':'Leftover tons','Registrerad av':'Registered by','Anteckningar':'Notes',
'Användare':'User','ton använt':'tons used','ton över':'tons left','Status: ':'Status: '
};
let language=localStorage.getItem('pavetrack-language')||'';
const tr=(s)=>language==='en'?(translations[s]||s):s;
const originalTexts=[];
function captureTranslations(){const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement?.closest('#languageGate,script,style'))continue;const raw=n.nodeValue;if(raw.trim())originalTexts.push([n,raw]);}document.querySelectorAll('[placeholder]').forEach(el=>el.dataset.originalPlaceholder=el.placeholder)}
function applyLanguage(){document.documentElement.lang=language||'sv';for(const [node,raw] of originalTexts){const trimmed=raw.trim();if(translations[trimmed])node.nodeValue=raw.replace(trimmed,tr(trimmed));}document.querySelectorAll('[data-original-placeholder]').forEach(el=>el.placeholder=tr(el.dataset.originalPlaceholder));$('languageLabel').textContent=(language||'sv').toUpperCase();show('languageGate',!language);show('changeLanguage',!!language)}
function setLanguage(next){language=next;localStorage.setItem('pavetrack-language',next);applyLanguage();if(typeof renderJobs==='function'&&me&&profile?.status==='approved'){renderJobs();if(isAdmin())renderUsers()}if($('authSubmit'))$('authSubmit').textContent=tr(mode==='register'?'Skapa konto':'Logga in')}
document.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.language));$('changeLanguage').onclick=()=>show('languageGate',true);captureTranslations();applyLanguage();

const fmt=n=>new Intl.NumberFormat('sv-SE',{maximumFractionDigits:2}).format(n||0), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let auth,db,functionsClient,me=null,profile=null,jobs=[],users=[],companies=[],teams=[],unsubs=[],mode='login',ownerWorkAvailable=false,ownerWorkMode=false;
const PLATFORM_OWNER_UID=window.PAVETRACK_OWNER_UID||'';
const platformOwner=()=>!!me&&me.uid===PLATFORM_OWNER_UID;
const companyRef=id=>doc(db,'companies',id);
const companyUsers=id=>collection(db,'companies',id,'users');
const companyJobs=id=>collection(db,'companies',id,'jobs');
const companyTeams=id=>collection(db,'companies',id,'teams');
const tenantId=()=>profile?.companyId;

function toast(t){$('toast').textContent=t;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',3800)}
function resetSubs(){unsubs.forEach(f=>f());unsubs=[];jobs=[];users=[];companies=[];teams=[]}
function page(id){['auth','pending','dashboard','config'].forEach(k=>show(k,k===id));show('logout',id!=='auth'&&id!=='config')}
function view(name){document.querySelectorAll('.view').forEach(e=>e.classList.toggle('hidden',e.id!==name+'View'));document.querySelectorAll('#nav button').forEach(e=>e.classList.toggle('active',e.dataset.view===name))}
function isAdmin(){return ['admin','superadmin'].includes(profile?.role)&&!!tenantId()}
function resetForm(){$('jobForm').reset();$('jobId').value='';$('jobDate').value=dateLocal();$('jobTeam').value=profile?.teamId||'';$('formTitle').textContent=tr('Nytt asfaltjobb');show('cancelEdit',false)}
function renderJob(j){const canEdit=j.ownerUid===me?.uid||isAdmin();return `<article class="job"><div class="jobhead"><div><h3>${esc(j.customer)}</h3><div class="meta">${esc(j.date)} • ${tr('Littra')}: ${esc(j.littra||'—')} ${j.location?'• '+esc(j.location):''}</div></div><span class="pill">${esc(j.ownerName||tr('Användare'))}</span></div><div class="jobnums"><span><b>${fmt(j.area)}</b> m²</span><span><b>${fmt(j.used)}</b> ${tr('ton använt')}</span><span><b>${fmt(j.waste)}</b> ${tr('ton över')}</span></div>${j.teamName?`<p><b>Arbetslag:</b> ${esc(j.teamName)}</p>`:''}${j.asphaltType?`<p><b>Asfalttyp:</b> ${esc(j.asphaltType)}</p>`:''}${j.notes?`<p>${esc(j.notes)}</p>`:''}${canEdit?`<div class="actions"><button class="smallbtn secondary" data-edit="${esc(j.id)}">${tr('Redigera')}</button><button class="smallbtn ghost" data-delete="${esc(j.id)}">${tr('Radera')}</button></div>`:''}</article>`}
function renderJobs(){const now=dateLocal(),todays=jobs.filter(j=>j.date===now);$('todayCount').textContent=todays.length;$('todayTons').textContent=fmt(todays.reduce((s,j)=>s+j.used,0))+' ton';$('todayWaste').textContent=fmt(todays.reduce((s,j)=>s+j.waste,0))+' ton';$('recentJobs').innerHTML=jobs.slice(0,5).map(renderJob).join('')||'<p>Inga jobb registrerade ännu.</p>';const q=$('search').value.trim().toLowerCase(),d=$('filterDate').value;const filtered=jobs.filter(j=>(!d||j.date===d)&&(!q||[j.customer,j.littra,j.location,j.ownerName,j.notes,j.asphaltType,j.teamName].some(x=>String(x||'').toLowerCase().includes(q))));$('historyJobs').innerHTML=filtered.map(renderJob).join('')||'<p>Inga jobb matchar sökningen.</p>';$('allCount').textContent=jobs.length;$('allArea').textContent=fmt(jobs.reduce((s,j)=>s+j.area,0));$('allUsed').textContent=fmt(jobs.reduce((s,j)=>s+j.used,0));$('allWaste').textContent=fmt(jobs.reduce((s,j)=>s+j.waste,0));$('statsScope').textContent=isAdmin()?tr('Alla användares jobb'):tr('Dina registrerade jobb')}
function renderUsers(){const pending=users.filter(u=>u.status==='pending');const rest=users.filter(u=>u.status!=='pending');$('usersList').innerHTML=[...pending,...rest].map(u=>{const actions=[];if(u.status==='pending'){actions.push(`<button class="smallbtn primary" data-user="${esc(u.id)}" data-status="approved">${tr('Godkänn')}</button>`,`<button class="smallbtn secondary" data-user="${esc(u.id)}" data-status="rejected">${tr('Neka')}</button>`)}else if(u.status==='approved'&&u.id!==me.uid){actions.push(`<button class="smallbtn secondary" data-user="${esc(u.id)}" data-status="blocked">${tr('Spärra')}</button>`);if(profile.role==='superadmin'&&u.role!=='superadmin')actions.push(`<button class="smallbtn secondary" data-user="${esc(u.id)}" data-role="${u.role==='admin'?'user':'admin'}">${u.role==='admin'?tr('Ta bort admin'):tr('Gör till admin')}</button>`)}else if(u.status==='blocked')actions.push(`<button class="smallbtn secondary" data-user="${esc(u.id)}" data-status="approved">${tr('Återaktivera')}</button>`);return `<article class="user"><div><h3>${esc(u.name||u.email)}</h3><div class="meta">${esc(u.email)} • ${esc(u.status)} • ${esc(u.role)}</div></div><div class="actions">${actions.join('')}</div></article>`}).join('')||'<p>Inga användare hittades.</p>'}
function listenData(){const q=isAdmin()?query(companyJobs(tenantId())):query(companyJobs(tenantId()),where('ownerUid','==',me.uid));unsubs.push(onSnapshot(q,s=>{jobs=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));renderJobs()},e=>toast(tr('Kunde inte läsa jobb: ')+e.message)));listenTeams();if(isAdmin())unsubs.push(onSnapshot(companyUsers(tenantId()),s=>{users=s.docs.map(d=>({id:d.id,...d.data()}));renderUsers()},e=>toast(tr('Kunde inte läsa användare: ')+e.message)))}
function showWorkSetup(){
 $('ownerModeSwitch').classList.remove('hidden');
 $('ownerWorkButton').classList.add('active');$('ownerPlatformButton').classList.remove('active');
 show('companiesNav',false);for(const id of ['jobs','history','stats'])show(id+'Nav',false);show('usersNav',false);
 $('roleBadge').textContent='ARBETSLÄGE';
 view('jobs');
 $('jobsView').classList.remove('hidden');
 $('workSetup').classList.remove('hidden');
}
function setOwnerMode(work){
 if(!platformOwner())return;
 if(work&&!ownerWorkAvailable){ownerWorkMode=true;showWorkSetup();return}
 ownerWorkMode=!!work;show('workSetup',false);
 $('ownerModeSwitch').classList.remove('hidden');
 $('ownerWorkButton').classList.toggle('active',ownerWorkMode);
 $('ownerPlatformButton').classList.toggle('active',!ownerWorkMode);
 show('companiesNav',!ownerWorkMode);
 for(const id of ['jobs','history','stats'])show(id+'Nav',ownerWorkMode);
 show('usersNav',ownerWorkMode&&!!tenantId());
 show('teamAdmin',ownerWorkMode&&isAdmin());
 $('roleBadge').textContent=ownerWorkMode?(profile.role==='superadmin'?'SUPERADMIN':profile.role==='admin'?'ADMIN':'ANVÄNDARE'):'SYSTEMÄGARE';
 view(ownerWorkMode?'jobs':'companies');
}
async function loadProfile(){
 if(!me)return;
 const isOwner=platformOwner();
 let profileReadError=null;
 try {
  const snap=await getDoc(doc(db,'users',me.uid));
  profile=snap.exists()?snap.data():null;
 } catch(err) {
  if(!isOwner)throw err;
  profileReadError=err;
  console.warn('Systemägare: profil kunde inte läsas',err);
 }
 if(profile?.companyId){
  try {
   const membership=await getDoc(doc(companyUsers(profile.companyId),me.uid));
   if(membership.exists())profile={...profile,...membership.data()};
   else profile={...profile,status:'pending'};
  } catch(err) {
   if(!isOwner)throw err;
   profileReadError=err;
   console.warn('Systemägare: företagsmedlemskap kunde inte läsas',err);
   profile={...profile,status:'pending'};
  }
 }
 if(!profile&&isOwner)profile={name:me.displayName||me.email,role:'platformOwner',status:'approved',companyId:null};
 if(!profile){page('pending');$('pendingName').textContent=tr('Profil saknas. Kontakta administratören.');return}
 let companyApproved=false;
 if(profile.companyId){try{const company=await getDoc(companyRef(profile.companyId));companyApproved=company.exists()&&company.data().status==='approved';}catch(err){if(!platformOwner())throw err;console.warn('Work membership check:',err);}}
 ownerWorkAvailable=platformOwner()&&!!tenantId()&&profile.status==='approved'&&companyApproved;
 if(!platformOwner()&&(!companyApproved||profile.status!=='approved')){resetSubs();page('pending');$('pendingName').textContent=companyApproved?`${profile.name||me.email} • ${tr('Status: ')}${profile.status}`:'Företaget väntar på ditt godkännande eller är pausat.';return}
 page('dashboard');$('greeting').textContent=tr('HEJ, ')+(profile.name||tr('ANVÄNDARE')).toUpperCase();
 show('ownerModeSwitch',platformOwner());
 show('companiesNav',platformOwner());show('usersNav',!!tenantId()&&companyApproved&&profile.status==='approved');show('teamAdmin',isAdmin());
 if(platformOwner()){
  listenCompanies();listenBilling();
  if(profileReadError)toast('Systemägarläge öppnat. Arbetsprofilen kunde inte läsas: '+profileReadError.code);
  if(!ownerWorkAvailable)ownerWorkMode=false;
  setOwnerMode(ownerWorkMode);
 }else{
  for(const id of ['jobs','history','stats'])show(id+'Nav');
  $('roleBadge').textContent=profile.role==='superadmin'?'SUPERADMIN':profile.role==='admin'?'ADMIN':'ANVÄNDARE';
  view('jobs');
 }
 if(tenantId()&&profile.status==='approved'&&companyApproved)listenData();
}
$('ownerPlatformButton').onclick=()=>setOwnerMode(false);
$('ownerWorkButton').onclick=()=>setOwnerMode(true);

function init(){if(!window.PAVETRACK_FIREBASE_CONFIG?.apiKey||!window.PAVETRACK_FIREBASE_CONFIG?.projectId){page('config');return}try{const app=initializeApp(window.PAVETRACK_FIREBASE_CONFIG);auth=getAuth(app);db=getFirestore(app);functionsClient=getFunctions(app,'europe-west1');onAuthStateChanged(auth,async user=>{resetSubs();me=user;profile=null;if(!user){page('auth');return}try{await loadProfile()}catch(e){if(platformOwner()){console.error('Systemägarläge kunde inte starta:',e);page('dashboard');$('pendingName').textContent='';$('greeting').textContent='HEJ, SYSTEMÄGARE';show('ownerModeSwitch');setOwnerMode(false);listenCompanies();toast('Kontrollera anslutningen: '+e.message)}else{page('pending');$('pendingName').textContent=tr('Kunde inte läsa kontot: ')+e.message}}})}catch(e){page('config');$('config').innerHTML='<h2>Fel i Firebase-konfigurationen</h2><p>'+esc(e.message)+'</p>'}}
$('loginTab').onclick=()=>{mode='login';show('nameWrap',false);show('registerCompanyFields',false);$('authSubmit').textContent=tr('Logga in');$('loginTab').classList.add('active');$('registerTab').classList.remove('active');show('rememberWrap')};$('registerTab').onclick=()=>{mode='register';show('nameWrap');show('registerCompanyFields');$('authSubmit').textContent=tr('Skapa konto');$('registerTab').classList.add('active');$('loginTab').classList.remove('active');show('rememberWrap',false)};
$('authForm').onsubmit=async e=>{e.preventDefault();$('authMessage').textContent='';const email=$('email').value.trim(),password=$('password').value;try{if(mode==='register'){
 const name=$('name').value.trim(),isFounder=$('accountType').value==='company',companyName=$('companyName').value.trim(),orgNumber=$('orgNumber').value.trim(),joinId=$('joinCompanyId').value.trim();
 if(!name||name.length>120)throw Error('Ange ett namn (högst 120 tecken).');if(isFounder&&(!companyName||!orgNumber))throw Error('Ange företagsnamn och organisationsnummer.');if(!isFounder&&!joinId)throw Error('Ange företags-ID.');
 const cred=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(cred.user,{displayName:name});const cid=isFounder?cred.user.uid:joinId;
 const batch=writeBatch(db);if(isFounder)batch.set(companyRef(cid),{name:companyName,orgNumber,founderUid:cred.user.uid,status:'pending',plan:'start',billingExempt:false,subscriptionStatus:'not_required',trialDays:30,createdAt:serverTimestamp()});
 batch.set(doc(db,'users',cred.user.uid),{name,email,companyId:cid,role:isFounder?'superadmin':'user',status:'pending',createdAt:serverTimestamp()});
 batch.set(doc(companyUsers(cid),cred.user.uid),{name,email,role:isFounder?'superadmin':'user',status:'pending',teamId:'',createdAt:serverTimestamp()});
 await batch.commit();await loadProfile();
 }else {await setPersistence(auth,$('rememberLogin').checked?browserLocalPersistence:browserSessionPersistence);await signInWithEmailAndPassword(auth,email,password)}}catch(err){$('authMessage').textContent=err.message+' Om kontot redan skapats, kontakta administratören för hjälp.'}};
$('ownerPlatformButton').onclick=()=>setOwnerMode(false);$('ownerWorkButton').onclick=()=>setOwnerMode(true);$('logout').onclick=()=>signOut(auth);$('refreshStatus').onclick=()=>loadProfile();$('jobDate').value=dateLocal();document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>{if(platformOwner()&&((ownerWorkMode&&b.dataset.view==='companies')||(!ownerWorkMode&&b.dataset.view!=='companies')))return;view(b.dataset.view)});$('search').oninput=renderJobs;$('filterDate').oninput=renderJobs;$('clearFilters').onclick=()=>{$('search').value='';$('filterDate').value='';renderJobs()};$('cancelEdit').onclick=resetForm;
$('jobForm').onsubmit=async e=>{e.preventDefault();if(profile?.status!=='approved')return;const selectedTeam=teams.find(t=>t.id===$('jobTeam').value);const data={teamId:selectedTeam?.id||'',teamName:selectedTeam?.name||'',asphaltType:$('asphaltType').value.trim(),date:$('jobDate').value,customer:$('customer').value.trim(),littra:$('littra').value.trim(),location:$('location').value.trim(),area:Number($('area').value),used:Number($('used').value),waste:Number($('waste').value),notes:$('notes').value.trim()};if($('jobTeam').value&&!selectedTeam){toast('Välj ett giltigt arbetslag.');return}if(!data.customer||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||![data.area,data.used,data.waste].every(n=>Number.isFinite(n)&&n>=0)){toast(tr('Kontrollera uppgifterna.'));return}const id=$('jobId').value;$('saveJob').disabled=true;try{if(id){const old=jobs.find(j=>j.id===id);if(!old)throw Error(tr('Jobbet hittades inte.'));await updateDoc(doc(companyJobs(tenantId()),id),{...data,updatedAt:serverTimestamp(),updatedBy:me.uid})}else await addDoc(companyJobs(tenantId()),{...data,ownerUid:me.uid,ownerName:profile.name||me.email,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedBy:me.uid});resetForm();toast(tr('Jobbet sparat i molnet!'))}catch(err){toast(tr('Kunde inte spara: ')+err.message)}finally{$('saveJob').disabled=false}};
document.addEventListener('click',async e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]'),usr=e.target.closest('[data-user]');if(edit){const j=jobs.find(x=>x.id===edit.dataset.edit);if(!j)return;for(const f of ['date','customer','littra','location','area','used','waste','notes','asphaltType'])$(f==='date'?'jobDate':f).value=j[f]??'';$('jobId').value=j.id;$('jobTeam').value=j.teamId||'';$('formTitle').textContent=tr('Redigera jobb');show('cancelEdit');view('jobs');$('jobForm').scrollIntoView({behavior:'smooth'})}if(del){const j=jobs.find(x=>x.id===del.dataset.delete);if(j&&confirm((language==='en'?`Delete job for ${j.customer}?`:`Radera jobbet hos ${j.customer}?`))){try{await deleteDoc(doc(companyJobs(tenantId()),j.id));toast(tr('Jobbet raderat'))}catch(err){toast(err.message)}}}if(usr){const u=users.find(x=>x.id===usr.dataset.user);if(!u||!confirm((language==='en'?`Change permissions/status for ${u.name||u.email}?`:`Ändra behörighet/status för ${u.name||u.email}?`)))return;try{if(usr.dataset.status)await updateDoc(doc(companyUsers(tenantId()),u.id),{status:usr.dataset.status});else if(usr.dataset.role)await updateDoc(doc(companyUsers(tenantId()),u.id),{role:usr.dataset.role});toast(tr('Användaren uppdaterad'))}catch(err){toast(tr('Ändringen nekades: ')+err.message)}}});
$('exportCsv').onclick=()=>{const q=$('search').value.toLowerCase(),d=$('filterDate').value;const rows=jobs.filter(j=>(!d||j.date===d)&&(!q||[j.customer,j.littra,j.location,j.ownerName,j.notes,j.asphaltType,j.teamName].some(x=>String(x||'').toLowerCase().includes(q))));const columns=['date','customer','littra','location','teamName','asphaltType','area','used','waste','ownerName','notes'];const csv=[['Datum','Kund','Littra','Arbetsplats','Arbetslag','Asfalttyp','m²','Använt ton','Överblivet ton','Registrerad av','Anteckningar'].map(tr),...rows.map(j=>columns.map(c=>j[c]??''))].map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PaveTrack-jobb-'+dateLocal()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
init();

// Platform owner: approve/reject company requests. Only configured UID can write these fields.
function listenCompanies(){unsubs.push(onSnapshot(collection(db,'companies'),snapshot=>{companies=snapshot.docs.map(d=>({id:d.id,...d.data()}));$('companiesList').innerHTML=companies.map(c=>`<article class="user"><div><h3>${esc(c.name)}</h3><div class="meta">Org.nr ${esc(c.orgNumber)} • ${esc(c.status)} • ${esc(c.plan||'start')} • ID: ${esc(c.id)}</div></div><div class="actions">${c.status==='pending'?`<button class="smallbtn primary" data-company="${esc(c.id)}" data-company-status="approved">Godkänn</button><button class="smallbtn secondary" data-company="${esc(c.id)}" data-company-status="rejected">Neka</button>`:c.status==='approved'?`<button class="smallbtn secondary" data-company="${esc(c.id)}" data-company-status="paused">Arkivera</button>`:`<button class="smallbtn primary" data-company="${esc(c.id)}" data-company-status="approved">Återaktivera</button>`}<button class="smallbtn secondary" data-company-delete="${esc(c.id)}" style="border-color:#b65b5b;color:#ffb6b6">Radera permanent</button><label>Plan <select data-company-plan="${esc(c.id)}"><option value="start" ${c.plan==='start'?'selected':''}>Start 299 kr</option><option value="pro" ${c.plan==='pro'?'selected':''}>Pro 699 kr</option><option value="enterprise" ${c.plan==='enterprise'?'selected':''}>Enterprise 1 499 kr</option></select></label><label><input type="checkbox" data-company-free="${esc(c.id)}" ${c.billingExempt?'checked':''}> Gratisundantag</label></div></article>`).join('')||'<p>Inga företag registrerade.</p>'},e=>toast('Företag: '+e.message)))}
document.addEventListener('click',async e=>{const btn=e.target.closest('[data-company-status]');if(!btn||!platformOwner())return;const c=companies.find(c=>c.id===btn.dataset.company);if(!c||!confirm('Ändra status för '+c.name+'?'))return;try{const batch=writeBatch(db);batch.update(companyRef(c.id),{status:btn.dataset.companyStatus});if(btn.dataset.companyStatus==='approved')batch.update(doc(companyUsers(c.id),c.founderUid),{status:'approved'});await batch.commit();toast('Företaget uppdaterat')}catch(err){toast(err.message)}});
// Permanent deletion is never performed by Firestore client rules. Requires deployed callable Cloud Function.
document.addEventListener('click',async e=>{
 const btn=e.target.closest('[data-company-delete]');if(!btn||!platformOwner())return;
 const c=companies.find(x=>x.id===btn.dataset.companyDelete);if(!c)return;
 const answer=prompt(`PERMANENT RADERING\n\nFöretag: ${c.name}\nAlla jobb, arbetslag och användarkonton försvinner. Detta går inte att ångra.\n\nSkriv företagets namn exakt för att fortsätta:`);
 if(answer!==c.name)return;
 if(!confirm(`SISTA BEKRÄFTELSEN: Radera ${c.name} och alla dess uppgifter permanent?`))return;
 btn.disabled=true;
 try{const callable=httpsCallable(functionsClient,'deleteCompanyPermanently');await callable({companyId:c.id,confirmName:c.name});toast('Företaget är permanent raderat.');}
 catch(err){toast('Radering misslyckades: '+(err.message||err));}
 finally{btn.disabled=false;}
});
$('accountType').onchange=()=>{const founder=$('accountType').value==='company';show('companyFields',founder);show('joinFields',!founder)};

const settingsRef=()=>doc(db,'platform','settings');
function listenBilling(){unsubs.push(onSnapshot(settingsRef(),s=>{const enabled=!!s.data()?.billingEnabled;$('billingEnabled').checked=enabled;$('billingInfo').textContent=enabled?'Betalningskrav markerat som aktivt. Ingen debitering sker utan separat betalningsintegration.':'Gratisläge: alla godkända företag använder PaveTrack utan betalning.'},e=>toast('Inställningar: '+e.message)))}
$('billingEnabled').onchange=async e=>{const enabled=e.target.checked;if(!confirm(enabled?'Ändra till betalningsläge? Betalningar debiteras inte automatiskt.':'Återgå till gratisläge?')){e.target.checked=!enabled;return}try{await setDoc(settingsRef(),{billingEnabled:enabled,updatedAt:serverTimestamp()},{merge:true})}catch(err){e.target.checked=!enabled;toast(err.message)}};

document.addEventListener('change',async e=>{if(!platformOwner())return;const id=e.target.dataset.companyPlan||e.target.dataset.companyFree;if(!id)return;try{await updateDoc(companyRef(id),e.target.dataset.companyPlan?{plan:e.target.value}:{billingExempt:e.target.checked});toast('Företaget uppdaterat')}catch(err){toast(err.message)}});

function renderTeamSelectors(){for(const id of ['myTeam','jobTeam']){const el=$(id),old=id==='myTeam'?(profile?.teamId||''):el.value;el.innerHTML='<option value="">Inget arbetslag valt</option>'+teams.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');el.value=teams.some(t=>t.id===old)?old:''}if(isAdmin())$('teamsList').innerHTML=teams.map(t=>`<div class="meta">• ${esc(t.name)}</div>`).join('')||'<p>Inga arbetslag ännu.</p>'}
function listenTeams(){unsubs.push(onSnapshot(companyTeams(tenantId()),s=>{teams=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name,'sv'));renderTeamSelectors()},e=>toast('Arbetslag: '+e.message)))}
$('myTeam').onchange=async e=>{if(!tenantId())return;const id=e.target.value;try{await updateDoc(doc(companyUsers(tenantId()),me.uid),{teamId:id});profile.teamId=id;$('jobTeam').value=id;toast('Arbetslag sparat')}catch(err){toast('Kunde inte välja arbetslag: '+err.message)}};
$('teamForm').onsubmit=async e=>{e.preventDefault();if(!isAdmin())return;const name=$('newTeamName').value.trim();if(!name||name.length>80)return;try{await addDoc(companyTeams(tenantId()),{name,createdAt:serverTimestamp(),createdBy:me.uid});$('newTeamName').value='';toast('Arbetslaget är tillagt')}catch(err){toast(err.message)}};
