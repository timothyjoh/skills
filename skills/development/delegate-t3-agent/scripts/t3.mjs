#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { projects } from './catalog.mjs';
import { paths, connect, models } from './runtime.mjs';
import { Ledger, start, status, wait, reply, deliver, isTerminal, needsUser } from './delegation.mjs';

const print=value=>console.log(JSON.stringify(value,null,2));
const args=parseArgs({allowPositionals:true,options:{...Object.fromEntries(['project','prompt-file','kind','key','title','provider','model','effort','parent-thread','timeout','answers-file','request-id','out','reason','runtime-mode'].map(k=>[k,{type:'string'}])),help:{type:'boolean',short:'h'}}});
const [requested,id]=args.positionals, f=args.values;
const command=f.help?'help':requested;
const text=()=>readFileSync(f['prompt-file']==='-'?0:f['prompt-file'],'utf8');
let r,ledger;
try {
  if(command==='projects') {print(projects());}
  else if(command==='handoff') {
    if(!f.out || !f['prompt-file']) throw Error('handoff needs --out and --prompt-file.');
    const body=`# Agent handoff\n\nReason for manual handoff: ${f.reason||'No unambiguous local T3 destination.'}\n\nRequested destination: ${f.project||'User to choose'}\nTask kind: ${f.kind||'research'}\n\n${text()}\n`;
    writeFileSync(f.out,body,{flag:'wx',mode:0o600}); print({state:'handoff',path:resolve(f.out),launched:false});
  } else if(!['doctor','models','start','status','wait','reply','watch'].includes(command)) {
    print({usage:'node /absolute/path/to/skill/scripts/t3.mjs <command> [id] [flags]',commands:{projects:'Read registered local projects and model defaults. No authentication or write to T3.',doctor:'Check database, local server, authentication and providers.',models:'List installed provider IDs and model slugs.',start:'--project ID_OR_NAME --kind research|planning|implementation|review|research-review|coordination --prompt-file FILE --key STABLE_KEY [--provider ID --model SLUG --effort high] [--parent-thread T3_THREAD_ID] [--runtime-mode full-access|approval-required] (default: approval-required)',status:'DELEGATION_ID',wait:'DELEGATION_ID [--timeout 45], maximum 55 seconds. Repeat the same ID on running/pending.',reply:'DELEGATION_ID --key REPLY_KEY --prompt-file FILE, or --request-id ID --answers-file JSON',watch:'DELEGATION_ID [--timeout 3600], deliver child report to its recorded T3 parent. Restart with same ID after process/server restart.',handoff:'--prompt-file FILE --out NEW_MARKDOWN_FILE [--project NAME --reason TEXT]'}});
  } else {
    r=await connect(paths()); ledger=new Ledger(r.ledger);
    if(command==='doctor'||command==='models') {
      const cfg=await models(r.client);
      print({url:r.url,environmentId:r.environmentId,home:r.home,ledger:r.ledger,providers:cfg.providers.map(p=>({instanceId:p.instanceId,status:p.status,installed:p.installed,auth:p.auth?.status,models:p.models.map(m=>({slug:m.slug,isDefault:!!m.isDefault}))})),...(command==='doctor'?{projects:projects(r.home).length}: {})});
    } else if(command==='start') {
      if(!f['prompt-file']) throw Error('start requires --prompt-file FILE (or - for stdin).');
      const result=await start(r,ledger,{project:f.project||'',kind:f.kind||'research',prompt:text(),key:f.key||'',title:f.title||'',provider:f.provider||'',model:f.model||'',effort:f.effort||'',parent:f['parent-thread']||'',...(f['runtime-mode']!==undefined?{runtimeMode:f['runtime-mode']}: {})});
      if(f['parent-thread']) {
        const task=ledger.get(result.id);
        let alive=false; if(task.watcherPid) try {process.kill(task.watcherPid,0);alive=true;} catch {}
        if(!alive) {
          const fd=openSync(resolve(r.state,`${result.id}.watch.log`),'a',0o600);
          const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'watch',result.id],{detached:true,stdio:['ignore',fd,fd],env:process.env});
          child.unref();closeSync(fd); ledger.update(result.id,{watcherPid:child.pid});
        }
        result.returnMode='T3 callback watcher';
      } else result.returnMode='Call wait/status in the originating Codex or Claude Code session.';
      print(result);
    } else if(command==='status') print(await status(r,ledger,id));
    else if(command==='wait') print(await wait(r,ledger,id,Number(f.timeout??45)));
    else if(command==='reply') print(await reply(r,ledger,id,{key:f.key,text:f['prompt-file']?text():undefined,answers:f['answers-file']?JSON.parse(readFileSync(f['answers-file'],'utf8')):undefined,requestId:f['request-id']}));
    else if(command==='watch') {
      const seconds=Number(f.timeout??3600);
      if(!Number.isFinite(seconds)||seconds<1||seconds>86400) throw Error('watch timeout must be 1..86400 seconds.');
      const end=Date.now()+seconds*1000;
      let done=false;
      while(Date.now()<end) {
        try {
          const result=await status(r,ledger,id);
          if(isTerminal(result.state)||needsUser(result.state)) {
            const delivery=await deliver(r,ledger,id,result);
            if(delivery.delivered) {print({id,...delivery});done=true;break;}
            if(!ledger.get(id).spec.parent) {print({id,...delivery});done=true;break;}
          }
        } catch(e) {
          console.error(JSON.stringify({id,state:'retrying',error:e.message}));
          r.client.close();
          try { r=await connect(paths()); } catch { /* Next iteration retries; saved task and commands remain authoritative. */ }
        }
        await new Promise(x=>setTimeout(x,2000));
      }
      if(!done) print({id,state:'watch_expired',reason:'Child was not cancelled. Run watch again with this ID to resume delivery.'});
    }
  }
} catch(error) { console.error(JSON.stringify({error:error.message}));process.exitCode=1; }
finally {r?.client.close();ledger?.close();}
