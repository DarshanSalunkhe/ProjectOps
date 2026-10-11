import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { intelligenceService } from '../services/intelligenceService';
import { StatusBadge } from './WorkspaceUI';

const AssistantIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="2"/>
    <path d="M8 7V5a2 2 0 0 1 4 0v2"/>
    <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M9 11.5c.8-1 2.5-1 3 0M15 11.5c.8-1 2.5-1 3 0" opacity="0"/>
    <path d="M9 13h.01M15 13h.01"/>
    <path d="M9.5 16.5c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1"/>
  </svg>
);

export default function WorkspaceAssistant({ project, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = event => { if (String(event.detail?.projectId) === String(project?.id)) setRevision(n => n + 1); };
    window.addEventListener('projectops:project-updated', refresh);
    return () => window.removeEventListener('projectops:project-updated', refresh);
  }, [project?.id]);
  useEffect(() => {
    let current = true;
    setAnalysis(null); setError('');
    if (!project) { setLoading(false); return; }
    setLoading(true);
    intelligenceService.getProjectHealth(project.id).then(data => {
      if (current) setAnalysis(data);
    }).catch(err => { if (current) setError(err.message || 'Analysis is unavailable.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [project?.id, revision]);
  return <aside className="workspace-assistant" aria-label="AI assistant">
    <div className="assistant-heading"><span className="assistant-heading-title"><AssistantIcon />ProjectOps AI</span><div><button className="mini-button" aria-label="Refresh project analysis" disabled={!project || loading} onClick={() => setRevision(n => n + 1)}>↻</button><button className="mini-button" aria-label="Close AI assistant" onClick={onClose}>×</button></div></div>
    <div className="assistant-body">
      <div className="assistant-prompt">{project ? 'Show the risks and delivery health for this project.' : 'Help me keep my projects on track.'}</div>
      {!project ? <><p>Select a project to see its live health and risk signals here.</p><Link className="assistant-link" to="/projects">Browse projects →</Link></> : loading ? <p role="status">Reviewing project health…</p> : error ? <div role="alert"><p>{error}</p><button className="btn-secondary mt-3" onClick={() => setRevision(n => n + 1)}>Try again</button></div> : analysis && <>
        <p className="assistant-summary">Here’s the latest analysis for <strong>{project.name}</strong>.</p>
        <div className="assistant-health"><span><strong>{analysis.health?.score == null ? 'Insufficient data' : `${analysis.health.score} / 100`}</strong></span><StatusBadge status={analysis.health?.status} /></div>
        <p>{analysis.risks?.length ? `${analysis.risks.length} risk signals need your attention:` : 'No active risk signals were returned by the latest analysis.'}</p>
        <ul className="assistant-risks">{(analysis.risks || []).map((risk, index) => <li key={index}><Link to={`/projects/${project.id}?tab=ai`}>{risk.taskTitle || risk.type?.replaceAll('_', ' ') || 'Project risk'}</Link><p>{risk.message}</p></li>)}</ul>
        <div className="assistant-suggestion"><p>Review the affected tasks or run a recovery analysis to plan your next steps.</p><Link className="btn-secondary" to={`/projects/${project.id}?tab=ai`}>Open AI Command Center ↗</Link></div>
      </>}
    </div>
    <div className="assistant-context"><span className="context-label"><AssistantIcon /> {project?.name || 'Workspace context'}</span><p>Plan work, review assignments, and explore dependency impact.</p><Link className="assistant-launch" to={project ? `/projects/${project.id}?tab=ai` : '/ai/planner'}>Explore AI tools <span aria-hidden="true">↑</span></Link></div>
  </aside>;
}
