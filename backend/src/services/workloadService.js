import { query } from '../config/database.js';
import { userRepository } from '../repositories/userRepository.js';

export const workloadService = {
  /**
   * Calculate and update user workload based on assigned tasks
   * @param {number} userId - User ID to calculate workload for
   * @returns {Promise<number>} - Updated workload in hours
   */
  async calculateUserWorkload(userId, client = null) {
    // Sum estimated hours from all non-completed tasks assigned to the user
    const execute = client ? client.query.bind(client) : query;
    const result = await execute(
      `SELECT COALESCE(SUM(t.estimated_hours), 0) as total_workload
       FROM task_assignments ta
       INNER JOIN tasks t ON ta.task_id = t.id
       WHERE ta.user_id = $1 
       AND t.status != 'COMPLETED'`,
      [userId]
    );

    const workload = parseFloat(result.rows[0].total_workload) || 0;

    // Update user's workload_hours
    await userRepository.updateWorkload(userId, workload, client);

    return workload;
  },

  /**
   * Calculate workload for all users
   * @returns {Promise<void>}
   */
  async calculateAllWorkloads() {
    const users = await userRepository.findAll();

    for (const user of users) {
      await this.calculateUserWorkload(user.id);
    }
  },

  /**
   * Get user's current workload details
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Workload details
   */
  async getUserWorkloadDetails(userId) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get assigned tasks breakdown
    const tasksResult = await query(
      `SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.estimated_hours,
        t.deadline,
        p.name as project_name
       FROM task_assignments ta
       INNER JOIN tasks t ON ta.task_id = t.id
       INNER JOIN projects p ON t.project_id = p.id
       WHERE ta.user_id = $1 
       AND t.status != 'COMPLETED'
       ORDER BY t.deadline ASC NULLS LAST, t.priority DESC`,
      [userId]
    );

    const workload = parseFloat(user.workload_hours) || 0;
    const capacity = parseInt(user.weekly_capacity_hours) || 40;
    const utilization = capacity > 0 ? Math.round((workload / capacity) * 100) : 0;

    return {
      workload_hours: workload,
      weekly_capacity_hours: capacity,
      utilization_percentage: utilization,
      available_hours: Math.max(capacity - workload, 0),
      is_overloaded: workload > capacity,
      assigned_tasks: tasksResult.rows
    };
  }
};
