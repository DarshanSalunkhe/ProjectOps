import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateNodePositions } from '../utils/dependencyLayout';
import { DependencyGraph } from '../components/DependencyGraph';
import { AICommandCenter } from '../components/AICommandCenter';
const tasks = [{id:1,title:'Prerequisite',status:'TODO',priority:'LOW'}, {id:2,title:'Dependent',status:'BLOCKED',priority:'CRITICAL'}];
const dimensions = {width:800,height:600};
describe('dependency map regression', () => {
  it('places prerequisites before their dependents', () => {
    const nodes = calculateNodePositions(tasks,[{task_id:2,depends_on_task_id:1}],dimensions);
    expect(nodes.find(n => n.id===1).x).toBeLessThan(nodes.find(n => n.id===2).x);
  });
  it('keeps cyclic and isolated tasks visible without hanging', () => {
    const nodes = calculateNodePositions([...tasks,{id:3}], [{task_id:2,depends_on_task_id:1},{task_id:1,depends_on_task_id:2}],dimensions);
    expect(new Set(nodes.map(n => n.id)).size).toBe(3);
    expect(nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });
  it('ignores references to tasks outside the visible project', () => {
    expect(calculateNodePositions(tasks,[{task_id:2,depends_on_task_id:999}],dimensions)).toHaveLength(2);
  });
  it('renders empty projects and preserves full task names in accessible titles', () => {
    expect(renderToStaticMarkup(<DependencyGraph tasks={[]} dependencies={[]} />)).toContain('No tasks to visualize');
    const html=renderToStaticMarkup(<DependencyGraph tasks={tasks} dependencies={[]} />);
    expect(html).toContain('Prerequisite · TODO · LOW');
    expect(html).toContain('Critical priority');
    expect(html).not.toContain('On Critical Path');
  });
  it('expands SVG bounds for deep dependency chains', () => {
    const chain=Array.from({length:8},(_,i)=>({id:i,title:'Task '+i,status:'TODO'}));
    const edges=chain.slice(1).map(t=>({task_id:t.id,depends_on_task_id:t.id-1}));
    const html=renderToStaticMarkup(<DependencyGraph tasks={chain} dependencies={edges} />);
    expect(html).toContain('viewBox="0 0 1940 600"');
  });
});
describe('AI recovery inputs', () => {
  it('shows only real incomplete project tasks', () => {
    const html=renderToStaticMarkup(<AICommandCenter projectId={42} userRole="VIEWER" tasks={[...tasks,{id:3,title:'Finished',status:'COMPLETED'}]} />);
    expect(html).toContain('value="1">Prerequisite');
    expect(html).toContain('value="2">Dependent');
    expect(html).not.toContain('value="3">Finished');
    expect(html).not.toContain('Task #1 (Demo)');
    expect(html).toContain('Simulated delay in days');
  });
});
