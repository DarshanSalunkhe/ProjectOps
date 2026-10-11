export function calculateNodePositions(tasks, dependencies, dimensions) {
  const nodeWidth = 180;
  const nodeHeight = 50;
  const horizontalSpacing = 60;
  const verticalSpacing = 30;
  const leftMargin = 40;
  const topMargin = 40;

  // Build dependency graph
  const graph = new Map();
  tasks.forEach(task => {
    graph.set(task.id, {
      id: task.id,
      incoming: [],
      outgoing: []
    });
  });

  dependencies.forEach(dep => {
    const from = graph.get(dep.depends_on_task_id);
    const to = graph.get(dep.task_id);
    if (from && to) {
      from.outgoing.push(to.id);
      to.incoming.push(from.id);
    }
  });

  // Assign layers using topological sort
  const layers = [];
  const visited = new Set();
  const inDegree = new Map();

  tasks.forEach(task => {
    const node = graph.get(task.id);
    inDegree.set(task.id, node.incoming.length);
  });

  // Start with nodes that have no dependencies
  let queue = tasks.filter(t => inDegree.get(t.id) === 0).map(t => t.id);
  let currentLayer = 0;

  while (queue.length > 0) {
    if (!layers[currentLayer]) {
      layers[currentLayer] = [];
    }
    
    const nextQueue = [];
    
    queue.forEach(taskId => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      layers[currentLayer].push(taskId);
      
      const node = graph.get(taskId);
      node.outgoing.forEach(childId => {
        const current = inDegree.get(childId);
        inDegree.set(childId, current - 1);
        if (inDegree.get(childId) === 0) {
          nextQueue.push(childId);
        }
      });
    });
    
    queue = nextQueue;
    currentLayer++;
  }

  // Handle any remaining nodes (cycles or disconnected)
  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      if (!layers[currentLayer]) {
        layers[currentLayer] = [];
      }
      layers[currentLayer].push(task.id);
    }
  });

  // Calculate positions
  const positions = [];
  layers.forEach((layer, layerIndex) => {
    const layerHeight = layer.length * (nodeHeight + verticalSpacing);
    const startY = topMargin + (dimensions.height - layerHeight) / 2;
    
    layer.forEach((taskId, nodeIndex) => {
      positions.push({
        id: taskId,
        x: leftMargin + layerIndex * (nodeWidth + horizontalSpacing),
        y: startY + nodeIndex * (nodeHeight + verticalSpacing),
        width: nodeWidth,
        height: nodeHeight
      });
    });
  });

  return positions;
}

