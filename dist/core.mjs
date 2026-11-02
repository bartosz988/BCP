// iBCP demo: reguły programu Auto Demo.
// Model w demo (uproszczenie modelu z architecture.html):
//  - deklaracja (records): treść z chwili złożenia + status wyniku TU + status przekazania do TU,
//  - zmiana (changes): zmiana wariantu albo rezygnacja, z własnym przekazaniem i wynikiem TU,
//  - stan ochrony nie jest polem: wylicza go currentState()/coverage() z deklaracji i przyjętych zmian.
// Wynik TU można zasymulować wyłącznie dla pozycji przekazanych w eksporcie TU.

export const TODAY = '2026-11-02';
export const EFFECTIVE = '2026-12-01';
export const TENANT = 'auto-demo';
export const EMPLOYER = {id: TENANT, nip: 'DEMO-NIP-0001', name: 'Auto Demo sp. z o.o.', eligible: 200, asOf: '2026-11-01'};
export const ME = 'P-131';
export const ME_EMPLOYEE_ID = 'AD-131';
export const DOC_VERSION = 'DEMO-DOK-2026.1';
export const SCHEMA = 2;

export const PLANS = [
  {id:'basic',name:'Podstawowy',price:60,tag:'Dobry początek',life:50000,hospital:40,illness:5000,desc:'Najważniejsze świadczenia w jednym pakiecie.'},
  {id:'plus',name:'Rozszerzony',price:90,tag:'Więcej możliwości',life:100000,hospital:70,illness:10000,desc:'Wyższe świadczenia dla Ciebie i Twoich bliskich.'},
  {id:'max',name:'Kompletny',price:120,tag:'Najszerszy wariant demo',life:150000,hospital:100,illness:20000,desc:'Najwyższe kwoty świadczeń w tym porównaniu.'}
];
export const plan = id => PLANS.find(p => p.id === id) || PLANS[1];
export const money = n => new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(n)+' zł';
export const date = d => d ? new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Warsaw'}).format(new Date(d+'T12:00:00Z')) : '—';
export const shortDate = d => d ? d.slice(8,10).replace(/^0/,'')+'.'+d.slice(5,7) : '';

export function freshState() {
  const first=['Julia','Michał','Karolina','Piotr','Natalia','Tomasz','Alicja','Adam','Joanna','Mateusz','Anna','Łukasz'];
  const base=(i)=>({tenant:TENANT,personId:'P-'+i,payerId:'P-'+i,employeeId:'AD-'+String(i).padStart(3,'0'),email:'osoba'+i+'@example.com',kind:'employee',beneficiaries:[],version:'AUTO-2026.1'});
  const records = Array.from({length:126},(_,k)=>{const i=k+1;return {...base(i),id:'D-'+String(i).padStart(4,'0'),name:first[k%12]+' '+(k<12?'Demo':'Testowa '+i),planId:PLANS[k%3].id,status:'accepted',transmission:'sent',effective:'2026-10-01',created:'2026-09-20'};});
  for(let i=127;i<=130;i++)records.push({...base(i),id:'D-'+String(i).padStart(4,'0'),name:first[(i-1)%12]+' Testowa',planId:PLANS[i%3].id,status:'pending',transmission:'new',effective:EFFECTIVE,created:TODAY});
  return {schema:SCHEMA,rev:0,profile:null,step:0,verified:false,selectedPlan:'plus',records,changes:[],invites:[],exports:[],audit:[],beneficiaries:[{name:'Marta Demo',share:100}],consents:{},draftId:null};
}

const nextId=(prefix,list,pad=0)=>{const n=list.reduce((m,x)=>Math.max(m,Number(String(x.id).split('-').pop())||0),0)+1;return prefix+(pad?String(n).padStart(pad,'0'):n);};
export function event(s,type,recordId,detail='',actor='system') {s.audit.unshift({id:nextId('LOG-',s.audit),at:new Date().toISOString(),actor,type,recordId,detail});}

const personRecords=(s,personId)=>s.records.filter(r=>r.personId===personId&&r.tenant===TENANT);
// Najnowsza deklaracja pracownika demo (po odrzuceniu lub zakończeniu może istnieć kolejna wersja).
export function employeeRecord(s){const list=personRecords(s,ME).filter(r=>r.kind==='employee');return list[list.length-1];}
export function payerRecord(s,r){const list=personRecords(s,r.payerId).filter(x=>x.kind==='employee');return list[list.length-1];}

const acceptedChanges=(s,r)=>s.changes.filter(c=>c.recordId===r.id&&c.status==='accepted').sort((a,b)=>a.effective.localeCompare(b.effective)||a.id.localeCompare(b.id,undefined,{numeric:true}));
export const endChange=(s,r)=>acceptedChanges(s,r).find(c=>c.type==='cancel');
export const pendingChange=(s,r)=>s.changes.find(c=>c.recordId===r.id&&c.status==='pending');

// Wariant obowiązujący w okresie (period) albo, bez okresu, wariant po wszystkich przyjętych zmianach.
export function planAt(s,r,period=null){let p=r.planId;for(const c of acceptedChanges(s,r)){if(period&&c.effective>period)break;if(c.type==='cancel')return null;p=c.planId;}return p;}

export function coverage(s,r,period){
  if(r.status!=='accepted'||r.effective>period)return null;
  const p=planAt(s,r,period);if(!p)return null;
  if(r.kind==='family'){const payers=personRecords(s,r.payerId).filter(x=>x.kind==='employee');if(!payers.some(x=>coverage(s,x,period)))return null;}
  return plan(p);
}

// Jeden stan dla wszystkich widoków: pracownik, kadry, eksporty.
export function currentState(s,r){
  const end=endChange(s,r),pend=pendingChange(s,r);
  let status;
  if(r.status==='rejected')status='rejected';
  else if(r.status==='pending')status='pending';
  else if(end)status='ended';
  else if(r.kind==='family'&&!payerActive(s,r))status='ended';
  else status=r.effective>TODAY?'future':'active';
  const planId=r.status==='accepted'?(planAt(s,r)||planBeforeEnd(s,r)):r.planId;
  return {status,planId,plan:plan(planId),effective:r.effective,endsFrom:end?.effective||null,pendingChange:pend||null,transmission:r.transmission};
}
function planBeforeEnd(s,r){let p=r.planId;for(const c of acceptedChanges(s,r)){if(c.type==='cancel')break;p=c.planId;}return p;}
function payerActive(s,r){const p=payerRecord(s,r);return !!p&&p.status!=='rejected'&&!endChange(s,p);}

export function validateBeneficiaries(b){return Array.isArray(b)&&b.length>0&&b.every(x=>String(x?.name??'').trim().length>2&&Number(x.share)>0)&&Math.abs(b.reduce((a,x)=>a+Number(x.share),0)-100)<.001;}

export function submitDeclaration(s,{familyInviteId,familyConsents}={}) {
  let p,kind='employee',personId=ME,payerId=ME,employeeId=ME_EMPLOYEE_ID,planId=s.selectedPlan,previousId=null,relation=null,consents;
  if(familyInviteId){
    const invite=s.invites.find(i=>i.id===familyInviteId);
    if(!invite||invite.status==='joined')throw Error('Zaproszenie jest niedostępne.');
    const payer=employeeRecord(s);
    if(!payer||payer.status==='rejected'||endChange(s,payer))throw Error('Deklaracja płatnika jest odrzucona lub zakończona. Zaproszenie nie jest aktywne.');
    if(!familyConsents?.adult||!familyConsents?.docs)throw Error('Członek rodziny musi potwierdzić pełnoletność i zapoznanie się z dokumentami.');
    p={name:invite.name,email:invite.email};kind='family';personId=invite.id;planId=invite.planId;relation=invite.relation||null;
    consents={adult:true,docs:true,docVersion:DOC_VERSION,at:new Date().toISOString(),payrollAmount:plan(planId).price,payer:payerId};
    invite.status='joined';
  } else {
    if(!s.verified||!s.profile)throw Error('Najpierw zweryfikuj konto demo.');
    const last=employeeRecord(s);
    if(last&&last.status!=='rejected'&&!endChange(s,last))return last;
    if(!validateBeneficiaries(s.beneficiaries))throw Error('Wskaż co najmniej jednego uposażonego; udziały muszą sumować się do 100%.');
    if(!['documents','payroll','statement'].every(k=>s.consents[k]))throw Error('Potwierdź wymagane oświadczenia demo.');
    if(s.consents.payrollPlanId&&s.consents.payrollPlanId!==planId)throw Error('Wariant zmienił się po zgodzie na potrącenie. Potwierdź zgodę ponownie.');
    p=s.profile;previousId=last?.id||null;
    consents={...s.consents,payrollAmount:plan(planId).price,payrollPlanId:planId,docVersion:DOC_VERSION};
  }
  const r={id:nextId('D-',s.records,4),tenant:TENANT,personId,payerId,employeeId,name:p.name,email:p.email,kind,relation,planId,status:'pending',transmission:'new',effective:EFFECTIVE,created:TODAY,beneficiaries:kind==='employee'?structuredClone(s.beneficiaries):[],version:'AUTO-2026.1',submittedAt:new Date().toISOString(),consents,previousId};
  s.records.push(r);
  event(s,previousId?'Złożenie poprawionej deklaracji':'Złożenie deklaracji',r.id,'Do przekazania do TU · demo'+(previousId?' · zastępuje '+previousId:''),kind==='family'?'członek rodziny':'pracownik');
  if(kind==='employee')s.step=5;
  return r;
}

export function confirm(s,id,accepted,reason='') {
  const r=s.records.find(r=>r.id===id&&r.tenant===TENANT);
  if(!r||r.status!=='pending')throw Error('Ta deklaracja nie oczekuje na decyzję.');
  if(r.transmission!=='sent')throw Error('Najpierw przygotuj eksport do TU. TU nie ocenia deklaracji, której nie otrzymało.');
  if(!accepted&&!reason.trim())throw Error('Podaj powód odrzucenia.');
  if(accepted&&r.kind==='family'&&payerRecord(s,r)?.status!=='accepted')throw Error('Najpierw potwierdź deklarację pracownika będącego płatnikiem.');
  r.status=accepted?'accepted':'rejected';
  r.confirmation={id:'TU-DEMO-'+id,date:TODAY,reason:accepted?'Przyjęto w symulacji':reason,simulated:true};
  event(s,accepted?'Potwierdzenie TU — symulacja':'Odrzucenie TU — symulacja',id,r.confirmation.reason,'TU (symulacja)');
  return r;
}

export function requestChange(s,type,planId){
  const r=employeeRecord(s);
  if(!r||r.status!=='accepted')throw Error('Zmiany są dostępne po przyjęciu deklaracji przez TU w demo.');
  if(endChange(s,r))throw Error('Ochrona została zakończona. Zmiana nie jest możliwa.');
  if(pendingChange(s,r))throw Error('Masz już zmianę oczekującą na potwierdzenie.');
  if(!['variant','cancel'].includes(type))throw Error('Nieznany typ zmiany.');
  if(type==='variant'&&(!PLANS.some(p=>p.id===planId)||planId===planAt(s,r)))throw Error('Wybierz inny wariant niż obowiązujący.');
  const mk=(rec,extra)=>{const c={id:nextId('ZM-',s.changes),tenant:TENANT,recordId:rec.id,type,planId:type==='variant'?planId:planAt(s,rec),effective:EFFECTIVE,status:'pending',transmission:'new',created:TODAY,...extra};s.changes.push(c);return c;};
  const c=mk(r,{});
  event(s,'Zgłoszenie zmiany',c.id,type==='cancel'?'Rezygnacja · do przekazania do TU':'Zmiana wariantu · do przekazania do TU','pracownik');
  if(type==='cancel'){
    // Rezygnacja płatnika kończy finansowanie rodziny: jawne zdarzenie dla TU, nie ciche wygaszenie.
    for(const f of s.records.filter(x=>x.kind==='family'&&x.payerId===r.personId&&x.status==='accepted'&&!endChange(s,x)&&!pendingChange(s,x))){
      const fc=mk(f,{type:'cancel',reason:'payer_ended',parentId:c.id});
      event(s,'Zakończenie ochrony rodziny',fc.id,'Rezygnacja płatnika '+r.id+' · do przekazania do TU','system');
    }
  }
  return c;
}

export function confirmChange(s,id){
  const c=s.changes.find(c=>c.id===id&&c.tenant===TENANT);
  if(!c||c.status!=='pending')throw Error('Zmiana nie oczekuje na potwierdzenie.');
  if(c.transmission!=='sent')throw Error('Najpierw przygotuj eksport do TU. TU nie potwierdza zmiany, której nie otrzymało.');
  c.status='accepted';c.confirmation='TU-DEMO-'+id;
  event(s,'Potwierdzenie zmiany — symulacja',id,'Skuteczna od '+c.effective,'TU (symulacja)');
  return c;
}

export function payrollRows(s,period){
  const payers=new Map();
  for(const r of s.records.filter(r=>r.tenant===TENANT)){
    const p=coverage(s,r,period);if(!p)continue;
    const payer=payerRecord(s,r);if(!payer)continue;
    if(!payers.has(payer.personId))payers.set(payer.personId,{employeeId:payer.employeeId,name:payer.name,own:0,family:0,total:0,period});
    const row=payers.get(payer.personId);row[r.kind==='family'?'family':'own']+=p.price;row.total+=p.price;
  }
  return [...payers.values()];
}

export function csv(rows){return '﻿'+rows.map(r=>r.map(v=>{let t=String(v??'');if(/^\s*[=+@\-\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');}

const RELATION={'Małżonek / małżonka':'MALZONEK','Partner / partnerka':'PARTNER','Pełnoletnie dziecko':'DZIECKO'};
export function tuQueue(s){
  const decl=s.records.filter(r=>r.tenant===TENANT&&r.status==='pending'&&r.transmission==='new').map(r=>({kind:'declaration',ref:r}));
  const chg=s.changes.filter(c=>c.tenant===TENANT&&c.status==='pending'&&c.transmission==='new').map(c=>({kind:'change',ref:c}));
  return [...decl,...chg];
}
export function makeExport(s,type,period){
  let rows,items=[];
  if(type==='payroll'){
    rows=[['OKRES','ID_PRACODAWCY','ID_PRACOWNIKA','PRACOWNIK_DEMO','SKLADKA_PRACOWNIKA_PLN','SKLADKA_RODZINY_PLN','SUMA_PLN'],...payrollRows(s,period).map(r=>[period.slice(0,7),TENANT,r.employeeId,r.name,r.own.toFixed(2).replace('.',','),r.family.toFixed(2).replace('.',','),r.total.toFixed(2).replace('.',',')])];
  } else {
    // Każda pozycja trafia do TU raz. Ponowne pobranie pliku nie tworzy nowych pozycji.
    rows=[['FORMAT_DEMO_NIE_PZU','TYP_ZDARZENIA','ID_ZDARZENIA','ID_DEKLARACJI','ID_PRACODAWCY','ID_OSOBY','NR_KADROWY_PLATNIKA','RELACJA','WARIANT','DATA_WNIOSKOWANA']];
    for(const it of tuQueue(s)){
      const r=it.kind==='declaration'?it.ref:s.records.find(x=>x.id===it.ref.recordId);
      const payer=payerRecord(s,r);
      const typ=it.kind==='declaration'?'PRZYSTAPIENIE':it.ref.type==='cancel'?'REZYGNACJA':'ZMIANA_WARIANTU';
      rows.push(['IBCP-TU-DEMO-v2',typ,it.ref.id,r.id,TENANT,r.personId,payer?.employeeId||'',r.kind==='family'?(RELATION[r.relation]||'RODZINA'):'PRACOWNIK',typ==='REZYGNACJA'?'':plan(it.kind==='declaration'?r.planId:it.ref.planId).name,it.ref.effective]);
      it.ref.transmission='sent';items.push({kind:it.kind,ref:it.ref.id});
    }
  }
  const exp={id:nextId('EXP-',s.exports),type,period:type==='payroll'?period:null,count:rows.length-1,items,created:new Date().toISOString(),content:csv(rows)};
  s.exports.unshift(exp);
  event(s,'Przygotowanie eksportu',exp.id,type==='payroll'?'Lista płac · '+exp.count+' płatników':'TU · '+exp.count+' pozycji przekazanych do TU (symulacja). Wynik TU osobno.','kadry');
  return exp;
}
