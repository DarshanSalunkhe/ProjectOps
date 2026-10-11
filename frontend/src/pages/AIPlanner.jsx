import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { intelligenceService } from '../services/intelligenceService';
import { projectService } from '../services/projectService';

const AIPlanner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId');

  const [step, setStep] = useState('input');
  const [mode, setMode] = useState('personalized');
  const [formData, setFormData] = useState({
    goal: '', description: '', deadline: '', teamSize: 4,
    techStack: '', instructions: '', constraints: '',
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [selectedProject, setSelectedProject] = useState(initialProjectId || '');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiAvailable, setAiAvailable] = useState(null);

  useEffect(() => {
    setProjectsLoading(true);
    projectService.getAll()
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let raw;
      if (mode === 'personalized' && selectedProject) {
        raw = await intelligenceService.generatePersonalizedPlan(
          selectedProject, formData.instructions, formData.constraints
        );
      } else {
        raw = await intelligenceService.generatePlan({
          goal: formData.goal,
          description: formData.description,
          deadline: formData.deadline || null,
          teamSize: parseInt(formData.teamSize) || 4,
          techStack: formData.techStack.split(',').map(t => t.trim()).filter(Boolean),
        });
      }
      const plan = raw?.data ?? raw;
      setGeneratedPlan(plan);
      setAiAvailable(plan?.aiAvailable !== false);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedProject || !generatedPlan) return;
    setError('');
    setLoading(true);
    try {
      await intelligenceService.applyPlan(selectedProject, generatedPlan);
      navigate(`/projects/${selectedProject}?tab=tasks`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to apply plan');
      setLoading(false);
    }
  };

  if (step === 'input') {
    return (
      <div className="page-enter max-w-3xl mx-auto">
        <div className="mb-7">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">AI Intelligence</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Project Planner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate a plan grounded in your real project data, or describe a brand-new project.
          </p>
        </div>

        <div style={{ display:'flex', gap:'10px', marginBottom:'24px' }}>
          {[
            { id:'personalized', label:'Personalized — from project data', icon:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg> },
            { id:'generic',      label:'New plan from description',         icon:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => setMode(opt.id)}
              className={`ai-mode-btn${mode === opt.id ? ' active' : ''}`}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleGenerate} className="space-y-5">
            {mode === 'personalized' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                  <select className="input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    required disabled={projectsLoading}>
                    <option value="">{projectsLoading ? 'Loading…' : 'Select a project'}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    The planner reads this project's tasks, team, milestones, and deadline. Existing completed tasks
                    are excluded from new scheduling.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional instructions <span className="text-slate-400 text-xs">(optional)</span>
                  </label>
                  <textarea className="input" rows={3}
                    value={formData.instructions}
                    onChange={e => setFormData(f => ({ ...f, instructions: e.target.value }))}
                    placeholder="e.g. Focus on backend first, assign API tasks to Alice, keep MVP scope…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Constraints <span className="text-slate-400 text-xs">(optional)</span>
                  </label>
                  <textarea className="input" rows={2}
                    value={formData.constraints}
                    onChange={e => setFormData(f => ({ ...f, constraints: e.target.value }))}
                    placeholder="e.g. No work on weekends, Bob unavailable next week…" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="planner-goal" className="block text-sm font-medium text-gray-700 mb-1">
                    Project goal *
                  </label>
                  <textarea id="planner-goal" required className="input" rows={3}
                    value={formData.goal}
                    onChange={e => setFormData(f => ({ ...f, goal: e.target.value }))}
                    placeholder="e.g. Build an e-commerce platform with payments and admin dashboard" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional details</label>
                  <textarea className="input" rows={2}
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Specific requirements, constraints, or preferences…" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input type="date" name="deadline" className="input"
                      value={formData.deadline}
                      onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team size</label>
                    <input type="number" min={1} max={20} className="input"
                      value={formData.teamSize}
                      onChange={e => setFormData(f => ({ ...f, teamSize: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tech stack <span className="text-slate-400 text-xs">(comma-separated)</span>
                  </label>
                  <input type="text" className="input"
                    value={formData.techStack}
                    onChange={e => setFormData(f => ({ ...f, techStack: e.target.value }))}
                    placeholder="React, Node.js, PostgreSQL…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apply to project</label>
                  <select className="input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    disabled={projectsLoading}>
                    <option value="">{projectsLoading ? 'Loading…' : 'Choose a project to apply the plan (optional here)'}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Generating…' : (
                  <span className="flex items-center gap-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/>
                      <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/>
                      <path d="M9.5 11c.5-.7 1.4-1 2.5-1s2 .3 2.5 1"/>
                    </svg>
                    Generate Plan
                  </span>
                )}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'preview' && generatedPlan) {
    const meta = generatedPlan.metadata || {};
    const isFallback = meta.generatedBy?.includes('fallback') || meta.generatedBy === 'deterministic';
    return (
      <div className="page-enter">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Generated Plan Preview</h1>
            {isFallback && (
              <p className="mt-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 inline-block">
                A starter plan was generated. Review and adapt it to your project before applying.
              </p>
            )}
          </div>
          <button onClick={() => setStep('input')} className="btn-secondary flex-shrink-0">← Edit inputs</button>
        </div>

        {/* Feasibility warning */}
        {generatedPlan.feasibility && !generatedPlan.feasibility.feasible && (
          <div className="card mb-4 border-amber-300 bg-amber-50">
            <h3 className="font-semibold text-amber-800 mb-2">⚠ Feasibility concern</h3>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
              {(generatedPlan.feasibility.conflicts || []).map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {/* Assumptions */}
        {generatedPlan.assumptions?.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Assumptions</h3>
            <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
              {generatedPlan.assumptions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tasks',        val: generatedPlan.tasks?.length        || 0 },
            { label: 'Dependencies', val: generatedPlan.dependencies?.length || 0 },
            { label: 'Milestones',   val: generatedPlan.milestones?.length   || 0 },
            { label: 'Risks',        val: generatedPlan.risks?.length        || 0 },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-primary-600">{s.val}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="card mb-4">
          <h2 className="text-lg font-semibold mb-3">Tasks</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(generatedPlan.tasks || []).map((task, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</div>
                    )}
                    {task.acceptanceCriteria && (
                      <div className="text-xs text-emerald-700 mt-1">✓ {task.acceptanceCriteria}</div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {task.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium
                        ${task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.hours > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{task.hours}h</span>
                    )}
                  </div>
                </div>
                {task.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {task.skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        {generatedPlan.milestones?.length > 0 && (
          <div className="card mb-4">
            <h2 className="text-lg font-semibold mb-3">Milestones</h2>
            <div className="space-y-2">
              {generatedPlan.milestones.map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium text-slate-800">{m.title}</span>
                  {(m.dueDate || m.due_date) && (
                    <span className="text-slate-500">{new Date(m.dueDate || m.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {generatedPlan.risks?.length > 0 && (
          <div className="card mb-4">
            <h2 className="text-lg font-semibold mb-3">Risks</h2>
            <div className="space-y-2">
              {generatedPlan.risks.map((r, i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-slate-100 pb-2 last:border-0">
                  <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded self-start mt-0.5
                    ${r.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                      r.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'}`}>
                    {r.severity}
                  </span>
                  <div>
                    <div className="font-medium text-slate-800">{r.title}</div>
                    {r.mitigation && <div className="text-xs text-slate-500 mt-0.5">↳ {r.mitigation}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply */}
        <div className="card">
          <h3 className="text-base font-semibold mb-3">Apply plan to project</h3>
          {!selectedProject && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select project *</label>
              <select className="input" value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)} disabled={projectsLoading}>
                <option value="">{projectsLoading ? 'Loading…' : 'Choose a project'}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          {selectedProject && (
            <p className="text-sm text-slate-600 mb-3">
              Applying to: <strong>{projects.find(p => String(p.id) === String(selectedProject))?.name || `Project #${selectedProject}`}</strong>.
              Duplicate titles are checked — existing tasks will not be overwritten.
            </p>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleApply}
              disabled={!selectedProject || loading}
              className="btn-primary flex-1">
              {loading ? 'Applying…' : '✓ Apply Plan'}
            </button>
            <button onClick={() => { setStep('input'); setError(''); }} className="btn-secondary">Back</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AIPlanner;
