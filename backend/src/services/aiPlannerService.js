import { aiService } from './aiService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * AI Project Planner Service
 * Generates structured project plans from natural language goals
 */
export const aiPlannerService = {
  /**
   * Generate project plan from goal description
   * Falls back to deterministic planning if no LLM configured
   */
  async generatePlan(planRequest) {
    const { goal, description, deadline, teamSize, techStack } = planRequest;

    // Check if LLM API key is configured
    const hasLLM = aiService.isAvailable() && planRequest.userId;

    if (hasLLM) {
      try {
        return await this._generateWithLLM(planRequest);
      } catch (error) {
        console.error('LLM planning failed, using fallback:', error.message);
        return await this._generateFallbackPlan(planRequest);
      }
    } else {
      return await this._generateFallbackPlan(planRequest);
    }
  },

  /**
   * Generate plan using LLM (OpenAI/Gemini)
   */
  async _generateWithLLM(planRequest) {
    const template = await this._generateFallbackPlan(planRequest);
    const result = await aiService.call('TASK_GENERATION', [{ role: 'system', content: 'Return only JSON matching the supplied plan structure. Adapt tasks to the goal, dates and team. Maximum 20 tasks. No cycles. Proposals require approval.' }, { role: 'user', content: JSON.stringify({ request: planRequest, template }) }], { userId: planRequest.userId, jsonMode: true });
    const plan = JSON.parse(result.content);
    if (!Array.isArray(plan.tasks) || !plan.tasks.length) throw new Error('Invalid generated plan');
    plan.metadata = { ...plan.metadata, generatedBy: result.provider };
    return plan;
  },

  /**
   * Deterministic fallback planner
   * Generates realistic project structure without LLM
   */
  async _generateFallbackPlan(planRequest) {
    const { goal, description, deadline, teamSize = 4, techStack = [] } = planRequest;

    // Parse deadline
    const deadlineDate = deadline ? new Date(deadline) : null;
    const today = new Date();
    const daysAvailable = deadlineDate
      ? Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))
      : 90;

    // Detect project type from goal/description
    const combinedText = `${goal} ${description}`.toLowerCase();
    const isWeb = /web|website|frontend|backend|api|react|node/.test(combinedText);
    const isMobile = /mobile|app|ios|android|flutter|react native/.test(combinedText);
    const isFullStack = /full.?stack|e-commerce|platform/.test(combinedText);

    // Generate phases and tasks based on project type
    const plan = {
      metadata: {
        generatedBy: 'deterministic',
        goal,
        teamSize,
        deadline,
        estimatedDuration: daysAvailable
      },
      phases: [],
      tasks: [],
      dependencies: [],
      milestones: []
    };

    if (isFullStack || isWeb) {
      this._addFullStackTasks(plan, daysAvailable, teamSize);
    } else if (isMobile) {
      this._addMobileTasks(plan, daysAvailable, teamSize);
    } else {
      this._addGenericTasks(plan, daysAvailable, teamSize);
    }

    return plan;
  },

  /**
   * Add full-stack web project tasks
   */
  _addFullStackTasks(plan, days, teamSize) {
    const phases = [
      { name: 'Planning & Design', duration: Math.ceil(days * 0.15) },
      { name: 'Database & Backend', duration: Math.ceil(days * 0.25) },
      { name: 'Frontend Development', duration: Math.ceil(days * 0.30) },
      { name: 'Integration & Testing', duration: Math.ceil(days * 0.20) },
      { name: 'Deployment & Launch', duration: Math.ceil(days * 0.10) }
    ];

    plan.phases = phases.map((p, i) => ({ id: i + 1, ...p }));

    const tasks = [
      // Phase 1: Planning
      { title: 'Project Requirements Analysis', phase: 1, priority: 'CRITICAL', hours: 16, skills: ['product-management'], dependencies: [] },
      { title: 'Technical Architecture Design', phase: 1, priority: 'HIGH', hours: 24, skills: ['system-design', 'architecture'], dependencies: [1] },
      { title: 'Database Schema Design', phase: 1, priority: 'HIGH', hours: 16, skills: ['database-design', 'postgresql'], dependencies: [1] },
      { title: 'UI/UX Design & Wireframes', phase: 1, priority: 'MEDIUM', hours: 20, skills: ['ui-design', 'figma'], dependencies: [1] },

      // Phase 2: Backend
      { title: 'Database Setup & Migrations', phase: 2, priority: 'CRITICAL', hours: 12, skills: ['postgresql', 'database'], dependencies: [3] },
      { title: 'Authentication System', phase: 2, priority: 'CRITICAL', hours: 24, skills: ['nodejs', 'express', 'jwt'], dependencies: [5] },
      { title: 'Core API Endpoints', phase: 2, priority: 'HIGH', hours: 40, skills: ['nodejs', 'express', 'api-design'], dependencies: [5, 6] },
      { title: 'Payment Integration', phase: 2, priority: 'HIGH', hours: 20, skills: ['nodejs', 'stripe', 'api-integration'], dependencies: [7] },

      // Phase 3: Frontend
      { title: 'Frontend Project Setup', phase: 3, priority: 'HIGH', hours: 8, skills: ['react', 'vite'], dependencies: [4] },
      { title: 'Component Library', phase: 3, priority: 'MEDIUM', hours: 24, skills: ['react', 'tailwind', 'ui-components'], dependencies: [9] },
      { title: 'User Authentication UI', phase: 3, priority: 'HIGH', hours: 16, skills: ['react', 'authentication'], dependencies: [6, 10] },
      { title: 'Product Catalog & Cart', phase: 3, priority: 'CRITICAL', hours: 32, skills: ['react', 'state-management'], dependencies: [7, 10] },
      { title: 'Checkout & Payment UI', phase: 3, priority: 'HIGH', hours: 20, skills: ['react', 'forms'], dependencies: [8, 12] },
      { title: 'Admin Dashboard', phase: 3, priority: 'MEDIUM', hours: 28, skills: ['react', 'data-visualization'], dependencies: [7, 10] },

      // Phase 4: Integration & Testing
      { title: 'Frontend-Backend Integration', phase: 4, priority: 'CRITICAL', hours: 24, skills: ['fullstack', 'debugging'], dependencies: [7, 12, 13] },
      { title: 'End-to-End Testing', phase: 4, priority: 'HIGH', hours: 20, skills: ['testing', 'cypress'], dependencies: [15] },
      { title: 'Security Audit', phase: 4, priority: 'HIGH', hours: 16, skills: ['security', 'penetration-testing'], dependencies: [15] },
      { title: 'Performance Optimization', phase: 4, priority: 'MEDIUM', hours: 16, skills: ['performance', 'optimization'], dependencies: [15] },

      // Phase 5: Deployment
      { title: 'Production Environment Setup', phase: 5, priority: 'CRITICAL', hours: 12, skills: ['devops', 'cloud'], dependencies: [16, 17] },
      { title: 'CI/CD Pipeline', phase: 5, priority: 'HIGH', hours: 16, skills: ['devops', 'github-actions'], dependencies: [19] },
      { title: 'Monitoring & Logging Setup', phase: 5, priority: 'HIGH', hours: 12, skills: ['devops', 'monitoring'], dependencies: [19] },
      { title: 'Production Deployment', phase: 5, priority: 'CRITICAL', hours: 8, skills: ['devops', 'deployment'], dependencies: [19, 20, 21] },
      { title: 'Documentation & Handoff', phase: 5, priority: 'MEDIUM', hours: 16, skills: ['technical-writing'], dependencies: [22] }
    ];

    plan.tasks = tasks.map((t, i) => ({
      id: i + 1,
      ...t,
      description: `Complete ${t.title.toLowerCase()} according to technical specifications`,
      status: 'TODO'
    }));

    // Generate dependencies
    tasks.forEach((task, i) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          plan.dependencies.push({
            taskId: i + 1,
            dependsOnTaskId: depId,
            type: 'BLOCKS'
          });
        });
      }
    });

    // Generate milestones
    plan.milestones = phases.map((phase, i) => ({
      phaseId: phase.id,
      title: `${phase.name} Complete`,
      description: `All tasks in ${phase.name} phase completed`,
      dueDate: this._calculateMilestoneDate(i + 1, phases.length, days)
    }));

    return plan;
  },

  /**
   * Add mobile app tasks
   */
  _addMobileTasks(plan, days, teamSize) {
    const tasks = [
      { title: 'App Requirements & User Stories', priority: 'CRITICAL', hours: 16, skills: ['product-management'], dependencies: [] },
      { title: 'UI/UX Design & Prototyping', priority: 'HIGH', hours: 32, skills: ['ui-design', 'mobile-design'], dependencies: [1] },
      { title: 'Backend API Development', priority: 'HIGH', hours: 40, skills: ['nodejs', 'api-design'], dependencies: [1] },
      { title: 'Authentication & User Management', priority: 'CRITICAL', hours: 24, skills: ['mobile-dev', 'authentication'], dependencies: [3] },
      { title: 'Core App Features', priority: 'HIGH', hours: 60, skills: ['react-native', 'mobile-dev'], dependencies: [2, 4] },
      { title: 'Push Notifications', priority: 'MEDIUM', hours: 16, skills: ['mobile-dev', 'firebase'], dependencies: [5] },
      { title: 'Testing & QA', priority: 'HIGH', hours: 24, skills: ['testing', 'qa'], dependencies: [5, 6] },
      { title: 'App Store Deployment', priority: 'CRITICAL', hours: 12, skills: ['mobile-deployment'], dependencies: [7] }
    ];

    plan.tasks = tasks.map((t, i) => ({
      id: i + 1,
      ...t,
      description: `Complete ${t.title.toLowerCase()}`,
      status: 'TODO'
    }));

    tasks.forEach((task, i) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          plan.dependencies.push({ taskId: i + 1, dependsOnTaskId: depId, type: 'BLOCKS' });
        });
      }
    });

    plan.milestones = [
      { title: 'Design Complete', dueDate: this._calculateMilestoneDate(1, 4, days) },
      { title: 'Core Features Complete', dueDate: this._calculateMilestoneDate(2, 4, days) },
      { title: 'Testing Complete', dueDate: this._calculateMilestoneDate(3, 4, days) },
      { title: 'Launch', dueDate: this._calculateMilestoneDate(4, 4, days) }
    ];

    return plan;
  },

  /**
   * Add generic software project tasks
   */
  _addGenericTasks(plan, days, teamSize) {
    const tasks = [
      { title: 'Requirements Gathering', priority: 'CRITICAL', hours: 16, skills: ['analysis'], dependencies: [] },
      { title: 'System Design', priority: 'HIGH', hours: 24, skills: ['architecture'], dependencies: [1] },
      { title: 'Core Development', priority: 'HIGH', hours: 80, skills: ['programming'], dependencies: [2] },
      { title: 'Integration & Testing', priority: 'HIGH', hours: 32, skills: ['testing'], dependencies: [3] },
      { title: 'Deployment', priority: 'CRITICAL', hours: 16, skills: ['devops'], dependencies: [4] }
    ];

    plan.tasks = tasks.map((t, i) => ({
      id: i + 1,
      ...t,
      description: `Complete ${t.title.toLowerCase()}`,
      status: 'TODO'
    }));

    tasks.forEach((task, i) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          plan.dependencies.push({ taskId: i + 1, dependsOnTaskId: depId, type: 'BLOCKS' });
        });
      }
    });

    return plan;
  },

  /**
   * Calculate milestone due date
   */
  _calculateMilestoneDate(phaseNum, totalPhases, totalDays) {
    const today = new Date();
    const daysFromNow = Math.ceil((totalDays * phaseNum) / totalPhases);
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },

  /**
   * Apply generated plan to project
   * Creates tasks, dependencies, and milestones
   */
  async applyPlan(projectId, plan, userId, { taskRepository, dependencyRepository, milestoneRepository, skillRepository, client }) {
    const createdTasks = [];
    const taskIdMap = new Map(); // Map plan task IDs to actual database IDs

    try {
      // Create tasks
      for (const planTask of plan.tasks) {
        const taskData = {
          project_id: projectId,
          title: planTask.title,
          description: planTask.description,
          status: 'TODO',
          priority: planTask.priority || 'MEDIUM',
          estimated_hours: planTask.hours || null,
          created_by: userId
        };

        const created = await taskRepository.create(taskData, userId, client);
        createdTasks.push(created);
        taskIdMap.set(planTask.id, created.id);

        // Add required skills if present
        if (skillRepository && planTask.skills && planTask.skills.length > 0) {
          for (const skillName of planTask.skills) {
            await skillRepository.addTaskSkill(created.id, skillName, 'INTERMEDIATE', true, client);
          }
        }
      }

      // Create dependencies
      if (plan.dependencies && plan.dependencies.length > 0) {
        for (const dep of plan.dependencies) {
          const taskId = taskIdMap.get(dep.taskId);
          const dependsOnId = taskIdMap.get(dep.dependsOnTaskId);

          if (taskId && dependsOnId) {
            await dependencyRepository.create(taskId, dependsOnId, dep.type || 'BLOCKS', client);
          }
        }
      }

      // Create milestones
      if (plan.milestones && plan.milestones.length > 0) {
        for (const milestone of plan.milestones) {
          await milestoneRepository.create({
            project_id: projectId,
            title: milestone.title,
            description: milestone.description || '',
            due_date: milestone.dueDate || null,
            created_by: userId
          }, client);
        }
      }

      return {
        success: true,
        tasksCreated: createdTasks.length,
        dependenciesCreated: plan.dependencies?.length || 0,
        milestonesCreated: plan.milestones?.length || 0,
        tasks: createdTasks
      };
    } catch (error) {
      console.error('Failed to apply plan:', error);
      throw new AppError('Failed to apply project plan', 500);
    }
  }
};
