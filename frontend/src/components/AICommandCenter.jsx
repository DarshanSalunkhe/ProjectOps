import { Modal, LoadingState } from './WorkspaceUI';
import { useState, useEffect } from 'react';
import { intelligenceService } from '../services/intelligenceService';
import { ConfirmationDialog, ErrorState } from './WorkspaceUI';
import api from '../services/api';

export const AICommandCenter = ({ projectId, userRole, tasks = [], onUpdate }) => {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmPlan, setConfirmPlan] = useState(false);
  const [confirmRecoveryAction, setConfirmRecoveryAction] = useState(null);
  const [recoveryReviewed, setRecoveryReviewed] = useState(false);
  const [recoveryActionBusy, setRecoveryActionBusy] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [delayDays, setDelayDays] = useState(2);
  const [stage, setStage] = useState('Idle');
  const canManage = ['OWNER','DEVELOPER'].includes(userRole);
  const [health, setHealth] = useState(null);
  const [risks, setRisks] = useState([]);
  const [riskAdvice, setRiskAdvice] = useState('');
  const [impact, setImpact] = useState(null);
  const [replan, setReplan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const [showAssignments, setShowAssignments] = useState(false);
  const [assignmentRecs, setAssignmentRecs] = useState([]);
  const [showPlanner, setShowPlanner] = useState(false);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    goal: '',
    description: '',
    deadline: '',
    teamSize: 4,
    techStack: ''
  });

  useEffect(() => {
    if (projectId) {
      loadHealth();
      loadSavedRecovery();
    }
  }, [projectId]);
  useEffect(() => {
    const refresh = event => { if (String(event.detail?.projectId) === String(projectId)) loadHealth(); };
    window.addEventListener('projectops:project-updated', refresh);
    return () => window.removeEventListener('projectops:project-updated', refresh);
  }, [projectId]);

  const loadSavedRecovery = async () => {
    try {
      const proposals = await intelligenceService.getReplans(projectId);
      const latest = Array.isArray(proposals) ? proposals[0] : null;
      if (latest) {
        setReplan({ ...latest.proposal, proposalId: latest.id, approvalStatus: latest.status });
        setRecoveryReviewed(latest.status !== 'PENDING');
      }
    } catch (loadError) {
      setError(loadError.message || 'Saved recovery proposals could not be loaded.');
    }
  };

  const loadHealth = async () => {
    try {
      const data = await intelligenceService.getProjectHealth(projectId);
      setHealth(data.health);
      setRisks(data.risks || []);
    } catch (error) {
      setError(error.message || 'Project health could not be loaded.');
    }
  };

  const loadAssignmentRecommendations = async () => {
    setLoading(true);
    try {
      // Get tasks from parent or refetch
      const tasksResponse = await api.get(`/projects/${projectId}/tasks`);
      const tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : [];

      const unassignedTasks = tasks.filter(t =>
        (!t.assigned_users || t.assigned_users.length === 0) &&
        t.status !== 'COMPLETED'
      );

      const recommendations = [];
      for (const task of unassignedTasks.slice(0, 5)) {
        try {
          const matchResponse = await api.get(`/skills/tasks/${task.id}/matches?explain=true`);
          recommendations.push({
            task,
            matches: Array.isArray(matchResponse.data) ? matchResponse.data : []
          });
        } catch (err) {
          setError(err.message || 'Some assignment recommendations could not be loaded.');
        }
      }

      setAssignmentRecs(recommendations);
      setShowAssignments(true);
    } catch (error) {
      console.error('Failed to load assignment recommendations:', error);
      setError(error.message || 'Failed to load assignment recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!planFormData.goal) {
      setError('Please enter a project goal');
      return;
    }

    setPlannerLoading(true);
    try {
      const response = await intelligenceService.generatePlan({
        goal: planFormData.goal,
        description: planFormData.description,
        deadline: planFormData.deadline || null,
        teamSize: parseInt(planFormData.teamSize) || 4,
        techStack: planFormData.techStack ? planFormData.techStack.split(',').map(s => s.trim()) : []
      });

      setGeneratedPlan(response.data || response);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setError('Failed to generate plan: ' + (error.message || 'Unknown error'));
    } finally {
      setPlannerLoading(false);
    }
  };

  const applyPlan = async () => {
    if (!generatedPlan || !canManage) return;

    setPlannerLoading(true);
    try {
      await intelligenceService.applyPlan(projectId, generatedPlan);
      setNotice('Plan applied. Project tasks have been refreshed.');
      setConfirmPlan(false);
      await onUpdate?.();
      setGeneratedPlan(null);
      setShowPlanner(false);
      setPlanFormData({
        goal: '',
        description: '',
        deadline: '',
        teamSize: 4,
        techStack: ''
      });
    } catch (error) {
      console.error('Failed to apply plan:', error);
      setError('Failed to apply plan: ' + (error.message || 'Unknown error'));
    } finally {
      setPlannerLoading(false);
    }
  };

  const simulateDelay = async (taskId) => {
    if (!taskId) return;

    setLoading(true);
    setActiveDemo('impact');
    setError(''); setImpact(null); setReplan(null); setStage('Analyzing dependency impact');

    try {
      // Step 1: Analyze impact
      const impactData = await intelligenceService.analyzeImpact(taskId, Number(delayDays));
      setImpact(impactData);

      // Step 2: Detect risks
      setStage('Refreshing project health');
      await loadHealth();

      // Step 3: Generate replan
      await new Promise(resolve => setTimeout(resolve, 500));
      const replanData = await intelligenceService.generateReplan(projectId, {
        type: 'TASK_DELAY',
        taskId: parseInt(taskId),
        delayDays: Number(delayDays)
      });
      setReplan(replanData);
      setRecoveryReviewed(false);
      setStage('Analysis complete — proposal ready for review');

      setActiveDemo('complete');
    } catch (error) {
      console.error('Demo failed:', error);
      setError(error.message || 'Impact analysis failed. Check the selected task and retry.'); setActiveDemo(null); setStage('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = () => {
    setActiveDemo(null);
    setImpact(null);
    setReplan(null);
    setRecoveryReviewed(false);
  };

  const reviewRecovery = () => {
    setRecoveryReviewed(true);
    setNotice('Recovery proposal reviewed. An owner can now approve and apply or reject it.');
  };

  const decideRecovery = async () => {
    if (!replan?.proposalId || !canReview || !confirmRecoveryAction) return;
    setRecoveryActionBusy(true);
    setError('');
    try {
      const action = confirmRecoveryAction;
      const result = action === 'apply'
        ? await intelligenceService.applyReplan(projectId, replan.proposalId)
        : await intelligenceService.rejectReplan(projectId, replan.proposalId);
      setReplan(current => ({ ...current, approvalStatus: result.status || (action === 'apply' ? 'APPLIED' : 'REJECTED') }));
      setNotice(action === 'apply' ? 'Recovery approved and applied.' : 'Recovery proposal rejected.');
      setConfirmRecoveryAction(null);
      await onUpdate?.();
    } catch (actionError) {
      setError(actionError.message || 'Recovery proposal could not be updated.');
    } finally {
      setRecoveryActionBusy(false);
    }
  };

  const getHealthColor = (status) => {
    const colors = {
      HEALTHY: 'text-green-600 bg-green-50',
      AT_RISK: 'text-yellow-600 bg-yellow-50',
      CRITICAL: 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'text-red-800 bg-red-100 border-red-300',
      HIGH: 'text-orange-800 bg-orange-100 border-orange-300',
      MEDIUM: 'text-yellow-800 bg-yellow-100 border-yellow-300',
      LOW: 'text-blue-800 bg-blue-100 border-blue-300'
    };
    return colors[severity] || 'text-gray-800 bg-gray-100 border-gray-300';
  };

  return (
    <div className="space-y-6 ai-command-center">
      {error && <ErrorState message={error} />}
      {notice && <p className="card text-sm" role="status">{notice}</p>}
      <div className="ai-activity" role="status"><span className="sidebar-project-dot" />Analysis activity · {stage}</div>
      {confirmPlan && <ConfirmationDialog title="Apply generated plan?" busy={plannerLoading} onClose={() => setConfirmPlan(false)} onConfirm={applyPlan}>This creates {generatedPlan?.tasks?.length || 0} tasks and the proposed dependencies and milestones in this project. Review the preview before confirming.</ConfirmationDialog>}
      {confirmRecoveryAction && <ConfirmationDialog title={confirmRecoveryAction === 'apply' ? 'Approve and apply recovery?' : 'Reject recovery proposal?'} busy={recoveryActionBusy} busyLabel={confirmRecoveryAction === 'apply' ? 'Applying…' : 'Rejecting…'} confirmLabel={confirmRecoveryAction === 'apply' ? 'Approve and apply' : 'Reject proposal'} onClose={() => setConfirmRecoveryAction(null)} onConfirm={decideRecovery}>{confirmRecoveryAction === 'apply' ? 'This applies the reviewed assignment and schedule changes atomically. The server will reject stale project state or invalid dependencies.' : 'This records the proposal as rejected. No project tasks or assignments will change.'}</ConfirmationDialog>}
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2"> AI Command Center</h2>
        <p className="text-blue-100">Autonomous project intelligence and risk management</p>
      </div>

      {/* AI Project Planner */}
      {!showPlanner && !generatedPlan && (
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <h3 className="text-lg font-semibold mb-3"> AI Project Planner</h3>
          <p className="text-sm text-gray-700 mb-4">
            Generate a complete project plan with tasks, dependencies, and milestones using AI.
          </p>
          <button
            onClick={() => setShowPlanner(true)}
            className="btn-primary w-full"
          >
            Generate Project Plan
          </button>
        </div>
      )}

      {/* Planner Form */}
      {showPlanner && !generatedPlan && (
        <div className="card border-2 border-purple-200">
          <h3 className="text-lg font-semibold mb-4">Generate Project Plan</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Goal *
              </label>
              <input
                type="text"
                value={planFormData.goal}
                onChange={(e) => setPlanFormData({ ...planFormData, goal: e.target.value })}
                className="input"
                placeholder="E.g., Build an e-commerce platform"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                className="input"
                rows="3"
                placeholder="Additional details about the project..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={planFormData.deadline}
                  onChange={(e) => setPlanFormData({ ...planFormData, deadline: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={planFormData.teamSize}
                  onChange={(e) => setPlanFormData({ ...planFormData, teamSize: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tech Stack (comma-separated)
              </label>
              <input
                type="text"
                value={planFormData.techStack}
                onChange={(e) => setPlanFormData({ ...planFormData, techStack: e.target.value })}
                className="input"
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={generatePlan}
                disabled={plannerLoading || !canManage}
                className="btn-primary flex-1"
              >
                {plannerLoading ? 'Generating...' : 'Generate Plan'}
              </button>
              <button
                onClick={() => setShowPlanner(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Plan Preview */}
      {generatedPlan && (
        <div className="card border-2 border-purple-200">
          <h3 className="text-lg font-semibold mb-4">Generated Plan Preview</h3>
          <div className="space-y-4">
            {generatedPlan.metadata && (
              <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm">
                <div className="font-semibold text-purple-900 mb-2">Plan Metadata</div>
                <div className="text-purple-800">
                  Generated by: {generatedPlan.metadata.generatedBy === 'deterministic' ? 'Deterministic Planner (LLM not configured)' : 'AI'}
                  <br />
                  Team Size: {generatedPlan.metadata.teamSize} • Duration: {generatedPlan.metadata.estimatedDuration} days
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold mb-2">Tasks: {generatedPlan.tasks?.length || 0}</div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {(generatedPlan.tasks || []).slice(0, 10).map((task, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Priority: {task.priority} • Hours: {task.hours || 'TBD'}
                      {task.skills && task.skills.length > 0 && (
                        <span> • Skills: {task.skills.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
                {(generatedPlan.tasks || []).length > 10 && (
                  <div className="text-sm text-gray-500 text-center">
                    ... and {generatedPlan.tasks.length - 10} more tasks
                  </div>
                )}
              </div>
            </div>

            {generatedPlan.dependencies && generatedPlan.dependencies.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Dependencies:</span> {generatedPlan.dependencies.length}
              </div>
            )}

            {generatedPlan.milestones && generatedPlan.milestones.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Milestones:</span> {generatedPlan.milestones.length}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setConfirmPlan(true)}
                disabled={plannerLoading}
                className="btn-primary flex-1"
              >
                {plannerLoading ? 'Applying...' : canManage ? 'Review & Apply Plan' : 'Project manager approval required'}
              </button>
              <button
                onClick={() => {
                  setGeneratedPlan(null);
                  setShowPlanner(false);
                }}
                className="btn-secondary"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Health */}
      {health && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Project Health</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getHealthColor(health.status)}`}>
                <span className="text-3xl font-bold">{health.score ?? '—'}</span>
                <span className="text-sm font-semibold">{health.status === 'INSUFFICIENT_DATA' ? 'Insufficient data' : health.status}</span>
              </div>
            </div>
            <button onClick={loadHealth} className="btn-secondary text-sm">
              Refresh Analysis
            </button>
          </div>
        </div>
      )}

      {/* Active Risks */}
      {risks.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Active Risks ({risks.length})</h3>
          <div className="space-y-3">
            {risks.slice(0, 3).map((risk, idx) => (
              <div key={idx} className={`border-l-4 rounded p-3 text-sm ${getSeverityColor(risk.severity)}`}>
                <div className="font-semibold mb-1">{risk.type.replace(/_/g, ' ')}</div>
                <div className="opacity-90">{risk.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Agent */}
      {!showAssignments && (
        <div className="card bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <h3 className="text-lg font-semibold mb-3"> Intelligent Assignment Agent</h3>
          <p className="text-sm text-gray-700 mb-4">
            AI-powered task assignment recommendations based on skills, availability, and workload.
          </p>
          <button
            onClick={loadAssignmentRecommendations}
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Get Assignment Recommendations'}
          </button>
        </div>
      )}

      {/* Assignment Recommendations */}
      {showAssignments && assignmentRecs.length === 0 && <div className="card"><p>No unassigned tasks available for recommendations.</p><button className="btn-secondary mt-3" onClick={() => setShowAssignments(false)}>Close recommendations</button></div>}
      {showAssignments && assignmentRecs.length > 0 && (
        <div className="card border-2 border-green-200">
          <h3 className="text-lg font-semibold mb-3"> Recommended Assignments</h3>
          <div className="space-y-4">
            {assignmentRecs.map((rec, idx) => (
              <div key={idx} className="border border-gray-200 rounded p-4">
                <div className="font-semibold text-gray-900 mb-2">{rec.task.title}</div>
                {rec.matches.length > 0 ? (
                  <div className="space-y-2">
                    {rec.matches.slice(0, 3).map((match, midx) => (
                      <div key={midx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex-1">
                          <div className="font-medium text-green-900">{match.user.name}</div>
                          <div className="text-xs text-green-700 mt-1">{match.explanation}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-700">{match.match_score}%</div>
                          <div className="text-xs text-green-600">Match</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No team members match requirements</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAssignments(false)} className="btn-secondary w-full mt-4">
            Close Recommendations
          </button>
        </div>
      )}

      {/* Demo Controls */}
      <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <h3 className="text-lg font-semibold mb-4">Recovery workspace</h3>
        <p className="text-sm text-gray-700 mb-4">
          Simulate a task delay to see the AI detect risks, analyze cascading impact, and generate a recovery plan.
        </p>

        {!activeDemo ? (
          <div>
            <label className="block text-sm font-medium mb-2">Select a task to delay:</label>
            <select
              value={selectedTaskId}
              aria-label="Task to analyze"
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="input mb-3"
              disabled={loading}
            >
              <option value="">Choose a task...</option>
              {tasks.filter(task => task.status !== 'COMPLETED').map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
            <label className="block text-sm mb-2" htmlFor="delay-days">Simulated delay in days</label><input id="delay-days" className="input mb-3" type="number" min="1" max="365" value={delayDays} onChange={e => setDelayDays(e.target.value)} /><button className="btn-primary mb-3" disabled={loading || !selectedTaskId || Number(delayDays) < 1 || Number(delayDays) > 365} onClick={() => simulateDelay(selectedTaskId)}>Analyze impact & propose recovery</button>
            <p className="text-xs text-gray-600">
              Uses this project’s actual tasks and dependencies. Simulation generates a proposal without changing deadlines.
            </p>
          </div>
        ) : (
          <button onClick={resetDemo} className="btn-secondary w-full">
            Clear analysis
          </button>
        )}
      </div>

      {/* Impact Analysis Results */}
      {impact && (
        <div className="card border-2 border-orange-200">
          <h3 className="text-lg font-semibold mb-3"> Cascading Impact Analysis</h3>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="font-semibold text-orange-900 mb-1">Source Task Delayed</div>
              <div className="text-sm text-orange-800">
                {impact.sourceTask.title} - Delayed by {impact.sourceTask.delayDays} days
              </div>
            </div>

            {impact.totalAffected > 0 && (
              <div>
                <div className="font-medium mb-2">Affected Tasks: {impact.totalAffected}</div>
                <div className="space-y-2">
                  {impact.directlyAffected && impact.directlyAffected.length > 0 && (
                    <div className="text-sm">
                      <span className="font-semibold">Direct:</span>
                      <ul className="ml-4 mt-1 space-y-1">
                        {impact.directlyAffected.map((t, i) => (
                          <li key={i} className="text-gray-700">• {t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {impact.indirectlyAffected && impact.indirectlyAffected.length > 0 && (
                    <div className="text-sm">
                      <span className="font-semibold">Indirect:</span>
                      <ul className="ml-4 mt-1 space-y-1">
                        {impact.indirectlyAffected.slice(0, 3).map((t, i) => (
                          <li key={i} className="text-gray-700">• {t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="font-semibold text-blue-900 mb-1">Impact: {impact.overallImpact}</div>
              <div className="text-sm text-blue-800">{impact.recommendation}</div>
            </div>
          </div>
        </div>
      )}

      {impact && [...(impact.directlyAffected || []), ...(impact.indirectlyAffected || [])].length > 0 && <div className="card"><h3 className="text-lg font-semibold mb-4">Timeline impact · simulation</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Affected task</th><th className="p-3">Original deadline</th><th className="p-3">Projected deadline</th></tr></thead><tbody>{[...(impact.directlyAffected || []), ...(impact.indirectlyAffected || [])].map(task => <tr key={task.id}><td className="p-3">{task.title}<p className="text-xs text-slate-400">{task.reason}</p></td><td className="p-3">{task.currentDeadline ? new Date(task.currentDeadline).toLocaleDateString() : 'Unscheduled'}</td><td className="p-3">{task.currentDeadline ? new Date(new Date(task.currentDeadline).getTime() + task.projectedDelay * 86400000).toLocaleDateString() : 'Unscheduled'}</td></tr>)}</tbody></table></div></div>}
      {/* Replanning Proposal */}
      <div className="card mb-4"><button className="btn-secondary" disabled={loading} onClick={async () => { setLoading(true); try { const data = await intelligenceService.detectRisks(projectId); setRiskAdvice(data.aiExplanation?.text || data.aiExplanation?.reason || 'No explanation available.'); } catch (err) { setError(err.message); } finally { setLoading(false); } }}>Explain risks and suggest solutions</button>{riskAdvice && <p className="mt-3 whitespace-pre-wrap">{riskAdvice}</p>}</div>
      {replan?.aiExplanation?.text && <div className="card mb-4 recovery-proposal-text">{replan.aiExplanation.text.replace(/^#{1,3}\s+/gm,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/^\*\s+/gm,'• ')}</div>}
      {replan && (
        <div className="card border-2 border-green-200">
          <h3 className="text-lg font-semibold mb-3"> Autonomous Recovery Plan</h3>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="font-semibold text-yellow-900 mb-1">Problem Detected</div>
              <div className="text-sm text-yellow-800">
                {replan.problem?.type?.replace(/_/g, ' ')} detected in project
              </div>
            </div>

            {replan.recommendations && replan.recommendations.length > 0 && (
              <div>
                <div className="font-semibold mb-3">AI Recommendations ({replan.recommendations.length})</div>
                <div className="space-y-3">
                  {replan.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-green-900">{rec.action}</div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          rec.priority === 'HIGH' || rec.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>

                      <div className="text-sm text-green-800 mb-2">
                        <span className="font-medium">Type:</span> {rec.type}
                      </div>

                      {rec.target && (
                        <div className="text-sm text-green-800 mb-2">
                          {rec.target.taskTitle && <div>Task: {rec.target.taskTitle}</div>}
                          {rec.target.suggestedUser && <div>Assign to: {rec.target.suggestedUser}</div>}
                          {rec.target.reason && <div className="text-xs mt-1 opacity-80">{rec.target.reason}</div>}
                        </div>
                      )}

                      <div className="text-sm bg-white/50 rounded p-2 mt-2">
                        <span className="font-medium">Expected Benefit:</span> {rec.expectedBenefit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {replan.estimatedImpact && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <div className="font-semibold text-blue-900 mb-2">Estimated Impact</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-blue-800">
                  <div>Tasks Affected: {replan.estimatedImpact.tasksAffected}</div>
                  <div>Confidence: {replan.estimatedImpact.confidenceLevel}</div>
                  <div>Reassignments: {replan.estimatedImpact.reassignments}</div>
                  <div>Recovery Time: {replan.estimatedImpact.estimatedRecoveryTime}</div>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600">Review the proposed changes before approval. Applying a proposal rechecks project state and runs supported changes in one transaction.</p>
            {replan.approvalStatus && <p className="text-sm" role="status">Proposal status: <strong>{replan.approvalStatus}</strong></p>}
            {replan.approvalStatus === 'PENDING' && <>
              {!recoveryReviewed && <button onClick={reviewRecovery} className="btn-secondary">Review recovery proposal</button>}
              {recoveryReviewed && <p className="text-sm text-emerald-700" role="status">Proposal reviewed. Confirm your decision below.</p>}
              {userRole === 'OWNER' ? <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => setConfirmRecoveryAction('apply')} className="btn-primary flex-1" disabled={!recoveryReviewed || recoveryActionBusy}>Approve &amp; apply</button>
                <button onClick={() => setConfirmRecoveryAction('reject')} className="btn-secondary" disabled={recoveryActionBusy}>Reject proposal</button>
              </div> : <p className="text-sm text-slate-500">Only a project owner can approve, apply, or reject this proposal.</p>}
            </>}
            <button onClick={resetDemo} className="btn-secondary mt-3">Reset Demo</button>
          </div>
        </div>
      )}

      {loading && <Modal title="AI analysis in progress" busy>
        <LoadingState variant="ai" label="Processing your project request…" />
        <p className="text-center text-sm text-gray-600">AI suggestions will appear when the request completes. Review them before applying changes.</p>
      </Modal>}

    </div>
  );
};
