import { CollectionSkeleton, Modal } from '../components/WorkspaceUI';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Skills = () => {
  const { user } = useAuth();
  const [mySkills, setMySkills] = useState([]);
  const [workspaceSkills, setWorkspaceSkills] = useState([]);
  const [skillGaps, setSkillGaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-skills');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    proficiency_level: 'INTERMEDIATE',
    years_experience: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mySkillsRes, workspaceSkillsRes, gapsRes] = await Promise.all([
        api.get('/skills/me'),
        api.get('/skills/workspace'),
        api.get('/skills/workspace/gaps')
      ]);

      setMySkills(Array.isArray(mySkillsRes.data) ? mySkillsRes.data : []);
      setWorkspaceSkills(Array.isArray(workspaceSkillsRes.data) ? workspaceSkillsRes.data : []);
      setSkillGaps(gapsRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load skills');
      setMySkills([]);
      setWorkspaceSkills([]);
      setSkillGaps(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/skills/me', newSkill);
      setSuccess('Skill added successfully!');
      setShowAddModal(false);
      setNewSkill({ skill_name: '', proficiency_level: 'INTERMEDIATE', years_experience: 0 });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillName) => {
    if (!window.confirm(`Remove ${skillName} from your skills?`)) return;

    try {
      await api.delete(`/skills/me/${encodeURIComponent(skillName)}`);
      setSuccess('Skill removed');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove skill');
    }
  };

  const getProficiencyColor = (level) => {
    const colors = {
      'EXPERT': 'bg-blue-600',
      'ADVANCED': 'bg-green-600',
      'INTERMEDIATE': 'bg-yellow-600',
      'BEGINNER': 'bg-gray-600'
    };
    return colors[level] || 'bg-gray-600';
  };

  const getProficiencyBadgeClass = (level) => {
    const classes = {
      'EXPERT': 'badge-info',
      'ADVANCED': 'badge-success',
      'INTERMEDIATE': 'badge-warning',
      'BEGINNER': 'badge-gray'
    };
    return classes[level] || 'badge-gray';
  };

  if (loading) return <CollectionSkeleton label="Loading skills…" />;

  return (
    <div className="page-enter">
      <div className="mb-7">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Expertise</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Skills Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your skills and view workspace capabilities.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('my-skills')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'my-skills'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Skills ({mySkills.length})
        </button>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'workspace'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Workspace Skills ({workspaceSkills.length})
        </button>
        <button
          onClick={() => setActiveTab('gaps')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'gaps'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Skill Gaps {skillGaps?.has_gaps && skillGaps?.gaps?.length > 0 && <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">{skillGaps.gaps.length}</span>}
        </button>
      </div>

      {/* My Skills Tab */}
      {activeTab === 'my-skills' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-slate-600">{mySkills.length} skills in your profile</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add Skill
            </button>
          </div>

          {mySkills.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {mySkills.map((skill) => (
                <div key={skill.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{skill.skill_name}</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={getProficiencyBadgeClass(skill.proficiency_level)}>
                          {skill.proficiency_level}
                        </span>
                        {skill.years_experience > 0 && (
                          <span className="text-xs text-slate-500">{skill.years_experience}y exp</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill.skill_name)}
                      className="text-slate-400 hover:text-red-600"
                      title="Remove skill"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary-700">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 6v12M6 12h12"/>
                  </svg>
                </div>
                <p className="text-lg font-bold text-slate-900">No skills added yet</p>
                <p className="mt-2 text-sm text-slate-500">Add your skills to help with task assignments</p>
                <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
                  Add Your First Skill
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workspace Skills Tab */}
      {activeTab === 'workspace' && (
        <div>
          <p className="mb-4 text-sm text-slate-600">{workspaceSkills.length} unique skills across the workspace</p>

          {workspaceSkills.length > 0 ? (
            <div className="space-y-3">
              {workspaceSkills.map((skill) => (
                <div key={skill.skill_name} className="card p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-slate-900">{skill.skill_name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {skill.user_count} team member{skill.user_count !== 1 ? 's' : ''} • Avg proficiency: {Math.round(skill.avg_proficiency * 100) / 100}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {skill.user_count === 1 && (
                        <span className="rounded-md bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
                          Single Point of Failure
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12 text-slate-500">No skills found in workspace</div>
          )}
        </div>
      )}

      {/* Skill Gaps Tab */}
      {activeTab === 'gaps' && skillGaps && (
        <div>
          {skillGaps.has_gaps ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-semibold text-yellow-900">
                  {skillGaps.gap_count} skill gap{skillGaps.gap_count !== 1 ? 's' : ''} detected
                  {skillGaps.critical_gaps > 0 && ` (${skillGaps.critical_gaps} critical)`}
                </p>
              </div>

              {skillGaps.gaps.map((gap, idx) => (
                <div key={idx} className={`card p-4 border-l-4 ${
                  gap.severity === 'CRITICAL' || gap.severity === 'HIGH'
                    ? 'border-red-500'
                    : gap.severity === 'MEDIUM'
                    ? 'border-yellow-500'
                    : 'border-slate-300'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{gap.skill}</h3>
                        <span className={`badge ${
                          gap.severity === 'CRITICAL' ? 'badge-danger' :
                          gap.severity === 'HIGH' ? 'badge-danger' :
                          gap.severity === 'MEDIUM' ? 'badge-warning' :
                          'badge-gray'
                        }`}>
                          {gap.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{gap.message}</p>
                      {gap.qualified_count > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          {gap.qualified_count} qualified, {gap.available_count} available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="m5 12 5 5L20 7"/>
                  </svg>
                </div>
                <p className="text-lg font-bold text-slate-900">No skill gaps detected</p>
                <p className="mt-2 text-sm text-slate-500">Your workspace has good skill coverage</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <Modal title="Add Skill" onClose={() => setShowAddModal(false)}>

            <form onSubmit={handleAddSkill}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                  className="input"
                  placeholder="e.g., React, Python, Project Management"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proficiency Level
                </label>
                <select
                  value={newSkill.proficiency_level}
                  onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: e.target.value })}
                  className="input"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Years Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.5"
                  value={newSkill.years_experience}
                  onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add Skill
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};

export default Skills;
