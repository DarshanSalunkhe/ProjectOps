import { CollectionSkeleton, Modal } from '../components/WorkspaceUI';
import { useState, useEffect } from 'react';
import api from '../services/api';
import Avatar from '../components/Avatar';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';

const ROLE_CFG = {
  SYSTEM_ADMIN:    { bg:'rgba(124,58,237,0.1)', color:'#7C3AED', border:'rgba(124,58,237,0.25)' },
  PROJECT_OWNER:   { bg:'rgba(20,184,166,0.1)', color:'#0D9488', border:'rgba(20,184,166,0.25)' },
  PROJECT_MANAGER: { bg:'rgba(99,102,241,0.1)', color:'#4F46E5', border:'rgba(99,102,241,0.25)' },
  DEVELOPER:       { bg:'rgba(245,158,11,0.1)', color:'#D97706', border:'rgba(245,158,11,0.25)' },
  TEAM_MEMBER:     { bg:'rgba(100,116,139,0.1)', color:'#475569', border:'rgba(100,116,139,0.25)' },
  VIEWER:          { bg:'rgba(100,116,139,0.08)', color:'#64748B', border:'rgba(100,116,139,0.2)' },
};
const EXP_CFG = {
  EXPERT:       { bg:'rgba(20,184,166,0.1)',   color:'#0D9488' },
  ADVANCED:     { bg:'rgba(99,102,241,0.1)',   color:'#4F46E5' },
  INTERMEDIATE: { bg:'rgba(245,158,11,0.1)',   color:'#D97706' },
  BEGINNER:     { bg:'rgba(100,116,139,0.08)', color:'#64748B' },
};
const AVAIL_DOT = { AVAILABLE:'#14B8A6', BUSY:'#F59E0B', AWAY:'#F97316', OFFLINE:'#94A3B8' };

const RolePill = ({ role }) => {
  const cfg = ROLE_CFG[role] || ROLE_CFG.TEAM_MEMBER;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:'100px', fontSize:'10px', fontWeight:700, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, whiteSpace:'nowrap' }}>
      {role?.replace(/_/g,' ')}
    </span>
  );
};

const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteProjects, setInviteProjects] = useState([]);
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [inviteRole, setInviteRole] = useState('DEVELOPER');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('ALL');
  const [filterExperience, setFilterExperience] = useState('ALL');

  useEffect(() => {
    api.get('/auth/workspace/members').then(r => setMembers(Array.isArray(r.data) ? r.data : [])).catch(e => setError(e.message || 'Failed to load members')).finally(() => setLoading(false));
  }, []);

  const openInvite = async (member) => {
    setInviteTarget(member); setInviteMsg(null); setInviteProjectId('');
    if (!inviteProjects.length) {
      try { const d = await projectService.getAll(); setInviteProjects(Array.isArray(d) ? d.filter(p => !p.archived) : []); } catch { setInviteProjects([]); }
    }
  };

  const handleDirectInvite = async (e) => {
    e.preventDefault();
    if (!inviteProjectId || !inviteTarget) return;
    setInviting(true); setInviteMsg(null);
    try {
      await api.post(`/projects/${inviteProjectId}/members/invite`, { email: inviteTarget.email, role: inviteRole });
      setInviteMsg({ ok: true, text: `Invitation sent to ${inviteTarget.name}` });
    } catch (err) {
      setInviteMsg({ ok: false, text: err.response?.data?.message || err.message || 'Failed to send invite' });
    } finally { setInviting(false); }
  };

  const calcCap = (w, c) => !c ? 0 : Math.min(Math.round((w / c) * 100), 100);

  const filteredMembers = (members || []).filter(m =>
    (m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase()) || m.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (filterAvailability === 'ALL' || m.availability_status === filterAvailability) &&
    (filterExperience === 'ALL' || m.experience_level === filterExperience)
  );

  const canInvite = user && (user.role === 'PROJECT_OWNER' || user.role === 'SYSTEM_ADMIN' || user.role === 'PROJECT_MANAGER');
  const selectS = { fontSize:'12px', background:'var(--bg-card)', border:'1px solid var(--border-strong)', borderRadius:'8px', color:'var(--ink)', padding:'5px 10px', minHeight:'34px' };

  if (loading) return <CollectionSkeleton label="Loading workspace members…" />;

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom:'24px' }}>
        <p style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--accent-text)', marginBottom:'5px' }}>Workspace</p>
        <h1 style={{ fontSize:'26px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--ink)', marginBottom:'4px' }}>Team Directory</h1>
        <p style={{ fontSize:'13px', color:'var(--ink-secondary)' }}>View all workspace members, their skills, and availability.</p>
      </div>

      {error && <div className="error-state" style={{ marginBottom:'16px' }}>{error}</div>}

      {/* Filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center', marginBottom:'16px' }}>
        <select style={selectS} value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)} aria-label="Filter availability">
          <option value="ALL">All Availability</option>
          {['AVAILABLE','BUSY','AWAY','OFFLINE'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select style={selectS} value={filterExperience} onChange={e => setFilterExperience(e.target.value)} aria-label="Filter experience">
          <option value="ALL">All Experience</option>
          {['EXPERT','ADVANCED','INTERMEDIATE','BEGINNER'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <div style={{ flex:1, minWidth:'200px', maxWidth:'320px', position:'relative' }}>
          <svg style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--ink-muted)' }} width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
          <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search members or skills…" aria-label="Search members" className="input" style={{ paddingLeft:'30px', minHeight:'34px', fontSize:'12px' }} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px', marginBottom:'20px' }}>
        {[
          { label:'Total Members', value:members.length, color:'var(--accent-text)' },
          { label:'Available', value:members.filter(m => m.availability_status === 'AVAILABLE').length, color:'#0D9488' },
          { label:'Experts', value:members.filter(m => m.experience_level === 'EXPERT').length, color:'#4F46E5' },
          { label:'Avg Capacity', value:`${members.length > 0 ? Math.round(members.reduce((s,m) => s+(m.weekly_capacity_hours||0),0)/members.length) : 0}h`, color:'var(--ink)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:'10px', fontWeight:600, color:'var(--ink-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>{stat.label}</p>
            <p style={{ fontSize:'22px', fontWeight:800, color:stat.color, letterSpacing:'-0.03em' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      {filteredMembers.length > 0 ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap:'14px' }}>
          {filteredMembers.map(member => {
            const capPct = calcCap(member.workload_hours, member.weekly_capacity_hours);
            const expCfg = EXP_CFG[member.experience_level] || EXP_CFG.BEGINNER;
            const dotColor = AVAIL_DOT[member.availability_status] || '#94A3B8';
            return (
              <article key={member.id} className="card" style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'0', transition:'border-color 150ms, box-shadow 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.25)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(124,58,237,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='var(--shadow-card)'; }}
              >
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px' }}>
                  <Avatar user={member} size="md" />
                  <div style={{ minWidth:0, flex:1 }}>
                    <h3 className="mobile-readable" style={{ fontSize:'13px', fontWeight:700, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'2px' }}>{member.name}</h3>
                    <p className="mobile-readable" style={{ fontSize:'11px', color:'var(--ink-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.email}</p>
                    <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'5px', marginTop:'6px' }}>
                      <RolePill role={member.role} />
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'10px', fontWeight:600, color:'var(--ink-secondary)' }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:dotColor, flexShrink:0 }} />
                        {member.availability_status}
                      </span>
                    </div>
                  </div>
                </div>

                {member.bio && <p className="mobile-readable" style={{ fontSize:'12px', color:'var(--ink-secondary)', lineHeight:1.5, marginBottom:'10px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{member.bio}</p>}

                {/* Experience + capacity */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'10px', borderTop:'1px solid var(--border)', marginBottom:'8px' }}>
                  <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'100px', fontSize:'10px', fontWeight:700, background:expCfg.bg, color:expCfg.color, border:`1px solid ${expCfg.color}30` }}>
                    {member.experience_level}
                  </span>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'10px', color:'var(--ink-muted)' }}>Capacity</p>
                    <p style={{ fontSize:'11px', fontWeight:700, color:'var(--ink)' }}>{member.workload_hours||0}/{member.weekly_capacity_hours||40}h</p>
                  </div>
                </div>

                {/* Cap bar */}
                {(member.weekly_capacity_hours > 0) && (
                  <div style={{ height:'4px', background:'var(--border)', borderRadius:'100px', overflow:'hidden', marginBottom:'10px' }}>
                    <div style={{ height:'100%', borderRadius:'100px', background: capPct>=90 ? '#EF4444' : capPct>=70 ? '#F59E0B' : '#14B8A6', width:`${capPct}%`, transition:'width 0.5s ease' }} />
                  </div>
                )}

                {/* Skills */}
                {member.skills?.length > 0 && (
                  <div style={{ paddingTop:'8px', borderTop:'1px solid var(--border)', marginBottom:'10px' }}>
                    <p style={{ fontSize:'10px', fontWeight:600, color:'var(--ink-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Skills</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                      {member.skills.slice(0,5).map((s,i) => (
                        <span key={i} style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'100px', background:'rgba(124,58,237,0.08)', color:'var(--accent-text)', border:'1px solid rgba(124,58,237,0.2)' }}>{s}</span>
                      ))}
                      {member.skills.length > 5 && <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'100px', background:'var(--bg-app)', color:'var(--ink-muted)' }}>+{member.skills.length-5}</span>}
                    </div>
                  </div>
                )}

                {/* Invite */}
                {canInvite && (
                  <button onClick={() => openInvite(member)} className="btn btn-primary" style={{ width:'100%', fontSize:'12px', minHeight:'32px', gap:'5px', justifyContent:'center', marginTop:'auto' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    Invite to project
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding:'48px 24px', textAlign:'center' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'rgba(124,58,237,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="22" height="22" fill="none" stroke="var(--violet)" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20"/></svg>
          </div>
          <p style={{ fontWeight:700, fontSize:'15px', color:'var(--ink)', marginBottom:'5px' }}>No members found</p>
          <p style={{ fontSize:'12px', color:'var(--ink-muted)' }}>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Invite modal */}
      {inviteTarget && (
        <Modal title="Invite to project" busy={inviting} onClose={() => { setInviteTarget(null); setInviteMsg(null); }}>
            <p style={{ fontSize:'13px', color:'var(--ink-secondary)', marginBottom:'18px' }}>
              Send an invitation to <strong style={{ color:'var(--ink)' }}>{inviteTarget.name}</strong>
            </p>
            <form onSubmit={handleDirectInvite} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'var(--ink-secondary)', marginBottom:'5px' }}>Project *</label>
                <select className="input" value={inviteProjectId} onChange={e => setInviteProjectId(e.target.value)} required>
                  <option value="">Select project…</option>
                  {inviteProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'var(--ink-secondary)', marginBottom:'5px' }}>Role</label>
                <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="DEVELOPER">Developer</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              {inviteMsg && <p style={{ fontSize:'12px', fontWeight:500, color: inviteMsg.ok ? '#0D9488' : '#DC2626' }}>{inviteMsg.text}</p>}
              <div style={{ display:'flex', gap:'8px', paddingTop:'4px' }}>
                <button type="submit" disabled={inviting} aria-busy={inviting} className="btn btn-primary" style={{ flex:1, minHeight:'36px' }}>
                  {inviting ? 'Sending invitation…' : 'Send invitation'}
                </button>
                <button type="button" disabled={inviting} onClick={() => { setInviteTarget(null); setInviteMsg(null); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};

export default Team;
