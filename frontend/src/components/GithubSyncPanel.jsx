import { LoadingState } from './WorkspaceUI';
import { useFeedback } from './Feedback';
import {useEffect,useRef,useState} from 'react';
import api from '../services/api';

const activityLink=a=>/^https:\/\/github\.com\//i.test(a?.url||'')?a.url:null;
export default function GithubSyncPanel({projectId,repoUrl,userRole,onUpdate}) {
 const notify=useFeedback();
 const [refreshing,setRefreshing]=useState(false);
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [form,setForm]=useState({enabled:false,integrationBranch:'',requiredChecks:'',requireConfirmation:true});
 const [tasks,setTasks]=useState([]),[selections,setSelections]=useState({}),[notice,setNotice]=useState('');
 const historyId=useRef(null),mounted=useRef(true);
 const owner=userRole==='OWNER',canReview=owner||userRole==='DEVELOPER';
 async function load(initial=false) {
  try {
   const response=await api.get(`/github/projects/${projectId}/sync`);
   if(!mounted.current)return;
   const next=response.data;setData(next);setError('');
   if(initial&&next.connection)setForm({enabled:next.connection.enabled,integrationBranch:next.connection.integration_branch,requiredChecks:next.connection.required_checks.join(', '),requireConfirmation:next.connection.require_confirmation});
   const latest=next.history?.[0]?.id||0;
   if(historyId.current!==null&&historyId.current!==latest)await onUpdate?.();
   historyId.current=latest;
  }catch(e){if(mounted.current)setError(e.message||'Unable to load GitHub synchronization.');}
  finally{if(mounted.current)setLoading(false);}
 }
 useEffect(()=>{
  mounted.current=true;historyId.current=null;void load(true);
  api.get(`/projects/${projectId}/tasks`).then(r=>{if(mounted.current)setTasks(r.data||[]);}).catch(()=>{});
  const interval=setInterval(()=>{if(document.visibilityState==='visible')void load();},30000);
  return ()=>{mounted.current=false;clearInterval(interval);};
 },[projectId,repoUrl]);
 async function action(operation,message) {
  setBusy(true);setError('');setNotice('');
  try{await operation();setNotice(message);notify(message);await load(true);await onUpdate?.();}
  catch(e){setError(e.message||'Unable to save synchronization changes.');}
  finally{setBusy(false);}
 }
 if(loading)return <LoadingState variant="sync" label="Loading GitHub activity…" />;
 return <section className="sync-panel" style={{marginTop:'24px'}} aria-label="GitHub Activity and AI Sync">
  <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'8px',marginBottom:'16px'}}>
    <h3 style={{fontSize:'15px',fontWeight:700,color:'var(--ink)'}}>GitHub Activity &amp; AI Sync</h3>
    <button className="btn btn-secondary" style={{minHeight:'30px',padding:'4px 12px',fontSize:'12px',gap:'5px'}} disabled={busy||refreshing} aria-busy={refreshing} onClick={async()=>{setRefreshing(true);try{await load();}finally{setRefreshing(false);}}}>
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8"/></svg>
      {refreshing ? 'Refreshing activity…' : 'Refresh activity'}
    </button>
  </div>
  {busy&&<LoadingState variant="sync" label="Applying synchronization changes…" />}
  {error&&<p role="alert" style={{fontSize:'13px',color:'#DC2626',marginBottom:'10px',padding:'10px 14px',background:'rgba(239,68,68,0.08)',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.2)'}}>{error}</p>}
  {notice&&<p role="status" style={{fontSize:'13px',color:'#0D9488',marginBottom:'10px',padding:'10px 14px',background:'rgba(20,184,166,0.08)',borderRadius:'8px',border:'1px solid rgba(20,184,166,0.2)'}}>{notice}</p>}
  {!data?.serviceEnabled&&data&&<p style={{fontSize:'13px',color:'var(--ink-secondary)',marginBottom:'12px'}}>Automatic synchronization is currently unavailable. Repository browsing remains available.</p>}
  {data&&<div className="card" style={{marginBottom:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
   <p style={{fontWeight:600,fontSize:'13px',color:'var(--ink)',wordBreak:'break-all'}}>{data.connection?.full_name||'No synchronization connection yet'}</p>
   <p style={{fontSize:'12px',color:'var(--ink-secondary)'}}>{data.connection?.enabled?'Automatic sync enabled':'Automatic sync disabled'} · Last successful sync: {data.connection?.last_synced_at?new Date(data.connection.last_synced_at).toLocaleString():'Not yet synchronized'}</p>
   {data.connection?.last_error&&<p style={{fontSize:'12px',color:'#DC2626'}}>{data.connection.last_error}</p>}
   {owner&&repoUrl&&<form style={{display:'flex',flexDirection:'column',gap:'12px'}} onSubmit={e=>{e.preventDefault();action(()=>api.put(`/github/projects/${projectId}/sync`,{url:repoUrl,...form,requiredChecks:form.requiredChecks.split(',').map(s=>s.trim()).filter(Boolean)}),'Synchronization settings saved.');}}>
    <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--ink)',cursor:'pointer'}}><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/>Enable automatic task synchronization</label>
    <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--ink-secondary)',marginBottom:'5px'}}>Integration branch</label><input className="input" value={form.integrationBranch} placeholder="Repository default branch" onChange={e=>setForm({...form,integrationBranch:e.target.value})}/></div>
    <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--ink-secondary)',marginBottom:'5px'}}>Required check names</label><input className="input" value={form.requiredChecks} placeholder="build, test" onChange={e=>setForm({...form,requiredChecks:e.target.value})}/></div>
    <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--ink)',cursor:'pointer'}}><input type="checkbox" checked={form.requireConfirmation} onChange={e=>setForm({...form,requireConfirmation:e.target.checked})}/>Require confirmation before completing a task</label>
    <p style={{fontSize:'11px',color:'var(--ink-muted)',lineHeight:1.5}}>Without required checks, merged pull requests always need confirmation. Manually changed tasks stay protected until you resume their GitHub updates.</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
      <button className="btn btn-primary" aria-busy={busy} disabled={busy} style={{minHeight:'34px',fontSize:'12px'}}>
        {busy?'Saving…':data.connection?'Save sync settings':'Connect synchronization'}
      </button>
      {data.connection&&<button type="button" className="btn btn-danger" style={{minHeight:'34px',fontSize:'12px'}} disabled={busy} onClick={()=>action(()=>api.delete(`/github/projects/${projectId}/sync`),'Repository disconnected. Activity history is retained.')}>Disconnect repository</button>}
    </div>
   </form>}
   {!repoUrl&&<p style={{fontSize:'13px',color:'var(--ink-secondary)'}}>Link a repository above to configure synchronization.</p>}
  </div>}
  <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
    <h4 style={{fontSize:'13px',fontWeight:700,color:'var(--ink)'}}>Recent activity and match review</h4>
    {!data?.activities?.length&&<p style={{fontSize:'13px',color:'var(--ink-muted)'}}>No webhook activity received yet.</p>}
    {data?.activities?.map(a=><article key={a.id} className="card" style={{display:'flex',flexDirection:'column',gap:'8px',wordBreak:'break-word'}}>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:'8px'}}>
        <p style={{fontSize:'13px',fontWeight:600,color:'var(--ink)'}}>{a.metadata.title}</p>
        {activityLink(a.metadata)&&<a style={{color:'var(--violet)',fontSize:'12px',fontWeight:600,textDecoration:'none'}} target="_blank" rel="noopener noreferrer" href={activityLink(a.metadata)}>View on GitHub ↗</a>}
      </div>
      <p style={{fontSize:'12px',color:'var(--ink-secondary)'}}>{a.task_title?`OPS-${a.task_id}: ${a.task_title}`:'Unmatched'} · {a.outcome.replaceAll('_',' ').toLowerCase()}</p>
      <p style={{fontSize:'12px',color:'var(--ink-muted)'}}>{a.reason}</p>
      {a.confidence!==null&&<p style={{fontSize:'11px',color:'var(--ink-muted)'}}>{a.method} match score: {Math.round(Number(a.confidence)*100)}/100 · heuristic</p>}
      {canReview&&a.outcome==='NEEDS_REVIEW'&&a.decision!=='REJECTED'&&<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--ink-secondary)',marginBottom:'5px'}}>Match task</label><select className="input" value={selections[a.id]??a.task_id??''} onChange={e=>setSelections({...selections,[a.id]:e.target.value})}><option value="">Select a task</option>{tasks.map(t=><option key={t.id} value={t.id}>OPS-{t.id}: {t.title}</option>)}</select></div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
          <button className="btn btn-primary" style={{fontSize:'12px',minHeight:'32px'}} disabled={busy||!data.connection?.enabled||!(selections[a.id]||a.task_id)} onClick={()=>action(()=>api.post(`/github/projects/${projectId}/sync/activities/${a.id}/review`,{decision:'CONFIRMED',taskId:Number(selections[a.id]||a.task_id),approveCompletion:a.metadata.merged===true}),a.metadata.merged?'Completion reviewed.':'Task match confirmed.')}>{a.metadata.merged?'Confirm match & completion':'Confirm match'}</button>
          <button className="btn btn-secondary" style={{fontSize:'12px',minHeight:'32px'}} disabled={busy} onClick={()=>action(()=>api.post(`/github/projects/${projectId}/sync/activities/${a.id}/review`,{decision:'REJECTED'}),'Match dismissed.')}>Reject</button>
        </div>
      </div>}
    </article>)}
  </div>
  {canReview&&tasks.some(t=>t.github_sync_paused)&&<div className="card" style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
    <h4 style={{fontSize:'13px',fontWeight:700,color:'var(--ink)'}}>Protected manual decisions</h4>
    {tasks.filter(t=>t.github_sync_paused).map(t=><div key={t.id} style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:'8px',fontSize:'13px',color:'var(--ink-secondary)'}}>
      <span>OPS-{t.id}: {t.title}</span>
      <button className="btn btn-secondary" style={{fontSize:'11px',minHeight:'26px',padding:'2px 10px'}} disabled={busy} onClick={()=>action(async()=>{await api.patch(`/github/projects/${projectId}/sync/tasks/${t.id}`,{paused:false});setTasks((await api.get(`/projects/${projectId}/tasks`)).data);},'GitHub updates resumed.')}>Resume updates</button>
    </div>)}
  </div>}
  <div className="card" style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
    <h4 style={{fontSize:'13px',fontWeight:700,color:'var(--ink)'}}>Synchronization history</h4>
    {!data?.history?.length&&<p style={{fontSize:'13px',color:'var(--ink-muted)'}}>No automatic task changes yet.</p>}
    {data?.history?.map(h=><p key={h.id} style={{fontSize:'12px',color:'var(--ink-secondary)',wordBreak:'break-word'}}>OPS-{h.task_id}: <b>{h.previous_status}</b> → <b>{h.new_status}</b>. {h.reason} {activityLink(h.metadata)&&<a style={{color:'var(--violet)',fontWeight:600}} target="_blank" rel="noopener noreferrer" href={activityLink(h.metadata)}>View ↗</a>}</p>)}
  </div>
  {!!data?.errors?.length&&<div className="card" style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
    <h4 style={{fontSize:'13px',fontWeight:700,color:'var(--ink)'}}>Recent synchronization errors</h4>
    {data.errors.map(e=><div key={e.id} style={{display:'flex',flexDirection:'column',gap:'6px'}}>
      <p style={{fontSize:'12px',color:'#DC2626'}}>{e.error}</p>
      {owner&&e.state==='FAILED'&&<button className="btn btn-secondary" style={{fontSize:'11px',minHeight:'28px',alignSelf:'flex-start'}} disabled={busy} onClick={()=>action(()=>api.post(`/github/projects/${projectId}/sync/deliveries/${e.id}/retry`),'Delivery queued for retry.')}>Retry</button>}
    </div>)}
  </div>}
 </section>;
}
