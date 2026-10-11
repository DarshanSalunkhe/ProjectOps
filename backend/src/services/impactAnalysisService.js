/**
 * Cascading Impact Analysis Service
 * Analyzes downstream effects of task delays
 */
const toDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const impactAnalysisService = {
  /**
   * Analyze impact of delaying a specific task
   */
  async analyzeTaskDelay(taskId, delayDays, { taskRepository, dependencyRepository, milestoneRepository }) {
    if (!Number.isInteger(Number(delayDays)) || Number(delayDays) < 1 || Number(delayDays) > 365) {
      throw new Error('Delay must be between 1 and 365 days');
    }
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const affectedTasks = [];
    const affectedMilestones = [];
    
    // Find all downstream dependent tasks recursively
    const directDependencies = await dependencyRepository.findDependentTasks(taskId);
    const directTaskIds = new Set(directDependencies.map((dependency) => Number(dependency.task_id)));
    const downstream = await this._findDownstreamTasks(taskId, dependencyRepository);
    
    for (const depTaskId of downstream) {
      const depTask = await taskRepository.findById(depTaskId);
      if (depTask) {
        let impact = 'MEDIUM';
        
        // Calculate impact severity
        if (depTask.deadline) {
          const deadline = new Date(depTask.deadline);
          const projectedDelay = new Date(deadline);
          projectedDelay.setDate(projectedDelay.getDate() + delayDays);
          
          if (projectedDelay > deadline) {
            impact = 'HIGH';
          }
        }
        
        if (depTask.priority === 'CRITICAL') {
          impact = 'CRITICAL';
        }

        affectedTasks.push({
          id: depTask.id,
          title: depTask.title,
          currentDeadline: toDateOnly(depTask.deadline),
          projectedDelay: delayDays,
          impact,
          reason: directTaskIds.has(Number(depTaskId)) ? 'Direct dependency' : 'Indirect dependency'
        });
      }
    }

    // Check affected milestones
    const milestones = await milestoneRepository.findByProject(task.project_id);
    milestones.forEach(milestone => {
      if (milestone.due_date && !milestone.completed) {
        // Check if any affected tasks are associated with this milestone
        const hasCriticalTask = affectedTasks.some(t => t.impact === 'CRITICAL');
        if (hasCriticalTask) {
          affectedMilestones.push({
            id: milestone.id,
            title: milestone.title,
            dueDate: milestone.due_date,
            risk: 'May be delayed',
            impact: 'HIGH'
          });
        }
      }
    });

    return {
      sourceTask: {
        id: task.id,
        title: task.title,
        delayDays
      },
      directlyAffected: affectedTasks.filter((t) => directTaskIds.has(Number(t.id))),
      indirectlyAffected: affectedTasks.filter((t) => !directTaskIds.has(Number(t.id))),
      affectedTasks,
      totalAffected: affectedTasks.length,
      affectedMilestones,
      overallImpact: this._calculateOverallImpact(affectedTasks),
      recommendation: this._generateRecommendation(task, affectedTasks, delayDays)
    };
  },

  /**
   * Find all downstream tasks recursively
   */
  async _findDownstreamTasks(taskId, dependencyRepository, visited = new Set()) {
    if (visited.has(taskId)) {
      return [];
    }
    
    visited.add(taskId);
    const downstream = [];
    
    // Find tasks that depend on this task
    const dependentTasks = await dependencyRepository.findDependentTasks(taskId);
    
    for (const dep of dependentTasks) {
      downstream.push(dep.task_id);
      
      // Recursively find downstream of those tasks
      const nested = await this._findDownstreamTasks(dep.task_id, dependencyRepository, visited);
      downstream.push(...nested);
    }
    
    return [...new Set(downstream)]; // Remove duplicates
  },

  /**
   * Calculate overall impact severity
   */
  _calculateOverallImpact(affectedTasks) {
    if (affectedTasks.some(t => t.impact === 'CRITICAL')) return 'CRITICAL';
    if (affectedTasks.length > 5 || affectedTasks.some(t => t.impact === 'HIGH')) return 'HIGH';
    if (affectedTasks.length > 0) return 'MEDIUM';
    return 'LOW';
  },

  /**
   * Generate recommendation based on impact
   */
  _generateRecommendation(task, affectedTasks, delayDays) {
    if (affectedTasks.length === 0) {
      return 'No dependent tasks affected. Safe to delay if needed.';
    }

    const criticalCount = affectedTasks.filter(t => t.impact === 'CRITICAL').length;
    
    if (criticalCount > 0) {
      return `URGENT: ${criticalCount} critical task(s) affected. Consider: (1) Add resources to accelerate, (2) Reorder tasks if possible, (3) Reduce scope of affected tasks.`;
    }

    if (affectedTasks.length > 3) {
      return `${affectedTasks.length} tasks affected. Recommend: (1) Notify affected task owners, (2) Adjust downstream schedules, (3) Identify parallel work opportunities.`;
    }

    return `Monitor affected tasks closely and communicate revised timelines to team.`;
  }
};
