import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Ledger, start, classify, callbackReady, deliver, reply } from '../delegation.mjs';
import { projects, selectProject } from '../catalog.mjs';
import { chooseModel } from '../runtime.mjs';

const cfg={providers:[{instanceId:'claudeAgent',installed:true,status:'ready',auth:{status:'authenticated'},models:[{slug:'sample-claude-model',isDefault:true}]},{instanceId:'codex',installed:true,status:'ready',auth:{status:'authenticated'},models:[{slug:'sample-codex-model',isDefault:true}]}]};
function fixture(t) {
 const root=mkdtempSync(resolve(tmpdir(),'t3-delegate-test-'));
 mkdirSync(resolve(root,'userdata'));mkdirSync(resolve(root,'sample-app'));
 const db=new DatabaseSync(resolve(root,'userdata/state.sqlite'));
 db.exec('CREATE TABLE projection_projects(project_id TEXT,title TEXT,workspace_root TEXT,default_model_selection_json TEXT,deleted_at TEXT)');
 db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,NULL)').run('p1','Sample App',resolve(root,'sample-app'),JSON.stringify({instanceId:'claudeAgent',model:'sample-claude-model'}));db.close();
 const ledger=new Ledger(resolve(root,'ledger.sqlite'));t.after(()=>{ledger.close();rmSync(root,{recursive:true,force:true});});
 const seen=new Map(), effects=[];
 const client={readShell:async()=>({projects:[{id:'p1',workspaceRoot:resolve(root,'sample-app')}],threads:[]}),request:async(method,payload)=>{
  if(method==='server.getConfig') return cfg;
  assert.equal(method,'orchestration.dispatchCommand');
  if(!seen.has(payload.commandId)){seen.set(payload.commandId,true);effects.push(payload);}
  return {sequence:effects.length};
 }};
 return {root,ledger,effects,client,runtime:{client,home:root,state:root,url:'http://127.0.0.1:3773',environmentId:'env'}};
}
const spec={project:'Sample App',kind:'research',key:'same-work',prompt:'Return a test word',title:'',provider:'',model:'',effort:'',parent:''};
test('catalog excludes deleted projects and rejects missing workspaces',t=>{
 const f=fixture(t),db=new DatabaseSync(resolve(f.root,'userdata/state.sqlite'));
 db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,?)').run('p2','Deleted','/missing',null,'today');
 db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,NULL)').run('p3','Missing','/missing',null);db.close();
 const all=projects(f.root);assert.equal(all.length,2);assert.throws(()=>selectProject(all,'Missing'),/does not exist/);
 assert.equal(selectProject(all,'sample-app').id,'p1');assert.throws(()=>selectProject(all,'nonexistent'),/No registered/);
});
test('ambiguous project names never choose first candidate',()=>{
 assert.throws(()=>selectProject([{id:'1',title:'Duplicate',workspace:'/a',available:true},{id:'2',title:'Duplicate',workspace:'/b',available:true}],'Duplicate'),/Ambiguous/);
});
test('launch retries retain one thread, one message and the original commands',async t=>{
 const f=fixture(t);const a=await start(f.runtime,f.ledger,spec),b=await start(f.runtime,f.ledger,spec);
 assert.equal(a.id,b.id);assert.equal(f.effects.length,2);assert.equal(f.effects[1].threadId,a.threadId);
 assert.equal(f.effects[0].runtimeMode,'approval-required');assert.equal(f.effects[1].runtimeMode,'approval-required');assert.equal(a.runtimeMode,'approval-required');
 await assert.rejects(start(f.runtime,f.ledger,{...spec,prompt:'different'}),/different request/);
});
test('ambiguous dispatch response reuses persisted IDs after failure',async t=>{
 const f=fixture(t);const original=f.client.request;let once=true;
 f.client.request=async(method,payload)=>{const r=await original(method,payload);if(once && payload.type==='thread.turn.start'){once=false;throw Error('connection lost after accepted');}return r;};
 await assert.rejects(start(f.runtime,f.ledger,spec),/connection lost/);
 const row=f.ledger.byKey(spec.key);assert.ok(row.launch.message.messageId);
 const r=await start(f.runtime,f.ledger,spec);assert.equal(r.id,row.id);assert.equal(f.effects.length,2);
});
test('all task kinds use the project model and respect explicit overrides',()=>{
 const p={selection:{instanceId:'claudeAgent',model:'sample-claude-model'}};
 for (const kind of ['research','implementation','review','research-review']) {
  assert.deepEqual(chooseModel(cfg,p,kind),p.selection);
  assert.deepEqual(chooseModel(cfg,p,kind,{provider:'codex',model:'sample-codex-model',effort:'high'}),{instanceId:'codex',model:'sample-codex-model',options:[{id:'reasoningEffort',value:'high'}]});
 }
 assert.throws(()=>chooseModel(cfg,p,'research',{provider:'codex',model:'missing'}),/not available/);
 assert.throws(()=>chooseModel(cfg,{selection:null},'research'),/no default model/);
});
const task={launch:{message:{messageId:'user1'}}};
const detail={messages:[{id:'user1',role:'user',text:'test'},{id:'answer1',role:'assistant',text:'ACK',isStreaming:false}],activities:[]};
test('return includes real assistant answer and does not equate turn completion with objective success',()=>{
 const r=classify({latestTurn:{state:'completed',turnId:'turn1'}},detail,task);assert.equal(r.state,'completed');assert.equal(r.messages[0].text,'ACK');assert.match(r.note,/Evaluate/);
});
test('pending approvals, questions, failures and interrupts are distinguished',()=>{
 assert.equal(classify({hasPendingApprovals:true},detail,task).state,'needs_approval');
 assert.equal(classify({hasPendingUserInput:true},detail,task).state,'needs_input');
 assert.equal(classify({latestTurn:{state:'error'}},detail,task).state,'failed');
 assert.equal(classify({latestTurn:{state:'interrupted'}},detail,task).state,'interrupted');
});
test('a later user turn cannot masquerade as the delegated answer',()=>{
 const r=classify({latestTurn:{state:'completed'}},{...detail,messages:[...detail.messages,{id:'next',role:'user',text:'other'},{id:'next-answer',role:'assistant',text:'unrelated'}]},task);
 assert.equal(r.state,'superseded');assert.equal(r.messages.length,1);assert.equal(r.messages[0].text,'ACK');
 assert.equal(classify({}, {messages:[]}, task).state,'unknown');
});
test('parent delivery waits for active work, approvals, plans or archived parents',()=>{
 assert.equal(callbackReady({latestTurn:{state:'completed'}}),true);
 for(const parent of [null,{archivedAt:'now'},{latestTurn:{state:'running'}},{session:{activeTurnId:'x'}},{hasPendingApprovals:true},{hasPendingUserInput:true},{hasActionableProposedPlan:true}]) assert.ok(!callbackReady(parent));
});
test('parent callbacks preserve its modes and use one receipt across retries',async t=>{
 const f=fixture(t);f.client.readShell=async()=>({projects:[{id:'p1',workspaceRoot:resolve(f.root,'sample-app')}],threads:[{id:'parent',runtimeMode:'approval-required',interactionMode:'default'}]});
 const launched=await start(f.runtime,f.ledger,{...spec,parent:'parent'});
 const result={state:'completed',turnId:'turn1',messages:[{text:'ACK'}]};
 await deliver(f.runtime,f.ledger,launched.id,result);await deliver(f.runtime,f.ledger,launched.id,result);
 const callbacks=f.effects.filter(c=>c.threadId==='parent');assert.equal(callbacks.length,1);assert.equal(callbacks[0].runtimeMode,'approval-required');assert.match(callbacks[0].message.text,/ACK/);
});
test('streaming text is not reported as a final answer',()=>{
 const r=classify({latestTurn:{state:'running'}},{...detail,messages:[detail.messages[0],{id:'partial',role:'assistant',text:'partial',streaming:true}]},task);
 assert.equal(r.state,'running');assert.equal(r.messages,undefined);
});
test('journal survives a new client process and reconciles without another session',async t=>{
 const f=fixture(t);const first=await start(f.runtime,f.ledger,spec);
 const reopened=new Ledger(resolve(f.root,'ledger.sqlite'));try {
 const again=await start(f.runtime,reopened,spec);assert.equal(first.threadId,again.threadId);assert.equal(f.effects.length,2);
 } finally {reopened.close();}
});
test('callback with uncertain acknowledgement retries the same message',async t=>{
 const f=fixture(t);f.client.readShell=async()=>({projects:[{id:'p1',workspaceRoot:resolve(f.root,'sample-app')}],threads:[{id:'parent',runtimeMode:'approval-required',interactionMode:'default'}]});
 const child=await start(f.runtime,f.ledger,{...spec,parent:'parent'});const original=f.client.request;let once=true;
 f.client.request=async(method,payload)=>{const x=await original(method,payload);if(once&&payload.threadId==='parent'){once=false;throw Error('ack lost');}return x;};
 const result={state:'completed',turnId:'turn1',messages:[{text:'ACK'}]};
 await assert.rejects(deliver(f.runtime,f.ledger,child.id,result),/ack lost/);
 await deliver(f.runtime,f.ledger,child.id,result);assert.equal(f.effects.filter(c=>c.threadId==='parent').length,1);
});
test('new question requests get separate callbacks without repeating an old request',async t=>{
 const f=fixture(t);f.client.readShell=async()=>({projects:[{id:'p1',workspaceRoot:resolve(f.root,'sample-app')}],threads:[{id:'parent',runtimeMode:'approval-required',interactionMode:'default'}]});
 const child=await start(f.runtime,f.ledger,{...spec,parent:'parent'});
 await deliver(f.runtime,f.ledger,child.id,{state:'needs_input',questions:[{requestId:'q1'}]});
 await deliver(f.runtime,f.ledger,child.id,{state:'needs_input',questions:[{requestId:'q1'}]});
 await deliver(f.runtime,f.ledger,child.id,{state:'needs_input',questions:[{requestId:'q2'}]});
 assert.equal(f.effects.filter(c=>c.threadId==='parent').length,2);
});
test('live project mismatch stops dispatch before creating anything',async t=>{
 const f=fixture(t);f.client.readShell=async()=>({projects:[{id:'p1',workspaceRoot:'/wrong'}],threads:[]});
 await assert.rejects(start(f.runtime,f.ledger,spec),/disagree/);assert.equal(f.effects.length,0);
});
test('an uncertain follow-up retry advances the observed prompt and does not send twice',async t=>{
 const f=fixture(t),child=await start(f.runtime,f.ledger,spec);
 const first=f.ledger.get(child.id).launch;
 f.client.readShell=async()=>({projects:[],threads:[{id:child.threadId,latestTurn:{state:'completed',turnId:'first'}}]});
 f.client.readThread=async()=>({thread:{messages:[{id:first.message.messageId,role:'user',text:'first'},{id:'a1',role:'assistant',text:'first answer',streaming:false}],activities:[]}});
 const original=f.client.request;let once=true;
 f.client.request=async(method,payload)=>{const r=await original(method,payload);if(once&&payload.type==='thread.turn.start'){once=false;throw Error('lost follow-up acknowledgement');}return r;};
 const input={key:'follow-up',text:'Second request'};
 await assert.rejects(reply(f.runtime,f.ledger,child.id,input),/lost follow-up/);
 await reply(f.runtime,f.ledger,child.id,input);
 assert.notEqual(f.ledger.get(child.id).launch.message.messageId,first.message.messageId);
 assert.equal(f.effects.filter(c=>c.type==='thread.turn.start').length,2);
 assert.equal(f.effects.at(-1).runtimeMode,'approval-required');
 await assert.rejects(reply(f.runtime,f.ledger,child.id,{...input,text:'Different second request'}),/different content/);
});
test('question answers preserve the provider request and question IDs',async t=>{
 const f=fixture(t),child=await start(f.runtime,f.ledger,spec),launch=f.ledger.get(child.id).launch;
 f.client.readShell=async()=>({projects:[],threads:[{id:child.threadId,hasPendingUserInput:true}]});
 f.client.readThread=async()=>({thread:{messages:[{id:launch.message.messageId,role:'user'}],activities:[{kind:'user-input.requested',payload:{requestId:'question-request',questions:[{id:'Which environment?',question:'Which environment?'}]}}]}});
 const answers={'Which environment?':'Staging'};
 await reply(f.runtime,f.ledger,child.id,{key:'answer',requestId:'question-request',answers});
 assert.equal(f.effects.at(-1).type,'thread.user-input.respond');assert.equal(f.effects.at(-1).requestId,'question-request');assert.deepEqual(f.effects.at(-1).answers,answers);
});

test('explicit supervised launch and follow-up retain approval-required mode',async t=>{
 const f=fixture(t),input={...spec,runtimeMode:'approval-required'};
 const child=await start(f.runtime,f.ledger,input),launch=f.ledger.get(child.id).launch;
 assert.equal(child.runtimeMode,'approval-required');
 assert.ok(f.effects.every(c=>c.runtimeMode==='approval-required'));
 f.client.readShell=async()=>({projects:[],threads:[{id:child.threadId,latestTurn:{state:'completed',turnId:'first'}}]});
 f.client.readThread=async()=>({thread:{messages:[{id:launch.message.messageId,role:'user'},{id:'a',role:'assistant',text:'done'}],activities:[]}});
 await reply(f.runtime,f.ledger,child.id,{key:'follow-up',text:'Continue'});
 assert.equal(f.effects.at(-1).runtimeMode,'approval-required');
 await assert.rejects(start(f.runtime,f.ledger,{...input,runtimeMode:'full-access'}),/different request/);
});
test('invalid runtime mode cannot dispatch or persist a task',async t=>{
 const f=fixture(t);
 await assert.rejects(start(f.runtime,f.ledger,{...spec,runtimeMode:'supervised'}),/runtime mode/);
 assert.equal(f.effects.length,0);assert.equal(f.ledger.byKey(spec.key),undefined);
});

test('follow-up honors an existing session mode changed in T3',async t=>{
 const f=fixture(t),child=await start(f.runtime,f.ledger,{...spec,runtimeMode:'approval-required'}),launch=f.ledger.get(child.id).launch;
 f.client.readShell=async()=>({projects:[],threads:[{id:child.threadId,runtimeMode:'full-access',latestTurn:{state:'completed',turnId:'first'}}]});
 f.client.readThread=async()=>({thread:{messages:[{id:launch.message.messageId,role:'user'},{id:'a',role:'assistant',text:'done'}],activities:[]}});
 await reply(f.runtime,f.ledger,child.id,{key:'resume',text:'Continue'});
 assert.equal(f.effects.at(-1).runtimeMode,'full-access');
});
