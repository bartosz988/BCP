// IBCP-A01-20261102-8da9a5d — testy regresyjne z audytu Claude'a.
// Na commicie 8da9a5d 13 z tych testów nie przechodziło (dowód błędów). Po poprawkach przechodzą wszystkie.
// Pomocnicze send()/conf(): wynik TU tylko dla pozycji przekazanych w eksporcie (AUD-001).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from './dist/core.mjs';
const {freshState,submitDeclaration,confirm,confirmChange,requestChange,payrollRows,makeExport,coverage,EFFECTIVE}=core;
function ready(){const s=freshState();s.profile={name:'Alex Demo',email:'alex.demo@example.com'};s.verified=true;s.consents={documents:true,payroll:true,statement:true};return s;}
const fam=(s,id='FAM-1',planId='basic')=>{s.invites.push({id,name:'Marta Demo',email:id.toLowerCase()+'@example.com',planId,status:'prepared'});return submitDeclaration(s,{familyInviteId:id,familyConsents:{adult:true,docs:true}});};
const send=s=>makeExport(s,'tu',EFFECTIVE);
const conf=(s,c)=>{send(s);return confirmChange(s,c.id);};
const accepted=s=>{const r=submitDeclaration(s);makeExport(s,'tu',EFFECTIVE);confirm(s,r.id,true);return r;};

test('AUD-002 po odrzuceniu pracownik może złożyć nową wersję deklaracji',()=>{const s=ready(),r=submitDeclaration(s);send(s);confirm(s,r.id,false,'Brak danych');const r2=submitDeclaration(s);assert.notEqual(r2.id,r.id);assert.equal(r2.status,'pending');});
test('AUD-002 rodzina nie może przystąpić, gdy deklaracja płatnika jest odrzucona',()=>{const s=ready(),r=submitDeclaration(s);send(s);confirm(s,r.id,false,'x');assert.throws(()=>fam(s));});
test('AUD-003 zmiana wariantu porównuje z wariantem bieżącym, nie pierwotnym',()=>{const s=ready(),r=accepted(s);conf(s,requestChange(s,'variant','max'));assert.doesNotThrow(()=>requestChange(s,'variant','plus'));});
test('AUD-003 nie można zgłosić zmiany na wariant już obowiązujący',()=>{const s=ready(),r=accepted(s);conf(s,requestChange(s,'variant','max'));assert.throws(()=>requestChange(s,'variant','max'));});
test('AUD-004 po przyjętej rezygnacji nie można zgłosić kolejnej rezygnacji ani zmiany wariantu',()=>{const s=ready(),r=accepted(s);conf(s,requestChange(s,'cancel'));assert.throws(()=>requestChange(s,'cancel'));assert.throws(()=>requestChange(s,'variant','max'));});
test('AUD-004 rezygnacja płatnika tworzy jawne zdarzenie dla każdej przyjętej deklaracji rodziny',()=>{const s=ready(),r=submitDeclaration(s),f=fam(s);makeExport(s,'tu',EFFECTIVE);confirm(s,r.id,true);confirm(s,f.id,true);conf(s,requestChange(s,'cancel'));assert.ok(s.changes.some(c=>c.recordId===f.id&&c.type==='cancel'),'brak zdarzenia zakończenia ochrony rodziny');});
test('AUD-001 TU nie może przyjąć deklaracji, której nie przekazano w eksporcie',()=>{const s=ready(),r=submitDeclaration(s);assert.throws(()=>confirm(s,r.id,true));});
test('AUD-001 zmiana i rezygnacja trafiają do eksportu TU',()=>{const s=ready(),r=accepted(s);const c=requestChange(s,'cancel');const e=makeExport(s,'tu',EFFECTIVE);assert.ok(e.content.includes(c.id),'eksport TU nie zawiera zmiany');});
test('AUD-001 TU nie może potwierdzić zmiany, której nie przekazano w eksporcie',()=>{const s=ready(),r=accepted(s);const c=requestChange(s,'variant','basic');assert.throws(()=>confirmChange(s,c.id));});
test('AUD-009 drugi eksport TU nie powtarza pozycji już przekazanych',()=>{const s=ready();submitDeclaration(s);makeExport(s,'tu',EFFECTIVE);const b=makeExport(s,'tu',EFFECTIVE);assert.equal(b.count,0);});
test('AUD-009 eksport TU nie zawiera wewnętrznego identyfikatora ME',()=>{const s=ready();submitDeclaration(s);const e=makeExport(s,'tu',EFFECTIVE);assert.equal(/"ME"/.test(e.content),false);});
test('AUD-005 zgoda na potrącenie zapisuje kwotę i wariant, których dotyczy',()=>{const s=ready();s.selectedPlan='max';const r=submitDeclaration(s);assert.equal(r.consents.payrollAmount,120);});
test('AUD-006 deklaracja rodziny zapisuje oświadczenia członka rodziny',()=>{const s=ready();submitDeclaration(s);const f=fam(s);assert.notDeepEqual(f.consents,{demo:true});});
test('AUD-012 rodzina traci ochronę, gdy płatnik nie ma ochrony (strażnik mutacji M1)',()=>{const s=ready(),r=submitDeclaration(s),f=fam(s);makeExport(s,'tu',EFFECTIVE);confirm(s,r.id,true);confirm(s,f.id,true);r.status='rejected';assert.equal(coverage(s,f,EFFECTIVE),null);});
test('AUD-012 zmiana z przyszłą datą nie działa wstecz (strażnik mutacji M4)',()=>{const s=ready(),r=accepted(s);const c=requestChange(s,'variant','max');c.effective='2027-01-01';c.status='accepted';assert.equal(payrollRows(s,EFFECTIVE).find(x=>x.employeeId===r.employeeId).total,90);});
test('AUD-012 CSV neutralizuje +, @ i - na początku pola (strażnik mutacji M2/M3)',()=>{const out=core.csv([['+1','@SUM(A1)','-2+3']]);for(const v of ['+1','@SUM(A1)','-2+3'])assert.ok(out.includes('"\''+v+'"'),v);});
test('AUD-012 uposażony z pustą nazwą jest odrzucany (strażnik mutacji M5)',()=>{assert.equal(core.validateBeneficiaries([{name:'  ',share:100}]),false);});
test('AUD-012 decyzja TU nie dotyka deklaracji innego pracodawcy (strażnik mutacji M8)',()=>{const s=ready();s.records.push({...s.records[0],id:'OBCY-1',tenant:'inny-pracodawca',status:'pending',transmission:'sent'});assert.throws(()=>confirm(s,'OBCY-1',true));assert.equal(s.records.find(r=>r.id==='OBCY-1').status,'pending');});
