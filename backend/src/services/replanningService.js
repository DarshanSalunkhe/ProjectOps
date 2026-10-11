/**
 * Autonomous Replanning Service
 * Generates recovery strategies when risks detected
 */
import { AppError } from '../middleware/errorHandler.js';

export const replanningService = {
  /**
   * Generate replanning proposal for a project
   */
  async generateReplan(projectId, problem, {
    taskRepository,
    dependencyRepository,
    userRepository,
    skillRepository,
    milestoneRepository,
    riskDetectionService,
    impactAnalysisService,
    skillMatchingService
  }) {
    const tasks = await taskRepository.findByProject(projectId);
    const users = await userRepository.findAllByProject(projectId);
    const taskIds = new Set(tasks.map((task) => Number(task.id)));
    const userIds = new Set(users.map((user) => Number(user.id)));
    if (problem.type === 'TASK_DELAY' || problem.type === 'DEADLINE_EXCEEDED') {
      if (!taskIds.has(Number(problem.taskId))) throw new AppError('Task is not part of this project', 404);
    } else if (problem.type === 'WORKLOAD_OVERLOAD') {
      if (!userIds.has(Number(problem.userId))) throw new AppError('User is not part of this project', 404);
    } else if (problem.type === 'DEPENDENCY_BLOCKED') {
      if (!taskIds.has(Number(problem.taskId)) || !taskIds.has(Number(problem.blockingTaskId))) {
        throw new AppError('Tasks must belong to this project', 404);
      }
    } else {
      throw new AppError('Unsupported recovery problem type', 400);
    }

    const proposal = {
      projectId,
      problem,
      detectedAt: new Date().toISOString(),
      originalState: await this._captureCurrentState(tasks, users),
      recommendations: [],
      estimatedImpact: {}
    };

    // Analyze the problem type and generate appropriate recommendations
    if (problem.type === 'TASK_DELAY' || problem.type === 'DEADLINE_EXCEEDED') {
      await this._generateDelayRecovery(proposal, problem, {
        taskRepository,
        dependencyRepository,
        userRepository,
        skillRepository,
        milestoneRepository,
        impactAnalysisService,
        skillMatchingService
      });
    } else if (problem.type === 'WORKLOAD_OVERLOAD') {
      await this._generateWorkloadRecovery(proposal, problem, {
        taskRepository,
        userRepository,
        skillRepository,
        skillMatchingService
      });
    } else if (problem.type === 'DEPENDENCY_BLOCKED') {
      await this._generateDependencyRecovery(proposal, problem, {
        taskRepository,
        dependencyRepository,
        userRepository
      });
    }

    // Calculate overall impact of proposed changes
    proposal.estimatedImpact = this._calculateProposalImpact(proposal);

    return proposal;
  },

  /**
   * Generate recovery plan for task delays
   */
  async _generateDelayRecovery(proposal, problem, services) {
    const { taskRepository, impactAnalysisService, skillMatchingService } = services;
    
    const delayedTask = await taskRepository.findById(problem.taskId);
    if (!delayedTask) return;

    // Analyze cascading impact
    const impact = await impactAnalysisService.analyzeTaskDelay(
      problem.taskId,
      problem.delayDays || 2,
      services
    );

    proposal.cascadingImpact = impact;

    // Recommendation 1: Reassign to faster/available team member
    if (delayedTask.status !== 'COMPLETED') {
      const matches = await skillMatchingService.findBestMatchesForTask(problem.taskId, { availableOnly: true });
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        if (bestMatch.match_score > 70 && bestMatch.available_hours > (delayedTask.estimated_hours || 0)) {
          proposal.recommendations.push({
            type: 'REASSIGN',
            priority: 'HIGH',
            action: 'Reassign task to more available team member',
            target: {
              taskId: delayedTask.id,
              taskTitle: delayedTask.title,
              suggestedUser: bestMatch.user.name,
              userId: bestMatch.user.id,
              reason: `${bestMatch.user.name} has ${bestMatch.match_score}% skill match and ${bestMatch.available_hours}h available capacity`
            },
            expectedBenefit: 'Accelerate task completion and reduce downstream delays'
          });
        }
      }
    }

    // Recommendation 2: Adjust dependent task schedules
    const affectedTasks = impact.affectedTasks || [...(impact.directlyAffected || []), ...(impact.indirectlyAffected || [])];
    if (affectedTasks.length > 0) {
      proposal.recommendations.push({
        type: 'RESCHEDULE',
        priority: 'MEDIUM',
        action: 'Adjust deadlines for dependent tasks',
        targets: affectedTasks.map(t => ({
          taskId: t.id,
          taskTitle: t.title,
          currentDeadline: t.currentDeadline,
          suggestedDelay: t.projectedDelay
        })),
        expectedBenefit: 'Align expectations with realistic timeline'
      });
    }

    // Recommendation 3: Identify parallel work opportunities
    const blockedTasks = await taskRepository.findByProject(delayedTask.project_id);
    const unblocked = blockedTasks.filter(t => 
      t.status === 'TODO' && 
      t.id !== delayedTask.id &&
      !affectedTasks.some(at => at.id === t.id)
    );

    if (unblocked.length > 0) {
      proposal.recommendations.push({
        type: 'PARALLELIZE',
        priority: 'LOW',
        action: 'Start independent work while delayed task completes',
        targets: unblocked.slice(0, 3).map(t => ({
          taskId: t.id,
          taskTitle: t.title
        })),
        expectedBenefit: 'Maintain team productivity during delay'
      });
    }
  },

  /**
   * Generate recovery plan for workload issues
   */
  async _generateWorkloadRecovery(proposal, problem, services) {
    const { taskRepository, userRepository, skillMatchingService } = services;
    
    const overloadedUser = await userRepository.findById(problem.userId);
    if (!overloadedUser) return;

    // Find tasks assigned to overloaded user
    const allTasks = await taskRepository.findByProject(proposal.projectId);
    const userTasks = allTasks.filter(t => 
      t.assigned_users && t.assigned_users.some(u => u.id === overloadedUser.id) && 
      t.status !== 'COMPLETED'
    );

    // Suggest redistributing lower-priority tasks
    const redistributable = userTasks
      .filter(t => t.priority !== 'CRITICAL')
      .sort((a, b) => {
        const priorityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    for (const task of redistributable.slice(0, 2)) {
      const matches = await skillMatchingService.findBestMatchesForTask(task.id, { availableOnly: true });
      const alternatives = matches.filter(m => m.user.id !== overloadedUser.id);
      
      if (alternatives.length > 0) {
        proposal.recommendations.push({
          type: 'REDISTRIBUTE',
          priority: 'HIGH',
          action: 'Reassign task to reduce workload',
          target: {
            taskId: task.id,
            taskTitle: task.title,
            from: overloadedUser.name,
            to: alternatives[0].user.name,
            toUserId: alternatives[0].user.id,
            reason: `Reduce ${overloadedUser.name}'s workload from ${overloadedUser.workload_hours}h to ${overloadedUser.workload_hours - (task.estimated_hours || 0)}h`
          },
          expectedBenefit: 'Balance team workload and prevent burnout'
        });
      }
    }
  },

  /**
   * Generate recovery plan for dependency blocks
   */
  async _generateDependencyRecovery(proposal, problem, services) {
    const { taskRepository, dependencyRepository } = services;
    
    proposal.recommendations.push({
      type: 'ESCALATE',
      priority: 'CRITICAL',
      action: 'Escalate blocked dependency task',
      target: {
        blockingTaskId: problem.blockingTaskId,
        blockedTaskId: problem.taskId
      },
      expectedBenefit: 'Unblock critical path and restore progress'
    });
  },

  /**
   * Capture current project state
   */
  async _captureCurrentState(tasks, users) {
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      blockedTasks: tasks.filter(t => t.status === 'BLOCKED').length,
      overdueTasks: tasks.filter(t => {
        if (!t.deadline || t.status === 'COMPLETED') return false;
        return new Date(t.deadline) < new Date();
      }).length,
      teamUtilization: this._calculateTeamUtilization(users)
    };
  },

  /**
   * Calculate team utilization percentage
   */
  _calculateTeamUtilization(users) {
    const totalCapacity = users.reduce((sum, u) => sum + Number(u.weekly_capacity_hours || 40), 0);
    const totalWorkload = users.reduce((sum, u) => sum + Number(u.workload_hours || 0), 0);
    return totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;
  },

  /**
   * Calculate overall impact of proposal
   */
  _calculateProposalImpact(proposal) {
    const reassignCount = proposal.recommendations.filter(r => r.type === 'REASSIGN' || r.type === 'REDISTRIBUTE').length;
    const rescheduleCount = proposal.recommendations.filter(r => r.type === 'RESCHEDULE').length;

    return {
      tasksAffected: proposal.cascadingImpact?.totalAffected || 0,
      recommendationCount: proposal.recommendations.length,
      reassignments: reassignCount,
      scheduleChanges: rescheduleCount,
      estimatedRecoveryTime: this._estimateRecoveryTime(proposal.recommendations),
      confidenceLevel: this._calculateConfidence(proposal.recommendations)
    };
  },

  /**
   * Estimate recovery time in days
   */
  _estimateRecoveryTime(recommendations) {
    const highPriority = recommendations.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL').length;
    return highPriority > 0 ? '2-3 days' : '1-2 days';
  },

  /**
   * Calculate confidence in proposal
   */
  _calculateConfidence(recommendations) {
    if (recommendations.length === 0) return 'LOW';
    if (recommendations.some(r => r.type === 'REASSIGN' || r.type === 'REDISTRIBUTE')) return 'HIGH';
    return 'MEDIUM';
  }
};
