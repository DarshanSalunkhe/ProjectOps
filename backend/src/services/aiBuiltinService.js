export function builtinAnswer(message, ctx, today = new Date()) {
  const q = message.trim().toLowerCase();
  const list = tasks => tasks.length ? tasks.map(t => `${t.title} (${t.status}${t.deadline ? `, due ${String(t.deadline).slice(0,10)}` : ''})`).join('\n') : 'None found.';
  if (/^(help|what can you do|how does.*ai)[?.!]*$/.test(q)) return 'Ask about progress, overdue tasks, deadlines, team workload, or milestones. Request a personalized plan, assignment explanation, delay report, recovery proposal, or risk solution. Changes require preview and approval in the planning or recovery tools.';
  if (/^(what tasks are overdue|show overdue tasks|overdue tasks|delay report)[?.!]*$/.test(q)) return `Overdue tasks as of ${today.toISOString().slice(0,10)}:\n${list(ctx.tasks.filter(t => t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < today))}`;
  if (/^(summarize project progress|project status|project progress|how is the project doing)[?.!]*$/.test(q)) return `${ctx.project.name}: ${ctx.project.status}. ${ctx.tasks.filter(t => t.status === 'COMPLETED').length}/${ctx.tasks.length} tasks completed; ${ctx.tasks.filter(t => t.status === 'BLOCKED').length} blocked. Deadline: ${ctx.project.deadline ? String(ctx.project.deadline).slice(0,10) : 'not set'}.`;
  if (/^(who has the most work assigned|team workload|show assignments)[?.!]*$/.test(q)) return ctx.members.map(m => `${m.name}: ${ctx.tasks.filter(t => t.assignees?.some(a => a.id === m.id) && t.status !== 'COMPLETED').length} open assignments`).join('\n') || 'No project members found.';
  if (/^(show milestones|what are the milestones)[?.!]*$/.test(q)) return ctx.milestones.map(m => `${m.title}: ${m.completed ? 'completed' : String(m.due_date || 'no date').slice(0,10)}`).join('\n') || 'No milestones found.';
  return null;
}
export function validateDates(text) {
  for (const date of String(text).match(/\b\d{4}-\d{2}-\d{2}\b/g) || []) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date) return false;
  }
  return true;
}
