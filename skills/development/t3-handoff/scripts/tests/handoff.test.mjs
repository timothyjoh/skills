import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Ledger, start, status, wait, relay, reply, rename, sessionTitle, handoffPrompt } from '../delegation.mjs';
import { projects, selectProject, stateDb } from '../catalog.mjs';
import { chooseModel } from '../runtime.mjs';
import { protocolV1, classifyV1, parentReadyV1 } from '../protocol-v1.mjs';
import { protocolV2, classifyV2, parentReadyV2 } from '../protocol-v2.mjs';
import { extractReports, formatReport } from '../reports.mjs';

const providers=[{instanceId:'claudeAgent',enabled:true,installed:true,status:'ready',auth:'authenticated',models:[{slug:'sample-claude-model',isDefault:true,optionIds:['effort']}]},{instanceId:'codex',enabled:true,installed:true,status:'ready',auth:null,models:[{slug:'sample-codex-model',isDefault:true,optionIds:['reasoningEffort']}]}];
const config={providers:providers.map(p=>({...p,auth:p.auth?{status:p.auth}:undefined,models:p.models.map(m=>({slug:m.slug,isDefault:m.isDefault,capabilities:{optionDescriptors:m.optionIds.map(id=>({id}))}}))}))};
const block=(seq,status,extra='')=>'```t3-report\nhandoff: HANDOFF\nseq: '+seq+'\nstatus: '+status+'\n'+extra+'```';

// A fake T3 server for one protocol. `effects` holds each accepted command once,
// so a replayed commandId does not count twice.
function fixture(t,protocol=1) {
  const root=mkdtempSync(resolve(tmpdir(),'t3-handoff-test-'));
  mkdirSync(resolve(root,'userdata'));mkdirSync(resolve(root,'sample-app'));
  const db=new DatabaseSync(resolve(root,`userdata/${protocol===2?'statev2':'state'}.sqlite`));
  db.exec('CREATE TABLE projection_projects(project_id TEXT,title TEXT,workspace_root TEXT,default_model_selection_json TEXT,deleted_at TEXT)');
  db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,NULL)').run('p1','Sample App',resolve(root,'sample-app'),JSON.stringify({instanceId:'claudeAgent',model:'sample-claude-model'}));db.close();
  const ledger=new Ledger(resolve(root,'ledger.sqlite'));t.after(()=>{ledger.close();rmSync(root,{recursive:true,force:true});});
  const seen=new Set(), effects=[];
  const client={
    shell:{projects:[{id:'p1',workspaceRoot:resolve(root,'sample-app')}],threads:[]},
    readShell:async()=>client.shell,
    readThread:async()=>({thread:client.detail}),
    request:async(method,payload)=>{
      if(method==='server.getConfig') return config;
      if(method==='orchestration.getThreadProjection') return client.projection;
      assert.ok(['orchestration.dispatchCommand','orchestration.launchThread'].includes(method));
      if(!seen.has(payload.commandId)){seen.add(payload.commandId);effects.push({method,...payload});}
      return {sequence:effects.length};
    }};
  const api=protocol===2?protocolV2(client):protocolV1(client);
  return {root,ledger,effects,client,runtime:{client,api,protocol,home:root,state:root,url:'http://127.0.0.1:3773',environmentId:'env'}};
}
const spec={project:'Sample App',kind:'research',key:'same-work',title:'Check the sample',prompt:'Return a test word',brief:'',provider:'',model:'',effort:'',parent:''};
const textOf=e=>e.message?.text??e.initialMessage?.text??e.text;

test('catalog excludes deleted projects and rejects missing workspaces',t=>{
 const f=fixture(t),db=new DatabaseSync(resolve(f.root,'userdata/state.sqlite'));
 db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,?)').run('p2','Deleted','/missing',null,'today');
 db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,NULL)').run('p3','Missing','/missing',null);db.close();
 const all=projects(f.root);assert.equal(all.length,2);assert.throws(()=>selectProject(all,'Missing'),/does not exist/);
 assert.equal(selectProject(all,'sample-app').id,'p1');assert.throws(()=>selectProject(all,'nonexistent'),/No registered/);
});
test('catalog reads statev2.sqlite when the server uses protocol 2',t=>{
 const f=fixture(t,2);
 assert.equal(stateDb(f.root),resolve(f.root,'userdata/statev2.sqlite'));
 assert.equal(stateDb(f.root,1),resolve(f.root,'userdata/state.sqlite'));
 assert.equal(projects(f.root,{protocol:2})[0].id,'p1');
});
test('ambiguous project names never choose first candidate',()=>{
 assert.throws(()=>selectProject([{id:'1',title:'Duplicate',workspace:'/a',available:true},{id:'2',title:'Duplicate',workspace:'/b',available:true}],'Duplicate'),/Ambiguous/);
});

test('session titles carry the handoff prefix once and are required',()=>{
 assert.equal(sessionTitle('Fix E4-1080 date rounding'),'👋 Fix E4-1080 date rounding');
 assert.equal(sessionTitle('👋  Fix   it'),'👋 Fix it');
 assert.throws(()=>sessionTitle('  '),/--title/);
 assert.ok(sessionTitle('x'.repeat(200)).length<=80);
});
test('handoff prompt names the report skill, its fallback path and the coordinator brief',()=>{
 const p=handoffPrompt({kind:'implementation',id:'H1',threadId:'T1',parent:'',brief:'Report each test fix.',prompt:'Do the work.',reportSkill:'/skills/t3-report/SKILL.md'});
 assert.match(p,/Handoff ID: H1/);assert.match(p,/t3-report skill/);assert.match(p,/read \/skills\/t3-report\/SKILL\.md/);
 assert.match(p,/Reporting brief: Report each test fix\./);assert.match(p,/outside T3/);assert.ok(p.endsWith('Do the work.'));
 const none=handoffPrompt({kind:'research',id:'H1',threadId:'T1',parent:'P1',brief:'',prompt:'x',reportSkill:null});
 assert.match(none,/Reporting brief: none/);assert.match(none,/T3 conversation P1/);assert.doesNotMatch(none,/If that skill is not available/);
});

for (const protocol of [1,2]) {
 test(`protocol ${protocol}: launch retries keep one thread, one message and a fixed title`,async t=>{
  const f=fixture(t,protocol);const a=await start(f.runtime,f.ledger,spec),b=await start(f.runtime,f.ledger,spec);
  assert.equal(a.id,b.id);assert.equal(a.title,'👋 Check the sample');
  assert.equal(f.effects.length,protocol===2?1:2);
  const create=f.effects[0];assert.equal(create.title,'👋 Check the sample');assert.equal(create.runtimeMode,'auto');
  if(protocol===2) {assert.equal(create.method,'orchestration.launchThread');assert.equal(create.generateTitle,false);assert.equal(create.initialMessage.messageId,f.ledger.get(a.id).messageId);}
  else assert.equal(f.effects[1].message.messageId,f.ledger.get(a.id).messageId);
  assert.match(textOf(f.effects.at(-1)),new RegExp(`Handoff ID: ${a.id}`));
  await assert.rejects(start(f.runtime,f.ledger,{...spec,prompt:'different'}),/different request/);
 });
 test(`protocol ${protocol}: an ambiguous launch response reuses persisted IDs`,async t=>{
  const f=fixture(t,protocol);const original=f.client.request;let once=true;
  f.client.request=async(method,payload)=>{const r=await original(method,payload);if(once && method!=='server.getConfig' && textOf(payload)){once=false;throw Error('connection lost after accepted');}return r;};
  await assert.rejects(start(f.runtime,f.ledger,spec),/connection lost/);
  const r=await start(f.runtime,f.ledger,spec);assert.equal(r.id,f.ledger.byKey(spec.key).id);assert.equal(f.effects.length,protocol===2?1:2);
 });
 test(`protocol ${protocol}: a missing title stops dispatch before anything is saved`,async t=>{
  const f=fixture(t,protocol);
  await assert.rejects(start(f.runtime,f.ledger,{...spec,title:''}),/--title/);
  assert.equal(f.effects.length,0);assert.equal(f.ledger.byKey(spec.key),undefined);
 });
 test(`protocol ${protocol}: every runtime mode is sent; an invalid one never dispatches`,async t=>{
  for(const runtimeMode of ['auto','auto-accept-edits','approval-required','full-access']) {
   const f=fixture(t,protocol),child=await start(f.runtime,f.ledger,{...spec,key:`mode-${runtimeMode}`,runtimeMode});
   assert.equal(child.runtimeMode,runtimeMode);assert.ok(f.effects.every(c=>c.runtimeMode===runtimeMode));
  }
  const f=fixture(t,protocol);
  await assert.rejects(start(f.runtime,f.ledger,{...spec,runtimeMode:'supervised'}),/runtime mode/);assert.equal(f.effects.length,0);
 });
 test(`protocol ${protocol}: live project mismatch stops dispatch before creating anything`,async t=>{
  const f=fixture(t,protocol);f.client.shell={projects:[{id:'p1',workspaceRoot:'/wrong'}],threads:[]};
  await assert.rejects(start(f.runtime,f.ledger,spec),/disagree/);assert.equal(f.effects.length,0);
 });
 test(`protocol ${protocol}: a busy implementation checkout is refused`,async t=>{
  const f=fixture(t,protocol);
  f.client.shell.threads=[protocol===2?{id:'x',projectId:'p1',status:'running',activeRunId:'r'}:{id:'x',projectId:'p1',latestTurn:{state:'running'}}];
  await assert.rejects(start(f.runtime,f.ledger,{...spec,kind:'implementation'}),/active sessions: x/);
 });
}

test('all task kinds use the project model; effort uses the option name the model advertises',()=>{
 const p={selection:{instanceId:'claudeAgent',model:'sample-claude-model'}};
 for (const kind of ['research','implementation','review','research-review']) assert.deepEqual(chooseModel(providers,p,kind),p.selection);
 assert.deepEqual(chooseModel(providers,p,'research',{effort:'low'}),{instanceId:'claudeAgent',model:'sample-claude-model',options:[{id:'effort',value:'low'}]});
 assert.deepEqual(chooseModel(providers,p,'research',{provider:'codex',model:'sample-codex-model',effort:'high'}),{instanceId:'codex',model:'sample-codex-model',options:[{id:'reasoningEffort',value:'high'}]});
 assert.throws(()=>chooseModel(providers,p,'research',{provider:'codex',model:'missing'}),/not available/);
 assert.throws(()=>chooseModel(providers,{selection:null},'research'),/no default model/);
 assert.throws(()=>chooseModel([{...providers[0],status:'disabled'}],p,'research'),/not available/);
});

test('reports parse in order, skip other handoffs and user text, and dedupe a repeated seq',()=>{
 const messages=[
  {id:'u',role:'user',text:block(9,'done')},
  {id:'c1',role:'assistant',source:'command',text:"cat <<'T3_REPORT'\n"+block(1,'started','next: 1 fix, 2 test\n')+'\nT3_REPORT'},
  {id:'m1',role:'assistant',text:'```t3-report\nhandoff: OTHER\nseq: 2\nstatus: done\n```'},
  {id:'c2',role:'assistant',text:block(2,'working','evidence: 12 passed\nfiles: a.ts\n')},
  {id:'m2',role:'assistant',text:block(2,'working')+'\n\n'+block(3,'done')+'\n## Changed'}];
 const r=extractReports(messages,'HANDOFF');
 assert.deepEqual(r.map(x=>[x.seq,x.status]),[[1,'started'],[2,'working'],[3,'done']]);
 assert.equal(r[1].fields.files,'a.ts');
 assert.equal(formatReport(r[1]),'#2 working | evidence: 12 passed | files: a.ts');
 assert.equal(extractReports([{id:'x',role:'assistant',text:'```t3-report\nseq: 1\nstatus: bogus\n```'}])[0].status,'working');
});

const v1task={messageId:'user1'};
const v1detail={messages:[{id:'user1',role:'user',text:'test'},{id:'answer1',role:'assistant',text:'ACK',isStreaming:false}],activities:[]};
test('protocol 1: classification keeps real answers, pending states and supersession',()=>{
 const r=classifyV1({latestTurn:{state:'completed',turnId:'turn1'}},v1detail,'user1');assert.equal(r.state,'completed');assert.equal(r.messages[0].text,'ACK');
 assert.equal(classifyV1({hasPendingApprovals:true},v1detail,'user1').state,'needs_approval');
 assert.equal(classifyV1({hasPendingUserInput:true},v1detail,'user1').state,'needs_input');
 assert.equal(classifyV1({latestTurn:{state:'error'}},v1detail,'user1').state,'failed');
 assert.equal(classifyV1({latestTurn:{state:'interrupted'}},v1detail,'user1').state,'interrupted');
 const s=classifyV1({latestTurn:{state:'completed'}},{...v1detail,messages:[...v1detail.messages,{id:'next',role:'user',text:'other'},{id:'n',role:'assistant',text:'unrelated'}]},'user1');
 assert.equal(s.state,'superseded');assert.equal(s.messages.length,1);
 assert.equal(classifyV1({},{messages:[]},'user1').state,'unknown');
 const streaming=classifyV1({latestTurn:{state:'running'}},{...v1detail,messages:[v1detail.messages[0],{id:'p',role:'assistant',text:'partial',streaming:true}]},'user1');
 assert.equal(streaming.state,'running');assert.equal(streaming.messages,undefined);
});
test('protocol 1: report commands come from completed command activities inside the window',()=>{
 const cmd=(id,at,text)=>({kind:'tool.completed',createdAt:at,payload:{itemType:'command_execution',toolCallId:id,data:{command:text}}});
 const detail={messages:[{id:'user1',role:'user',createdAt:'2026-10-05T10:00:00Z'},{id:'a',role:'assistant',text:block(2,'done'),createdAt:'2026-10-05T10:02:00Z'}],
  activities:[cmd('old','2026-10-05T09:00:00Z',block(7,'done')),cmd('t1','2026-10-05T10:01:00Z',block(1,'started')),{...cmd('t1','2026-10-05T10:01:01Z',block(1,'started')),kind:'tool.updated'}]};
 const r=classifyV1({latestTurn:{state:'completed'}},detail,'user1');
 assert.deepEqual(extractReports(r.transcript,'HANDOFF').map(x=>x.seq),[1,2]);
});
test('protocol 1: parent readiness waits for active work, requests, plans and archives',()=>{
 assert.equal(parentReadyV1({latestTurn:{state:'completed'}}),true);
 for(const p of [null,{archivedAt:'now'},{latestTurn:{state:'running'}},{session:{activeTurnId:'x'}},{hasPendingApprovals:true},{hasPendingUserInput:true},{hasActionableProposedPlan:true}]) assert.ok(!parentReadyV1(p));
});

const projection=(over={})=>({thread:{interactionMode:'default'},messages:[{id:'user1',role:'user',text:'go'}],runs:[{id:'r1',userMessageId:'user1',status:'running'}],runtimeRequests:[],turnItems:[],plans:[],...over});
test('protocol 2: run status, runtime requests and plans map to delegation states',()=>{
 assert.equal(classifyV2(projection(),'user1').state,'running');
 assert.match(classifyV2(projection({runs:[{id:'r1',userMessageId:'user1',status:'waiting'}]}),'user1').note,/background/);
 assert.equal(classifyV2(projection({runs:[]}),'user1').state,'pending');
 assert.equal(classifyV2(projection({runs:[{id:'r1',userMessageId:'user1',status:'starting'}]}),'user1').state,'pending');
 const done=classifyV2(projection({runs:[{id:'r1',userMessageId:'user1',status:'completed'}],messages:[{id:'user1',role:'user'},{id:'a',role:'assistant',text:'ACK',streaming:false},{id:'b',role:'assistant',text:'more',streaming:true}]}),'user1');
 assert.equal(done.state,'completed');assert.deepEqual(done.messages.map(m=>m.text),['ACK']);
 const q=classifyV2(projection({runtimeRequests:[{id:'q1',kind:'user_input',status:'pending'},{id:'old',kind:'user_input',status:'resolved'}],turnItems:[{type:'user_input_request',requestId:'q1',questions:[{id:'Which?',question:'Which?',options:[]}]}]}),'user1');
 assert.equal(q.state,'needs_input');assert.deepEqual(q.questions,[{requestId:'q1',questions:[{id:'Which?',question:'Which?',options:[]}]}]);
 const a=classifyV2(projection({runtimeRequests:[{id:'a1',kind:'command',status:'pending'}],turnItems:[{type:'approval_request',requestId:'a1',prompt:'rm -rf build'}]}),'user1');
 assert.equal(a.state,'needs_approval');assert.equal(a.approvals[0].prompt,'rm -rf build');
 const plan=classifyV2(projection({thread:{interactionMode:'plan'},runs:[{id:'r1',userMessageId:'user1',status:'completed'}],plans:[{id:'pl',kind:'proposed_plan',status:'active',markdown:'# Plan'}]}),'user1');
 assert.equal(plan.state,'needs_plan_review');assert.equal(plan.plans[0].markdown,'# Plan');
 const failed=classifyV2(projection({runs:[{id:'r1',userMessageId:'user1',status:'failed'}],turnItems:[{type:'error',runId:'r1',failure:{message:'quota exceeded'}}]}),'user1');
 assert.equal(failed.state,'failed');assert.equal(failed.reason,'quota exceeded');
 for(const s of ['interrupted','cancelled','rolled_back']) assert.equal(classifyV2(projection({runs:[{id:'r1',userMessageId:'user1',status:s}]}),'user1').state,'interrupted');
 assert.equal(classifyV2(projection({messages:[{id:'user1',role:'user'},{id:'u2',role:'user'}]}),'user1').state,'superseded');
 assert.equal(classifyV2(projection({messages:[]}),'user1').state,'unknown');
});
test('protocol 2: reports come from command inputs and assistant items of this run, in order',()=>{
 const item=(ordinal,type,text,runId='r1')=>({id:`i${ordinal}`,ordinal,runId,type,streaming:false,...(type==='command_execution'?{input:text}:{text})});
 const p=projection({turnItems:[item(5,'assistant_message',block(3,'done')),item(2,'command_execution',"cat <<'T3_REPORT'\n"+block(1,'started')+"\nT3_REPORT"),item(3,'reasoning','thinking about '+block(9,'done')),item(4,'command_execution','npm test'),item(1,'command_execution',block(8,'done'),'other-run'),{...item(6,'assistant_message',block(4,'done')),streaming:true}]});
 assert.deepEqual(extractReports(classifyV2(p,'user1').transcript,'HANDOFF').map(r=>r.seq),[1,3]);
});
test('protocol 2: parent readiness waits for active runs, requests, plans and archives',()=>{
 assert.equal(parentReadyV2({status:'completed',activeRunId:null,pendingRuntimeRequest:null}),true);
 assert.equal(parentReadyV2({status:'idle'}),true);
 for(const p of [null,{archivedAt:'now'},{status:'running'},{status:'waiting'},{activeRunId:'r'},{pendingRuntimeRequest:{id:'x'}},{hasActionableProposedPlan:true}]) assert.ok(!parentReadyV2(p));
});

// Child thread state for status(): a completed run with the given transcript items.
function childState(f,child,{state='completed',items=[]}={}) {
 const messageId=f.ledger.get(child.id).messageId;
 if(f.runtime.protocol===2) {
  f.client.shell.threads=[...f.client.shell.threads.filter(t=>t.id!==child.threadId),{id:child.threadId,status:state==='completed'?'completed':'running',runtimeMode:'auto',interactionMode:'default'}];
  f.client.projection=projection({messages:[{id:messageId,role:'user'}],runs:[{id:'r1',userMessageId:messageId,status:state}],
   turnItems:items.map((text,i)=>({id:`i${i}`,ordinal:i+1,runId:'r1',type:'command_execution',input:text,streaming:false}))});
 } else {
  f.client.shell.threads=[...f.client.shell.threads.filter(t=>t.id!==child.threadId),{id:child.threadId,latestTurn:{state,turnId:'turn1'},runtimeMode:'auto',interactionMode:'default'}];
  f.client.detail={messages:[{id:messageId,role:'user',createdAt:'2026-10-05T10:00:00Z'}],
   activities:items.map((text,i)=>({kind:'tool.completed',createdAt:`2026-10-05T10:0${i+1}:00Z`,payload:{itemType:'command_execution',toolCallId:`c${i}`,data:{command:text}}}))};
 }
}
for (const protocol of [1,2]) {
 const withParent=(f,ready=true)=>{f.client.shell.threads=[...f.client.shell.threads.filter(t=>t.id!=='parent'),protocol===2?{id:'parent',status:ready?'completed':'running',runtimeMode:'approval-required',interactionMode:'default'}:{id:'parent',runtimeMode:'approval-required',interactionMode:'default',latestTurn:{state:ready?'completed':'running'}}];};
 const parentPosts=f=>f.effects.filter(e=>e.threadId==='parent');
 test(`protocol ${protocol}: wait returns each new report once and status keeps them all`,async t=>{
  const f=fixture(t,protocol),child=await start(f.runtime,f.ledger,spec);
  childState(f,child,{state:'running',items:[block(1,'started').replace('HANDOFF',child.id)]});
  const first=await wait(f.runtime,f.ledger,child.id,0);assert.deepEqual(first.reports.map(r=>r.seq),[1]);assert.equal(first.reportCount,1);
  const again=await wait(f.runtime,f.ledger,child.id,0);assert.deepEqual(again.reports,[]);
  childState(f,child,{state:'running',items:[block(1,'started'),block(2,'working')].map(b=>b.replace('HANDOFF',child.id))});
  assert.deepEqual((await wait(f.runtime,f.ledger,child.id,0)).reports.map(r=>r.seq),[2]);
  assert.deepEqual((await status(f.runtime,f.ledger,child.id)).reports.map(r=>r.seq),[1,2]);
 });
 test(`protocol ${protocol}: the relay posts each new report, then the result, once, in the parent's mode`,async t=>{
  const f=fixture(t,protocol);withParent(f);
  const child=await start(f.runtime,f.ledger,{...spec,parent:'parent'}),b=(n,s)=>block(n,s).replace('HANDOFF',child.id);
  childState(f,child,{state:'running',items:[b(1,'started')]});
  assert.equal((await relay(f.runtime,f.ledger,child.id,await status(f.runtime,f.ledger,child.id))).delivered,true);
  assert.equal((await relay(f.runtime,f.ledger,child.id,await status(f.runtime,f.ledger,child.id))).reason,'no-new-reports');
  withParent(f,false);childState(f,child,{state:'running',items:[b(1,'started'),b(2,'working'),b(3,'working')]});
  assert.equal((await relay(f.runtime,f.ledger,child.id,await status(f.runtime,f.ledger,child.id))).reason,'parent-busy');
  withParent(f);
  const batch=await relay(f.runtime,f.ledger,child.id,await status(f.runtime,f.ledger,child.id));assert.equal(batch.reports,2);
  childState(f,child,{items:[b(1,'started'),b(2,'working'),b(3,'working'),b(4,'done')]});
  const final=await relay(f.runtime,f.ledger,child.id,await status(f.runtime,f.ledger,child.id));assert.equal(final.final,true);assert.equal(final.reports,1);
  assert.equal((await relay(f.runtime,f.ledger,child.id,await status(f.runtime,f.ledger,child.id))).reason,'already-delivered');
  const posts=parentPosts(f);assert.equal(posts.length,3);
  assert.match(textOf(posts[0]),/#1 started/);assert.match(textOf(posts[1]),/#2 working[\s\S]*#3 working/);assert.match(textOf(posts[2]),/Delegated T3 result[\s\S]*#4 done/);
  assert.match(textOf(posts[0]),/👋 Check the sample/);
  if(protocol===1) assert.ok(posts.every(p=>p.runtimeMode==='approval-required'));
 });
 test(`protocol ${protocol}: a lost parent acknowledgement retries the same post`,async t=>{
  const f=fixture(t,protocol);withParent(f);
  const child=await start(f.runtime,f.ledger,{...spec,parent:'parent'});childState(f,child);
  const original=f.client.request;let once=true;
  f.client.request=async(method,payload)=>{const x=await original(method,payload);if(once&&payload.threadId==='parent'){once=false;throw Error('ack lost');}return x;};
  const result=await status(f.runtime,f.ledger,child.id);
  await assert.rejects(relay(f.runtime,f.ledger,child.id,result),/ack lost/);
  await relay(f.runtime,f.ledger,child.id,result);assert.equal(parentPosts(f).length,1);
 });
 test(`protocol ${protocol}: follow-ups advance the prompt, reset report cursors and never send twice`,async t=>{
  const f=fixture(t,protocol),child=await start(f.runtime,f.ledger,spec);childState(f,child,{items:[block(1,'done').replace('HANDOFF',child.id)]});
  await wait(f.runtime,f.ledger,child.id,0);const before=f.ledger.get(child.id).messageId;
  const original=f.client.request;let once=true;
  f.client.request=async(method,payload)=>{const r=await original(method,payload);if(once&&textOf(payload)==='Second request'){once=false;throw Error('lost follow-up acknowledgement');}return r;};
  const input={key:'follow-up',text:'Second request'};
  await assert.rejects(reply(f.runtime,f.ledger,child.id,input),/lost follow-up/);
  assert.equal((await reply(f.runtime,f.ledger,child.id,input)).replayed,true);
  const after=f.ledger.get(child.id);assert.notEqual(after.messageId,before);assert.equal(after.reportsSeen,0);
  assert.equal(f.effects.filter(e=>textOf(e)==='Second request').length,1);
  await assert.rejects(reply(f.runtime,f.ledger,child.id,{...input,text:'Different second request'}),/different content/);
 });
 test(`protocol ${protocol}: question answers keep the request and question IDs`,async t=>{
  const f=fixture(t,protocol),child=await start(f.runtime,f.ledger,spec),messageId=f.ledger.get(child.id).messageId;
  if(protocol===2) {
   f.client.shell.threads=[{id:child.threadId,status:'running'}];
   f.client.projection=projection({messages:[{id:messageId,role:'user'}],runs:[{id:'r1',userMessageId:messageId,status:'running'}],runtimeRequests:[{id:'question-request',kind:'user_input',status:'pending'}],turnItems:[{type:'user_input_request',requestId:'question-request',questions:[{id:'Which environment?'}]}]});
  } else {
   f.client.shell.threads=[{id:child.threadId,hasPendingUserInput:true}];
   f.client.detail={messages:[{id:messageId,role:'user'}],activities:[{kind:'user-input.requested',payload:{requestId:'question-request',questions:[{id:'Which environment?'}]}}]};
  }
  const answers={'Which environment?':'Staging'};
  await assert.rejects(reply(f.runtime,f.ledger,child.id,{key:'bad',requestId:'other',answers}),/current requestId/);
  await reply(f.runtime,f.ledger,child.id,{key:'answer',requestId:'question-request',answers});
  const sent=f.effects.at(-1);assert.equal(sent.type,protocol===2?'runtime-request.respond':'thread.user-input.respond');
  assert.equal(sent.requestId,'question-request');assert.deepEqual(sent.answers,answers);
 });
 test(`protocol ${protocol}: rename keeps the prefix and sends the protocol's metadata command once`,async t=>{
  const f=fixture(t,protocol),child=await start(f.runtime,f.ledger,spec);
  const r=await rename(f.runtime,f.ledger,child.id,{title:'Better name',key:'r1'});await rename(f.runtime,f.ledger,child.id,{title:'Better name',key:'r1'});
  assert.equal(r.title,'👋 Better name');
  const renames=f.effects.filter(e=>e.title==='👋 Better name');assert.equal(renames.length,1);
  assert.equal(renames[0].type,protocol===2?'thread.metadata.update':'thread.meta.update');
 });
}

test('journal survives a new client process and reconciles without another session',async t=>{
 const f=fixture(t);const first=await start(f.runtime,f.ledger,spec);
 const reopened=new Ledger(resolve(f.root,'ledger.sqlite'));try {
  const again=await start(f.runtime,reopened,spec);assert.equal(first.threadId,again.threadId);assert.equal(f.effects.length,2);
 } finally {reopened.close();}
});
test('records written by the old helper still observe, follow up and replay',async t=>{
 const f=fixture(t);
 const old={id:'old1',key:'old-key',fingerprint:'x',spec:{...spec,parent:''},project:{title:'Sample App',workspace:'/w'},threadId:'th-old',url:'u',selection:{},
  create:{type:'thread.create',commandId:'c-create',threadId:'th-old',title:'Delegated research: old-key'},
  launch:{type:'thread.turn.start',commandId:'c-launch',threadId:'th-old',runtimeMode:'auto',interactionMode:'default',message:{messageId:'m-old',role:'user',text:'old'}}};
 f.ledger.insert(old);f.ledger.command('old1:create','old1',old.create);f.ledger.command('old1:launch','old1',old.launch);
 f.client.shell.threads=[{id:'th-old',latestTurn:{state:'completed',turnId:'t'}}];
 f.client.detail={messages:[{id:'m-old',role:'user'},{id:'a',role:'assistant',text:'old answer'}],activities:[]};
 const s=await status(f.runtime,f.ledger,'old1');assert.equal(s.state,'completed');assert.equal(s.title,'Delegated research: old-key');
 assert.equal(s.messages[0].text,'old answer');
 assert.equal(f.ledger.byKey('old-key').id,'old1');
 await reply(f.runtime,f.ledger,'old1',{key:'k',text:'Continue'});assert.equal(f.effects.at(-1).type,'thread.turn.start');
});
