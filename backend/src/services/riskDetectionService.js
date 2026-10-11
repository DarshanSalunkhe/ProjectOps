/**
 * Risk Detection Engine
 * Deterministic, rule-based risk analysis
 */
export const riskDetectionService = {
  /**
   * Detect all risks for a project
   */
  async detectProjectRisks(projectId, { projectRepository, taskRepository, dependencyRepository, userRepository }) {
    const risks = [];
    const today = new Date();

    // Get project and tasks
    const project = await projectRepository.findById(projectId);
    const tasks = await taskRepository.findByProject(projectId);
    const users = await userRepository.findAll();

    // Risk 1: Overdue tasks
    tasks.forEach(task => {
      if (task.deadline && task.status !== 'COMPLETED') {
        const deadline = new Date(task.deadline);
        if (deadline < today) {
          const daysOverdue = Math.ceil((today - deadline) / (1000 * 60 * 60 * 24));
          risks.push({
            type: 'DEADLINE_EXCEEDED',
            severity: 'HIGH',
            taskId: task.id,
            taskTitle: task.title,
            message: `Task is ${daysOverdue} days overdue`,
            impact: 'Delays dependent tasks and may jeopardize project deadline',
            recommendation: 'Reassign to available team member or adjust scope'
          });
        } else {
          // Risk 2: Approaching deadline
          const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 3 && task.status === 'TODO') {
            risks.push({
              type: 'DEADLINE_RISK',
              severity: 'MEDIUM',
              taskId: task.id,
              taskTitle: task.title,
              message: `Task due in ${daysUntil} days but not started`,
              impact: 'May miss deadline if not started immediately',
              recommendation: 'Assign immediately and prioritize'
            });
          }
        }
      }
    });

    // Risk 3: Blocked tasks
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
    blockedTasks.forEach(task => {
      risks.push({
        type: 'TASK_BLOCKED',
        severity: 'HIGH',
        taskId: task.id,
        taskTitle: task.title,
        message: 'Task is blocked and cannot progress',
        impact: 'Prevents dependent tasks from starting',
        recommendation: 'Resolve blocking issues or find workaround'
      });
    });

    // Risk 4: Dependency delays
    for (const task of tasks) {
      if (task.status !== 'COMPLETED') {
        const deps = await dependencyRepository.findByTask(task.id);
        for (const dep of deps) {
          if (dep.depends_on_task_status !== 'COMPLETED') {
            if (dep.depends_on_task_deadline) {
              const depDeadline = new Date(dep.depends_on_task_deadline);
              if (depDeadline < today) {
                risks.push({
                  type: 'DEPENDENCY_DELAY',
                  severity: 'MEDIUM',
                  taskId: task.id,
                  taskTitle: task.title,
                  dependencyTaskId: dep.depends_on_task_id,
                  dependencyTitle: dep.depends_on_task_title,
                  message: `Dependent task "${dep.depends_on_task_title}" is overdue`,
                  impact: 'Cannot start until dependency completes',
                  recommendation: 'Escalate dependency task or adjust schedule'
                });
              }
            }
          }
        }
      }
    }

    // Risk 5: Workload overload
    users.forEach(user => {
      if (user.workload_hours && user.weekly_capacity_hours) {
        const utilization = (user.workload_hours / user.weekly_capacity_hours) * 100;
        if (utilization > 100) {
          risks.push({
            type: 'WORKLOAD_OVERLOAD',
            severity: 'HIGH',
            userId: user.id,
            userName: user.name,
            message: `${user.name} is ${Math.round(utilization)}% utilized (${user.workload_hours}h / ${user.weekly_capacity_hours}h capacity)`,
            impact: 'Team member burnout and quality issues',
            recommendation: 'Redistribute tasks or extend deadlines'
          });
        } else if (utilization > 85) {
          risks.push({
            type: 'WORKLOAD_WARNING',
            severity: 'MEDIUM',
            userId: user.id,
            userName: user.name,
            message: `${user.name} is ${Math.round(utilization)}% utilized`,
            impact: 'Limited capacity for new work',
            recommendation: 'Monitor workload closely'
          });
        }
      }
    });

    // Risk 6: Project deadline risk
    if (project.deadline) {
      const projectDeadline = new Date(project.deadline);
      const incompleteTasks = tasks.filter(t => t.status !== 'COMPLETED');
      const totalRemainingHours = incompleteTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const daysUntilDeadline = Math.ceil((projectDeadline - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 0) {
        risks.push({
          type: 'PROJECT_DEADLINE_EXCEEDED',
          severity: 'CRITICAL',
          message: `Project deadline was ${Math.abs(daysUntilDeadline)} days ago`,
          impact: 'Project is late',
          recommendation: 'Immediate replanning required'
        });
      } else if (totalRemainingHours > 0) {
        const teamCapacity = users.reduce((sum, u) => sum + ((u.weekly_capacity_hours || 40) - (u.workload_hours || 0)), 0);
        const weeksNeeded = teamCapacity > 0 ? totalRemainingHours / teamCapacity : 999;
        const daysNeeded = Math.ceil(weeksNeeded * 7);
        
        if (daysNeeded > daysUntilDeadline) {
          risks.push({
            type: 'PROJECT_DEADLINE_RISK',
            severity: 'HIGH',
            message: `Estimated ${daysNeeded} days needed but only ${daysUntilDeadline} days until deadline`,
            impact: 'Likely to miss project deadline',
            recommendation: 'Reduce scope or add resources'
          });
        }
      }
    }

    return {
      projectId,
      taskCount: tasks.length,
      riskCount: risks.length,
      criticalRisks: risks.filter(r => r.severity === 'CRITICAL').length,
      highRisks: risks.filter(r => r.severity === 'HIGH').length,
      mediumRisks: risks.filter(r => r.severity === 'MEDIUM').length,
      risks,
      detectedAt: new Date().toISOString()
    };
  },

  /**
   * Calculate project health score
   */
  calculateHealthScore(risks, taskCount) {
    if (taskCount === 0) return { score: null, status: 'INSUFFICIENT_DATA' };

    let score = 100;
    
    risks.forEach(risk => {
      switch (risk.severity) {
        case 'CRITICAL': score -= 25; break;
        case 'HIGH': score -= 15; break;
        case 'MEDIUM': score -= 5; break;
        default: score -= 2;
      }
    });

    score = Math.max(0, score);

    let status = 'HEALTHY';
    if (score < 40) status = 'CRITICAL';
    else if (score < 70) status = 'AT_RISK';

    return { score, status };
  }
};
