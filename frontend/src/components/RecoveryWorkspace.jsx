/**
 * Recovery Workspace
 * Editable delay-report form â†’ recovery proposals â†’ review/apply/reject
 * Integrates with /api/intelligence/replan/:projectId endpoints.
 */
import { useState, useEffect } from 'react';
import { intelligenceService } from '../services/intelligenceService';

const PROBLEM_TYPES = [
  { value: 'TASK_DELAY',          label: 'Task is delayed' },
  { value: 'DEADLINE_EXCEEDED',   label: 'Deadline will be missed' },
  { value: 'WORKLOAD_OVERLOAD',   label: 'Team member is overloaded' },
  { value: 'DEPENDENCY_BLOCKED',  label: 'Dependency is blocking work' },
];

const OBJECTIVES = [
  'Preserve the final project deadline',
  'Minimise reassignment disruption',
  'Reduce overloaded member\'s workload',
  'Unblock the critical path',
];

export default function RecoveryWorkspace({ projectId, tasks = [], members = [] }) {
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    problemType: 'TASK_DELAY',
    taskId: '',
    blockingTaskId: '',
    userId: '',
    delayDays: 3,
    revisedDate: '',
    reason: '',
    freeText: '',
    availabilityChange: '',
    objective: OBJECTIVES[0],
  });

  useEffect(() => { fetchProposals(); }, [projectId]);

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await intelligenceService.getReplans(projectId);
      setProposals(Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []);
    } catch { setProposals([]); }
    finally { setLoadingProposals(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setGenerating(true);
    try {
      // Build the problem object the backend expects
      const problem = {
        type: form.problemType,
        freeText: form.freeText,
        reason: form.reason,
        availabilityChange: form.availabilityChange,
        objective: form.objective,
        delayDays: parseInt(form.delayDays) || 0,
        revisedDate: form.revisedDate || undefined,
      };
      if (['TASK_DELAY','DEADLINE_EXCEEDED'].includes(form.problemType)) problem.taskId = parseInt(form.taskId);
      if (form.problemType === 'WORKLOAD_OVERLOAD') problem.userId = parseInt(form.userId);
      if (form.problemType === 'DEPENDENCY_BLOCKED') {
        problem.taskId = parseInt(form.taskId);
        problem.blockingTaskId = parseInt(form.blockingTaskId);
      }

      await intelligenceService.generateReplan(projectId, problem);
      setSuccess('Recovery proposal generated.');
      setShowForm(false);
      await fetchProposals();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate proposal');
    } finally { setGenerating(false); }
  };

  const handleApply = async (proposalId) => {
    if (!window.confirm('Apply this recovery proposal? Task dates and assignments will be updated.')) return;
    setApplying(proposalId); setError(''); setSuccess('');
    try {
      await intelligenceService.applyReplan(projectId, proposalId);
      setSuccess('Recovery proposal applied successfully.');
      await fetchProposals();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to apply proposal');
    } finally { setApplying(null); }
  };

  const handleReject = async (proposalId) => {
    setApplying(proposalId); setError(''); setSuccess('');
    try {
      await intelligenceService.rejectReplan(projectId, proposalId);
      setSuccess('Proposal rejected.');
      await fetchProposals();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject proposal');
    } finally { setApplying(null); }
  };

  const pendingProposals  = proposals.filter(p => p.status === 'PENDING');
  const historyProposals  = proposals.filter(p => p.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 style={{fontSize:'15px',fontWeight:700,color:'var(--ink)'}}>Recovery Workspace</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary" style={{minHeight:'32px',fontSize:'12px',gap:'5px'}}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {showForm ? 'Cancel' : 'Report delay / issue'}
        </button>
      </div>

      {error   && <div className="error-state" style={{marginBottom:'10px',fontSize:'13px'}}>{error}</div>}
      {success && <div style={{background:'rgba(20,184,166,0.08)',border:'1px solid rgba(20,184,166,0.25)',color:'#0D9488',borderRadius:'8px',padding:'9px 13px',marginBottom:'10px',fontSize:'13px'}}>{success}</div>}

      {/* Delay report form */}
      {showForm && (
        <div className="card border-primary-200">
          <h4 style={{fontSize:'14px',fontWeight:700,color:'var(--ink)',marginBottom:'14px'}}>Report a delay or issue</h4>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Problem type *</label>
                <select className="input" value={form.problemType}
                  onChange={e => setForm(f => ({ ...f, problemType: e.target.value }))}>
                  {PROBLEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {['TASK_DELAY','DEADLINE_EXCEEDED','DEPENDENCY_BLOCKED'].includes(form.problemType) && (
                <div>
                  <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Affected task *</label>
                  <select className="input" value={form.taskId}
                    onChange={e => setForm(f => ({ ...f, taskId: e.target.value }))} required>
                    <option value="">Select taskâ€¦</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}

              {form.problemType === 'DEPENDENCY_BLOCKED' && (
                <div>
                  <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Blocking task *</label>
                  <select className="input" value={form.blockingTaskId}
                    onChange={e => setForm(f => ({ ...f, blockingTaskId: e.target.value }))} required>
                    <option value="">Select blocking taskâ€¦</option>
                    {tasks.filter(t => String(t.id) !== String(form.taskId))
                      .map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}

              {form.problemType === 'WORKLOAD_OVERLOAD' && (
                <div>
                  <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Overloaded member *</label>
                  <select className="input" value={form.userId}
                    onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required>
                    <option value="">Select memberâ€¦</option>
                    {members.map(m => <option key={m.user_id || m.id} value={m.user_id || m.id}>{m.name || m.user_name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Delay duration (days)</label>
                <input type="number" min={0} max={365} className="input" value={form.delayDays}
                  onChange={e => setForm(f => ({ ...f, delayDays: e.target.value }))} />
              </div>

              <div>
                <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Revised completion date</label>
                <input type="date" className="input" value={form.revisedDate}
                  onChange={e => setForm(f => ({ ...f, revisedDate: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Reason</label>
              <input type="text" className="input" value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. illness, scope creep, external dependencyâ€¦" />
            </div>

            <div>
              <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Availability changes &amp; constraints</label>
              <input type="text" className="input" value={form.availabilityChange}
                onChange={e => setForm(f => ({ ...f, availabilityChange: e.target.value }))}
                placeholder="e.g. Backend dev unavailable Monâ€“Wed next week" />
            </div>

            <div>
              <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>
                Free-text instructions <span className="text-slate-400 text-xs">(natural language)</span>
              </label>
              <textarea className="input" rows={2} value={form.freeText}
                onChange={e => setForm(f => ({ ...f, freeText: e.target.value }))}
                placeholder="e.g. Keep the demo deadline and suggest which tasks we can reassign." />
            </div>

            <div>
              <label style={{display:"block",fontSize:"12px",fontWeight:600,color:"var(--ink-secondary)",marginBottom:"5px"}}>Recovery objective</label>
              <select className="input" value={form.objective}
                onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}>
                {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={generating} className="btn-primary flex-1">
                {generating ? 'Generating proposalâ€¦' : 'âš¡ Generate Recovery Proposal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Pending proposals */}
      {pendingProposals.length > 0 && (
        <div>
        <h4 style={{fontSize:'13px',fontWeight:700,color:'var(--ink)',marginBottom:'8px'}}>Pending proposals ({pendingProposals.length})</h4>
          {pendingProposals.map(p => (
            <ProposalCard key={p.id} proposal={p} onApply={handleApply} onReject={handleReject}
              applying={applying === p.id} tasks={tasks} members={members} />
          ))}
        </div>
      )}

      {/* Proposal history */}
      <div>
        <h4 style={{fontSize:"13px",fontWeight:700,color:"var(--ink)",marginBottom:"8px"}}>
          {loadingProposals ? 'Loadingâ€¦' : `History (${historyProposals.length})`}
        </h4>
        {historyProposals.length === 0 && !loadingProposals && (
          <p style={{fontSize:"12px",color:"var(--ink-muted)"}}>No historical proposals yet.</p>
        )}
        {historyProposals.map(p => (
          <ProposalCard key={p.id} proposal={p} readOnly tasks={tasks} members={members} />
        ))}
      </div>
    </div>
  );
}

function ProposalCard({ proposal, onApply, onReject, applying, readOnly, tasks, members }) {
  const [expanded, setExpanded] = useState(false);
  const rec = proposal.proposal?.recommendations || [];
  const problem = proposal.problem || {};

  const statusColors = {
    PENDING:  { bg:'rgba(245,158,11,0.12)', color:'#D97706' },
    APPLIED:  { bg:'rgba(20,184,166,0.12)',  color:'#0D9488' },
    REJECTED: { bg:'rgba(100,116,139,0.1)',  color:'#64748B' },
  };

  const taskTitle = id => tasks.find(t => String(t.id) === String(id))?.title || `Task #${id}`;

  return (
    <div className="card mb-3">
      {proposal.proposal?.aiExplanation?.text && <div className="recovery-proposal-text mb-3">{proposal.proposal.aiExplanation.text.replace(/^#{1,3}\s+/gm,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/^\*\s+/gm,'â€¢ ')}</div>}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[proposal.status] || 'bg-slate-100'}`}>
              {proposal.status}
            </span>
            <span className="text-xs text-slate-400">{new Date(proposal.created_at).toLocaleString()}</span>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">{problem.type?.replace(/_/g, ' ')}</span>
            {problem.taskId && <span className="text-slate-500"> â€” {taskTitle(problem.taskId)}</span>}
            {problem.freeText && <span className="text-slate-500 italic"> "{problem.freeText}"</span>}
          </div>
          {proposal.proposal?.estimatedImpact?.delayDaysAvoided !== undefined && (
            <div className="text-xs text-slate-500 mt-1">
              Impact: {proposal.proposal.estimatedImpact.delayDaysAvoided} days avoided
              {proposal.proposal.estimatedImpact.tasksReassigned > 0 && `, ${proposal.proposal.estimatedImpact.tasksReassigned} task(s) reassigned`}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="btn-secondary text-xs">
            {expanded ? 'Collapse' : 'View'}
          </button>
          {!readOnly && proposal.status === 'PENDING' && (
            <>
              <button onClick={() => onApply(proposal.id)} disabled={applying} className="btn-success text-xs">
                {applying ? 'â€¦' : 'Apply'}
              </button>
              <button onClick={() => onReject(proposal.id)} disabled={applying} className="btn-danger text-xs">
                {applying ? 'â€¦' : 'Reject'}
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && rec.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {rec.map((r, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-slate-800 mb-1">{r.type?.replace(/_/g, ' ')}</div>
              {r.taskTitle && <div className="text-slate-600">Task: {r.taskTitle}</div>}
              {r.newDeadline && (
                <div className="text-slate-600">
                  New deadline: <span className="font-medium">{new Date(r.newDeadline).toLocaleDateString()}</span>
                  {r.currentDeadline && <span className="text-slate-400"> (was {new Date(r.currentDeadline).toLocaleDateString()})</span>}
                </div>
              )}
              {r.newAssigneeName && <div className="text-slate-600">Reassign to: <span className="font-medium">{r.newAssigneeName}</span></div>}
              {r.reason && <div className="text-slate-500 text-xs mt-1">{r.reason}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


