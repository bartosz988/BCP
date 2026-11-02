export const TODAY = '2026-11-02';
export const EFFECTIVE = '2026-12-01';
export const TENANT = 'auto-demo';
export const PLANS = [
  {id:'basic',name:'Podstawowy',price:60,tag:'Dobry początek',life:50000,hospital:40,illness:5000,desc:'Najważniejsze świadczenia w jednym pakiecie.'},
  {id:'plus',name:'Rozszerzony',price:90,tag:'Więcej możliwości',life:100000,hospital:70,illness:10000,desc:'Wyższe świadczenia dla Ciebie i Twoich bliskich.'},
  {id:'max',name:'Kompletny',price:120,tag:'Najszerszy wariant demo',life:150000,hospital:100,illness:20000,desc:'Najwyższe kwoty świadczeń w tym porównaniu.'}
];
export const plan = id => PLANS.find(p => p.id === id) || PLANS[1];
export const money = n => new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(n)+' zł';
export const date = d => d ? new Intl.DateTimeFormat('pl-PL',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Warsaw'}).format(new Date(d+'T12:00:00Z')) : '—';
export function freshState() {
 const first=['Julia','Michał','Karolina','Piotr','Natalia','Tomasz','Alicja','Adam','Joanna','Mateusz','Anna','Łukasz'];
 const records = Array.from({length:126},(_,i)=>({id:'D-'+String(i+1).padStart(4,'0'),tenant:TENANT,personId:'P-'+(i+1),payerId:'P-'+(i+1),employeeId:'AD-'+String(i+1).padStart(3,'0'),name:first[i%12]+' '+(i<12?'Demo':'Testowa '+(i+1)),email:'osoba'+(i+1)+'@example.com',kind:'employee',planId:PLANS[i%3].id,status:'accepted',effective:'2026-10-01',created:'2026-09-20',beneficiaries:[],version:'AUTO-2026.1'}));
 for(let i=127;i<=130;i++)records.push({id:'D-'+String(i).padStart(4,'0'),tenant:TENANT,personId:'P-'+i,payerId:'P-'+i,employeeId:'AD-'+i,name:first[(i-1)%12]+' Testowa',email:'osoba'+i+'@example.com',kind:'employee',planId:PLANS[i%3].id,status:'pending',effective:EFFECTIVE,created:TODAY,beneficiaries:[],version:'AUTO-2026.1'});
 return {schema:1,profile:null,step:0,verified:false,selectedPlan:'plus',records,changes:[],invites:[],exports:[],audit:[],beneficiaries:[{name:'Marta Demo',share:100}],consents:{},draftId:null};
}
export function event(s,type,recordId,detail='') {s.audit.unshift({id:'LOG-'+(s.audit.length+1),at:new Date().toISOString(),type,recordId,detail});}
export function employeeRecord(s){return s.records.find(r=>r.personId==='ME'&&r.tenant===TENANT);}
export function validateBeneficiaries(b){return b.length>0&&b.every(x=>x.name.trim().length>2&&Number(x.share)>0)&&Math.abs(b.reduce((a,x)=>a+Number(x.share),0)-100)<.001;}
export function submitDeclaration(s,{familyInviteId}={}) {
 let p,kind='employee',personId='ME',payerId='ME',employeeId='AD-131',planId=s.selectedPlan;
 if(familyInviteId){const invite=s.invites.find(i=>i.id===familyInviteId);if(!invite||invite.status==='joined')throw Error('Zaproszenie jest niedostępne.');p={name:invite.name,email:invite.email};kind='family';personId=invite.id;payerId='ME';planId=invite.planId;invite.status='joined';}
 else {if(!s.verified||!s.profile)throw Error('Najpierw zweryfikuj konto demo.');if(employeeRecord(s))return employeeRecord(s);if(!validateBeneficiaries(s.beneficiaries))throw Error('Udziały uposażonych muszą sumować się do 100%.');if(!['documents','payroll','statement'].every(k=>s.consents[k]))throw Error('Potwierdź wymagane oświadczenia demo.');p=s.profile;}
 const r={id:'D-'+String(s.records.length+1).padStart(4,'0'),tenant:TENANT,personId,payerId,employeeId,name:p.name,email:p.email,kind,planId,status:'pending',effective:EFFECTIVE,created:TODAY,beneficiaries:kind==='employee'?structuredClone(s.beneficiaries):[],version:'AUTO-2026.1',submittedAt:new Date().toISOString(),consents:kind==='employee'?{...s.consents}:{demo:true}};
 s.records.push(r);event(s,'Złożenie deklaracji',r.id,'Oczekuje na potwierdzenie TU · demo');if(kind==='employee')s.step=5;return r;
}
export function confirm(s,id,accepted,reason='') {
 const r=s.records.find(r=>r.id===id&&r.tenant===TENANT);if(!r||r.status!=='pending')throw Error('Ta deklaracja nie oczekuje na decyzję.');
 if(!accepted&&!reason.trim())throw Error('Podaj powód odrzucenia.');
 if(accepted&&r.kind==='family'&&employeeRecord(s)?.status!=='accepted')throw Error('Najpierw potwierdź deklarację pracownika będącego płatnikiem.');
 r.status=accepted?'accepted':'rejected';r.confirmation={id:'TU-DEMO-'+id,date:TODAY,reason:accepted?'Przyjęto w symulacji':reason,simulated:true};event(s,accepted?'Potwierdzenie TU — symulacja':'Odrzucenie TU — symulacja',id,r.confirmation.reason);return r;
}
export function requestChange(s,type,planId){const r=employeeRecord(s);if(!r||r.status!=='accepted')throw Error('Zmiany są dostępne po przyjęciu deklaracji przez TU w demo.');if(s.changes.some(c=>c.recordId===r.id&&c.status==='pending'))throw Error('Masz już zmianę oczekującą na potwierdzenie.');if(type==='variant'&&(!PLANS.some(p=>p.id===planId)||planId===r.planId))throw Error('Wybierz inny wariant.');const c={id:'ZM-'+(s.changes.length+1),tenant:TENANT,recordId:r.id,type,planId:planId||r.planId,effective:EFFECTIVE,status:'pending',created:TODAY};s.changes.push(c);event(s,'Zgłoszenie zmiany',c.id,type==='cancel'?'Rezygnacja · oczekuje na TU':'Zmiana wariantu · oczekuje na TU');return c;}
export function confirmChange(s,id){const c=s.changes.find(c=>c.id===id&&c.tenant===TENANT);if(!c||c.status!=='pending')throw Error('Zmiana nie oczekuje na potwierdzenie.');c.status='accepted';c.confirmation='TU-DEMO-'+id;event(s,'Potwierdzenie zmiany — symulacja',id,'Skuteczna od '+c.effective);}
export function coverage(s,r,period){if(r.status!=='accepted'||r.effective>period)return null;let p=r.planId;for(const c of s.changes.filter(c=>c.recordId===r.id&&c.status==='accepted'&&c.effective<=period)){if(c.type==='cancel')return null;p=c.planId;}if(r.kind==='family'){const parent=s.records.find(x=>x.personId===r.payerId&&x.kind==='employee');if(!parent||!coverage(s,parent,period))return null;}return plan(p);}
export function payrollRows(s,period){const payers=new Map();for(const r of s.records.filter(r=>r.tenant===TENANT)){const p=coverage(s,r,period);if(!p)continue;const payer=s.records.find(x=>x.personId===r.payerId&&x.kind==='employee');if(!payer)continue;if(!payers.has(payer.personId))payers.set(payer.personId,{employeeId:payer.employeeId,name:payer.name,own:0,family:0,total:0,period});const row=payers.get(payer.personId);row[r.kind==='family'?'family':'own']+=p.price;row.total+=p.price;}return [...payers.values()];}
export function csv(rows){return '\uFEFF'+rows.map(r=>r.map(v=>{let t=String(v??'');if(/^[=+@\-\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');}
export function makeExport(s,type,period){let rows;if(type==='payroll'){rows=[['OKRES','ID_PRACOWNIKA','PRACOWNIK_DEMO','SKLADKA_PRACOWNIKA_PLN','SKLADKA_RODZINY_PLN','SUMA_PLN'],...payrollRows(s,period).map(r=>[period.slice(0,7),r.employeeId,r.name,r.own.toFixed(2).replace('.',','),r.family.toFixed(2).replace('.',','),r.total.toFixed(2).replace('.',',')])];}else{rows=[['FORMAT_DEMO_NIE_PZU','ID_DEKLARACJI','ID_OSOBY','ID_PLATNIKA','TYP','WARIANT','DATA_WNIOSKOWANA','STATUS'],...s.records.filter(r=>r.tenant===TENANT&&r.status==='pending').map(r=>['IBCP-TU-DEMO-v1',r.id,r.personId,r.payerId,r.kind,plan(r.planId).name,r.effective,'OCZEKUJE_NA_TU'])];}const exp={id:'EXP-'+(s.exports.length+1),type,period,count:rows.length-1,created:new Date().toISOString(),content:csv(rows)};s.exports.unshift(exp);event(s,'Przygotowanie eksportu',exp.id,type==='payroll'?'Lista płac · '+exp.count+' płatników':'TU · '+exp.count+' deklaracji. Bez zmiany ich statusu.');return exp;}
