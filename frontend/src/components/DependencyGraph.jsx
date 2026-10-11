import { calculateNodePositions } from '../utils/dependencyLayout';
import { useEffect, useRef, useState } from 'react';

/**
 * Visual Dependency Graph Component
 * Renders tasks and their dependencies as an interactive SVG graph
 */
export const DependencyGraph = ({ tasks = [], dependencies = [] }) => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;
    const resize = () => setDimensions({width: container.clientWidth || 800, height: Math.max(600, tasks.length * 80)});
    resize();
    const observer = new ResizeObserver(resize); observer.observe(container);
    return () => observer.disconnect();
  }, [tasks]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tasks to visualize. Add tasks to see the dependency graph.
      </div>
    );
  }

  // Calculate node positions
  const nodePositions = calculateNodePositions(tasks, dependencies, dimensions);

  // Get status color for nodes
  const getStatusColor = (status) => {
    const colors = {
      'TODO': '#9CA3AF',
      'IN_PROGRESS': '#3B82F6',
      'BLOCKED': '#EF4444',
      'COMPLETED': '#10B981'
    };
    return colors[status] || '#9CA3AF';
  };

  // Check if task is on critical path
  const isOnCriticalPath = (taskId) => {
    return tasks.find(task => task.id === taskId)?.priority === 'CRITICAL';
  };

  return (
    <div className="card"><div className="flex flex-wrap gap-2 items-center justify-between mb-4"><div><h3 className="font-semibold">Dependency map</h3><p className="text-xs text-slate-400 mt-1">Arrows flow from prerequisites to dependent tasks. Scroll to explore.</p></div><div className="flex gap-2"><button className="btn-secondary" aria-label="Zoom out" disabled={zoom <= .5} onClick={() => setZoom(z => Math.max(.5,z-.25))}>−</button><button className="btn-secondary" onClick={() => setZoom(1)}>Reset</button><button className="btn-secondary" aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom(z => Math.min(2,z+.25))}>+</button></div></div><div className="overflow-auto max-h-[650px]">

      <svg
        ref={svgRef}
        role="img" aria-label="Task dependency graph"
        viewBox={`0 0 ${Math.max(dimensions.width,...nodePositions.map(n => n.x+n.width+40))} ${dimensions.height}`}
        width={Math.max(dimensions.width,...nodePositions.map(n => n.x+n.width+40)) * zoom}
        height={dimensions.height * zoom}
        className="border border-gray-200 rounded" style={{background: '#fafbfc'}}
      >
        {/* Draw dependency edges first (so they appear behind nodes) */}
        {dependencies.map((dep, idx) => {
          const fromNode = nodePositions.find(n => n.id === dep.depends_on_task_id);
          const toNode = nodePositions.find(n => n.id === dep.task_id);
          
          if (!fromNode || !toNode) return null;

          return (
            <g key={`edge-${idx}`}>
              <defs>
                <marker
                  id={`arrowhead-${idx}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
                </marker>
              </defs>
              <line
                x1={fromNode.x + fromNode.width}
                y1={fromNode.y + fromNode.height / 2}
                x2={toNode.x}
                y2={toNode.y + toNode.height / 2}
                stroke="#6B7280"
                strokeWidth="2"
                markerEnd={`url(#arrowhead-${idx})`}
              />
            </g>
          );
        })}

        {/* Draw task nodes */}
        {nodePositions.map((node) => {
          const task = tasks.find(t => t.id === node.id);
          if (!task) return null;

          const delayed = task.deadline && task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
          const fillColor = task.status === 'BLOCKED' ? '#fb7185' : delayed ? '#fbbf24' : getStatusColor(task.status);
          const isCritical = isOnCriticalPath(task.id);

          return (
            <g key={`node-${node.id}`}><title>{`${task.title} · ${task.status} · ${task.priority}${delayed ? ' · Overdue' : ''}`}</title>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill="#ffffff"
                stroke={isCritical ? '#a78bfa' : fillColor}
                strokeWidth={isCritical ? '3' : '2'}
                rx="8"
                
              />
              <text
                x={node.x + node.width / 2}
                y={node.y + node.height / 2}
                fill="#39464d"
                fontSize="14"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none"
              >
                {truncateText(task.title, 20)}
              </text>
              <text
                x={node.x + node.width / 2}
                y={node.y + node.height / 2 + 18}
                fill="#69777d"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.9"
                className="pointer-events-none"
              >
                {task.status.replaceAll('_',' ')}{delayed ? ' · Overdue' : ''}
              </text>
            </g>
          );
        })}
      </svg></div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>To Do</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-4 border-violet-400 rounded"></div>
          <span>Critical priority</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate positions for all task nodes
 * Uses a simple layered layout algorithm
 */
/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
